const salesService = require('../services/salesService');

const salesController = {
  async getOverview(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = salesService.getSalesOverview({ startDate, endDate });
      res.success(data, '获取销售概览成功');
    } catch (err) {
      next(err);
    }
  },

  async getAnalysis(req, res, next) {
    try {
      const params = req.body;
      const data = salesService.getSalesAnalysis(params);
      res.success(data, '获取销售分析成功');
    } catch (err) {
      next(err);
    }
  },

  async getTrend(req, res, next) {
    try {
      const { startDate, endDate, interval } = req.query;
      const data = salesService.getSalesTrend({ startDate, endDate, interval });
      res.success(data, '获取销售趋势成功');
    } catch (err) {
      next(err);
    }
  },

  async getByCategory(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = salesService.getSalesByCategory({ startDate, endDate });
      res.success(data, '获取品类销售成功');
    } catch (err) {
      next(err);
    }
  },

  async getByStaff(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = salesService.getSalesByStaff({ startDate, endDate });
      res.success(data, '获取店员销售成功');
    } catch (err) {
      next(err);
    }
  },

  async getDetail(req, res, next) {
    try {
      const { page, pageSize, orderNo, startDate, endDate, staffId, customerId, productId } = req.query;
      const data = salesService.getSalesDetail({ 
        page: parseInt(page) || 1, 
        pageSize: parseInt(pageSize) || 20, 
        orderNo, 
        startDate, 
        endDate, 
        staffId: staffId ? parseInt(staffId) : undefined, 
        customerId: customerId ? parseInt(customerId) : undefined, 
        productId: productId ? parseInt(productId) : undefined 
      });
      res.success(data, '获取销售明细成功');
    } catch (err) {
      next(err);
    }
  },

  async getHourly(req, res, next) {
    try {
      const { date } = req.query;
      const data = salesService.getHourlySales({ date });
      res.success(data, '获取时段销售成功');
    } catch (err) {
      next(err);
    }
  },

  async getProductsByCategory(req, res, next) {
    try {
      const { startDate, endDate, categoryId } = req.query;
      const data = salesService.getProductsByCategory({ 
        startDate, 
        endDate, 
        categoryId: parseInt(categoryId) 
      });
      res.success(data, '获取品类商品明细成功');
    } catch (err) {
      next(err);
    }
  },

  async getProductDailyTrend(req, res, next) {
    try {
      const { startDate, endDate, productId } = req.query;
      const data = salesService.getProductDailyTrend({ 
        startDate, 
        endDate, 
        productId: parseInt(productId) 
      });
      res.success(data, '获取商品日销售趋势成功');
    } catch (err) {
      next(err);
    }
  },

  async getCategoryDrillOverview(req, res, next) {
    try {
      const { startDate, endDate, categoryId, productId } = req.query;
      const data = salesService.getCategoryDrillOverview({ 
        startDate, 
        endDate, 
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        productId: productId ? parseInt(productId) : undefined
      });
      res.success(data, '获取下钻概览成功');
    } catch (err) {
      next(err);
    }
  },

  async exportCategoryAnalysis(req, res, next) {
    try {
      const { startDate, endDate, categoryId, productId } = req.body;
      const buffer = salesService.exportCategoryAnalysis({ 
        startDate, 
        endDate, 
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        productId: productId ? parseInt(productId) : undefined
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="category_analysis_${Date.now()}.xlsx"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = salesController;
