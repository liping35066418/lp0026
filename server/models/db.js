const Database = require('better-sqlite3');
const config = require('../config/database');
const fs = require('fs');
const path = require('path');

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.dbPath, config.options);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

function createTables() {
  const tableSQLs = [
    `CREATE TABLE IF NOT EXISTS category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      parent_id INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS product (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku VARCHAR(50) UNIQUE NOT NULL,
      barcode VARCHAR(50),
      name VARCHAR(200) NOT NULL,
      category_id INTEGER NOT NULL,
      spec VARCHAR(200),
      unit VARCHAR(20),
      cost_price DECIMAL(10,2) DEFAULT 0,
      sale_price DECIMAL(10,2) DEFAULT 0,
      warning_threshold INTEGER DEFAULT 10,
      expire_days_warning INTEGER DEFAULT 30,
      slow_moving_days INTEGER DEFAULT 90,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER UNIQUE NOT NULL,
      sku VARCHAR(50) UNIQUE NOT NULL,
      quantity INTEGER DEFAULT 0,
      available_qty INTEGER DEFAULT 0,
      locked_qty INTEGER DEFAULT 0,
      avg_cost_price DECIMAL(10,2) DEFAULT 0,
      total_cost_amount DECIMAL(12,2) DEFAULT 0,
      last_in_date DATETIME,
      last_out_date DATETIME,
      last_sale_date DATETIME,
      expire_date DATE,
      alert_status VARCHAR(20) DEFAULT 'normal',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS inventory_flow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flow_no VARCHAR(32) UNIQUE NOT NULL,
      flow_type VARCHAR(20) NOT NULL,
      reference_no VARCHAR(32),
      product_id INTEGER NOT NULL,
      sku VARCHAR(50) NOT NULL,
      quantity INTEGER NOT NULL,
      before_qty INTEGER NOT NULL,
      after_qty INTEGER NOT NULL,
      cost_price DECIMAL(10,2) DEFAULT 0,
      operator_id INTEGER,
      operator_name VARCHAR(50),
      remark VARCHAR(500),
      is_red_offset INTEGER DEFAULT 0,
      original_flow_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS customer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_no VARCHAR(50) UNIQUE,
      name VARCHAR(100),
      phone VARCHAR(20),
      level VARCHAR(20) DEFAULT 'normal',
      point INTEGER DEFAULT 0,
      total_consumption DECIMAL(12,2) DEFAULT 0,
      visit_count INTEGER DEFAULT 0,
      last_visit_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_no VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL,
      phone VARCHAR(20),
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS supplier (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_no VARCHAR(50) UNIQUE,
      name VARCHAR(200) NOT NULL,
      contact VARCHAR(100),
      phone VARCHAR(20),
      address VARCHAR(500),
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sales_order (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no VARCHAR(32) UNIQUE NOT NULL,
      customer_id INTEGER,
      staff_id INTEGER,
      total_amount DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      actual_amount DECIMAL(12,2) DEFAULT 0,
      total_cost DECIMAL(12,2) DEFAULT 0,
      profit DECIMAL(12,2) DEFAULT 0,
      profit_rate DECIMAL(5,2) DEFAULT 0,
      item_count INTEGER DEFAULT 0,
      pay_type VARCHAR(20),
      is_void INTEGER DEFAULT 0,
      void_reason VARCHAR(200),
      void_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sales_order_item (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      order_no VARCHAR(32) NOT NULL,
      product_id INTEGER NOT NULL,
      sku VARCHAR(50) NOT NULL,
      product_name VARCHAR(200) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      cost_price DECIMAL(10,2) DEFAULT 0,
      subtotal DECIMAL(12,2) NOT NULL,
      profit DECIMAL(12,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_order (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no VARCHAR(32) UNIQUE NOT NULL,
      supplier_id INTEGER,
      total_amount DECIMAL(12,2) DEFAULT 0,
      actual_amount DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      operator_id INTEGER,
      remark VARCHAR(500),
      in_warehouse_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_order_item (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      sku VARCHAR(50) NOT NULL,
      product_name VARCHAR(200) NOT NULL,
      quantity INTEGER NOT NULL,
      cost_price DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL,
      expire_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS stocktake_order (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no VARCHAR(32) UNIQUE NOT NULL,
      stocktake_date DATE NOT NULL,
      category_id INTEGER,
      status VARCHAR(20) DEFAULT 'pending',
      total_book_qty INTEGER DEFAULT 0,
      total_actual_qty INTEGER DEFAULT 0,
      total_diff_qty INTEGER DEFAULT 0,
      total_diff_amount DECIMAL(12,2) DEFAULT 0,
      operator_id INTEGER,
      remark VARCHAR(500),
      is_adjusted INTEGER DEFAULT 0,
      adjust_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS stocktake_item (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stocktake_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      sku VARCHAR(50) NOT NULL,
      product_name VARCHAR(200) NOT NULL,
      book_qty INTEGER NOT NULL,
      actual_qty INTEGER DEFAULT 0,
      diff_qty INTEGER DEFAULT 0,
      cost_price DECIMAL(10,2) DEFAULT 0,
      diff_amount DECIMAL(12,2) DEFAULT 0,
      diff_reason VARCHAR(200),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS report_template (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      report_type VARCHAR(50) NOT NULL,
      metrics TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      filters TEXT,
      layout_config TEXT,
      creator_id INTEGER,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sys_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_key VARCHAR(100) UNIQUE NOT NULL,
      config_value TEXT,
      description VARCHAR(500),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sys_user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  const indexSQLs = [
    `CREATE INDEX IF NOT EXISTS idx_category_parent ON category(parent_id)`,
    `CREATE INDEX IF NOT EXISTS idx_product_sku ON product(sku)`,
    `CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_inventory_alert ON inventory(alert_status)`,
    `CREATE INDEX IF NOT EXISTS idx_inventory_qty ON inventory(quantity)`,
    `CREATE INDEX IF NOT EXISTS idx_flow_type ON inventory_flow(flow_type)`,
    `CREATE INDEX IF NOT EXISTS idx_flow_product ON inventory_flow(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_flow_created ON inventory_flow(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_flow_ref ON inventory_flow(reference_no)`,
    `CREATE INDEX IF NOT EXISTS idx_customer_phone ON customer(phone)`,
    `CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_order(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_order(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sales_staff ON sales_order(staff_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sales_void ON sales_order(is_void)`,
    `CREATE INDEX IF NOT EXISTS idx_sales_item_order ON sales_order_item(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sales_item_product ON sales_order_item(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sales_item_created ON sales_order_item(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_purchase_status ON purchase_order(status)`,
    `CREATE INDEX IF NOT EXISTS idx_purchase_created ON purchase_order(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_purchase_item_order ON purchase_order_item(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_purchase_item_product ON purchase_order_item(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_stocktake_status ON stocktake_order(status)`,
    `CREATE INDEX IF NOT EXISTS idx_stocktake_date ON stocktake_order(stocktake_date)`,
    `CREATE INDEX IF NOT EXISTS idx_stocktake_item_order ON stocktake_item(stocktake_id)`,
    `CREATE INDEX IF NOT EXISTS idx_stocktake_item_product ON stocktake_item(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_report_type ON report_template(report_type)`
  ];

  tableSQLs.forEach(sql => db.exec(sql));
  indexSQLs.forEach(sql => db.exec(sql));
}

function initData() {
  const categories = db.prepare('SELECT COUNT(*) as count FROM category').get();
  if (categories.count === 0) {
    const insertCategory = db.prepare('INSERT INTO category (name, parent_id, sort_order) VALUES (?, ?, ?)');
    [
      ['食品饮料', 0, 1],
      ['日用百货', 0, 2],
      ['生鲜果蔬', 0, 3],
      ['休闲零食', 1, 1],
      ['酒水饮料', 1, 2],
      ['洗护用品', 2, 1],
      ['家居用品', 2, 2],
      ['蔬菜', 3, 1],
      ['水果', 3, 2]
    ].forEach(([name, parent, sort]) => insertCategory.run(name, parent, sort));

    const insertProduct = db.prepare(`INSERT INTO product 
      (sku, barcode, name, category_id, spec, unit, cost_price, sale_price, 
       warning_threshold, expire_days_warning, slow_moving_days) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    const products = [
      ['SKU001', '6901234567890', '可口可乐 330ml', 5, '330ml/罐', '罐', 2.5, 3.5, 50, 30, 60],
      ['SKU002', '6901234567891', '农夫山泉 550ml', 5, '550ml/瓶', '瓶', 1.2, 2.0, 100, 180, 60],
      ['SKU003', '6901234567892', '乐事薯片 原味', 4, '104g/袋', '袋', 5.5, 8.9, 30, 90, 60],
      ['SKU004', '6901234567893', '康师傅方便面', 4, '100g/袋', '袋', 2.8, 4.5, 50, 180, 90],
      ['SKU005', '6901234567894', '海飞丝洗发水', 6, '400ml/瓶', '瓶', 25.0, 45.0, 20, 365, 120],
      ['SKU006', '6901234567895', '蓝月亮洗衣液', 6, '2kg/瓶', '瓶', 18.0, 32.8, 15, 540, 120],
      ['SKU007', '6901234567896', '西红柿', 8, '500g', '斤', 3.5, 5.8, 20, 7, 7],
      ['SKU008', '6901234567897', '红富士苹果', 9, '500g', '斤', 4.0, 6.9, 30, 15, 10],
      ['SKU009', '6901234567898', '抽纸 3层100抽', 7, '3包/提', '提', 8.0, 12.9, 40, 730, 180],
      ['SKU010', '6901234567899', '一次性口罩', 7, '50只/盒', '盒', 12.0, 19.9, 50, 730, 180],
      ['SKU011', '6901234567900', '青岛啤酒 500ml', 5, '500ml/罐', '罐', 3.8, 6.0, 60, 180, 90],
      ['SKU012', '6901234567901', '蒙牛纯牛奶', 1, '250ml/盒', '盒', 2.5, 3.8, 80, 45, 45],
      ['SKU013', '6901234567902', '旺旺雪饼', 4, '52g/袋', '袋', 3.2, 5.5, 40, 180, 90],
      ['SKU014', '6901234567903', '黄瓜', 8, '500g', '斤', 2.8, 4.5, 25, 7, 7],
      ['SKU015', '6901234567904', '香蕉', 9, '500g', '斤', 3.0, 4.9, 40, 10, 10]
    ];
    
    products.forEach(p => insertProduct.run(...p));

    const insertInventory = db.prepare(`INSERT INTO inventory 
      (product_id, sku, quantity, available_qty, avg_cost_price, total_cost_amount, 
       last_in_date, last_sale_date, alert_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    for (let i = 1; i <= 15; i++) {
      const qty = Math.floor(Math.random() * 500) + 500;
      const cost = products[i-1][6];
      insertInventory.run(
        i, products[i-1][0], qty, qty, cost, qty * cost,
        '2026-06-01 10:00:00', '2026-06-10 14:30:00', 'normal'
      );
    }

    const insertStaff = db.prepare('INSERT INTO staff (staff_no, name, role, phone) VALUES (?, ?, ?, ?)');
    [
      ['S001', '张三', 'manager', '13800138001'],
      ['S002', '李四', 'cashier', '13800138002'],
      ['S003', '王五', 'cashier', '13800138003'],
      ['S004', '赵六', 'inventory', '13800138004']
    ].forEach(s => insertStaff.run(...s));

    const insertCustomer = db.prepare(`INSERT INTO customer 
      (member_no, name, phone, level, total_consumption, visit_count, last_visit_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`);
    [
      ['C001', '会员甲', '13900139001', 'gold', 5680.50, 28, '2026-06-10 14:30:00'],
      ['C002', '会员乙', '13900139002', 'silver', 2350.00, 15, '2026-06-09 16:20:00'],
      ['C003', '会员丙', '13900139003', 'normal', 890.50, 8, '2026-06-08 11:15:00'],
      ['C004', '会员丁', '13900139004', 'normal', 320.00, 3, '2026-06-05 09:40:00'],
      ['C005', '会员戊', '13900139005', 'normal', 150.00, 2, '2026-06-07 15:20:00'],
      ['C006', '会员己', '13900139006', 'normal', 68.00, 1, '2026-06-06 10:30:00'],
      ['C007', '会员庚', '13900139007', 'silver', 1280.00, 6, '2026-06-09 11:45:00'],
      ['C008', '会员辛', '13900139008', 'normal', 45.00, 1, '2026-06-04 16:00:00'],
      ['C009', '会员壬', '13900139009', 'gold', 3560.00, 18, '2026-06-10 09:15:00'],
      ['C010', '会员癸', '13900139010', 'normal', 89.00, 1, '2026-06-03 14:30:00']
    ].forEach(c => insertCustomer.run(...c));

    const insertSupplier = db.prepare('INSERT INTO supplier (supplier_no, name, contact, phone, address) VALUES (?, ?, ?, ?, ?)');
    [
      ['SU001', '食品供应商A', '王经理', '13700137001', '北京市朝阳区食品城A座'],
      ['SU002', '生鲜供应商B', '李经理', '13700137002', '北京市海淀区农产品批发市场'],
      ['SU003', '日用百货商C', '张经理', '13700137003', '北京市丰台区工业园B区']
    ].forEach(s => insertSupplier.run(...s));

    const insertUser = db.prepare('INSERT INTO sys_user (username, password, name, role) VALUES (?, ?, ?, ?)');
    [
      ['admin', 'admin123', '系统管理员', 'admin'],
      ['manager', 'manager123', '门店经理', 'manager'],
      ['cashier', 'cashier123', '收银员', 'cashier'],
      ['inventory', 'inventory123', '库存管理员', 'inventory']
    ].forEach(u => insertUser.run(...u));
  }
}

function generateSalesHistory() {
  const count = db.prepare('SELECT COUNT(*) as count FROM sales_order').get();
  if (count.count > 0) return;

  const insertOrder = db.prepare(`INSERT INTO sales_order 
    (order_no, customer_id, staff_id, total_amount, discount_amount, actual_amount, 
     total_cost, profit, profit_rate, item_count, pay_type, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const insertItem = db.prepare(`INSERT INTO sales_order_item 
    (order_id, order_no, product_id, sku, product_name, quantity, unit_price, 
     cost_price, subtotal, profit) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const updateInventoryFlow = db.prepare(`INSERT INTO inventory_flow 
    (flow_no, flow_type, reference_no, product_id, sku, quantity, before_qty, 
     after_qty, cost_price, operator_id, operator_name, remark) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const updateInventory = db.prepare(`UPDATE inventory SET 
    quantity = quantity - ?, 
    available_qty = available_qty - ?, 
    last_out_date = ?, 
    last_sale_date = ?, 
    total_cost_amount = avg_cost_price * (quantity - ?),
    updated_at = ? 
    WHERE product_id = ?`);

  const getInventory = db.prepare('SELECT * FROM inventory WHERE product_id = ?');

  const payTypes = ['cash', 'wechat', 'alipay', 'card'];
  const staffIds = [2, 3];
  let flowCounter = 0;
  let orderCounter = 0;
  
  const customerOrderCounts = {};
  const maxOrdersPerCustomer = {};
  for (let cid = 1; cid <= 10; cid++) {
    if (cid <= 3) {
      maxOrdersPerCustomer[cid] = 15 + Math.floor(Math.random() * 10);
    } else if (cid <= 5) {
      maxOrdersPerCustomer[cid] = 3 + Math.floor(Math.random() * 5);
    } else {
      maxOrdersPerCustomer[cid] = Math.random() > 0.5 ? 1 : 2;
    }
    customerOrderCounts[cid] = 0;
  }
  
  for (let day = 0; day < 30; day++) {
    const date = new Date(2026, 5, 11 - day);
    const orderCount = Math.floor(Math.random() * 30) + 10;
    
    for (let o = 0; o < orderCount; o++) {
      orderCounter++;
      const orderNo = `SO${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}${String(orderCounter).padStart(6,'0')}`;
      const hour = Math.floor(Math.random() * 12) + 9;
      const minute = Math.floor(Math.random() * 60);
      const createdAt = new Date(date);
      createdAt.setHours(hour, minute, 0, 0);
      
      const itemCount = Math.floor(Math.random() * 5) + 1;
      
      let customerId = null;
      if (Math.random() > 0.5) {
        const availableCustomers = [];
        for (let cid = 1; cid <= 10; cid++) {
          if (customerOrderCounts[cid] < maxOrdersPerCustomer[cid]) {
            availableCustomers.push(cid);
          }
        }
        if (availableCustomers.length > 0) {
          customerId = availableCustomers[Math.floor(Math.random() * availableCustomers.length)];
          customerOrderCounts[customerId]++;
        }
      }
      
      const staffId = staffIds[Math.floor(Math.random() * staffIds.length)];
      
      let totalAmount = 0;
      let totalCost = 0;
      const items = [];
      
      for (let i = 0; i < itemCount; i++) {
        const productId = Math.floor(Math.random() * 15) + 1;
        const product = db.prepare('SELECT * FROM product WHERE id = ?').get(productId);
        const inv = getInventory.get(productId);
        
        if (!inv || inv.quantity <= 0) continue;
        
        const maxQty = Math.min(Math.floor(Math.random() * 3) + 1, inv.quantity);
        const qty = Math.max(1, Math.floor(Math.random() * maxQty) + 1);
        
        const subtotal = qty * product.sale_price;
        const cost = qty * product.cost_price;
        const profit = subtotal - cost;
        
        items.push({
          productId,
          sku: product.sku,
          name: product.name,
          qty,
          price: product.sale_price,
          cost: product.cost_price,
          subtotal,
          profit
        });
        
        totalAmount += subtotal;
        totalCost += cost;
      }
      
      if (items.length === 0) {
        orderCounter--;
        if (customerId) customerOrderCounts[customerId]--;
        continue;
      }
      
      const discount = Math.random() > 0.7 ? parseFloat((totalAmount * Math.random() * 0.1).toFixed(2)) : 0;
      const actualAmount = totalAmount - discount;
      const profit = actualAmount - totalCost;
      const profitRate = actualAmount > 0 ? parseFloat(((profit / actualAmount) * 100).toFixed(2)) : 0;
      
      const orderId = insertOrder.run(
        orderNo, customerId, staffId, totalAmount, discount, actualAmount,
        totalCost, profit, profitRate, items.length, 
        payTypes[Math.floor(Math.random() * payTypes.length)],
        createdAt.toISOString().slice(0, 19).replace('T', ' ')
      ).lastInsertRowid;
      
      items.forEach(item => {
        const inv = getInventory.get(item.productId);
        if (!inv || inv.quantity < item.qty) return;
        
        insertItem.run(
          orderId, orderNo, item.productId, item.sku, item.name,
          item.qty, item.price, item.cost, item.subtotal, item.profit
        );
        
        flowCounter++;
        const flowNo = `IF${Date.now().toString().slice(-8)}${String(flowCounter).padStart(8, '0')}`;
        updateInventoryFlow.run(
          flowNo, 'sales_out', orderNo, item.productId, item.sku, item.qty,
          inv.quantity, inv.quantity - item.qty, item.cost,
          staffId, '收银员', '销售出库'
        );
        updateInventory.run(
          item.qty, item.qty, 
          createdAt.toISOString().slice(0, 19).replace('T', ' '),
          createdAt.toISOString().slice(0, 19).replace('T', ' '),
          item.qty,
          new Date().toISOString().slice(0, 19).replace('T', ' '),
          item.productId
        );
      });
    }
  }
}

function init() {
  createTables();
  initData();
  generateSalesHistory();
  console.log('Database initialized successfully');
}

module.exports = {
  db,
  init,
  createTables
};
