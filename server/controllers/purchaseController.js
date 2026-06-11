const purchaseService = require('../services/purchaseService');

const purchaseController = {
  async createOrder(req, res, next) {
    try {
      const { supplierId, items, operatorId, remark } = req.body;
      const data = purchaseService.createPurchaseOrder({
        supplierId: supplierId ? parseInt(supplierId) : undefined,
        items: items.map(item => ({
          ...item,
          product_id: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          cost_price: parseFloat(item.costPrice)
        })),
        operatorId: parseInt(operatorId) || 1,
        remark
      });
      res.success(data, '采购单创建成功');
    } catch (err) {
      next(err);
    }
  },

  async getOrderList(req, res, next) {
    try {
      const { page, pageSize, status, supplierId, startDate, endDate, useCursor, lastId } = req.query;
      const data = purchaseService.getPurchaseList({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        status,
        supplierId: supplierId ? parseInt(supplierId) : undefined,
        startDate,
        endDate,
        useCursor: useCursor === 'true',
        lastId: lastId ? parseInt(lastId) : undefined
      });
      res.success(data, '获取采购单列表成功');
    } catch (err) {
      next(err);
    }
  },

  async getOrderDetail(req, res, next) {
    try {
      const { id } = req.params;
      const data = purchaseService.getPurchaseDetail(parseInt(id));
      res.success(data, '获取采购单详情成功');
    } catch (err) {
      next(err);
    }
  },

  async confirmWarehouse(req, res, next) {
    try {
      const { id } = req.params;
      const { operatorId, operatorName } = req.body;
      const data = purchaseService.confirmWarehouse(
        parseInt(id),
        parseInt(operatorId) || 1,
        operatorName || '系统管理员'
      );
      res.success(data, '入库确认成功');
    } catch (err) {
      next(err);
    }
  },

  async purchaseReturn(req, res, next) {
    try {
      const { id } = req.params;
      const { items, operatorId, operatorName, reason } = req.body;
      const data = purchaseService.purchaseReturn(
        parseInt(id),
        items.map(item => ({
          ...item,
          item_id: parseInt(item.itemId),
          quantity: parseInt(item.quantity)
        })),
        parseInt(operatorId) || 1,
        operatorName || '系统管理员',
        reason
      );
      res.success(data, '采购退货成功');
    } catch (err) {
      next(err);
    }
  },

  async getSupplierList(req, res, next) {
    try {
      const { page, pageSize, keyword, status } = req.query;
      const data = purchaseService.getSupplierList({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        keyword,
        status: status !== undefined ? parseInt(status) : undefined
      });
      res.success(data, '获取供应商列表成功');
    } catch (err) {
      next(err);
    }
  },

  async saveSupplier(req, res, next) {
    try {
      const { id, supplierNo, name, contact, phone, address, status } = req.body;
      const data = purchaseService.saveSupplier({
        id: id ? parseInt(id) : undefined,
        supplierNo,
        name,
        contact,
        phone,
        address,
        status: status !== undefined ? parseInt(status) : 1
      });
      res.success(data, id ? '供应商更新成功' : '供应商创建成功');
    } catch (err) {
      next(err);
    }
  },

  async deleteSupplier(req, res, next) {
    try {
      const { id } = req.params;
      const data = purchaseService.deleteSupplier(parseInt(id));
      res.success(data, '供应商删除成功');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = purchaseController;
