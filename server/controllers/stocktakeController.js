const stocktakeService = require('../services/stocktakeService');

const stocktakeController = {
  async createOrder(req, res, next) {
    try {
      const { stocktakeDate, categoryId, operatorId, remark } = req.body;
      const data = stocktakeService.createStocktakeOrder({
        stocktakeDate,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        operatorId: parseInt(operatorId) || 1,
        remark
      });
      res.success(data, '盘点单创建成功');
    } catch (err) {
      next(err);
    }
  },

  async getOrderList(req, res, next) {
    try {
      const { page, pageSize, status, startDate, endDate } = req.query;
      const data = stocktakeService.getStocktakeList({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        status,
        startDate,
        endDate
      });
      res.success(data, '获取盘点单列表成功');
    } catch (err) {
      next(err);
    }
  },

  async getOrderDetail(req, res, next) {
    try {
      const { id } = req.params;
      const data = stocktakeService.getStocktakeDetail(parseInt(id));
      res.success(data, '获取盘点单详情成功');
    } catch (err) {
      next(err);
    }
  },

  async inputActualQty(req, res, next) {
    try {
      const { id } = req.params;
      const { items } = req.body;
      const data = stocktakeService.inputActualQty(
        parseInt(id),
        items.map(item => ({
          ...item,
          id: parseInt(item.id),
          book_qty: parseInt(item.bookQty),
          actual_qty: parseInt(item.actualQty),
          cost_price: parseFloat(item.costPrice)
        }))
      );
      res.success(data, '实盘数量录入成功');
    } catch (err) {
      next(err);
    }
  },

  async redoStocktake(req, res, next) {
    try {
      const { id } = req.params;
      const { operatorId, operatorName } = req.body;
      const data = stocktakeService.redoStocktake(
        parseInt(id),
        parseInt(operatorId) || 1,
        operatorName || '系统管理员'
      );
      res.success(data, '红冲重算成功');
    } catch (err) {
      next(err);
    }
  },

  async confirmAdjust(req, res, next) {
    try {
      const { id } = req.params;
      const { operatorId, operatorName } = req.body;
      const data = stocktakeService.confirmAdjust(
        parseInt(id),
        parseInt(operatorId) || 1,
        operatorName || '系统管理员'
      );
      res.success(data, '库存调整确认成功');
    } catch (err) {
      next(err);
    }
  },

  async voidSalesOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { operatorId, operatorName, reason } = req.body;
      const data = stocktakeService.voidSalesOrder(
        parseInt(id),
        parseInt(operatorId) || 1,
        operatorName || '系统管理员',
        reason
      );
      res.success(data, '销售单红冲成功');
    } catch (err) {
      next(err);
    }
  },

  async recalculateInventory(req, res, next) {
    try {
      const { startDate, endDate } = req.body;
      const data = stocktakeService.recalculateInventoryByDate(startDate, endDate);
      res.success(data, '库存成本重算成功');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = stocktakeController;
