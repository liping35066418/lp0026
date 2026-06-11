const { db } = require('../models/db');
const dayjs = require('dayjs');
const { updateInventory } = require('./inventoryService');
const { cursorPaginate } = require('../utils/pagination');

function generatePurchaseNo() {
  return `PO${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function createPurchaseOrder(params) {
  const { supplierId, items, operatorId, remark = '' } = params;
  
  const orderNo = generatePurchaseNo();
  
  const tx = db.transaction(() => {
    let totalAmount = 0;
    
    items.forEach(item => {
      totalAmount += item.quantity * item.cost_price;
    });
    
    const insertOrder = db.prepare(`INSERT INTO purchase_order 
      (order_no, supplier_id, total_amount, actual_amount, operator_id, remark) 
      VALUES (?, ?, ?, ?, ?, ?)`);
    
    const result = insertOrder.run(orderNo, supplierId || null, totalAmount, totalAmount, operatorId || 1, remark);
    const orderId = result.lastInsertRowid;
    
    const insertItem = db.prepare(`INSERT INTO purchase_order_item 
      (order_id, product_id, sku, product_name, quantity, cost_price, subtotal, expire_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    
    items.forEach(item => {
      const product = db.prepare('SELECT sku, name FROM product WHERE id = ?').get(item.product_id);
      if (!product) throw new Error(`Product not found: ${item.product_id}`);
      
      insertItem.run(
        orderId,
        item.product_id,
        product.sku,
        product.name,
        item.quantity,
        item.cost_price,
        item.quantity * item.cost_price,
        item.expire_date || null
      );
    });
    
    return { id: orderId, orderNo, totalAmount };
  });
  
  return tx();
}

function getPurchaseList(params = {}) {
  const { page = 1, pageSize = 20, status, supplierId, startDate, endDate, useCursor = false, lastId } = params;
  
  let whereSql = 'WHERE 1=1';
  const conditions = {};
  const countParams = [];
  const queryParams = [];
  
  if (status) {
    whereSql += ' AND status = ?';
    conditions.status = status;
    countParams.push(status);
    queryParams.push(status);
  }
  
  if (supplierId) {
    whereSql += ' AND supplier_id = ?';
    conditions.supplier_id = supplierId;
    countParams.push(supplierId);
    queryParams.push(supplierId);
  }
  
  if (startDate) {
    whereSql += ' AND created_at >= ?';
    countParams.push(startDate);
    queryParams.push(startDate);
  }
  
  if (endDate) {
    whereSql += ' AND created_at <= ?';
    countParams.push(endDate + ' 23:59:59');
    queryParams.push(endDate + ' 23:59:59');
  }
  
  if (useCursor) {
    return cursorPaginate(
      `(SELECT po.*, s.name as supplier_name FROM purchase_order po LEFT JOIN supplier s ON po.supplier_id = s.id ${whereSql})`,
      lastId,
      pageSize,
      conditions,
      { sortField: 'id', sortOrder: 'DESC' }
    );
  }
  
  const offset = (page - 1) * pageSize;
  
  const countSql = `SELECT COUNT(*) as total FROM purchase_order ${whereSql}`;
  const querySql = `SELECT po.*, s.name as supplier_name 
    FROM purchase_order po 
    LEFT JOIN supplier s ON po.supplier_id = s.id 
    ${whereSql} 
    ORDER BY po.id DESC 
    LIMIT ? OFFSET ?`;
  
  queryParams.push(pageSize, offset);
  
  const total = db.prepare(countSql).get(...countParams).total;
  const list = db.prepare(querySql).all(...queryParams);
  
  return { list, total, page, pageSize };
}

function getPurchaseDetail(orderId) {
  const order = db.prepare(`
    SELECT po.*, s.name as supplier_name, s.contact, s.phone 
    FROM purchase_order po 
    LEFT JOIN supplier s ON po.supplier_id = s.id 
    WHERE po.id = ?
  `).get(orderId);
  
  if (!order) throw new Error('Purchase order not found');
  
  const items = db.prepare(`
    SELECT poi.*, p.category_id, c.name as category_name, p.spec, p.unit, p.sale_price
    FROM purchase_order_item poi
    LEFT JOIN product p ON poi.product_id = p.id
    LEFT JOIN category c ON p.category_id = c.id
    WHERE poi.order_id = ?
    ORDER BY poi.id
  `).all(orderId);
  
  return { ...order, items };
}

function confirmWarehouse(orderId, operatorId, operatorName) {
  const tx = db.transaction(() => {
    const order = db.prepare('SELECT * FROM purchase_order WHERE id = ?').get(orderId);
    if (!order) throw new Error('Purchase order not found');
    if (order.status === 'completed') throw new Error('This order has already been warehoused');
    
    const items = db.prepare('SELECT * FROM purchase_order_item WHERE order_id = ?').all(orderId);
    
    items.forEach(item => {
      updateInventory(
        item.product_id,
        item.quantity,
        item.cost_price,
        'purchase_in',
        operatorId,
        operatorName,
        order.order_no,
        '采购入库',
        item.expire_date
      );
    });
    
    db.prepare(`UPDATE purchase_order SET 
      status = 'completed',
      in_warehouse_at = ? 
      WHERE id = ?`).run(dayjs().format('YYYY-MM-DD HH:mm:ss'), orderId);
    
    return { success: true, orderId };
  });
  
  return tx();
}

function purchaseReturn(orderId, items, operatorId, operatorName, reason = '') {
  const tx = db.transaction(() => {
    const order = db.prepare('SELECT * FROM purchase_order WHERE id = ?').get(orderId);
    if (!order) throw new Error('Purchase order not found');
    
    items.forEach(item => {
      const orderItem = db.prepare('SELECT * FROM purchase_order_item WHERE id = ? AND order_id = ?').get(item.item_id, orderId);
      if (!orderItem) throw new Error(`Purchase item not found: ${item.item_id}`);
      
      updateInventory(
        orderItem.product_id,
        -item.quantity,
        orderItem.cost_price,
        'purchase_return',
        operatorId,
        operatorName,
        order.order_no,
        `采购退货: ${reason}`
      );
    });
    
    return { success: true, orderId };
  });
  
  return tx();
}

function getSupplierList(params = {}) {
  const { page = 1, pageSize = 20, keyword, status } = params;
  const offset = (page - 1) * pageSize;
  
  let whereSql = 'WHERE 1=1';
  const countParams = [];
  const queryParams = [];
  
  if (keyword) {
    whereSql += ' AND (name LIKE ? OR contact LIKE ? OR phone LIKE ?)';
    const search = `%${keyword}%`;
    countParams.push(search, search, search);
    queryParams.push(search, search, search);
  }
  
  if (status !== undefined) {
    whereSql += ' AND status = ?';
    countParams.push(status);
    queryParams.push(status);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM supplier ${whereSql}`;
  const querySql = `SELECT * FROM supplier ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`;
  
  queryParams.push(pageSize, offset);
  
  const total = db.prepare(countSql).get(...countParams).total;
  const list = db.prepare(querySql).all(...queryParams);
  
  return { list, total, page, pageSize };
}

function saveSupplier(params) {
  const { id, supplierNo, name, contact, phone, address, status = 1 } = params;
  
  if (id) {
    db.prepare(`UPDATE supplier SET 
      supplier_no = ?, name = ?, contact = ?, phone = ?, address = ?, status = ? 
      WHERE id = ?`).run(supplierNo, name, contact, phone, address, status, id);
    return { id };
  } else {
    const result = db.prepare(`INSERT INTO supplier 
      (supplier_no, name, contact, phone, address, status) 
      VALUES (?, ?, ?, ?, ?, ?)`).run(supplierNo, name, contact, phone, address, status);
    return { id: result.lastInsertRowid };
  }
}

function deleteSupplier(id) {
  db.prepare('DELETE FROM supplier WHERE id = ?').run(id);
  return { success: true };
}

module.exports = {
  generatePurchaseNo,
  createPurchaseOrder,
  getPurchaseList,
  getPurchaseDetail,
  confirmWarehouse,
  purchaseReturn,
  getSupplierList,
  saveSupplier,
  deleteSupplier
};
