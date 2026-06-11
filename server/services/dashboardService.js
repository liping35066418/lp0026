const { db } = require('../models/db');
const dayjs = require('dayjs');
const { getAlertStatus } = require('./inventoryService');

function getOverview(params = {}) {
  const { startDate, endDate } = params;
  const today = dayjs().format('YYYY-MM-DD');
  const defaultStart = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  
  const start = startDate || defaultStart;
  const end = endDate || today;
  const startDateTime = start + ' 00:00:00';
  const endDateTime = end + ' 23:59:59';
  
  const salesSql = `SELECT 
    COALESCE(SUM(actual_amount), 0) as total_sales,
    COALESCE(SUM(profit), 0) as total_profit,
    COALESCE(AVG(profit_rate), 0) as avg_profit_rate,
    COUNT(*) as order_count,
    COALESCE(SUM(item_count), 0) as item_count,
    COUNT(DISTINCT customer_id) as customer_count
    FROM sales_order 
    WHERE is_void = 0 AND created_at BETWEEN ? AND ?`;
  
  const salesData = db.prepare(salesSql).get(startDateTime, endDateTime);
  
  const yesterdayStart = dayjs().subtract(1, 'day').format('YYYY-MM-DD') + ' 00:00:00';
  const yesterdayEnd = dayjs().subtract(1, 'day').format('YYYY-MM-DD') + ' 23:59:59';
  const yesterdayData = db.prepare(salesSql).get(yesterdayStart, yesterdayEnd);
  
  const todayStart = today + ' 00:00:00';
  const todayEnd = today + ' 23:59:59';
  const todayData = db.prepare(salesSql).get(todayStart, todayEnd);
  
  const inventorySql = `SELECT 
    COUNT(*) as total_products,
    COALESCE(SUM(quantity), 0) as total_quantity,
    COALESCE(SUM(total_cost_amount), 0) as total_inventory_value,
    COUNT(CASE WHEN alert_status != 'normal' THEN 1 END) as alert_count
    FROM inventory`;
  
  const inventoryData = db.prepare(inventorySql).get();
  
  const customerPrice = salesData.order_count > 0 
    ? Number((salesData.total_sales / salesData.order_count).toFixed(2)) 
    : 0;
  
  const customerCounts = db.prepare(`
    SELECT customer_id, COUNT(*) as count 
    FROM sales_order 
    WHERE is_void = 0 AND customer_id IS NOT NULL 
    AND created_at BETWEEN ? AND ?
    GROUP BY customer_id
  `).all(startDateTime, endDateTime);
  
  const totalCustomers = customerCounts.length;
  const repeatCustomers = customerCounts.filter(c => c.count >= 2).length;
  const repurchaseRate = totalCustomers > 0 
    ? Number(((repeatCustomers / totalCustomers) * 100).toFixed(2)) 
    : 0;
  
  return {
    sales: {
      totalSales: salesData.total_sales,
      totalProfit: salesData.total_profit,
      avgProfitRate: salesData.avg_profit_rate,
      orderCount: salesData.order_count,
      itemCount: salesData.item_count,
      customerCount: salesData.customer_count,
      customerPrice,
      repurchaseRate
    },
    inventory: {
      totalProducts: inventoryData.total_products,
      totalQuantity: inventoryData.total_quantity,
      totalInventoryValue: inventoryData.total_inventory_value,
      alertCount: inventoryData.alert_count
    },
    today: {
      totalSales: todayData.total_sales,
      orderCount: todayData.order_count,
      totalProfit: todayData.total_profit
    },
    yesterday: {
      totalSales: yesterdayData.total_sales,
      orderCount: yesterdayData.order_count,
      totalProfit: yesterdayData.total_profit
    },
    period: { startDate: start, endDate: end }
  };
}

function getTrends(params = {}) {
  const { startDate, endDate, interval = 'day' } = params;
  const today = dayjs().format('YYYY-MM-DD');
  const defaultStart = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  
  const start = startDate || defaultStart;
  const end = endDate || today;
  
  let dateFormat;
  switch (interval) {
    case 'hour': dateFormat = "%Y-%m-%d %H:00:00"; break;
    case 'week': dateFormat = "%Y-%W"; break;
    case 'month': dateFormat = "%Y-%m"; break;
    default: dateFormat = "%Y-%m-%d";
  }
  
  const salesSql = `SELECT 
    strftime(?, created_at) as period,
    COALESCE(SUM(actual_amount), 0) as sales_amount,
    COALESCE(SUM(profit), 0) as profit,
    COUNT(*) as order_count
    FROM sales_order 
    WHERE is_void = 0 AND created_at BETWEEN ? AND ?
    GROUP BY strftime(?, created_at)
    ORDER BY period ASC`;
  
  const salesTrend = db.prepare(salesSql).all(
    dateFormat, start + ' 00:00:00', end + ' 23:59:59', dateFormat
  );
  
  const inventorySql = `SELECT 
    DATE(created_at) as period,
    COALESCE(SUM(CASE WHEN flow_type IN ('purchase_in', 'return_in', 'adjust_in') THEN quantity END), 0) as in_qty,
    COALESCE(SUM(CASE WHEN flow_type IN ('sales_out', 'adjust_out', 'purchase_return') THEN ABS(quantity) END), 0) as out_qty
    FROM inventory_flow 
    WHERE created_at BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY period ASC`;
  
  const inventoryTrend = db.prepare(inventorySql).all(
    start + ' 00:00:00', end + ' 23:59:59'
  );
  
  return {
    sales: salesTrend,
    inventory: inventoryTrend,
    period: { startDate: start, endDate: end, interval }
  };
}

function getAlerts(params = {}) {
  const { page = 1, pageSize = 20, alertType } = params;
  const offset = (page - 1) * pageSize;
  
  let whereSql = "WHERE i.alert_status != 'normal'";
  const countParams = [];
  const queryParams = [];
  
  if (alertType) {
    whereSql += ' AND i.alert_status = ?';
    countParams.push(alertType);
    queryParams.push(alertType);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM inventory i 
    LEFT JOIN product p ON i.product_id = p.id 
    ${whereSql}`;
  
  const querySql = `SELECT i.*, p.name as product_name, p.category_id, 
    p.warning_threshold, p.expire_days_warning, p.slow_moving_days,
    c.name as category_name
    FROM inventory i 
    LEFT JOIN product p ON i.product_id = p.id 
    LEFT JOIN category c ON p.category_id = c.id 
    ${whereSql} 
    ORDER BY 
      CASE i.alert_status 
        WHEN 'low_stock' THEN 1 
        WHEN 'expiring' THEN 2 
        WHEN 'slow_moving' THEN 3 
        WHEN 'overstock' THEN 4 
        ELSE 5 
      END,
      i.id DESC
    LIMIT ? OFFSET ?`;
  
  queryParams.push(pageSize, offset);
  
  const total = db.prepare(countSql).get(...countParams).total;
  const rawList = db.prepare(querySql).all(...queryParams);
  
  const today = new Date();
  const list = rawList.map(item => {
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
  
  const stats = db.prepare(`
    SELECT alert_status, COUNT(*) as count 
    FROM inventory 
    WHERE alert_status != 'normal'
    GROUP BY alert_status
  `).all();
  
  const alertStats = {
    low_stock: 0,
    expiring: 0,
    slow_moving: 0,
    overstock: 0
  };
  
  stats.forEach(s => {
    alertStats[s.alert_status] = s.count;
  });
  
  return { list, total, page, pageSize, stats: alertStats };
}

function getTopProducts(params = {}) {
  const { startDate, endDate, limit = 10, sortBy = 'sales_amount' } = params;
  const today = dayjs().format('YYYY-MM-DD');
  const defaultStart = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  
  const start = startDate || defaultStart;
  const end = endDate || today;
  
  const orderBy = sortBy === 'profit' ? 'total_profit' : 'total_sales';
  
  const sql = `SELECT 
    oi.product_id, oi.sku, oi.product_name, p.category_id, c.name as category_name,
    COALESCE(SUM(oi.subtotal), 0) as total_sales,
    COALESCE(SUM(oi.profit), 0) as total_profit,
    COALESCE(SUM(oi.quantity), 0) as total_quantity,
    COUNT(DISTINCT o.id) as order_count
    FROM sales_order_item oi
    JOIN sales_order o ON oi.order_id = o.id
    JOIN product p ON oi.product_id = p.id
    LEFT JOIN category c ON p.category_id = c.id
    WHERE o.is_void = 0 AND o.created_at BETWEEN ? AND ?
    GROUP BY oi.product_id
    ORDER BY ${orderBy} DESC
    LIMIT ?`;
  
  const list = db.prepare(sql).all(start + ' 00:00:00', end + ' 23:59:59', limit);
  
  return { list, period: { startDate: start, endDate: end } };
}

function getCategorySales(params = {}) {
  const { startDate, endDate } = params;
  const today = dayjs().format('YYYY-MM-DD');
  const defaultStart = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  
  const start = startDate || defaultStart;
  const end = endDate || today;
  
  const sql = `SELECT 
    c.id as category_id,
    c.name as category_name,
    COALESCE(SUM(oi.subtotal), 0) as sales_amount,
    COALESCE(SUM(oi.profit), 0) as profit,
    SUM(oi.quantity) as quantity,
    COUNT(DISTINCT o.id) as order_count
    FROM sales_order_item oi
    JOIN sales_order o ON oi.order_id = o.id
    JOIN product p ON oi.product_id = p.id
    LEFT JOIN category c ON p.category_id = c.id
    WHERE o.is_void = 0 AND o.created_at BETWEEN ? AND ?
    GROUP BY c.id
    ORDER BY sales_amount DESC`;
  
  const list = db.prepare(sql).all(start + ' 00:00:00', end + ' 23:59:59');
  
  const totalSales = list.reduce((sum, item) => sum + item.sales_amount, 0);
  const listWithPercentage = list.map(item => ({
    ...item,
    percentage: totalSales > 0 ? Number(((item.sales_amount / totalSales) * 100).toFixed(2)) : 0
  }));
  
  return { list: listWithPercentage, totalSales, period: { startDate: start, endDate: end } };
}

function refreshAllAlerts() {
  const items = db.prepare(`
    SELECT i.*, p.warning_threshold, p.expire_days_warning, p.slow_moving_days 
    FROM inventory i 
    JOIN product p ON i.product_id = p.id
  `).all();
  
  const updateStmt = db.prepare('UPDATE inventory SET alert_status = ?, updated_at = ? WHERE id = ?');
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  let updatedCount = 0;
  const alerts = [];
  
  items.forEach(item => {
    const alertStatus = getAlertStatus(item, item);
    if (alertStatus !== item.alert_status) {
      updateStmt.run(alertStatus, now, item.id);
      updatedCount++;
    }
    if (alertStatus !== 'normal') {
      alerts.push({ id: item.id, sku: item.sku, alertStatus });
    }
  });
  
  return {
    updated: updatedCount,
    totalAlerts: alerts.length,
    alerts
  };
}

module.exports = {
  getOverview,
  getTrends,
  getAlerts,
  getTopProducts,
  getCategorySales,
  refreshAllAlerts
};
