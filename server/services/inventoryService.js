const { db } = require('../models/db');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');

function calculateAvgCost(oldTotalCost, oldQty, newCost, newQty) {
  const newTotalCost = oldTotalCost + (newCost * newQty);
  const newTotalQty = oldQty + newQty;
  return newTotalQty > 0 ? Number((newTotalCost / newTotalQty).toFixed(2)) : 0;
}

function getAlertStatus(inventory, product) {
  const today = new Date();
  const expireDate = inventory.expire_date ? new Date(inventory.expire_date) : null;
  const daysToExpire = expireDate ? Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24)) : null;
  const daysNoSale = inventory.last_sale_date 
    ? Math.ceil((today - new Date(inventory.last_sale_date)) / (1000 * 60 * 60 * 24)) 
    : 999;
  
  if (inventory.quantity <= product.warning_threshold) return 'low_stock';
  if (daysToExpire !== null && daysToExpire <= product.expire_days_warning) return 'expiring';
  if (daysNoSale >= product.slow_moving_days && inventory.quantity > 0) return 'slow_moving';
  if (inventory.quantity > product.warning_threshold * 5) return 'overstock';
  return 'normal';
}

function generateFlowNo() {
  return `IF${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function createInventoryFlow(flowType, referenceNo, productId, sku, quantity, beforeQty, afterQty, costPrice, operatorId, operatorName, remark, transaction) {
  const flowNo = generateFlowNo();
  const sql = `INSERT INTO inventory_flow 
    (flow_no, flow_type, reference_no, product_id, sku, quantity, before_qty, 
     after_qty, cost_price, operator_id, operator_name, remark) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  if (transaction) {
    transaction.prepare(sql).run(
      flowNo, flowType, referenceNo, productId, sku, quantity,
      beforeQty, afterQty, costPrice, operatorId, operatorName, remark
    );
  } else {
    db.prepare(sql).run(
      flowNo, flowType, referenceNo, productId, sku, quantity,
      beforeQty, afterQty, costPrice, operatorId, operatorName, remark
    );
  }
  
  return flowNo;
}

function updateInventory(productId, quantityChange, costPrice, flowType, operatorId, operatorName, referenceNo, remark, expireDate) {
  const getInv = db.prepare('SELECT * FROM inventory WHERE product_id = ?');
  const getProduct = db.prepare('SELECT * FROM product WHERE id = ?');
  
  const inventory = getInv.get(productId);
  const product = getProduct.get(productId);
  
  if (!inventory) {
    throw new Error('Inventory record not found');
  }
  
  const beforeQty = inventory.quantity;
  const afterQty = beforeQty + quantityChange;
  
  if (afterQty < 0) {
    throw new Error('Insufficient inventory');
  }
  
  const updateInv = db.prepare(`UPDATE inventory SET 
    quantity = ?, 
    available_qty = ?, 
    avg_cost_price = ?, 
    total_cost_amount = ?, 
    ${expireDate ? 'expire_date = ?,' : ''}
    ${quantityChange > 0 ? 'last_in_date = ?,' : 'last_out_date = ?,'}
    alert_status = ?,
    updated_at = ? 
    WHERE product_id = ?`);
  
  let newAvgCost = inventory.avg_cost_price;
  let newTotalCost = inventory.total_cost_amount;
  
  if (quantityChange > 0) {
    newAvgCost = calculateAvgCost(inventory.total_cost_amount, inventory.quantity, costPrice, quantityChange);
    newTotalCost = Number((newAvgCost * afterQty).toFixed(2));
  } else {
    newTotalCost = Number((newAvgCost * afterQty).toFixed(2));
  }
  
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const alertStatus = getAlertStatus({ ...inventory, quantity: afterQty, expire_date: expireDate || inventory.expire_date }, product);
  
  const params = [afterQty, afterQty, newAvgCost, newTotalCost];
  if (expireDate) params.push(expireDate);
  params.push(now);
  params.push(alertStatus, now, productId);
  
  updateInv.run(...params);
  
  const typeMap = {
    'purchase_in': 'purchase_in',
    'sales_out': 'sales_out',
    'return_in': 'return_in',
    'purchase_return': 'adjust_out',
    'adjust_in': 'adjust_in',
    'adjust_out': 'adjust_out',
    'stocktake': 'stocktake'
  };
  
  createInventoryFlow(
    typeMap[flowType] || flowType,
    referenceNo,
    productId,
    product.sku,
    quantityChange,
    beforeQty,
    afterQty,
    costPrice || inventory.avg_cost_price,
    operatorId,
    operatorName,
    remark
  );
  
  return { beforeQty, afterQty, avgCostPrice: newAvgCost };
}

function getInventoryList(params = {}) {
  const { page = 1, pageSize = 20, keyword, categoryId, alertStatus, sortBy = 'id', sortOrder = 'DESC' } = params;
  const offset = (page - 1) * pageSize;
  
  let whereSql = 'WHERE 1=1';
  const countParams = [];
  const queryParams = [];
  
  if (keyword) {
    whereSql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
    const search = `%${keyword}%`;
    countParams.push(search, search, search);
    queryParams.push(search, search, search);
  }
  
  if (categoryId) {
    whereSql += ' AND p.category_id = ?';
    countParams.push(categoryId);
    queryParams.push(categoryId);
  }
  
  if (alertStatus) {
    whereSql += ' AND i.alert_status = ?';
    countParams.push(alertStatus);
    queryParams.push(alertStatus);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM inventory i 
    LEFT JOIN product p ON i.product_id = p.id 
    ${whereSql}`;
  
  const querySql = `SELECT i.*, p.name as product_name, p.category_id, p.spec, p.unit, 
    p.sale_price, p.warning_threshold, p.expire_days_warning, p.slow_moving_days,
    c.name as category_name
    FROM inventory i 
    LEFT JOIN product p ON i.product_id = p.id 
    LEFT JOIN category c ON p.category_id = c.id 
    ${whereSql} 
    ORDER BY i.${sortBy} ${sortOrder} 
    LIMIT ? OFFSET ?`;
  
  queryParams.push(pageSize, offset);
  
  const total = db.prepare(countSql).get(...countParams).total;
  const list = db.prepare(querySql).all(...queryParams);
  
  const today = new Date();
  const result = list.map(item => {
    const daysToExpire = item.expire_date 
      ? Math.ceil((new Date(item.expire_date) - today) / (1000 * 60 * 60 * 24)) 
      : null;
    const daysNoSale = item.last_sale_date 
      ? Math.ceil((today - new Date(item.last_sale_date)) / (1000 * 60 * 60 * 24)) 
      : 999;
    
    return {
      ...item,
      days_to_expire: daysToExpire,
      days_no_sale: daysNoSale
    };
  });
  
  return { list: result, total, page, pageSize };
}

function getInventoryFlow(params = {}) {
  const { page = 1, pageSize = 20, productId, flowType, startDate, endDate, referenceNo } = params;
  const offset = (page - 1) * pageSize;
  
  let whereSql = 'WHERE 1=1';
  const countParams = [];
  const queryParams = [];
  
  if (productId) {
    whereSql += ' AND product_id = ?';
    countParams.push(productId);
    queryParams.push(productId);
  }
  
  if (flowType) {
    whereSql += ' AND flow_type = ?';
    countParams.push(flowType);
    queryParams.push(flowType);
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
  
  if (referenceNo) {
    whereSql += ' AND reference_no LIKE ?';
    const search = `%${referenceNo}%`;
    countParams.push(search);
    queryParams.push(search);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM inventory_flow ${whereSql}`;
  const querySql = `SELECT * FROM inventory_flow ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`;
  
  queryParams.push(pageSize, offset);
  
  const total = db.prepare(countSql).get(...countParams).total;
  const list = db.prepare(querySql).all(...queryParams);
  
  return { list, total, page, pageSize };
}

function recalculateInventoryCost(productId) {
  const flows = db.prepare(`
    SELECT * FROM inventory_flow 
    WHERE product_id = ? AND is_red_offset = 0 
    ORDER BY created_at ASC
  `).all(productId);
  
  let totalQty = 0;
  let totalCost = 0;
  
  flows.forEach(flow => {
    if (flow.quantity > 0) {
      totalCost += flow.quantity * flow.cost_price;
      totalQty += flow.quantity;
    } else {
      const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
      totalQty += flow.quantity;
      totalCost = avgCost * totalQty;
    }
  });
  
  const avgCost = totalQty > 0 ? Number((totalCost / totalQty).toFixed(2)) : 0;
  
  db.prepare(`UPDATE inventory SET 
    avg_cost_price = ?, 
    total_cost_amount = ?, 
    quantity = ?,
    available_qty = ?,
    updated_at = ? 
    WHERE product_id = ?`).run(
    avgCost, 
    Number((avgCost * totalQty).toFixed(2)), 
    totalQty, 
    totalQty,
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
    productId
  );
  
  return { avgCost, totalQty, totalCost };
}

function checkAllInventoryAlerts() {
  const items = db.prepare(`
    SELECT i.*, p.warning_threshold, p.expire_days_warning, p.slow_moving_days 
    FROM inventory i 
    JOIN product p ON i.product_id = p.id
  `).all();
  
  const updateStmt = db.prepare('UPDATE inventory SET alert_status = ?, updated_at = ? WHERE id = ?');
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  const results = items.map(item => {
    const alertStatus = getAlertStatus(item, item);
    if (alertStatus !== item.alert_status) {
      updateStmt.run(alertStatus, now, item.id);
    }
    return { id: item.id, sku: item.sku, alertStatus };
  });
  
  return {
    updated: results.filter(r => r.alertStatus !== 'normal').length,
    alerts: results.filter(r => r.alertStatus !== 'normal')
  };
}

function redOffsetFlow(flowId, operatorId, operatorName) {
  const flow = db.prepare('SELECT * FROM inventory_flow WHERE id = ?').get(flowId);
  if (!flow) {
    throw new Error('Flow record not found');
  }
  
  if (flow.is_red_offset) {
    throw new Error('This flow has already been red offset');
  }
  
  const tx = db.transaction(() => {
    db.prepare('UPDATE inventory_flow SET is_red_offset = 1 WHERE id = ?').run(flowId);
    
    const reverseFlowNo = generateFlowNo();
    db.prepare(`INSERT INTO inventory_flow 
      (flow_no, flow_type, reference_no, product_id, sku, quantity, before_qty, 
       after_qty, cost_price, operator_id, operator_name, remark, is_red_offset, original_flow_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`).run(
      reverseFlowNo,
      flow.flow_type,
      flow.reference_no,
      flow.product_id,
      flow.sku,
      -flow.quantity,
      flow.after_qty,
      flow.before_qty,
      flow.cost_price,
      operatorId,
      operatorName,
      `红冲单据: ${flow.flow_no}`,
      flowId
    );
    
    recalculateInventoryCost(flow.product_id);
  });
  
  tx();
  
  return recalculateInventoryCost(flow.product_id);
}

module.exports = {
  calculateAvgCost,
  getAlertStatus,
  updateInventory,
  createInventoryFlow,
  getInventoryList,
  getInventoryFlow,
  recalculateInventoryCost,
  checkAllInventoryAlerts,
  redOffsetFlow,
  generateFlowNo
};
