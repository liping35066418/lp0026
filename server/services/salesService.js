const { db } = require('../models/db');
const dayjs = require('dayjs');

function calculateCustomerPrice(totalSales, orderCount) {
  return orderCount > 0 ? Number((totalSales / orderCount).toFixed(2)) : 0;
}

function calculateProfitRate(salesAmount, costAmount) {
  return salesAmount > 0 ? Number((((salesAmount - costAmount) / salesAmount) * 100).toFixed(2)) : 0;
}

function calculateRepurchaseRate(customerPurchaseCounts) {
  const totalCustomers = customerPurchaseCounts.length;
  const repeatCustomers = customerPurchaseCounts.filter(c => c.count >= 2).length;
  return totalCustomers > 0 ? Number(((repeatCustomers / totalCustomers) * 100).toFixed(2)) : 0;
}

function getSalesOverview(params = {}) {
  const { startDate, endDate } = params;
  const today = dayjs().format('YYYY-MM-DD');
  const defaultStart = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  
  const start = startDate || defaultStart;
  const end = endDate || today;
  
  const sql = `SELECT 
    COALESCE(SUM(actual_amount), 0) as total_sales,
    COALESCE(SUM(total_cost), 0) as total_cost,
    COALESCE(SUM(profit), 0) as total_profit,
    COALESCE(AVG(profit_rate), 0) as avg_profit_rate,
    COUNT(*) as order_count,
    COALESCE(SUM(item_count), 0) as item_count,
    COUNT(DISTINCT customer_id) as customer_count
    FROM sales_order 
    WHERE is_void = 0 AND created_at BETWEEN ? AND ?`;
  
  const result = db.prepare(sql).get(start + ' 00:00:00', end + ' 23:59:59');
  
  result.customer_price = calculateCustomerPrice(result.total_sales, result.order_count);
  
  const customerCounts = db.prepare(`
    SELECT customer_id, COUNT(*) as count 
    FROM sales_order 
    WHERE is_void = 0 AND customer_id IS NOT NULL 
    AND created_at BETWEEN ? AND ?
    GROUP BY customer_id
  `).all(start + ' 00:00:00', end + ' 23:59:59');
  
  result.repurchase_rate = calculateRepurchaseRate(customerCounts);
  
  return result;
}

function getSalesAnalysis(params) {
  const { 
    startDate, 
    endDate, 
    dimensions = [], 
    metrics = ['salesAmount', 'profit', 'profitRate', 'orderCount', 'customerPrice', 'repurchaseRate'],
    filters = {} 
  } = params;
  
  const today = dayjs().format('YYYY-MM-DD');
  const defaultStart = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  
  const start = startDate || defaultStart;
  const end = endDate || today;
  const startDateTime = start + ' 00:00:00';
  const endDateTime = end + ' 23:59:59';
  
  let whereSql = 'WHERE o.is_void = 0 AND o.created_at BETWEEN ? AND ?';
  const sqlParams = [startDateTime, endDateTime];
  let extraJoins = '';
  
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    extraJoins += ' LEFT JOIN sales_order_item oi_filter ON o.id = oi_filter.order_id LEFT JOIN product p_filter ON oi_filter.product_id = p_filter.id';
    whereSql += ` AND p_filter.category_id IN (${filters.categoryIds.map(() => '?').join(',')})`;
    sqlParams.push(...filters.categoryIds);
  }
  
  if (filters.staffIds && filters.staffIds.length > 0) {
    whereSql += ` AND o.staff_id IN (${filters.staffIds.map(() => '?').join(',')})`;
    sqlParams.push(...filters.staffIds);
  }
  
  if (filters.customerLevels && filters.customerLevels.length > 0) {
    whereSql += ` AND c.level IN (${filters.customerLevels.map(() => '?').join(',')})`;
    sqlParams.push(...filters.customerLevels);
  }
  
  const dimensionConfigs = {
    time: {
      select: `DATE(o.created_at) as dimension_value`,
      label: '日期',
      groupBy: 'DATE(o.created_at)',
      orderBy: 'dimension_value ASC'
    },
    category: {
      select: `p.category_id as dimension_value, cat.name as dimension_label`,
      label: '品类',
      join: 'LEFT JOIN product p ON oi.product_id = p.id LEFT JOIN category cat ON p.category_id = cat.id',
      groupBy: 'p.category_id',
      orderBy: 'sales_amount DESC'
    },
    staff: {
      select: `o.staff_id as dimension_value, s.name as dimension_label`,
      label: '店员',
      join: 'LEFT JOIN staff s ON o.staff_id = s.id',
      groupBy: 'o.staff_id',
      orderBy: 'sales_amount DESC'
    },
    customer: {
      select: `o.customer_id as dimension_value, c.name as dimension_label`,
      label: '客户',
      join: 'LEFT JOIN customer c ON o.customer_id = c.id',
      groupBy: 'o.customer_id',
      orderBy: 'sales_amount DESC'
    }
  };
  
  const results = {};
  const summary = {
    totalSalesAmount: 0,
    totalProfit: 0,
    avgProfitRate: 0,
    totalOrderCount: 0,
    avgCustomerPrice: 0,
    overallRepurchaseRate: 0
  };
  
  const baseSql = `SELECT 
    o.id, o.actual_amount, o.total_cost, o.profit, o.profit_rate, o.item_count,
    o.customer_id, o.staff_id, o.created_at
    FROM sales_order o
    LEFT JOIN sales_order_item oi ON o.id = oi.order_id
    LEFT JOIN customer c ON o.customer_id = c.id
    ${extraJoins}
    ${whereSql}`;
  
  const allOrders = db.prepare(baseSql).all(...sqlParams);
  
  const uniqueOrders = [];
  const orderIds = new Set();
  allOrders.forEach(o => {
    if (!orderIds.has(o.id)) {
      orderIds.add(o.id);
      uniqueOrders.push(o);
    }
  });
  
  summary.totalSalesAmount = uniqueOrders.reduce((sum, o) => sum + o.actual_amount, 0);
  summary.totalProfit = uniqueOrders.reduce((sum, o) => sum + o.profit, 0);
  summary.avgProfitRate = uniqueOrders.length > 0 
    ? Number((uniqueOrders.reduce((sum, o) => sum + o.profit_rate, 0) / uniqueOrders.length).toFixed(2))
    : 0;
  summary.totalOrderCount = uniqueOrders.length;
  summary.avgCustomerPrice = calculateCustomerPrice(summary.totalSalesAmount, summary.totalOrderCount);
  
  const filteredCustomerIds = new Set();
  uniqueOrders.forEach(o => {
    if (o.customer_id) {
      filteredCustomerIds.add(o.customer_id);
    }
  });
  
  const allPeriodOrdersSql = `SELECT 
    o.id, o.customer_id
    FROM sales_order o
    WHERE o.is_void = 0 AND o.created_at BETWEEN ? AND ?`;
  
  const allPeriodOrders = db.prepare(allPeriodOrdersSql).all(startDateTime, endDateTime);
  
  const customerCounts = {};
  allPeriodOrders.forEach(o => {
    if (o.customer_id && filteredCustomerIds.has(o.customer_id)) {
      customerCounts[o.customer_id] = (customerCounts[o.customer_id] || 0) + 1;
    }
  });
  
  summary.overallRepurchaseRate = calculateRepurchaseRate(
    Object.entries(customerCounts).map(([id, count]) => ({ customer_id: id, count }))
  );
  
  dimensions.forEach(dim => {
    const config = dimensionConfigs[dim];
    if (!config) return;
    
    const dimSqlParams = [...sqlParams];
    let dimJoin = '';
    if (config.join) dimJoin = config.join;
    
    const dimSql = `SELECT 
      ${config.select},
      COALESCE(SUM(DISTINCT o.actual_amount), 0) as sales_amount,
      COALESCE(SUM(DISTINCT o.total_cost), 0) as total_cost,
      COALESCE(SUM(DISTINCT o.profit), 0) as profit,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(AVG(DISTINCT o.profit_rate), 0) as profit_rate
      FROM sales_order o
      LEFT JOIN sales_order_item oi ON o.id = oi.order_id
      LEFT JOIN customer c ON o.customer_id = c.id
      ${dimJoin}
      ${extraJoins}
      ${whereSql}
      GROUP BY ${config.groupBy}
      ORDER BY ${config.orderBy}`;
    
    const rawData = db.prepare(dimSql).all(...dimSqlParams);
    
    const dimCustomerSql = `SELECT 
      ${config.select},
      o.customer_id
      FROM sales_order o
      LEFT JOIN sales_order_item oi ON o.id = oi.order_id
      LEFT JOIN customer c ON o.customer_id = c.id
      ${dimJoin}
      ${extraJoins}
      ${whereSql} AND o.customer_id IS NOT NULL
      GROUP BY ${config.groupBy}, o.customer_id`;
    
    const dimCustomerData = db.prepare(dimCustomerSql).all(...dimSqlParams);
    const dimFilteredCustomers = {};
    dimCustomerData.forEach(d => {
      const key = d.dimension_value;
      if (!dimFilteredCustomers[key]) dimFilteredCustomers[key] = new Set();
      dimFilteredCustomers[key].add(d.customer_id);
    });
    
    const dimCustomerCounts = {};
    Object.keys(dimFilteredCustomers).forEach(key => {
      dimCustomerCounts[key] = [];
      const customerIds = dimFilteredCustomers[key];
      const periodCounts = {};
      allPeriodOrders.forEach(o => {
        if (o.customer_id && customerIds.has(o.customer_id)) {
          periodCounts[o.customer_id] = (periodCounts[o.customer_id] || 0) + 1;
        }
      });
      Object.values(periodCounts).forEach(count => {
        dimCustomerCounts[key].push({ count });
      });
    });
    
    results[dim] = rawData.map(d => {
      const item = {
        dimensionValue: d.dimension_value,
        dimensionLabel: d.dimension_label || d.dimension_value,
        salesAmount: d.sales_amount,
        profit: d.profit,
        profitRate: d.profit_rate,
        orderCount: d.order_count,
        customerPrice: calculateCustomerPrice(d.sales_amount, d.order_count),
        repurchaseRate: calculateRepurchaseRate(dimCustomerCounts[d.dimension_value] || [])
      };
      return item;
    });
  });
  
  return {
    dimensions,
    metrics,
    data: results,
    summary
  };
}

function getSalesTrend(params = {}) {
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
  
  const sql = `SELECT 
    strftime(?, created_at) as period,
    COALESCE(SUM(actual_amount), 0) as sales_amount,
    COALESCE(SUM(profit), 0) as profit,
    COUNT(*) as order_count
    FROM sales_order 
    WHERE is_void = 0 AND created_at BETWEEN ? AND ?
    GROUP BY strftime(?, created_at)
    ORDER BY period ASC`;
  
  return db.prepare(sql).all(dateFormat, start + ' 00:00:00', end + ' 23:59:59', dateFormat);
}

function getSalesByCategory(params = {}) {
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
  
  return db.prepare(sql).all(start + ' 00:00:00', end + ' 23:59:59');
}

function getSalesByStaff(params = {}) {
  const { startDate, endDate } = params;
  const today = dayjs().format('YYYY-MM-DD');
  const defaultStart = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  
  const start = startDate || defaultStart;
  const end = endDate || today;
  
  const sql = `SELECT 
    s.id as staff_id,
    s.name as staff_name,
    s.staff_no,
    COALESCE(SUM(o.actual_amount), 0) as sales_amount,
    COALESCE(SUM(o.profit), 0) as profit,
    COALESCE(AVG(o.profit_rate), 0) as profit_rate,
    COUNT(*) as order_count,
    COUNT(DISTINCT o.customer_id) as customer_count
    FROM sales_order o
    LEFT JOIN staff s ON o.staff_id = s.id
    WHERE o.is_void = 0 AND o.created_at BETWEEN ? AND ?
    GROUP BY s.id
    ORDER BY sales_amount DESC`;
  
  return db.prepare(sql).all(start + ' 00:00:00', end + ' 23:59:59');
}

function getSalesDetail(params = {}) {
  const { page = 1, pageSize = 20, orderNo, startDate, endDate, staffId, customerId, productId } = params;
  const offset = (page - 1) * pageSize;
  
  let whereSql = 'WHERE o.is_void = 0';
  const countParams = [];
  const queryParams = [];
  
  if (orderNo) {
    whereSql += ' AND o.order_no LIKE ?';
    const search = `%${orderNo}%`;
    countParams.push(search);
    queryParams.push(search);
  }
  
  if (startDate) {
    whereSql += ' AND o.created_at >= ?';
    countParams.push(startDate);
    queryParams.push(startDate);
  }
  
  if (endDate) {
    whereSql += ' AND o.created_at <= ?';
    countParams.push(endDate + ' 23:59:59');
    queryParams.push(endDate + ' 23:59:59');
  }
  
  if (staffId) {
    whereSql += ' AND o.staff_id = ?';
    countParams.push(staffId);
    queryParams.push(staffId);
  }
  
  if (customerId) {
    whereSql += ' AND o.customer_id = ?';
    countParams.push(customerId);
    queryParams.push(customerId);
  }
  
  if (productId) {
    whereSql += ' AND oi.product_id = ?';
    countParams.push(productId);
    queryParams.push(productId);
  }
  
  const countSql = `SELECT COUNT(DISTINCT o.id) as total FROM sales_order o 
    LEFT JOIN sales_order_item oi ON o.id = oi.order_id 
    ${whereSql}`;
  
  const querySql = `SELECT o.*, 
    s.name as staff_name, 
    c.name as customer_name, c.member_no, c.level as customer_level,
    (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
      'id', id, 'product_id', product_id, 'sku', sku, 'product_name', product_name,
      'quantity', quantity, 'unit_price', unit_price, 'cost_price', cost_price,
      'subtotal', subtotal, 'profit', profit
    )) FROM sales_order_item WHERE order_id = o.id) as items
    FROM sales_order o
    LEFT JOIN staff s ON o.staff_id = s.id
    LEFT JOIN customer c ON o.customer_id = c.id
    ${whereSql}
    GROUP BY o.id
    ORDER BY o.id DESC 
    LIMIT ? OFFSET ?`;
  
  queryParams.push(pageSize, offset);
  
  const total = db.prepare(countSql).get(...countParams).total;
  const list = db.prepare(querySql).all(...queryParams).map(o => ({
    ...o,
    items: o.items ? JSON.parse(o.items) : []
  }));
  
  return { list, total, page, pageSize };
}

function getHourlySales(params = {}) {
  const { date = dayjs().format('YYYY-MM-DD') } = params;
  
  const sql = `SELECT 
    CAST(strftime('%H', created_at) as INTEGER) as hour,
    COALESCE(SUM(actual_amount), 0) as sales_amount,
    COUNT(*) as order_count
    FROM sales_order 
    WHERE is_void = 0 AND DATE(created_at) = ?
    GROUP BY strftime('%H', created_at)
    ORDER BY hour ASC`;
  
  const result = db.prepare(sql).all(date);
  
  const hourlyData = Array(24).fill(null).map((_, i) => {
    const found = result.find(r => r.hour === i);
    return {
      hour: i,
      hourLabel: `${String(i).padStart(2, '0')}:00`,
      salesAmount: found ? found.sales_amount : 0,
      orderCount: found ? found.order_count : 0
    };
  });
  
  return hourlyData;
}

module.exports = {
  calculateCustomerPrice,
  calculateProfitRate,
  calculateRepurchaseRate,
  getSalesOverview,
  getSalesAnalysis,
  getSalesTrend,
  getSalesByCategory,
  getSalesByStaff,
  getSalesDetail,
  getHourlySales
};
