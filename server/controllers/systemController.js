const systemService = require('../services/systemService');

const systemController = {
  async getConfigList(req, res, next) {
    try {
      const data = systemService.getConfigList();
      res.success(data, '获取配置列表成功');
    } catch (err) {
      next(err);
    }
  },

  async getConfig(req, res, next) {
    try {
      const { key } = req.params;
      const data = systemService.getConfig(key);
      res.success(data, '获取配置成功');
    } catch (err) {
      next(err);
    }
  },

  async setConfig(req, res, next) {
    try {
      const { key, value, description } = req.body;
      const data = systemService.setConfig(key, value, description);
      res.success(data, '配置保存成功');
    } catch (err) {
      next(err);
    }
  },

  async deleteConfig(req, res, next) {
    try {
      const { key } = req.params;
      const data = systemService.deleteConfig(key);
      res.success(data, '配置删除成功');
    } catch (err) {
      next(err);
    }
  },

  async getUserList(req, res, next) {
    try {
      const { page, pageSize, keyword, role, status } = req.query;
      const data = systemService.getUserList({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        keyword,
        role,
        status: status !== undefined ? parseInt(status) : undefined
      });
      res.success(data, '获取用户列表成功');
    } catch (err) {
      next(err);
    }
  },

  async saveUser(req, res, next) {
    try {
      const { id, username, password, name, role, status } = req.body;
      const data = systemService.saveUser({
        id: id ? parseInt(id) : undefined,
        username,
        password,
        name,
        role,
        status: status !== undefined ? parseInt(status) : 1
      });
      res.success(data, id ? '用户更新成功' : '用户创建成功');
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const data = systemService.deleteUser(parseInt(id));
      res.success(data, '用户删除成功');
    } catch (err) {
      next(err);
    }
  },

  async getCategoryList(req, res, next) {
    try {
      const { parentId, status } = req.query;
      const data = systemService.getCategoryList({
        parentId: parentId !== undefined ? parseInt(parentId) : undefined,
        status: status !== undefined ? parseInt(status) : undefined
      });
      res.success(data, '获取分类列表成功');
    } catch (err) {
      next(err);
    }
  },

  async getCategoryTree(req, res, next) {
    try {
      const data = systemService.getCategoryTree();
      res.success(data, '获取分类树成功');
    } catch (err) {
      next(err);
    }
  },

  async saveCategory(req, res, next) {
    try {
      const { id, name, parentId, sortOrder, status } = req.body;
      const data = systemService.saveCategory({
        id: id ? parseInt(id) : undefined,
        name,
        parentId: parseInt(parentId) || 0,
        sortOrder: parseInt(sortOrder) || 0,
        status: status !== undefined ? parseInt(status) : 1
      });
      res.success(data, id ? '分类更新成功' : '分类创建成功');
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const data = systemService.deleteCategory(parseInt(id));
      res.success(data, '分类删除成功');
    } catch (err) {
      next(err);
    }
  },

  async getProductList(req, res, next) {
    try {
      const { page, pageSize, keyword, categoryId, status } = req.query;
      const data = systemService.getProductList({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        keyword,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        status: status !== undefined ? parseInt(status) : undefined
      });
      res.success(data, '获取商品列表成功');
    } catch (err) {
      next(err);
    }
  },

  async saveProduct(req, res, next) {
    try {
      const { id, sku, barcode, name, categoryId, spec, unit, costPrice, salePrice, warningThreshold, expireDaysWarning, slowMovingDays, status } = req.body;
      const data = systemService.saveProduct({
        id: id ? parseInt(id) : undefined,
        sku,
        barcode,
        name,
        categoryId: parseInt(categoryId),
        spec,
        unit,
        costPrice: parseFloat(costPrice),
        salePrice: parseFloat(salePrice),
        warningThreshold: parseInt(warningThreshold) || 10,
        expireDaysWarning: parseInt(expireDaysWarning) || 30,
        slowMovingDays: parseInt(slowMovingDays) || 90,
        status: status !== undefined ? parseInt(status) : 1
      });
      res.success(data, id ? '商品更新成功' : '商品创建成功');
    } catch (err) {
      next(err);
    }
  },

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const data = systemService.deleteProduct(parseInt(id));
      res.success(data, '商品删除成功');
    } catch (err) {
      next(err);
    }
  },

  async getStaffList(req, res, next) {
    try {
      const { page, pageSize, keyword, role, status } = req.query;
      const data = systemService.getStaffList({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        keyword,
        role,
        status: status !== undefined ? parseInt(status) : undefined
      });
      res.success(data, '获取员工列表成功');
    } catch (err) {
      next(err);
    }
  },

  async saveStaff(req, res, next) {
    try {
      const { id, staffNo, name, role, phone, status } = req.body;
      const data = systemService.saveStaff({
        id: id ? parseInt(id) : undefined,
        staffNo,
        name,
        role,
        phone,
        status: status !== undefined ? parseInt(status) : 1
      });
      res.success(data, id ? '员工更新成功' : '员工创建成功');
    } catch (err) {
      next(err);
    }
  },

  async deleteStaff(req, res, next) {
    try {
      const { id } = req.params;
      const data = systemService.deleteStaff(parseInt(id));
      res.success(data, '员工删除成功');
    } catch (err) {
      next(err);
    }
  },

  async getCustomerList(req, res, next) {
    try {
      const { page, pageSize, keyword, level } = req.query;
      const data = systemService.getCustomerList({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        keyword,
        level
      });
      res.success(data, '获取客户列表成功');
    } catch (err) {
      next(err);
    }
  },

  async saveCustomer(req, res, next) {
    try {
      const { id, memberNo, name, phone, level, point } = req.body;
      const data = systemService.saveCustomer({
        id: id ? parseInt(id) : undefined,
        memberNo,
        name,
        phone,
        level: level || 'normal',
        point: parseInt(point) || 0
      });
      res.success(data, id ? '客户更新成功' : '客户创建成功');
    } catch (err) {
      next(err);
    }
  },

  async deleteCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const data = systemService.deleteCustomer(parseInt(id));
      res.success(data, '客户删除成功');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = systemController;
