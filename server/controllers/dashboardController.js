const dashboardService = require('../services/dashboardService');

const dashboardController = {
  async getOverview(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = dashboardService.getOverview({ startDate, endDate });
      res.success(data, '获取概览数据成功');
    } catch (err) {
      next(err);
    }
  },

  async getTrends(req, res, next) {
    try {
      const { startDate, endDate, interval } = req.query;
      const data = dashboardService.getTrends({ startDate, endDate, interval });
      res.success(data, '获取趋势数据成功');
    } catch (err) {
      next(err);
    }
  },

  async getAlerts(req, res, next) {
    try {
      const { page, pageSize, alertType } = req.query;
      const data = dashboardService.getAlerts({ 
        page: parseInt(page) || 1, 
        pageSize: parseInt(pageSize) || 20, 
        alertType 
      });
      res.success(data, '获取预警列表成功');
    } catch (err) {
      next(err);
    }
  },

  async getTopProducts(req, res, next) {
    try {
      const { startDate, endDate, limit, sortBy } = req.query;
      const data = dashboardService.getTopProducts({ 
        startDate, 
        endDate, 
        limit: parseInt(limit) || 10, 
        sortBy 
      });
      res.success(data, '获取热销商品成功');
    } catch (err) {
      next(err);
    }
  },

  async getCategorySales(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = dashboardService.getCategorySales({ startDate, endDate });
      res.success(data, '获取品类销售成功');
    } catch (err) {
      next(err);
    }
  },

  async refreshAlerts(req, res, next) {
    try {
      const data = dashboardService.refreshAllAlerts();
      res.success(data, '刷新预警成功');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = dashboardController;
