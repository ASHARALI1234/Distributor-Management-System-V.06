
export interface TCodeInfo {
  module: string;
  parentModule: string;
  tCode: string;
  transactionName: string;
  actionType: 'Create' | 'Change' | 'Display' | 'Manage' | 'Delete' | 'Report';
  roleAssociation: string;
  description: string;
}

export const TCODES: TCodeInfo[] = [
  // Master Data - Distributor Master Setup
  {
    module: 'Distributor Management',
    parentModule: 'Master Data',
    tCode: 'DST01',
    transactionName: 'Distributor Master Setup',
    actionType: 'Manage',
    roleAssociation: 'Z_SUPER_ADMIN',
    description: 'Central portal to maintain distributor franchises, logistics hubs, NTN/STRN, and operating entities.'
  },
  {
    module: 'Distributor Management',
    parentModule: 'Master Data',
    tCode: 'DIS01',
    transactionName: 'Distributor Master Setup',
    actionType: 'Manage',
    roleAssociation: 'Z_SUPER_ADMIN',
    description: 'Alternative code for Distributor Master setup and franchise management.'
  },
  {
    module: 'Distributor Management',
    parentModule: 'Master Data',
    tCode: 'DM01',
    transactionName: 'Distributor Operations Master',
    actionType: 'Display',
    roleAssociation: 'Z_SUPER_ADMIN',
    description: 'Quick lookup for registered distributors, regional branches, and active operations.'
  },

  // Master Data - Salesman
  {
    module: 'Salesman Management',
    parentModule: 'Master Data',
    tCode: 'SLM1',
    transactionName: 'Salesmen Master',
    actionType: 'Manage',
    roleAssociation: 'Z_SALESMAN_ADMIN',
    description: 'Central portal for all salesmen management tasks.'
  },
  {
    module: 'Salesman Management',
    parentModule: 'Master Data',
    tCode: 'SM01',
    transactionName: 'Salesman Overview',
    actionType: 'Display',
    roleAssociation: 'Z_SALESMAN_VIEWER',
    description: 'Overview of all active and inactive salesmen.'
  },
  {
    module: 'Salesman Management',
    parentModule: 'Master Data',
    tCode: 'SM05',
    transactionName: 'Manage Salesmen',
    actionType: 'Manage',
    roleAssociation: 'Z_SALESMAN_MANAGER',
    description: 'Update salesman contact information and status.'
  },
  {
    module: 'Salesman Management',
    parentModule: 'Master Data',
    tCode: 'SM07',
    transactionName: 'Create Salesman',
    actionType: 'Create',
    roleAssociation: 'Z_SALESMAN_ADMIN',
    description: 'Onboard new salesman into the distribution system.'
  },
  {
    module: 'Salesman Management',
    parentModule: 'Master Data',
    tCode: 'SM08',
    transactionName: 'Delete Salesman Record',
    actionType: 'Delete',
    roleAssociation: 'Z_SALESMAN_ADMIN',
    description: 'Archive or remove a salesman record.'
  },

  // Master Data - Product
  {
    module: 'Product Management',
    parentModule: 'Master Data',
    tCode: 'PR01',
    transactionName: 'Product Overview',
    actionType: 'Display',
    roleAssociation: 'Z_PRODUCT_VIEWER',
    description: 'List all products with basic trade and retail prices.'
  },
  {
    module: 'Product Management',
    parentModule: 'Master Data',
    tCode: 'PR02',
    transactionName: 'Manage Product Data',
    actionType: 'Manage',
    roleAssociation: 'Z_PRODUCT_MASTER',
    description: 'Update product descriptions, brands, and prices.'
  },
  {
    module: 'Product Management',
    parentModule: 'Master Data',
    tCode: 'PR03',
    transactionName: 'Create Product',
    actionType: 'Create',
    roleAssociation: 'Z_PRODUCT_MASTER',
    description: 'Define new SKUs in the inventory system.'
  },

  // Master Data - Shop
  {
    module: 'Shop Management',
    parentModule: 'Master Data',
    tCode: 'SH01',
    transactionName: 'Shop Overview',
    actionType: 'Display',
    roleAssociation: 'Z_SHOP_VIEWER',
    description: 'View list of all registered shops and routes.'
  },
  {
    module: 'Shop Management',
    parentModule: 'Master Data',
    tCode: 'SH05',
    transactionName: 'Register New Shop',
    actionType: 'Create',
    roleAssociation: 'Z_SHOP_ADMIN',
    description: 'Register a new retailer or mart for delivery.'
  },
  {
    module: 'Shop Management',
    parentModule: 'Master Data',
    tCode: 'SH07',
    transactionName: 'Create Shop',
    actionType: 'Create',
    roleAssociation: 'Z_SHOP_ADMIN',
    description: 'Quick creation of shop records.'
  },
  {
    module: 'Shop Management',
    parentModule: 'Master Data',
    tCode: 'SH08',
    transactionName: 'Delete Shop Record',
    actionType: 'Delete',
    roleAssociation: 'Z_SHOP_ADMIN',
    description: 'Remove or archive shop master records.'
  },
  {
    module: 'Shop Management',
    parentModule: 'Master Data',
    tCode: 'SHM1',
    transactionName: 'Shop Master Maintenance',
    actionType: 'Manage',
    roleAssociation: 'Z_SHOP_MANAGER',
    description: 'Comprehensive management of shop details and credit.'
  },
  {
    module: 'Shop Management',
    parentModule: 'Master Data',
    tCode: 'VD01',
    transactionName: 'Create Customer (Shop)',
    actionType: 'Create',
    roleAssociation: 'Z_SHOP_ADMIN',
    description: 'SAP standard code for creating customers.'
  },
  {
    module: 'Shop Management',
    parentModule: 'Master Data',
    tCode: 'VD02',
    transactionName: 'Change Customer (Shop)',
    actionType: 'Change',
    roleAssociation: 'Z_SHOP_MANAGER',
    description: 'SAP standard code for modifying customer master.'
  },
  {
    module: 'Shop Management',
    parentModule: 'Master Data',
    tCode: 'VD03',
    transactionName: 'Display Customer (Shop)',
    actionType: 'Display',
    roleAssociation: 'Z_SHOP_VIEWER',
    description: 'SAP standard code for displaying customer data.'
  },

  // Inventory
  {
    module: 'Inventory Control',
    parentModule: 'Inventory',
    tCode: 'IN01',
    transactionName: 'Stock Status Report',
    actionType: 'Report',
    roleAssociation: 'Z_STOCK_CLERK',
    description: 'Current real-time stock levels of all products.'
  },
  {
    module: 'Inventory Control',
    parentModule: 'Inventory',
    tCode: 'IN05',
    transactionName: 'Material Group Maintenance',
    actionType: 'Manage',
    roleAssociation: 'Z_STOCK_MANAGER',
    description: 'Define and link product categories (groups).'
  },

  // Sales/Transactions
  {
    module: 'Order Management',
    parentModule: 'Sales',
    tCode: 'OR01',
    transactionName: 'Booking Overview',
    actionType: 'Display',
    roleAssociation: 'Z_ORDER_VIEWER',
    description: 'Track daily booking progress and history.'
  },
  {
    module: 'Order Management',
    parentModule: 'Sales',
    tCode: 'OR05',
    transactionName: 'New Sale Order',
    actionType: 'Create',
    roleAssociation: 'Z_ORDER_BOOKER',
    description: 'Create individual booking for a shop client.'
  },
  {
    module: 'Order Management',
    parentModule: 'Sales',
    tCode: 'ORD02',
    transactionName: 'Order Cancellation',
    actionType: 'Change',
    roleAssociation: 'Z_ORDER_ADMIN',
    description: 'Bulk cancel order documents and release allocated stock count.'
  },

  // Logistics
  {
    module: 'Logistics',
    parentModule: 'Logistics',
    tCode: 'DL01',
    transactionName: 'Delivery Fleet Status',
    actionType: 'Display',
    roleAssociation: 'Z_LOGISTICS_COORD',
    description: 'Status of all drivers and delivery vehicles.'
  },
  {
    module: 'Logistics',
    parentModule: 'Logistics',
    tCode: 'DL05',
    transactionName: 'Generate Daily Load Plan',
    actionType: 'Manage',
    roleAssociation: 'Z_LOGISTICS_ADMIN',
    description: 'Assign orders to vehicles for delivery.'
  },

  // Master Data - Supplier
  {
    module: 'Supplier Management',
    parentModule: 'Master Data',
    tCode: 'SU01',
    transactionName: 'Supplier Overview',
    actionType: 'Display',
    roleAssociation: 'Z_SUPPLIER_VIEWER',
    description: 'View list of all registered suppliers and vendors.'
  },
  {
    module: 'Supplier Management',
    parentModule: 'Master Data',
    tCode: 'SU05',
    transactionName: 'Register New Supplier',
    actionType: 'Create',
    roleAssociation: 'Z_SUPPLIER_ADMIN',
    description: 'Register a new supplier or vendor for purchases.'
  },
  {
    module: 'Supplier Management',
    parentModule: 'Master Data',
    tCode: 'SU07',
    transactionName: 'Create Supplier',
    actionType: 'Create',
    roleAssociation: 'Z_SUPPLIER_ADMIN',
    description: 'Quick creation of supplier records.'
  },
  {
    module: 'Supplier Management',
    parentModule: 'Master Data',
    tCode: 'SU08',
    transactionName: 'Delete Supplier Record',
    actionType: 'Delete',
    roleAssociation: 'Z_SUPPLIER_ADMIN',
    description: 'Remove or archive supplier master records.'
  },
  {
    module: 'Supplier Management',
    parentModule: 'Master Data',
    tCode: 'SUM1',
    transactionName: 'Supplier Master Maintenance',
    actionType: 'Manage',
    roleAssociation: 'Z_SUPPLIER_MANAGER',
    description: 'Comprehensive management of supplier details and terms.'
  },
  {
    module: 'Supplier Management',
    parentModule: 'Master Data',
    tCode: 'XK01',
    transactionName: 'Create Vendor (Supplier)',
    actionType: 'Create',
    roleAssociation: 'Z_SUPPLIER_ADMIN',
    description: 'SAP standard code for creating vendors.'
  },
  {
    module: 'Supplier Management',
    parentModule: 'Master Data',
    tCode: 'XK02',
    transactionName: 'Change Vendor (Supplier)',
    actionType: 'Change',
    roleAssociation: 'Z_SUPPLIER_MANAGER',
    description: 'SAP standard code for modifying vendor master.'
  },
  {
    module: 'Supplier Management',
    parentModule: 'Master Data',
    tCode: 'XK03',
    transactionName: 'Display Vendor (Supplier)',
    actionType: 'Display',
    roleAssociation: 'Z_SUPPLIER_VIEWER',
    description: 'SAP standard code for displaying vendor data.'
  },
  {
    module: 'Unit Management',
    parentModule: 'Master Data',
    tCode: 'UN01',
    transactionName: 'Units Master Maintenance',
    actionType: 'Manage',
    roleAssociation: 'Z_UNIT_MANAGER',
    description: 'Comprehensive management of measurement units (e.g. PCS, KG, BOX).'
  },
  {
    module: 'Invoice Management',
    parentModule: 'Sales',
    tCode: 'INV01',
    transactionName: 'Invoice Transaction',
    actionType: 'Create',
    roleAssociation: 'Z_INVOICE_ADMIN',
    description: 'Convert deliveries into final bills/invoices for shops.'
  },
  {
    module: 'Invoice Management',
    parentModule: 'Sales',
    tCode: 'VF03',
    transactionName: 'Display Invoice',
    actionType: 'Display',
    roleAssociation: 'Z_INVOICE_VIEWER',
    description: 'View and print posted invoice documents.'
  },
  {
    module: 'Order Management',
    parentModule: 'Sales',
    tCode: 'VA03',
    transactionName: 'Display Sales Order',
    actionType: 'Display',
    roleAssociation: 'Z_ORDER_VIEWER',
    description: 'Search and display detail of a Sales Order.'
  },
  {
    module: 'Logistics',
    parentModule: 'Sales',
    tCode: 'VL03',
    transactionName: 'Display Delivery',
    actionType: 'Display',
    roleAssociation: 'Z_DELIVERY_VIEWER',
    description: 'Search and display detail of a Delivery document.'
  },
  {
    module: 'Purchasing',
    parentModule: 'Procurement',
    tCode: 'ME03',
    transactionName: 'Display Purchase Order',
    actionType: 'Display',
    roleAssociation: 'Z_PURCHASE_VIEWER',
    description: 'Search and display detail of a Purchase Order.'
  },
  {
    module: 'Return Delivery',
    parentModule: 'Sales',
    tCode: 'LR03',
    transactionName: 'Display Return',
    actionType: 'Display',
    roleAssociation: 'Z_RETURN_VIEWER',
    description: 'Search and display detail of a Return document.'
  },
  {
    module: 'Location Management',
    parentModule: 'Master Data',
    tCode: 'LOC01',
    transactionName: 'Location Master',
    actionType: 'Manage',
    roleAssociation: 'Z_LOCATION_MANAGER',
    description: 'Manage provinces, cities, towns, areas and sub-areas.'
  },
  {
    module: 'Return Management',
    parentModule: 'Sales',
    tCode: 'RT01',
    transactionName: 'Delivery Return Transaction',
    actionType: 'Create',
    roleAssociation: 'Z_RETURN_CLERK',
    description: 'Process customer returns (Reverse Logistics) and restock inventory.'
  },
  {
    module: 'Return Management',
    parentModule: 'Sales',
    tCode: 'SRT01',
    transactionName: 'Sales Return Transaction',
    actionType: 'Create',
    roleAssociation: 'Z_RETURN_CLERK',
    description: 'Process shop sales returns referencing invoice number and increase stock.'
  },
  {
    module: 'Return Management',
    parentModule: 'Procurement',
    tCode: 'PRT01',
    transactionName: 'Purchase Return Transaction',
    actionType: 'Create',
    roleAssociation: 'Z_PURCHASE_CLERK',
    description: 'Process vendor purchase returns referencing purchase order number and decrease stock.'
  },
  {
    module: 'Daily Load Plan',
    parentModule: 'Reports',
    tCode: 'LPR01',
    transactionName: 'Daily Load Plan Report',
    actionType: 'Report',
    roleAssociation: 'Z_REPORT_AUDITOR',
    description: 'Generate high-efficiency physical load plan and stop sequencing guides.'
  },
  {
    module: 'User Management',
    parentModule: 'Basis / Security',
    tCode: 'USR1',
    transactionName: 'User Master & Credentials Maintenance',
    actionType: 'Manage',
    roleAssociation: 'Z_BASIS_ADMIN',
    description: 'Create and manage system operator and salesman user logins and access passwords.'
  },
  {
    module: 'User Maintenance',
    parentModule: 'Basis / Security',
    tCode: 'SU01',
    transactionName: 'User Maintenance & Access Roles',
    actionType: 'Manage',
    roleAssociation: 'Z_SECURITY_ADMIN',
    description: 'Maintain authorizations, user accounts and access profiles.'
  },
  {
    module: 'System Session',
    parentModule: 'System',
    tCode: 'EXIT',
    transactionName: 'Log Off Session',
    actionType: 'Manage',
    roleAssociation: 'ALL_USERS',
    description: 'Safely terminate active DMS operator session and return to login portal.'
  }
];
