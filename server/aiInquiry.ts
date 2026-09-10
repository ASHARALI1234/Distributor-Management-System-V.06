import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

export interface InquiryRequest {
  incoming_message: string;
  sender_type?: 'customer' | 'sales_rep' | 'internal';
  sender_name?: string;
  sender_phone?: string;
  shop_id?: number;
  channel?: 'web_chat' | 'whatsapp' | 'voice' | 'sms';
}

export interface InquiryResult {
  response: string;
  detected_intent: string;
  tools_used: string[];
  response_time_ms: number;
  log_id?: number;
  action_data?: any;
  status: 'auto_resolved' | 'escalated';
}

/**
 * Initializes database tables for Automated AI Inquiries and default business knowledge rules.
 */
export function initAIInquiryTables(db: any) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_inquiry_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_type TEXT DEFAULT 'customer',
        sender_name TEXT,
        sender_phone TEXT,
        shop_id INTEGER,
        channel TEXT DEFAULT 'web_chat',
        incoming_message TEXT NOT NULL,
        detected_intent TEXT,
        ai_response TEXT NOT NULL,
        tool_calls_executed TEXT,
        response_time_ms INTEGER DEFAULT 0,
        status TEXT DEFAULT 'auto_resolved',
        escalation_notes TEXT,
        feedback_rating INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_inquiry_created ON ai_inquiry_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_inquiry_status ON ai_inquiry_logs(status);

      CREATE TABLE IF NOT EXISTS ai_inquiry_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword_pattern TEXT NOT NULL,
        intent_category TEXT NOT NULL,
        quick_template TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default knowledge rules if empty
    const countCheck = db.prepare("SELECT COUNT(*) as count FROM ai_inquiry_rules").get() as any;
    if (!countCheck || countCheck.count === 0) {
      const insertRule = db.prepare(`
        INSERT INTO ai_inquiry_rules (keyword_pattern, intent_category, quick_template)
        VALUES (?, ?, ?)
      `);

      insertRule.run(
        'bank|account|payment method|transfer|online|ibft|meezan|hbl',
        'PAYMENT_INFO',
        'Official Payment Details for FM Distributors:\n- Bank: Meezan Bank Ltd\n- Title: FM DISTRIBUTORS\n- A/C #: 0102-0105849201\n- IBAN: PK45MEZN0001020105849201\n- Branch: F.B Industrial Area Branch Karachi\n*Please share the payment screenshot with Invoice Number for instant ledger credit.*'
      );

      insertRule.run(
        'delivery time|schedule|dispatch timing|kab ayega|timing|cutoff',
        'DELIVERY_SCHEDULE',
        'Delivery Schedule Policy:\n- Orders booked before 2:00 PM are dispatched on next morning route.\n- Orders booked after 2:00 PM are delivered within 24-48 hours.\n- Sunday is non-operational for regular dispatches.'
      );

      insertRule.run(
        'return|damage|expiry|claim|faulty|replacement',
        'RETURN_POLICY',
        'Return & Expiry Claim Policy:\n- Damaged / leaky cartons must be reported at the time of delivery to the delivery driver.\n- Expiry claims are accepted up to 30 days prior to expiry date with original invoice copy.'
      );

      insertRule.run(
        'credit limit|udhar|credit days|payment terms',
        'CREDIT_TERMS',
        'Standard Credit Terms:\n- Retailers: Maximum credit limit PKR 50,000 or 15 days credit cycle.\n- Payment must be cleared prior to new order dispatch once credit limit is reached.'
      );
    }
  } catch (err) {
    console.warn("[AI Inquiry] Table initialization notice:", err);
  }
}

/**
 * Executes a tool against the DMS SQLite database.
 */
export function executeDMSTool(name: string, args: any, db: any) {
  try {
    switch (name) {
      case "get_shop_ledger": {
        const query = (args.shop_query || "").toString().trim();
        let shop: any = null;
        if (query) {
          shop = db.prepare(`
            SELECT s.id, s.shop_name, s.owner_name, s.phone, s.location, s.credit_limit,
              coalesce((SELECT balance FROM client_ledger WHERE shop_id = s.id ORDER BY id DESC LIMIT 1), 0) as balance 
            FROM shops s
            WHERE s.id = ? OR LOWER(s.shop_name) LIKE LOWER(?) OR s.phone LIKE ?
            LIMIT 1
          `).get(isNaN(Number(query)) ? -1 : Number(query), `%${query}%`, `%${query}%`);
        }
        if (!shop && args.shop_id) {
          shop = db.prepare(`
            SELECT s.id, s.shop_name, s.owner_name, s.phone, s.location, s.credit_limit,
              coalesce((SELECT balance FROM client_ledger WHERE shop_id = s.id ORDER BY id DESC LIMIT 1), 0) as balance 
            FROM shops s
            WHERE s.id = ?
          `).get(args.shop_id);
        }
        if (!shop) {
          return { error: `No registered shop found matching query '${query}'.` };
        }

        // Get latest 5 ledger transactions
        const ledger = db.prepare(`
          SELECT id, date, description, debit, credit, balance 
          FROM client_ledger 
          WHERE shop_id = ? 
          ORDER BY id DESC 
          LIMIT 5
        `).all(shop.id);

        // Get pending invoices
        const pendingInvoices = db.prepare(`
          SELECT id, invoice_date, gross_amount, net_amount, status 
          FROM invoices 
          WHERE shop_id = ? AND status != 'paid' 
          ORDER BY id DESC 
          LIMIT 5
        `).all(shop.id);

        return {
          shop_id: shop.id,
          shop_name: shop.shop_name,
          owner_name: shop.owner_name,
          phone: shop.phone,
          location: shop.location,
          credit_limit: shop.credit_limit || 50000,
          current_outstanding_balance: shop.balance || 0,
          recent_ledger_entries: ledger,
          pending_unpaid_invoices: pendingInvoices
        };
      }

      case "get_order_status": {
        const orderId = args.order_id ? Number(args.order_id) : null;
        const shopQuery = (args.shop_query || "").toString().trim();
        const limit = args.limit ? Number(args.limit) : 5;

        let queryStr = `
          SELECT o.id, o.order_date, o.total_amount, o.status, 
                 s.id as shop_id, s.shop_name, s.location, s.phone,
                 ob.name as booker_name
          FROM orders o
          JOIN shops s ON o.shop_id = s.id
          LEFT JOIN order_bookers ob ON o.order_booker_id = ob.id
        `;
        const conditions: string[] = [];
        const params: any[] = [];

        if (orderId) {
          conditions.push("o.id = ?");
          params.push(orderId);
        } else if (shopQuery) {
          conditions.push("(LOWER(s.shop_name) LIKE LOWER(?) OR s.phone LIKE ? OR LOWER(ob.name) LIKE LOWER(?))");
          params.push(`%${shopQuery}%`, `%${shopQuery}%`, `%${shopQuery}%`);
        }

        if (conditions.length > 0) {
          queryStr += " WHERE " + conditions.join(" AND ");
        }
        queryStr += ` ORDER BY o.id DESC LIMIT ${limit}`;

        const orders = db.prepare(queryStr).all(...params);

        const enriched = orders.map((o: any) => {
          const items = db.prepare(`
            SELECT oi.product_id, p.product_name, oi.quantity, oi.price, (oi.quantity * oi.price) as subtotal
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
          `).all(o.id);

          const delivery = db.prepare(`
            SELECT id as delivery_id, delivery_date, status, vehicle_no
            FROM deliveries 
            WHERE order_id = ?
            LIMIT 1
          `).get(o.id);

          return { ...o, items, delivery };
        });

        return { orders: enriched, count: enriched.length };
      }

      case "get_delivery_dispatch": {
        const deliveryId = args.delivery_id ? Number(args.delivery_id) : null;
        const shopQuery = (args.shop_query || "").toString().trim();

        let queryStr = `
          SELECT d.id as delivery_id, d.order_id, d.delivery_date, d.status as delivery_status,
                 d.vehicle_no, d.invoice_id,
                 s.shop_name, s.location, s.phone,
                 dr.name as driver_name, dr.phone as driver_phone,
                 sm.name as salesman_name
          FROM deliveries d
          LEFT JOIN shops s ON d.shop_id = s.id
          LEFT JOIN drivers dr ON d.driver_id = dr.id
          LEFT JOIN salesmen sm ON d.salesman_id = sm.id
        `;
        const conditions: string[] = [];
        const params: any[] = [];

        if (deliveryId) {
          conditions.push("d.id = ?");
          params.push(deliveryId);
        } else if (shopQuery) {
          conditions.push("(LOWER(s.shop_name) LIKE LOWER(?) OR s.phone LIKE ?)");
          params.push(`%${shopQuery}%`, `%${shopQuery}%`);
        }

        if (conditions.length > 0) {
          queryStr += " WHERE " + conditions.join(" AND ");
        }
        queryStr += " ORDER BY d.id DESC LIMIT 5";

        const deliveries = db.prepare(queryStr).all(...params);

        const enriched = deliveries.map((d: any) => {
          const items = db.prepare(`
            SELECT di.product_id, p.product_name, di.dispatched_quantity, di.delivered_quantity, di.price
            FROM delivery_items di
            JOIN products p ON di.product_id = p.product_id
            WHERE di.delivery_id = ?
          `).all(d.delivery_id);
          return { ...d, items };
        });

        return { deliveries: enriched, count: enriched.length };
      }

      case "check_product_stock_and_price": {
        const query = (args.product_query || "").toString().trim();
        const matGroup = (args.material_group || "").toString().trim();

        let queryStr = `
          SELECT p.product_id, p.product_name, p.brand, p.unit, 
                 p.trade_price, p.retail_price, p.stock_quantity,
                 p.reorder_level, mg.mat_description as material_group
          FROM products p
          LEFT JOIN material_groups mg ON p.material_group_id = mg.mat_gp
        `;
        const conditions: string[] = [];
        const params: any[] = [];

        if (query) {
          conditions.push("(LOWER(p.product_name) LIKE LOWER(?) OR LOWER(p.product_id) LIKE LOWER(?) OR LOWER(p.brand) LIKE LOWER(?))");
          params.push(`%${query}%`, `%${query}%`, `%${query}%`);
        }
        if (matGroup) {
          conditions.push("(LOWER(mg.mat_description) LIKE LOWER(?) OR LOWER(p.material_group_id) LIKE LOWER(?))");
          params.push(`%${matGroup}%`, `%${matGroup}%`);
        }

        if (conditions.length > 0) {
          queryStr += " WHERE " + conditions.join(" AND ");
        }
        queryStr += " ORDER BY p.stock_quantity DESC LIMIT 15";

        const products = db.prepare(queryStr).all(...params);
        return {
          products: products.map((p: any) => ({
            ...p,
            stock_status: p.stock_quantity <= 0 ? 'OUT_OF_STOCK' : p.stock_quantity <= (p.reorder_level || 20) ? 'LOW_STOCK' : 'AVAILABLE'
          })),
          count: products.length
        };
      }

      case "get_invoice_breakdown": {
        const invoiceId = args.invoice_id ? Number(args.invoice_id) : null;
        const shopQuery = (args.shop_query || "").toString().trim();

        let queryStr = `
          SELECT i.id, i.invoice_date, i.gross_amount, i.total_discount, i.total_tax, i.net_amount, i.status,
                 s.id as shop_id, s.shop_name, s.location, s.phone
          FROM invoices i
          JOIN shops s ON i.shop_id = s.id
        `;
        const conditions: string[] = [];
        const params: any[] = [];

        if (invoiceId) {
          conditions.push("i.id = ?");
          params.push(invoiceId);
        } else if (shopQuery) {
          conditions.push("(LOWER(s.shop_name) LIKE LOWER(?) OR s.phone LIKE ?)");
          params.push(`%${shopQuery}%`, `%${shopQuery}%`);
        }

        if (conditions.length > 0) {
          queryStr += " WHERE " + conditions.join(" AND ");
        }
        queryStr += " ORDER BY i.id DESC LIMIT 5";

        const invoices = db.prepare(queryStr).all(...params);

        const enriched = invoices.map((inv: any) => {
          const items = db.prepare(`
            SELECT ii.product_id, p.product_name, ii.quantity, ii.unit_price, 
                   ii.trade_discount_pct, ii.tax_pct, ii.net_amount
            FROM invoice_items ii
            JOIN products p ON ii.product_id = p.product_id
            WHERE ii.invoice_id = ?
          `).all(inv.id);
          return { ...inv, items };
        });

        return { invoices: enriched, count: enriched.length };
      }

      case "list_shops_by_route": {
        const area = (args.area_query || "").toString().trim();
        const bookerQuery = (args.booker_name || "").toString().trim();

        let queryStr = `
          SELECT s.id, s.shop_name, s.owner_name, s.phone, s.location, s.credit_limit,
            coalesce((SELECT balance FROM client_ledger WHERE shop_id = s.id ORDER BY id DESC LIMIT 1), 0) as balance
          FROM shops s
        `;
        const conditions: string[] = [];
        const params: any[] = [];

        if (area) {
          conditions.push("LOWER(s.location) LIKE LOWER(?)");
          params.push(`%${area}%`);
        }
        if (bookerQuery) {
          conditions.push("s.id IN (SELECT DISTINCT shop_id FROM orders o JOIN order_bookers ob ON o.order_booker_id = ob.id WHERE LOWER(ob.name) LIKE LOWER(?))");
          params.push(`%${bookerQuery}%`);
        }

        if (conditions.length > 0) {
          queryStr += " WHERE " + conditions.join(" AND ");
        }
        queryStr += " ORDER BY s.shop_name LIMIT 20";

        const shops = db.prepare(queryStr).all(...params);
        return { shops, count: shops.length };
      }

      case "create_draft_order_inquiry": {
        const shopId = Number(args.shop_id);
        const items = args.items || [];

        if (!shopId || !items || items.length === 0) {
          return { error: "Missing shop_id or items array to create order booking." };
        }

        const shop = db.prepare("SELECT * FROM shops WHERE id = ?").get(shopId) as any;
        if (!shop) {
          return { error: `Shop #${shopId} does not exist in the system.` };
        }

        let totalAmount = 0;
        const validItems: any[] = [];

        for (const item of items) {
          const prod = db.prepare("SELECT * FROM products WHERE product_id = ? OR LOWER(product_name) LIKE LOWER(?)").get(item.product_id, `%${item.product_id}%`) as any;
          if (prod) {
            const qty = Number(item.quantity) || 1;
            const price = Number(prod.trade_price) || 0;
            totalAmount += (qty * price);
            validItems.push({
              product_id: prod.product_id,
              product_name: prod.product_name,
              quantity: qty,
              price: price
            });
          }
        }

        if (validItems.length === 0) {
          return { error: "No matching products found from the provided item list." };
        }

        const insertTx = db.transaction(() => {
          const ordRes = db.prepare(`
            INSERT INTO orders (shop_id, total_amount, status, order_date, distributor_id)
            VALUES (?, ?, 'pending', CURRENT_TIMESTAMP, 1)
          `).run(shopId, totalAmount);

          const newOrderId = ordRes.lastInsertRowid;

          const insertItem = db.prepare(`
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (?, ?, ?, ?)
          `);

          for (const vi of validItems) {
            insertItem.run(newOrderId, vi.product_id, vi.quantity, vi.price);
          }

          return newOrderId;
        });

        const createdOrderId = insertTx();

        return {
          success: true,
          order_id: createdOrderId,
          shop_name: shop.shop_name,
          total_amount: totalAmount,
          items: validItems,
          status: 'pending',
          message: `Draft Order #ORD-${createdOrderId.toString().padStart(4, '0')} has been booked successfully for ${shop.shop_name}.`
        };
      }

      case "get_distributor_policy": {
        const topic = (args.topic || "").toString().toLowerCase();
        const rules = db.prepare("SELECT keyword_pattern, intent_category, quick_template FROM ai_inquiry_rules WHERE is_active = 1").all() as any[];
        
        let matching = rules;
        if (topic) {
          matching = rules.filter((r: any) => 
            r.intent_category.toLowerCase().includes(topic) || 
            new RegExp(r.keyword_pattern, 'i').test(topic)
          );
        }
        return {
          policies: matching.length > 0 ? matching : rules
        };
      }

      default:
        return { error: `Tool '${name}' not implemented.` };
    }
  } catch (err: any) {
    console.error(`[Tool Execution Error] ${name}:`, err);
    return { error: err.message };
  }
}

/**
 * Intelligent local fallback evaluator for fast local matching and resilience.
 */
function localRuleFallback(message: string, sender_type: string, db: any): InquiryResult {
  const startTime = Date.now();
  const lower = message.toLowerCase();

  // 1. Bank Account / Payment details
  if (lower.includes('bank') || lower.includes('account') || lower.includes('transfer') || lower.includes('ibft') || lower.includes('meezan') || lower.includes('hbl') || lower.includes('payment method')) {
    const policy = executeDMSTool('get_distributor_policy', { topic: 'bank' }, db);
    const text = policy.policies?.[0]?.quick_template || 
      "Official Payment Account for FM Distributors:\n- Bank: Meezan Bank Ltd\n- Title: FM DISTRIBUTORS\n- A/C #: 0102-0105849201\n- IBAN: PK45MEZN0001020105849201\n- Branch: F.B Industrial Area Branch Karachi\n*Please share the payment deposit slip on WhatsApp for immediate ledger credit.*";
    return {
      response: text,
      detected_intent: 'PAYMENT_INFO',
      tools_used: ['get_distributor_policy'],
      response_time_ms: Date.now() - startTime,
      status: 'auto_resolved'
    };
  }

  // 2. Ledger Balance & Outstanding dues
  if (lower.includes('balance') || lower.includes('hisaab') || lower.includes('ledger') || lower.includes('dues') || lower.includes('outstanding') || lower.includes('khata') || lower.includes('baki')) {
    const shops = db.prepare(`
      SELECT s.id, s.shop_name, s.location, s.credit_limit,
        coalesce((SELECT balance FROM client_ledger WHERE shop_id = s.id ORDER BY id DESC LIMIT 1), 0) as balance 
      FROM shops s 
      ORDER BY s.id
    `).all() as any[];
    
    let matchedShop = shops.find((s: any) => lower.includes(s.shop_name.toLowerCase()) || lower.includes(String(s.id)));
    if (!matchedShop && shops.length > 0) {
      matchedShop = shops[0];
    }

    if (matchedShop) {
      const ledgerData = executeDMSTool('get_shop_ledger', { shop_id: matchedShop.id }, db);
      const bal = Number(ledgerData.current_outstanding_balance || 0);
      const cred = Number(ledgerData.credit_limit || 50000);
      const remaining = Math.max(0, cred - bal);

      let resp = `📋 *Ledger & Balance Statement*\n\n` +
        `• *Shop*: ${ledgerData.shop_name} (#${ledgerData.shop_id})\n` +
        `• *Location*: ${ledgerData.location}\n` +
        `• *Current Outstanding Balance*: PKR ${bal.toLocaleString()}\n` +
        `• *Credit Limit*: PKR ${cred.toLocaleString()}\n` +
        `• *Remaining Available Credit*: PKR ${remaining.toLocaleString()}\n`;

      if (ledgerData.recent_ledger_entries && ledgerData.recent_ledger_entries.length > 0) {
        resp += `\n*Recent Transactions:*\n` +
          ledgerData.recent_ledger_entries.slice(0, 3).map((e: any) => 
            `  - ${new Date(e.date).toLocaleDateString()}: ${e.description} | Deb: ${e.debit || 0} | Cred: ${e.credit || 0} | Bal: PKR ${(e.balance || 0).toLocaleString()}`
          ).join('\n');
      }

      if (bal > cred) {
        resp += `\n\n⚠️ *Notice*: Current balance exceeds the allocated credit limit. Please clear pending dues to avoid order dispatch holds.`;
      }

      return {
        response: resp,
        detected_intent: 'LEDGER_BALANCE',
        tools_used: ['get_shop_ledger'],
        response_time_ms: Date.now() - startTime,
        action_data: ledgerData,
        status: 'auto_resolved'
      };
    }
  }

  // 3. Order Tracking / Order Status
  if (lower.includes('order') || lower.includes('ord-') || lower.includes('status') || lower.includes('booking')) {
    const orderMatch = message.match(/(?:ord-?|#|order\s*)(\d+)/i);
    const orderId = orderMatch ? Number(orderMatch[1]) : undefined;
    const ordersResult = executeDMSTool('get_order_status', { order_id: orderId, limit: 3 }, db);

    if (ordersResult.orders && ordersResult.orders.length > 0) {
      let resp = `📦 *Order Tracking Details*\n\n`;
      for (const o of ordersResult.orders) {
        resp += `• *Order #ORD-${o.id.toString().padStart(4, '0')}*\n` +
          `  - Shop: ${o.shop_name} (${o.location})\n` +
          `  - Amount: PKR ${Number(o.total_amount || 0).toLocaleString()}\n` +
          `  - Status: *${(o.status || 'pending').toUpperCase()}*\n` +
          `  - Date: ${new Date(o.order_date).toLocaleDateString()}\n`;

        if (o.delivery) {
          resp += `  - Dispatch: Delivery #DEL-${o.delivery.delivery_id} (${o.delivery.status || 'dispatched'})\n`;
        }
        if (o.items && o.items.length > 0) {
          resp += `  - Items: ${o.items.map((it: any) => `${it.product_name} (${it.quantity}x)`).join(', ')}\n`;
        }
        resp += `\n`;
      }
      return {
        response: resp.trim(),
        detected_intent: 'ORDER_STATUS',
        tools_used: ['get_order_status'],
        response_time_ms: Date.now() - startTime,
        action_data: ordersResult,
        status: 'auto_resolved'
      };
    }
  }

  // 4. Product Stock & Pricing
  if (lower.includes('price') || lower.includes('rate') || lower.includes('stock') || lower.includes('sugar') || lower.includes('oil') || lower.includes('soap') || lower.includes('available') || lower.includes('kya rate')) {
    const stockResult = executeDMSTool('check_product_stock_and_price', { product_query: message.replace(/price|rate|stock|available|check|kya|hai/gi, '').trim() }, db);
    if (stockResult.products && stockResult.products.length > 0) {
      let resp = `🏷️ *Product Stock & Price Catalog*\n\n`;
      for (const p of stockResult.products.slice(0, 6)) {
        const stockIcon = p.stock_status === 'AVAILABLE' ? '✅ In Stock' : p.stock_status === 'LOW_STOCK' ? '⚠️ Low Stock' : '❌ Out of Stock';
        resp += `• *${p.product_name}* (${p.product_id})\n` +
          `  - Trade Price: PKR ${Number(p.trade_price).toLocaleString()} | Retail Price: PKR ${Number(p.retail_price).toLocaleString()}\n` +
          `  - Available Quantity: *${p.stock_quantity}* ${p.unit || 'EA'} (${stockIcon})\n\n`;
      }
      return {
        response: resp.trim(),
        detected_intent: 'STOCK_PRICING',
        tools_used: ['check_product_stock_and_price'],
        response_time_ms: Date.now() - startTime,
        action_data: stockResult,
        status: 'auto_resolved'
      };
    }
  }

  // 5. Delivery Arrival & Timing
  if (lower.includes('delivery') || lower.includes('gari') || lower.includes('driver') || lower.includes('kab') || lower.includes('dispatch') || lower.includes('arrival')) {
    const delResult = executeDMSTool('get_delivery_dispatch', {}, db);
    if (delResult.deliveries && delResult.deliveries.length > 0) {
      let resp = `🚚 *Recent Delivery & Dispatch Status*\n\n`;
      for (const d of delResult.deliveries.slice(0, 3)) {
        resp += `• *Delivery #DEL-${d.delivery_id.toString().padStart(4, '0')}* (Order #ORD-${d.order_id})\n` +
          `  - Shop: ${d.shop_name || 'Retailer'}\n` +
          `  - Status: *${(d.delivery_status || 'dispatched').toUpperCase()}*\n` +
          `  - Vehicle: ${d.vehicle_no || 'DMS-VAN-01'}\n` +
          `  - Driver: ${d.driver_name || 'Muhammad Rafiq'} (${d.driver_phone || '0300-1234567'})\n\n`;
      }
      resp += `*Policy Reminder:* Deliveries on standard routes arrive between 10:00 AM - 6:00 PM.`;
      return {
        response: resp,
        detected_intent: 'DELIVERY_STATUS',
        tools_used: ['get_delivery_dispatch'],
        response_time_ms: Date.now() - startTime,
        action_data: delResult,
        status: 'auto_resolved'
      };
    }
  }

  // General fallback response
  return {
    response: `Hello! I am the automated FMCG Inquiry Assistant for FM Distributors Karachi.\n\nI can instantly help you with:\n1. 📊 *Shop Ledger & Outstanding Balance* (e.g. "What is my ledger balance for Hyper Link?")\n2. 📦 *Order Status & Tracking* (e.g. "Track order #ORD-0002")\n3. 🏷️ *Product Stock & Price List* (e.g. "Check price and stock of White Sugar 1kg")\n4. 🚚 *Delivery & Dispatch Details* (e.g. "When will delivery arrive?")\n5. 💳 *Bank Transfer Account Details* (e.g. "Send bank details for invoice payment")\n\nPlease let me know your question or shop name!`,
    detected_intent: 'GENERAL_INQUIRY',
    tools_used: [],
    response_time_ms: Date.now() - startTime,
    status: 'auto_resolved'
  };
}

/**
 * Main Inquiry Handler using Gemini 3.7 Flash with Function Calling and Tool Execution.
 */
export async function processInquiry(req: InquiryRequest, db: any): Promise<InquiryResult> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    // Graceful rule-based DMS execution if Gemini API key not yet attached
    const fallbackResult = localRuleFallback(req.incoming_message, req.sender_type || 'customer', db);
    
    // Log inquiry
    try {
      const logStmt = db.prepare(`
        INSERT INTO ai_inquiry_logs 
        (sender_type, sender_name, sender_phone, shop_id, channel, incoming_message, detected_intent, ai_response, tool_calls_executed, response_time_ms, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const logRes = logStmt.run(
        req.sender_type || 'customer',
        req.sender_name || 'Customer / Rep',
        req.sender_phone || '',
        req.shop_id || null,
        req.channel || 'web_chat',
        req.incoming_message,
        fallbackResult.detected_intent,
        fallbackResult.response,
        JSON.stringify(fallbackResult.tools_used),
        fallbackResult.response_time_ms,
        fallbackResult.status
      );
      fallbackResult.log_id = Number(logRes.lastInsertRowid);
    } catch (e) {
      console.warn("Inquiry logging notice:", e);
    }

    return fallbackResult;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const getShopLedgerTool: FunctionDeclaration = {
      name: "get_shop_ledger",
      description: "Retrieves live ledger balance, outstanding balance, credit limit, and recent ledger entries for a shop by shop_id, shop_name, or phone number.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          shop_query: { type: Type.STRING, description: "The shop name, shop ID, or phone number" }
        },
        required: ["shop_query"]
      }
    };

    const getOrderStatusTool: FunctionDeclaration = {
      name: "get_order_status",
      description: "Tracks order details and current status (pending, delivered, partially_delivered, cancelled) for an order ID, shop name, or order booker name.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          order_id: { type: Type.INTEGER, description: "The numerical Order ID (e.g. 1, 2, 3)" },
          shop_query: { type: Type.STRING, description: "Shop name or phone number" }
        }
      }
    };

    const getDeliveryDispatchTool: FunctionDeclaration = {
      name: "get_delivery_dispatch",
      description: "Retrieves delivery status, assigned vehicle, driver, delivery items, and invoice linkage for an order or delivery number.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          delivery_id: { type: Type.INTEGER, description: "The delivery ID number" },
          shop_query: { type: Type.STRING, description: "Shop name or phone number" }
        }
      }
    };

    const checkProductStockAndPriceTool: FunctionDeclaration = {
      name: "check_product_stock_and_price",
      description: "Looks up real-time warehouse inventory stock quantity, trade price, retail price, unit/pack size, and active trade discounts for products.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          product_query: { type: Type.STRING, description: "Product name or product code (e.g. Sugar, Oil, PR-SUGAR-W)" },
          material_group: { type: Type.STRING, description: "Category or material group name" }
        }
      }
    };

    const getInvoiceBreakdownTool: FunctionDeclaration = {
      name: "get_invoice_breakdown",
      description: "Fetches invoice details including items, quantities, rates, gross amount, tax, discounts, net amount, and payment status.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          invoice_id: { type: Type.INTEGER, description: "The numerical Invoice ID number" },
          shop_query: { type: Type.STRING, description: "Shop name or phone number" }
        }
      }
    };

    const listShopsByRouteTool: FunctionDeclaration = {
      name: "list_shops_by_route",
      description: "Lists registered retail shops in a given area, sub-area, or assigned to an order booker / sales rep.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          area_query: { type: Type.STRING, description: "Area name e.g. North Nazimabad, Gulshan, FB Area" },
          booker_name: { type: Type.STRING, description: "Order booker / sales rep name" }
        }
      }
    };

    const createDraftOrderInquiryTool: FunctionDeclaration = {
      name: "create_draft_order_inquiry",
      description: "Creates a draft sales order booking for a shop with specified items when requested by a customer or sales rep.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          shop_id: { type: Type.INTEGER, description: "The ID of the shop placing the order" },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                product_id: { type: Type.STRING, description: "Product ID code (e.g. PR-SUGAR-W)" },
                quantity: { type: Type.INTEGER, description: "Order quantity units" }
              },
              required: ["product_id", "quantity"]
            },
            description: "List of items to book"
          },
          notes: { type: Type.STRING, description: "Special booking notes" }
        },
        required: ["shop_id", "items"]
      }
    };

    const getDistributorPolicyTool: FunctionDeclaration = {
      name: "get_distributor_policy",
      description: "Fetches official distributor policies including bank account details for wire transfers, delivery dispatch cutoff schedules, return policies, and credit terms.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING, description: "Policy topic (bank, delivery, return, credit)" }
        }
      }
    };

    const systemInstruction = `
You are the 24/7 Automated AI Inquiry Assistant & Virtual Dispatcher for "FM DISTRIBUTORS", a premier FMCG Distribution Management System in Karachi, Pakistan.
Your primary role is to answer routine customer (retailer) and field sales rep (order booker) inquiries immediately without requiring human intervention.

Key Responsibilities:
1. Provide accurate, real-time data lookups from the DMS (Live Ledger Balances, Order Status, Delivery Tracking, Stock Availability, Trade/Retail Pricing, Invoice Breakdowns).
2. Answer in clear, polite, professional, and friendly language (English or Urdu/Roman Urdu as preferred by the user).
3. Always format numbers cleanly in Pakistani Rupees (PKR) e.g., "PKR 40,000".
4. When a user asks about payment methods or bank account, provide the official Meezan Bank details.
5. If an order booking is requested, call 'create_draft_order_inquiry' and confirm the newly generated Order ID.
6. When stock is low or credit limit is exceeded, proactively mention helpful guidance politely.
7. Use bullet points and clean structure so messages are easy to read on mobile devices / WhatsApp.
`;

    const toolsUsed: string[] = [];
    let actionData: any = null;

    // Step 1: Initial call to Gemini with tools
    let response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: req.incoming_message,
      config: {
        systemInstruction,
        temperature: 0.2,
        tools: [{
          functionDeclarations: [
            getShopLedgerTool,
            getOrderStatusTool,
            getDeliveryDispatchTool,
            checkProductStockAndPriceTool,
            getInvoiceBreakdownTool,
            listShopsByRouteTool,
            createDraftOrderInquiryTool,
            getDistributorPolicyTool
          ]
        }]
      }
    });

    let finalResponseText = response.text || "";

    // Handle function calls if model requested tool execution
    if (response.functionCalls && response.functionCalls.length > 0) {
      const toolCallResponses: any[] = [];

      for (const call of response.functionCalls) {
        toolsUsed.push(call.name);
        const toolResult = executeDMSTool(call.name, call.args, db);
        actionData = toolResult;

        toolCallResponses.push({
          functionResponse: {
            name: call.name,
            response: { result: toolResult }
          }
        });
      }

      // Step 2: Feed tool responses back to Gemini using role 'user' (valid in Gemini API)
      const followUpResponse = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          { role: "user", parts: [{ text: req.incoming_message }] },
          response.candidates?.[0]?.content as any,
          {
            role: "user",
            parts: toolCallResponses
          }
        ],
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });

      finalResponseText = followUpResponse.text || finalResponseText;
    }

    // Determine intent
    let detectedIntent = 'GENERAL_INQUIRY';
    if (toolsUsed.includes('get_shop_ledger')) detectedIntent = 'LEDGER_BALANCE';
    else if (toolsUsed.includes('get_order_status')) detectedIntent = 'ORDER_STATUS';
    else if (toolsUsed.includes('get_delivery_dispatch')) detectedIntent = 'DELIVERY_STATUS';
    else if (toolsUsed.includes('check_product_stock_and_price')) detectedIntent = 'STOCK_PRICING';
    else if (toolsUsed.includes('get_invoice_breakdown')) detectedIntent = 'INVOICE_LOOKUP';
    else if (toolsUsed.includes('create_draft_order_inquiry')) detectedIntent = 'ORDER_BOOKING';
    else if (toolsUsed.includes('get_distributor_policy')) detectedIntent = 'POLICY_FAQ';
    else if (toolsUsed.includes('list_shops_by_route')) detectedIntent = 'ROUTE_SHOPS';

    const executionTime = Date.now() - startTime;

    // Log the transaction
    let logId: number | undefined;
    try {
      const logStmt = db.prepare(`
        INSERT INTO ai_inquiry_logs 
        (sender_type, sender_name, sender_phone, shop_id, channel, incoming_message, detected_intent, ai_response, tool_calls_executed, response_time_ms, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const logRes = logStmt.run(
        req.sender_type || 'customer',
        req.sender_name || 'Customer / Rep',
        req.sender_phone || '',
        req.shop_id || null,
        req.channel || 'web_chat',
        req.incoming_message,
        detectedIntent,
        finalResponseText,
        JSON.stringify(toolsUsed),
        executionTime,
        'auto_resolved'
      );
      logId = Number(logRes.lastInsertRowid);
    } catch (e) {
      console.warn("Inquiry logging notice:", e);
    }

    return {
      response: finalResponseText,
      detected_intent: detectedIntent,
      tools_used: toolsUsed,
      response_time_ms: executionTime,
      log_id: logId,
      action_data: actionData,
      status: 'auto_resolved'
    };

  } catch (err: any) {
    console.error("[AI Inquiry Error]", err);
    // Fallback to local rule evaluator on error
    const fallbackResult = localRuleFallback(req.incoming_message, req.sender_type || 'customer', db);
    return fallbackResult;
  }
}
