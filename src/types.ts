export interface Distributor {
  id: number;
  code: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  ntn_number?: string;
  strn_number?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  total_shops?: number;
  total_users?: number;
  total_orders?: number;
}

export interface AuthUser {
  id: number;
  name: string;
  role: 'admin' | 'salesman' | 'order_booker' | 'accountant' | string;
  roles?: string[];
  role_ids?: number[];
  phone: string;
  distributor_id?: number | null;
  distributor_name?: string;
  distributor_code?: string;
  token?: string;
  permitted_tcodes?: string[];
}

export interface DmsUser {
  id: number;
  name: string;
  role: string;
  roles?: { id: number; name: string; description?: string }[];
  role_ids?: number[];
  phone: string;
  password?: string;
  distributor_id?: number | null;
  distributor_name?: string;
  distributor_code?: string;
  permitted_tcodes?: string[];
}

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  tcode_count?: number;
  user_count?: number;
  tcodes?: string[];
}

export interface TCodeMaster {
  tcode: string;
  module: string;
  parent_module: string;
  transaction_name: string;
  action_type: 'Create' | 'Change' | 'Display' | 'Manage' | 'Delete' | 'Report';
  role_association?: string;
  description: string;
  role_count?: number;
}

export interface Unit {
  id: number;
  unit_code: string;
  name: string;
  short_name: string;
  status: number;
}

export interface MaterialGroup {
  mat_gp: string;
  mat_description: string;
}

export interface Product {
  product_id: string;
  product_name: string;
  brand: string;
  material_group_id: string;
  material_group_name?: string;
  purchase_price: number; // PP
  trade_price: number;    // TP
  retail_price: number;   // RP
  stock_quantity: number;
  inventory_value?: number;
  moving_average_price?: number;
  opening_stock?: number;
  unit: string;
  conversion_value: number;
  conversion_unit: string;
  min_stock_level: number;
  reorder_level: number;
}

export interface InventoryAuditLog {
  id: number;
  product_id: string;
  product_name?: string;
  brand?: string;
  transaction_type: 'PURCHASE' | 'PURCHASE_RETURN' | 'SALE' | 'SALE_RETURN' | 'ADJUSTMENT';
  reference_id?: string | number;
  qty_change: number;
  unit_price: number;
  previous_stock: number;
  previous_value: number;
  previous_map: number;
  new_stock: number;
  new_value: number;
  new_map: number;
  notes?: string;
  timestamp: string;
}

export interface Shop {
  id: number;
  shop_name: string;
  owner_name: string;
  location: string;
  phone: string;
  credit_limit: number;
  category?: string;
}

export interface OrderBooker {
  id: number;
  name: string;
  father_name: string;
  cell_no: string;
  cnic_no: string;
  joining_date: string;
}

export interface Salesman {
  id: number;
  name: string;
  father_name: string;
  cell_no: string;
  cnic_no: string;
  joining_date: string;
}

export interface Order {
  id: number;
  shop_id: number;
  order_booker_id: number;
  order_date: string;
  estimated_delivery_date: string;
  status: 'pending' | 'delivered' | 'cancelled' | 'partially_delivered';
  total_amount: number;
  shop_name: string;
  order_booker_name: string;
  items_summary?: string;
  is_cancelled?: string;
  has_delivery?: boolean | number;
  sales_tax_pct?: number;
  sales_tax_amount?: number;
  additional_tax_pct?: number;
  additional_tax_amount?: number;
  discount_pct?: number;
  discount_amount?: number;
  extra_discount_pct?: number;
  extra_discount_amount?: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
  brand: string;
  status: 'pending' | 'delivered' | 'cancelled' | 'partially_delivered';
  delivered_quantity?: number;
  sales_tax_pct?: number;
  sales_tax_amount?: number;
  additional_tax_pct?: number;
  additional_tax_amount?: number;
  discount_pct?: number;
  discount_amount?: number;
  extra_discount_pct?: number;
  extra_discount_amount?: number;
}

export interface StockValuationReport {
  totalValueAtPP: number;
  totalPotentialRevenueAtTP: number;
  totalPotentialProfit: number;
  averageMarginPercent: number;
}

export interface DashboardStats {
  totalSales: number;
  pendingOrders: number;
  lowStock: number;
  totalShops: number;
  orderStatusCounts: { name: string; value: number }[];
  salesByTown: { name: string; value: number }[];
  topOrderBookers: { name: string; value: number }[];
  salesTrend: { name: string; value: number }[];
  categorySales: { name: string; value: number }[];
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
}

export interface Purchase {
  id: number;
  supplier_id: number;
  supplier_name: string;
  purchase_date: string;
  items_summary?: string;
  total_amount: number;
  status: 'received' | 'pending';
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: string;
  quantity: number;
  price: number;
  product_name?: string;
  supplier_batch_no?: string;
  storage_location?: string;
}

export interface Driver {
  id: number;
  name: string;
  father_name: string;
  cell_no: string;
  cnic_no: string;
  joining_date: string;
}

export interface LoadPlan {
  id: number;
  plan_date: string;
  vehicle_id: string;
  driver_id: number;
  driver_name?: string;
  items_summary?: string;
  status: 'draft' | 'dispatched' | 'completed';
}

export interface LoadPlanItem {
  id: number;
  plan_id: number;
  order_id: number;
  shop_name?: string;
  total_amount?: number;
}

export interface LedgerEntry {
  id: number;
  shop_id: number;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface Country {
  id: number;
  name: string;
}

export interface Province {
  id: number;
  country_id: number;
  name: string;
}

export interface City {
  id: number;
  province_id: number;
  name: string;
}

export interface Town {
  id: number;
  city_id: number;
  name: string;
}

export interface Area {
  id: number;
  town_id: number;
  name: string;
}

export interface Subarea {
  id: number;
  area_id: number;
  name: string;
}

export interface Delivery {
  id: number;
  order_id: number;
  order_ref: number;
  salesman_id: number;
  salesman_name: string;
  shop_id: number;
  shop_name: string;
  delivery_date: string;
  total_amount: number;
  items_summary?: string;
  status: 'completed';
}

export interface DeliveryItem {
  id: number;
  delivery_id: number;
  order_item_id: number;
  product_id: string;
  product_name?: string;
  brand?: string;
  quantity: number;
  return_qty?: number;
  net_qty?: number;
  price: number;
  order_id?: number;
  order_ref?: number;
  sales_tax_pct?: number;
  sales_tax_amount?: number;
  additional_tax_pct?: number;
  additional_tax_amount?: number;
  discount_pct?: number;
  discount_amount?: number;
  extra_discount_pct?: number;
  extra_discount_amount?: number;
}

export interface Invoice {
  id: number;
  shop_id: number;
  shop_name?: string;
  distributor_id?: number;
  distributor_name?: string;
  distributor_code?: string;
  distributor_address?: string;
  distributor_phone?: string;
  distributor_ntn?: string;
  distributor_strn?: string;
  distributor_city?: string;
  distributor_contact_person?: string;
  delivery_numbers?: string;
  invoice_date: string;
  gross_amount: number;
  total_discount: number;
  total_tax: number;
  net_amount: number;
  items_summary?: string;
  status: 'draft' | 'open' | 'posted' | 'paid' | 'cancelled';
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  delivery_id: number;
  delivery_item_id: number;
  product_id: string;
  product_name?: string;
  brand?: string;
  uom?: string;
  quantity: number;
  delivery_quantity?: number;
  max_delivery_qty?: number;
  return_qty?: number;
  unit_price: number;
  trade_discount_pct: number;
  tax_pct: number;
  additional_tax_pct?: number;
  special_discount_pct: number;
  net_amount: number;
}

export interface Return {
  id: number;
  return_date: string;
  shop_id: number;
  shop_name?: string;
  location?: string;
  total_amount: number;
  items_summary?: string;
  status: 'completed';
}

export interface ReturnItem {
  id: number;
  return_id: number;
  delivery_id: number;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  original_delivered_qty?: number;
  uom?: string;
}

export interface SalesReturn {
  id: number;
  return_date: string;
  shop_id: number;
  shop_name?: string;
  location?: string;
  invoice_id: number;
  invoice_ref_id?: number;
  total_amount: number;
  items_summary?: string;
  status: 'completed';
}

export interface SalesReturnItem {
  id: number;
  sales_return_id: number;
  invoice_item_id: number;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  original_invoice_qty?: number;
  uom?: string;
}

export interface PurchaseReturn {
  id: number;
  return_date: string;
  supplier_id: number;
  supplier_name?: string;
  purchase_id: number;
  purchase_ref_id?: number;
  total_amount: number;
  items_summary?: string;
  status: 'completed' | 'cancelled';
}

export interface PurchaseReturnItem {
  id: number;
  purchase_return_id: number;
  purchase_item_id: number;
  product_id: string;
  product_name?: string;
  brand?: string;
  quantity: number;
  unit_price: number;
  original_purchase_qty?: number;
  already_returned_qty?: number;
  net_qty?: number;
  current_return_qty?: number;
  reason?: string;
}

export interface AIInquiryLog {
  id: number;
  sender_type: 'customer' | 'sales_rep' | 'internal';
  sender_name?: string;
  sender_phone?: string;
  shop_id?: number;
  shop_name?: string;
  channel: 'web_chat' | 'whatsapp' | 'voice' | 'sms';
  incoming_message: string;
  detected_intent: string;
  ai_response: string;
  tool_calls_executed?: string;
  response_time_ms: number;
  status: 'auto_resolved' | 'escalated';
  escalation_notes?: string;
  feedback_rating?: number;
  created_at: string;
}

export interface AIInquiryRule {
  id: number;
  keyword_pattern: string;
  intent_category: string;
  quick_template: string;
  is_active: number;
  created_at?: string;
}

export interface AIInquiryStats {
  total_inquiries: number;
  auto_resolved: number;
  escalated: number;
  avg_response_time_ms: number;
  intents_breakdown: { intent: string; count: number }[];
  channels_breakdown: { channel: string; count: number }[];
}


