const inventoryService = require('../services/inventoryService');

const inventoryController = {
  async getInventoryList(req, res, next) {
    try {
      const { page, pageSize, keyword, categoryId, alertStatus, sortBy, sortOrder } = req.query;
      const data = inventoryService.getInventoryList({ 
        page: parseInt(page) || 1, 
        pageSize: parseInt(pageSize) || 20, 
        keyword, 
        categoryId: categoryId ? parseInt(categoryId) : undefined, 
        alertStatus, 
        sortBy, 
        sortOrder 
      });
      res.success(data, '获取库存列表成功');
    } catch (err) {
      next(err);
    }
  },

  async getInventoryFlow(req, res, next) {
    try {
      const { page, pageSize, productId, flowType, startDate, endDate, referenceNo } = req.query;
      const data = inventoryService.getInventoryFlow({ 
        page: parseInt(page) || 1, 
        pageSize: parseInt(pageSize) || 20, 
        productId: productId ? parseInt(productId) : undefined, 
        flowType, 
        startDate, 
        endDate, 
        referenceNo 
      });
      res.success(data, '获取出入库流水成功');
    } catch (err) {
      next(err);
    }
  },

  async calculateInventory(req, res, next) {
    try {
      const { productId } = req.body;
      const data = inventoryService.recalculateInventoryCost(parseInt(productId));
      res.success(data, '库存成本重算成功');
    } catch (err) {
      next(err);
    }
  },

  async checkAlerts(req, res, next) {
    try {
      const data = inventoryService.checkAllInventoryAlerts();
      res.success(data, '预警检查完成');
    } catch (err) {
      next(err);
    }
  },

  async redOffsetFlow(req, res, next) {
    try {
      const { flowId, operatorId, operatorName } = req.body;
      const data = inventoryService.redOffsetFlow(
        parseInt(flowId), 
        parseInt(operatorId) || 1, 
        operatorName || '系统管理员'
      );
      res.success(data, '红冲操作成功');
    } catch (err) {
      next(err);
    }
  },

  async updateInventory(req, res, next) {
    try {
      const { productId, quantityChange, costPrice, flowType, operatorId, operatorName, referenceNo, remark, expireDate } = req.body;
      const data = inventoryService.updateInventory(
        parseInt(productId),
        parseInt(quantityChange),
        parseFloat(costPrice),
        flowType,
        parseInt(operatorId) || 1,
        operatorName || '系统管理员',
        referenceNo,
        remark,
        expireDate
      );
      res.success(data, '库存更新成功');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = inventoryController;
