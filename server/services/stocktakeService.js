const { db } = require('../models/db');
const dayjs = require('dayjs');
const { updateInventory, recalculateInventoryCost, generateFlowNo, getAlertStatus } = require('./inventoryService');

function generateStocktakeNo() {
  return `ST${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function createStocktakeOrder(params) {
  const { stocktakeDate, categoryId, operatorId, remark = '' } = params;
  
  const orderNo = generateStocktakeNo();
  const date = stocktakeDate || dayjs().format('YYYY-MM-DD');
  
  const tx = db.transaction(() => {
    const insertOrder = db.prepare(`INSERT INTO stocktake_order 
      (order_no, stocktake_date, category_id, operator_id, remark) 
      VALUES (?, ?, ?, ?, ?)`);
    
    const result = insertOrder.run(orderNo, date, categoryId || null, operatorId || 1, remark);
    const stocktakeId = result.lastInsertRowid;
    
    let whereSql = 'WHERE 1=1';
    const paramsArr = [];
    if (categoryId) {
      whereSql += ' AND p.category_id = ?';
      paramsArr.push(categoryId);
    }
    
    const inventoryItems = db.prepare(`
      SELECT i.product_id, i.sku, p.name as product_name, i.quantity as book_qty, i.avg_cost_price as cost_price
      FROM inventory i
      JOIN product p ON i.product_id = p.id
      ${whereSql}
    `).all(...paramsArr);
    
    const insertItem = db.prepare(`INSERT INTO stocktake_item 
      (stocktake_id, product_id, sku, product_name, book_qty, cost_price, diff_qty, diff_amount) 
      VALUES (?, ?, ?, ?, ?, ?, 0, 0)`);
    
    let totalBookQty = 0;
    inventoryItems.forEach(item => {
      insertItem.run(stocktakeId, item.product_id, item.sku, item.product_name, item.book_qty, item.cost_price);
      totalBookQty += item.book_qty;
    });
    
    db.prepare(`UPDATE stocktake_order SET total_book_qty = ? WHERE id = ?`).run(totalBookQty, stocktakeId);
    
    return { id: stocktakeId, orderNo, itemCount: inventoryItems.length };
  });
  
  return tx();
}

function getStocktakeList(params = {}) {
  const { page = 1, pageSize = 20, status, startDate, endDate } = params;
  const offset = (page - 1) * pageSize;
  
  let whereSql = 'WHERE 1=1';
  const countParams = [];
  const queryParams = [];
  
  if (status) {
    whereSql += ' AND status = ?';
    countParams.push(status);
    queryParams.push(status);
  }
  
  if (startDate) {
    whereSql += ' AND stocktake_date >= ?';
    countParams.push(startDate);
    queryParams.push(startDate);
  }
  
  if (endDate) {
    whereSql += ' AND stocktake_date <= ?';
    countParams.push(endDate);
    queryParams.push(endDate);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM stocktake_order ${whereSql}`;
  const querySql = `SELECT so.*, s.name as operator_name 
    FROM stocktake_order so 
    LEFT JOIN staff s ON so.operator_id = s.id 
    ${whereSql} 
    ORDER BY so.id DESC 
    LIMIT ? OFFSET ?`;
  
  queryParams.push(pageSize, offset);
  
  const total = db.prepare(countSql).get(...countParams).total;
  const list = db.prepare(querySql).all(...queryParams);
  
  return { list, total, page, pageSize };
}

function getStocktakeDetail(stocktakeId) {
  const order = db.prepare(`
    SELECT so.*, s.name as operator_name 
    FROM stocktake_order so 
    LEFT JOIN staff s ON so.operator_id = s.id 
    WHERE so.id = ?
  `).get(stocktakeId);
  
  if (!order) throw new Error('Stocktake order not found');
  
  const items = db.prepare(`
    SELECT si.*, p.category_id, c.name as category_name
    FROM stocktake_item si
    LEFT JOIN product p ON si.product_id = p.id
    LEFT JOIN category c ON p.category_id = c.id
    WHERE si.stocktake_id = ?
    ORDER BY si.id
  `).all(stocktakeId);
  
  return { ...order, items };
}

function inputActualQty(stocktakeId, items) {
  const tx = db.transaction(() => {
    let totalActualQty = 0;
    let totalDiffQty = 0;
    let totalDiffAmount = 0;
    
    const updateItem = db.prepare(`UPDATE stocktake_item SET 
      actual_qty = ?, 
      diff_qty = ?, 
      diff_amount = ?, 
      diff_reason = ? 
      WHERE id = ?`);
    
    items.forEach(item => {
      const diffQty = item.actual_qty - item.book_qty;
      const diffAmount = diffQty * item.cost_price;
      
      updateItem.run(item.actual_qty, diffQty, diffAmount, item.diff_reason || '', item.id);
      
      totalActualQty += item.actual_qty;
      totalDiffQty += diffQty;
      totalDiffAmount += diffAmount;
    });
    
    db.prepare(`UPDATE stocktake_order SET 
      status = 'counted',
      total_actual_qty = ?, 
      total_diff_qty = ?, 
      total_diff_amount = ? 
      WHERE id = ?`).run(totalActualQty, totalDiffQty, totalDiffAmount, stocktakeId);
    
    return { 
      stocktakeId, 
      totalActualQty, 
      totalDiffQty, 
      totalDiffAmount 
    };
  });
  
  return tx();
}

function redoStocktake(stocktakeId, operatorId, operatorName) {
  const tx = db.transaction(() => {
    const order = db.prepare('SELECT * FROM stocktake_order WHERE id = ?').get(stocktakeId);
    if (!order) throw new Error('Stocktake order not found');
    
    const items = db.prepare('SELECT * FROM stocktake_item WHERE stocktake_id = ?').all(stocktakeId);
    
    items.forEach(item => {
      if (item.diff_qty !== 0) {
        const reverseQty = -item.diff_qty;
        updateInventory(
          item.product_id,
          reverseQty,
          item.cost_price,
          'stocktake',
          operatorId,
          operatorName,
          order.order_no,
          `红冲盘点调整: ${item.diff_qty > 0 ? '+' : ''}${item.diff_qty}`
        );
      }
    });
    
    db.prepare(`UPDATE stocktake_order SET 
      status = 'counted',
      is_adjusted = 0,
      adjust_at = NULL 
      WHERE id = ?`).run(stocktakeId);
    
    return { success: true, stocktakeId };
  });
  
  return tx();
}

function confirmAdjust(stocktakeId, operatorId, operatorName) {
  const tx = db.transaction(() => {
    const order = db.prepare('SELECT * FROM stocktake_order WHERE id = ?').get(stocktakeId);
    if (!order) throw new Error('Stocktake order not found');
    if (order.is_adjusted) throw new Error('This stocktake has already been adjusted');
    
    const items = db.prepare('SELECT * FROM stocktake_item WHERE stocktake_id = ?').all(stocktakeId);
    
    items.forEach(item => {
      if (item.diff_qty !== 0) {
        updateInventory(
          item.product_id,
          item.diff_qty,
          item.cost_price,
          'stocktake',
          operatorId,
          operatorName,
          order.order_no,
          `盘点调整: ${item.diff_qty > 0 ? '+' : ''}${item.diff_qty}`
        );
      }
    });
    
    db.prepare(`UPDATE stocktake_order SET 
      status = 'completed',
      is_adjusted = 1,
      adjust_at = ? 
      WHERE id = ?`).run(dayjs().format('YYYY-MM-DD HH:mm:ss'), stocktakeId);
    
    return { success: true, stocktakeId };
  });
  
  return tx();
}

function voidSalesOrder(orderId, operatorId, operatorName, reason) {
  const tx = db.transaction(() => {
    const order = db.prepare('SELECT * FROM sales_order WHERE id = ?').get(orderId);
    if (!order) throw new Error('Sales order not found');
    if (order.is_void) throw new Error('This order has already been void');
    
    const items = db.prepare('SELECT * FROM sales_order_item WHERE order_id = ?').all(orderId);
    
    items.forEach(item => {
      updateInventory(
        item.product_id,
        item.quantity,
        item.cost_price,
        'return_in',
        operatorId,
        operatorName,
        order.order_no,
        `红冲订单: ${reason || '单据红冲'}`
      );
    });
    
    db.prepare(`UPDATE sales_order SET 
      is_void = 1,
      void_reason = ?,
      void_at = ? 
      WHERE id = ?`).run(reason || '', dayjs().format('YYYY-MM-DD HH:mm:ss'), orderId);
    
    items.forEach(item => {
      const flows = db.prepare(`
        SELECT * FROM inventory_flow 
        WHERE reference_no = ? AND product_id = ? AND flow_type = 'sales_out'
        ORDER BY id DESC
      `).all(order.order_no, item.product_id);
      
      if (flows.length > 0) {
        const flow = flows[0];
        const reverseFlowNo = generateFlowNo();
        db.prepare(`INSERT INTO inventory_flow 
          (flow_no, flow_type, reference_no, product_id, sku, quantity, before_qty, 
           after_qty, cost_price, operator_id, operator_name, remark, is_red_offset, original_flow_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`).run(
          reverseFlowNo,
          'sales_out',
          order.order_no,
          item.product_id,
          item.sku,
          -item.quantity,
          flow.after_qty,
          flow.before_qty,
          item.cost_price,
          operatorId,
          operatorName,
          `红冲单据: ${order.order_no}`,
          flow.id
        );
      }
    });
    
    return { success: true, orderId };
  });
  
  return tx();
}

function recalculateInventoryByDate(startDate, endDate) {
  const affectedProducts = db.prepare(`
    SELECT DISTINCT product_id FROM inventory_flow 
    WHERE created_at BETWEEN ? AND ? AND is_red_offset = 0
  `).all(startDate + ' 00:00:00', endDate + ' 23:59:59');
  
  const results = affectedProducts.map(p => {
    return recalculateInventoryCost(p.product_id);
  });
  
  return { 
    recalculated: results.length, 
    results 
  };
}

module.exports = {
  generateStocktakeNo,
  createStocktakeOrder,
  getStocktakeList,
  getStocktakeDetail,
  inputActualQty,
  redoStocktake,
  confirmAdjust,
  voidSalesOrder,
  recalculateInventoryByDate
};