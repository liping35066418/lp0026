const { db } = require('../models/db');
const dayjs = require('dayjs');

function getConfigList() {
  const list = db.prepare('SELECT * FROM sys_config ORDER BY id').all();
  return list;
}

function getConfig(key) {
  const config = db.prepare('SELECT * FROM sys_config WHERE config_key = ?').get(key);
  return config ? config.config_value : null;
}

function setConfig(key, value, description = '') {
  const existing = db.prepare('SELECT * FROM sys_config WHERE config_key = ?').get(key);
  
  if (existing) {
    db.prepare(`UPDATE sys_config SET 
      config_value = ?, 
      description = ?, 
      updated_at = ? 
      WHERE config_key = ?`).run(value, description, dayjs().format('YYYY-MM-DD HH:mm:ss'), key);
  } else {
    db.prepare(`INSERT INTO sys_config 
      (config_key, config_value, description) 
      VALUES (?, ?, ?)`).run(key, value, description);
  }
  
  return { key, value };
}

function deleteConfig(key) {
  db.prepare('DELETE FROM sys_config WHERE config_key = ?').run(key);
  return { success: true };
}

function getUserList(params = {}) {
  const { page = 1, pageSize = 20, keyword, role, status } = params;
  const offset = (page - 1) * pageSize;
  
  let whereSql = 'WHERE 1=1';
  const countParams = [];
  const queryParams = [];
  
  if (keyword) {
    whereSql += ' AND (username LIKE ? OR name LIKE ?)';
    const search = `%${keyword}%`;
    countParams.push(search, search);
    queryParams.push(search, search);
  }
  
  if (role) {
    whereSql += ' AND role = ?';
    countParams.push(role);
    queryParams.push(role);
  }
  
  if (status !== undefined) {
    whereSql += ' AND status = ?';
    countParams.push(status);
    queryParams.push(status);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM sys_user ${whereSql}`;
  const querySql = `SELECT id, username, name, role, status, created_at FROM sys_user ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`;
  
  queryParams.push(pageSize, offset);
  
  const total = db.prepare(countSql).get(...countParams).total;
  const list = db.prepare(querySql).all(...queryParams);
  
  return { list, total, page, pageSize };
}

function saveUser(params) {
  const { id, username, password, name, role, status = 1 } = params;
  
  if (id) {
    const updateFields = ['name = ?', 'role = ?', 'status = ?'];
    const updateValues = [name, role, status];
    
    if (password) {
      updateFields.push('password = ?');
      updateValues.push(password);
    }
    
    updateValues.push(id);
    
    db.prepare(`UPDATE sys_user SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);
    return { id };
  } else {
    const existing = db.prepare('SELECT * FROM sys_user WHERE username = ?').get(username);
    if (existing) throw new Error('Username already exists');
    
    const result = db.prepare(`INSERT INTO sys_user 
      (username, password, name, role, status) 
      VALUES (?, ?, ?, ?, ?)`).run(username, password, name, role, status);
    return { id: result.lastInsertRowid };
  }
}

function deleteUser(id) {
  db.prepare('DELETE FROM sys_user WHERE id = ?').run(id);
  return { success: true };
}

function getCategoryList(params = {}) {
  const { parentId, status } = params;
  
  let whereSql = 'WHERE 1=1';
  const paramsArr = [];
  
  if (parentId !== undefined) {
    whereSql += ' AND parent_id = ?';
    paramsArr.push(parentId);
  }
  
  if (status !== undefined) {
    whereSql += ' AND status = ?';
    paramsArr.push(status);
  }
  
  const sql = `SELECT * FROM category ${whereSql} ORDER BY sort_order, id`;
  const list = db.prepare(sql).all(...paramsArr);
  
  return list;
}

function getCategoryTree() {
  const allCategories = db.prepare('SELECT * FROM category WHERE status = 1 ORDER BY sort_order, id').all();
  
  const buildTree = (parentId = 0) => {
    return allCategories
      .filter(c => c.parent_id === parentId)
      .map(c => ({
        ...c,
        children: buildTree(c.id)
      }));
  };
  
  return buildTree(0);
}

function saveCategory(params) {
  const { id, name, parentId = 0, sortOrder = 0, status = 1 } = params;
  
  if (id) {
    db.prepare(`UPDATE category SET 
      name = ?, parent_id = ?, sort_order = ?, status = ? 
      WHERE id = ?`).run(name, parentId, sortOrder, status, id);
    return { id };
  } else {
    const result = db.prepare(`INSERT INTO category 
      (name, parent_id, sort_order, status) 
      VALUES (?, ?, ?, ?)`).run(name, parentId, sortOrder, status);
    return { id: result.lastInsertRowid };
  }
}

function deleteCategory(id) {
  const hasChildren = db.prepare('SELECT COUNT(*) as count FROM category WHERE parent_id = ?').get(id).count > 0;
  if (hasChildren) throw new Error('Cannot delete category with children');
  
  const hasProducts = db.prepare('SELECT COUNT(*) as count FROM product WHERE category_id = ?').get(id).count > 0;
  if (hasProducts) throw new Error('Cannot delete category with products');
  
  db.prepare('DELETE FROM category WHERE id = ?').run(id);
  return { success: true };
}

function getProductList(params = {}) {
  const { page = 1, pageSize = 20, keyword, categoryId, status } = params;
  const offset = (page - 1) * pageSize;
  
  let whereSql = 'WHERE 1=1';
  const countParams = [];
  const queryParams = [];
  
  if (keyword) {
    whereSql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
    const search = `%${keyword}%`;
    countParams.push(search, search, search);
    queryParams.push(search, search, search);
  }
  
  if (categoryId) {
    whereSql += ' AND p.category_id = ?';
    countParams.push(categoryId);
    queryParams.push(categoryId);
  }
  
  if (status !== undefined) {
    whereSql += ' AND p.status = ?';
    countParams.push(status);
    queryParams.push(status);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM product p ${whereSql}`;
  const querySql = `SELECT p.*, c.name as category_name 
    FROM product p 
    LEFT JOIN category c ON p.category_id = c.id 
    ${whereSql} 
    ORDER BY p.id DESC 
    LIMIT ? OFFSET ?`;
  
  queryParams.push(pageSize, offset);
  
  const total = db.prepare(countSql).get(...countParams).total;
  const list = db.prepare(querySql).all(...queryParams);
  
  return { list, total, page, pageSize };
}

function saveProduct(params) {
  const { 
    id, sku, barcode, name, categoryId, spec, unit, 
    costPrice, salePrice, warningThreshold = 10, 
    expireDaysWarning = 30, slowMovingDays = 90, status = 1 
  } = params;
  
  if (id) {
    db.prepare(`UPDATE product SET 
      sku = ?, barcode = ?, name = ?, category_id = ?, spec = ?, unit = ?,
      cost_price = ?, sale_price = ?, warning_threshold = ?, 
      expire_days_warning = ?, slow_moving_days = ?, status = ?,
      updated_at = ? 
      WHERE id = ?`).run(
        sku, barcode, name, categoryId, spec, unit,
        costPrice, salePrice, warningThreshold,
        expireDaysWarning, slowMovingDays, status,
        dayjs().format('YYYY-MM-DD HH:mm:ss'), id
      );
    return { id };
  } else {
    const existing = db.prepare('SELECT * FROM product WHERE sku = ?').get(sku);
    if (existing) throw new Error('SKU already exists');
    
    const result = db.prepare(`INSERT INTO product 
      (sku, barcode, name, category_id, spec, unit, 
       cost_price, sale_price, warning_threshold, 
       expire_days_warning, slow_moving_days, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        sku, barcode, name, categoryId, spec, unit,
        costPrice, salePrice, warningThreshold,
        expireDaysWarning, slowMovingDays, status
      );
    
    db.prepare(`INSERT INTO inventory 
      (product_id, sku, quantity, available_qty, avg_cost_price, total_cost_amount, alert_status) 
      VALUES (?, ?, 0, 0, ?, 0, 'normal')`).run(result.lastInsertRowid, sku, costPrice);
    
    return { id: result.lastInsertRowid };
  }
}

function deleteProduct(id) {
  const hasInventory = db.prepare('SELECT COUNT(*) as count FROM inventory WHERE product_id = ? AND quantity > 0').get(id).count > 0;
  if (hasInventory) throw new Error('Cannot delete product with inventory');
  
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM inventory WHERE product_id = ?').run(id);
    db.prepare('DELETE FROM product WHERE id = ?').run(id);
  });
  
  tx();
  return { success: true };
}

function getStaffList(params = {}) {
  const { page = 1, pageSize = 20, keyword, role, status } = params;
  const offset = (page - 1) * pageSize;
  
  let whereSql = 'WHERE 1=1';
  const countParams = [];
  const queryParams = [];
  
  if (keyword) {
    whereSql += ' AND (name LIKE ? OR staff_no LIKE ? OR phone LIKE ?)';
    const search = `%${keyword}%`;
    countParams.push(search, search, search);
    queryParams.push(search, search, search);
  }
  
  if (role) {
    whereSql += ' AND role = ?';
    countParams.push(role);
    queryParams.push(role);
  }
  
  if (status !== undefined) {
    whereSql += ' AND status = ?';
    countParams.push(status);
    queryParams.push(status);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM staff ${whereSql}`;
  const querySql = `SELECT * FROM staff ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`;
  
  queryParams.push(pageSize, offset);
  
  const total = db.prepare(countSql).get(...countParams).total;
  const list = db.prepare(querySql).all(...queryParams);
  
  return { list, total, page, pageSize };
}

function saveStaff(params) {
  const { id, staffNo, name, role, phone, status = 1 } = params;
  
  if (id) {
    db.prepare(`UPDATE staff SET 
      staff_no = ?, name = ?, role = ?, phone = ?, status = ? 
      WHERE id = ?`).run(staffNo, name, role, phone, status, id);
    return { id };
  } else {
    const existing = db.prepare('SELECT * FROM staff WHERE staff_no = ?').get(staffNo);
    if (existing) throw new Error('Staff No already exists');
    
    const result = db.prepare(`INSERT INTO staff 
      (staff_no, name, role, phone, status) 
      VALUES (?, ?, ?, ?, ?)`).run(staffNo, name, role, phone, status);
    return { id: result.lastInsertRowid };
  }
}

function deleteStaff(id) {
  db.prepare('DELETE FROM staff WHERE id = ?').run(id);
  return { success: true };
}

function getCustomerList(params = {}) {
  const { page = 1, pageSize = 20, keyword, level } = params;
  const offset = (page - 1) * pageSize;
  
  let whereSql = 'WHERE 1=1';
  const countParams = [];
  const queryParams = [];
  
  if (keyword) {
    whereSql += ' AND (name LIKE ? OR member_no LIKE ? OR phone LIKE ?)';
    const search = `%${keyword}%`;
    countParams.push(search, search, search);
    queryParams.push(search, search, search);
  }
  
  if (level) {
    whereSql += ' AND level = ?';
    countParams.push(level);
    queryParams.push(level);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM customer ${whereSql}`;
  const querySql = `SELECT * FROM customer ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`;
  
  queryParams.push(pageSize, offset);
  
  const total = db.prepare(countSql).get(...countParams).total;
  const list = db.prepare(querySql).all(...queryParams);
  
  return { list, total, page, pageSize };
}

function saveCustomer(params) {
  const { id, memberNo, name, phone, level = 'normal', point = 0 } = params;
  
  if (id) {
    db.prepare(`UPDATE customer SET 
      member_no = ?, name = ?, phone = ?, level = ?, point = ? 
      WHERE id = ?`).run(memberNo, name, phone, level, point, id);
    return { id };
  } else {
    if (memberNo) {
      const existing = db.prepare('SELECT * FROM customer WHERE member_no = ?').get(memberNo);
      if (existing) throw new Error('Member No already exists');
    }
    
    const result = db.prepare(`INSERT INTO customer 
      (member_no, name, phone, level, point) 
      VALUES (?, ?, ?, ?, ?)`).run(memberNo, name, phone, level, point);
    return { id: result.lastInsertRowid };
  }
}

function deleteCustomer(id) {
  db.prepare('DELETE FROM customer WHERE id = ?').run(id);
  return { success: true };
}

module.exports = {
  getConfigList,
  getConfig,
  setConfig,
  deleteConfig,
  getUserList,
  saveUser,
  deleteUser,
  getCategoryList,
  getCategoryTree,
  saveCategory,
  deleteCategory,
  getProductList,
  saveProduct,
  deleteProduct,
  getStaffList,
  saveStaff,
  deleteStaff,
  getCustomerList,
  saveCustomer,
  deleteCustomer
};
