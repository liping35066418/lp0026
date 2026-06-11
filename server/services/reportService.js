const { db } = require('../models/db');
const dayjs = require('dayjs');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');

function getTemplateList(params = {}) {
  const { reportType, isDefault } = params;
  
  let whereSql = 'WHERE 1=1';
  const paramsArr = [];
  
  if (reportType) {
    whereSql += ' AND report_type = ?';
    paramsArr.push(reportType);
  }
  
  if (isDefault !== undefined) {
    whereSql += ' AND is_default = ?';
    paramsArr.push(isDefault ? 1 : 0);
  }
  
  const sql = `SELECT * FROM report_template ${whereSql} ORDER BY is_default DESC, created_at DESC`;
  
  const list = db.prepare(sql).all(...paramsArr);
  
  return list.map(t => ({
    ...t,
    metrics: JSON.parse(t.metrics || '[]'),
    dimensions: JSON.parse(t.dimensions || '[]'),
    filters: JSON.parse(t.filters || '{}'),
    layout_config: JSON.parse(t.layout_config || '{}')
  }));
}

function saveTemplate(template) {
  const { name, reportType, metrics, dimensions, filters = {}, layoutConfig = {}, creatorId, isDefault = 0 } = template;
  
  if (isDefault) {
    db.prepare('UPDATE report_template SET is_default = 0 WHERE report_type = ?').run(reportType);
  }
  
  const sql = `INSERT INTO report_template 
    (name, report_type, metrics, dimensions, filters, layout_config, creator_id, is_default) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const result = db.prepare(sql).run(
    name,
    reportType,
    JSON.stringify(metrics),
    JSON.stringify(dimensions),
    JSON.stringify(filters),
    JSON.stringify(layoutConfig),
    creatorId,
    isDefault
  );
  
  return { id: result.lastInsertRowid };
}

function updateTemplate(id, template) {
  const { name, metrics, dimensions, filters, layoutConfig, isDefault } = template;
  
  const existing = db.prepare('SELECT * FROM report_template WHERE id = ?').get(id);
  if (!existing) throw new Error('Template not found');
  
  if (isDefault) {
    db.prepare('UPDATE report_template SET is_default = 0 WHERE report_type = ?').run(existing.report_type);
  }
  
  const sql = `UPDATE report_template SET 
    name = ?, metrics = ?, dimensions = ?, filters = ?, layout_config = ?, 
    is_default = ?, updated_at = ? 
    WHERE id = ?`;
  
  db.prepare(sql).run(
    name,
    JSON.stringify(metrics),
    JSON.stringify(dimensions),
    JSON.stringify(filters || {}),
    JSON.stringify(layoutConfig || {}),
    isDefault !== undefined ? isDefault : existing.is_default,
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
    id
  );
  
  return { id };
}

function deleteTemplate(id) {
  db.prepare('DELETE FROM report_template WHERE id = ?').run(id);
  return { success: true };
}

function generateReport(params) {
  const { templateId, startDate, endDate, filters = {} } = params;
  
  let template;
  if (templateId) {
    template = db.prepare('SELECT * FROM report_template WHERE id = ?').get(templateId);
    if (!template) throw new Error('Template not found');
    template = {
      ...template,
      metrics: JSON.parse(template.metrics || '[]'),
      dimensions: JSON.parse(template.dimensions || '[]'),
      filters: JSON.parse(template.filters || '{}')
    };
  } else {
    template = {
      report_type: params.reportType || 'custom',
      metrics: params.metrics || [],
      dimensions: params.dimensions || [],
      filters: params.filters || {}
    };
  }
  
  const mergedFilters = { ...template.filters, ...filters };
  
  const metricConfigs = {
    salesAmount: { label: '销售额', field: 'actual_amount', agg: 'SUM', table: 'sales_order' },
    profit: { label: '毛利', field: 'profit', agg: 'SUM', table: 'sales_order' },
    profitRate: { label: '毛利率', field: 'profit_rate', agg: 'AVG', table: 'sales_order' },
    orderCount: { label: '订单数', field: 'id', agg: 'COUNT', table: 'sales_order' },
    customerPrice: { label: '客单价', field: 'actual_amount', agg: 'AVG', table: 'sales_order' },
    repurchaseRate: { label: '复购率', custom: true },
    inventoryQty: { label: '库存数量', field: 'quantity', agg: 'SUM', table: 'inventory' },
    inventoryValue: { label: '库存金额', field: 'total_cost_amount', agg: 'SUM', table: 'inventory' },
    purchaseAmount: { label: '采购金额', field: 'actual_amount', agg: 'SUM', table: 'purchase_order' },
    stocktakeDiff: { label: '盘点差异', field: 'diff_amount', agg: 'SUM', table: 'stocktake_item' }
  };
  
  const dimensionConfigs = {
    time: { label: '时间', field: 'DATE(created_at)', table: 'sales_order' },
    category: { label: '品类', field: 'category_id', join: 'product', table: 'sales_order_item' },
    staff: { label: '店员', field: 'staff_id', table: 'sales_order' },
    customer: { label: '客户', field: 'customer_id', table: 'sales_order' },
    supplier: { label: '供应商', field: 'supplier_id', table: 'purchase_order' },
    product: { label: '商品', field: 'product_id', table: 'sales_order_item' }
  };
  
  const start = startDate || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const end = endDate || dayjs().format('YYYY-MM-DD');
  const startDateTime = start + ' 00:00:00';
  const endDateTime = end + ' 23:59:59';
  
  const results = {};
  
  template.dimensions.forEach(dim => {
    const dimConfig = dimensionConfigs[dim];
    if (!dimConfig) return;
    
    const fields = template.metrics.map(m => {
      const config = metricConfigs[m];
      if (!config || config.custom) return null;
      return `${config.agg}(${config.field}) as ${m.toLowerCase()}`;
    }).filter(Boolean);
    
    if (fields.length === 0) return;
    
    let joinSql = '';
    let tableName = dimConfig.table;
    
    if (dimConfig.join) {
      if (dimConfig.table === 'sales_order_item') {
        joinSql = `JOIN sales_order o ON oi.order_id = o.id 
                   JOIN ${dimConfig.join} p ON oi.product_id = p.id`;
        tableName = 'sales_order_item oi';
      }
    }
    
    const sql = `SELECT 
      ${dimConfig.field} as dimension_value,
      ${fields.join(', ')}
      FROM ${tableName}
      ${joinSql}
      WHERE created_at BETWEEN ? AND ?
      AND is_void = 0
      GROUP BY ${dimConfig.field}
      ORDER BY dimension_value`;
    
    const data = db.prepare(sql).all(startDateTime, endDateTime);
    
    results[dim] = data;
  });
  
  const summary = {};
  template.metrics.forEach(m => {
    const config = metricConfigs[m];
    if (!config || config.custom) return;
    
    const sql = `SELECT ${config.agg}(${config.field}) as value 
      FROM ${config.table} 
      WHERE created_at BETWEEN ? AND ? 
      AND is_void = 0`;
    
    const result = db.prepare(sql).get(startDateTime, endDateTime);
    summary[m] = result.value || 0;
  });
  
  return {
    template: template.name || '自定义报表',
    reportType: template.report_type,
    period: { startDate: start, endDate: end },
    dimensions: template.dimensions,
    metrics: template.metrics,
    data: results,
    summary,
    generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
  };
}

function exportToExcel(reportData) {
  const wb = XLSX.utils.book_new();
  
  const summaryData = [
    ['报表名称', reportData.template],
    ['生成时间', reportData.generatedAt],
    ['统计周期', `${reportData.period.startDate} 至 ${reportData.period.endDate}`],
    [],
    ['指标汇总']
  ];
  
  const metricLabels = {
    salesAmount: '销售额',
    profit: '毛利',
    profitRate: '毛利率(%)',
    orderCount: '订单数',
    customerPrice: '客单价',
    repurchaseRate: '复购率(%)',
    inventoryQty: '库存数量',
    inventoryValue: '库存金额',
    purchaseAmount: '采购金额',
    stocktakeDiff: '盘点差异'
  };
  
  Object.entries(reportData.summary).forEach(([key, value]) => {
    summaryData.push([metricLabels[key] || key, value]);
  });
  
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), '汇总');
  
  reportData.dimensions.forEach(dim => {
    const dimLabels = { time: '按时间', category: '按品类', staff: '按店员', customer: '按客户', supplier: '按供应商', product: '按商品' };
    const dimData = reportData.data[dim];
    
    if (dimData && dimData.length > 0) {
      const headers = [dimLabels[dim] || dim, ...reportData.metrics.map(m => metricLabels[m] || m)];
      const rows = dimData.map(row => {
        return [row.dimension_value, ...reportData.metrics.map(m => row[m.toLowerCase()])];
      });
      const wsData = [headers, ...rows];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), dimLabels[dim] || dim);
    }
  });
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function exportToPDF(reportData, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = new PassThrough();
  
  doc.pipe(stream);
  
  doc.fontSize(18).text(reportData.template, { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(10).fillColor('#666');
  doc.text(`生成时间: ${reportData.generatedAt}`);
  doc.text(`统计周期: ${reportData.period.startDate} 至 ${reportData.period.endDate}`);
  doc.moveDown();
  
  const metricLabels = {
    salesAmount: '销售额',
    profit: '毛利',
    profitRate: '毛利率(%)',
    orderCount: '订单数',
    customerPrice: '客单价',
    repurchaseRate: '复购率(%)',
    inventoryQty: '库存数量',
    inventoryValue: '库存金额'
  };
  
  doc.fontSize(14).text('指标汇总', { underline: true });
  doc.moveDown();
  
  doc.fontSize(11);
  Object.entries(reportData.summary).forEach(([key, value]) => {
    doc.text(`${metricLabels[key] || key}: ${value}`);
  });
  
  reportData.dimensions.forEach(dim => {
    const dimLabels = { time: '按时间', category: '按品类', staff: '按店员', customer: '按客户' };
    const dimData = reportData.data[dim];
    
    if (dimData && dimData.length > 0) {
      doc.addPage();
      doc.fontSize(14).text(dimLabels[dim] || dim, { underline: true });
      doc.moveDown();
      
      doc.fontSize(10);
      const tableTop = doc.y;
      const colWidths = [120, ...reportData.metrics.map(() => 80)];
      
      const headers = [dimLabels[dim] || dim, ...reportData.metrics.map(m => metricLabels[m] || m)];
      headers.forEach((header, i) => {
        doc.text(header, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop);
      });
      
      dimData.forEach((row, rowIdx) => {
        const y = tableTop + 20 + (rowIdx * 15);
        doc.text(String(row.dimension_value), 50, y);
        reportData.metrics.forEach((m, colIdx) => {
          doc.text(String(row[m.toLowerCase()] || 0), 50 + colWidths.slice(0, colIdx + 1).reduce((a, b) => a + b, 0), y);
        });
      });
    }
  });
  
  doc.end();
  
  return stream;
}

function batchExport(params) {
  const { reports, format = 'xlsx' } = params;
  
  return reports.map(reportParams => {
    const reportData = generateReport(reportParams);
    
    if (format === 'xlsx') {
      return {
        name: `${reportData.template}_${dayjs().format('YYYYMMDD')}.xlsx`,
        data: exportToExcel(reportData),
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    } else if (format === 'pdf') {
      return {
        name: `${reportData.template}_${dayjs().format('YYYYMMDD')}.pdf`,
        data: null,
        type: 'application/pdf',
        reportData
      };
    }
  });
}

module.exports = {
  getTemplateList,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
  generateReport,
  exportToExcel,
  exportToPDF,
  batchExport
};
