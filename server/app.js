const express = require('express');
const path = require('path');
const config = require('./config/database');
const { init } = require('./models/db');

const corsMiddleware = require('./middleware/cors');
const requestLogger = require('./middleware/logger');
const { responseFormatter } = require('./middleware/response');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const dashboardRoutes = require('./routes/dashboard');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const purchaseRoutes = require('./routes/purchase');
const stocktakeRoutes = require('./routes/stocktake');
const reportRoutes = require('./routes/report');
const systemRoutes = require('./routes/system');

init();

const app = express();

app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);
app.use(responseFormatter);

app.use(express.static(path.join(__dirname, '../client')));

app.get('/api/health', (req, res) => {
  res.success({ status: 'ok', timestamp: new Date().toISOString() }, '服务运行正常');
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/stocktake', stocktakeRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/system', systemRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port || 8646;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                           ║
║  零售门店数据统计分析平台 - 后端服务                        ║
║                                                           ║
║  服务端口: ${PORT}                                          ║
║  启动时间: ${new Date().toLocaleString('zh-CN')}           ║
║                                                           ║
║  API文档:                                                  ║
║  - GET    /api/health              - 健康检查               ║
║  - GET    /api/dashboard/overview  - 仪表盘概览             ║
║  - POST   /api/sales/analysis       - 销售分析              ║
║  - GET    /api/inventory/current    - 实时库存              ║
║  - POST   /api/purchase/order       - 创建采购单            ║
║  - POST   /api/stocktake/create     - 创建盘点单            ║
║  - POST   /api/report/generate      - 生成报表              ║
║                                                           ║
║  前端访问: http://localhost:${PORT}/                        ║
║                                                           ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
