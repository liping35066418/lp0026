const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

router.get('/config', systemController.getConfigList);
router.get('/config/:key', systemController.getConfig);
router.post('/config', systemController.setConfig);
router.delete('/config/:key', systemController.deleteConfig);

router.get('/users', systemController.getUserList);
router.post('/users', systemController.saveUser);
router.delete('/users/:id', systemController.deleteUser);

router.get('/categories', systemController.getCategoryList);
router.get('/categories/tree', systemController.getCategoryTree);
router.post('/categories', systemController.saveCategory);
router.delete('/categories/:id', systemController.deleteCategory);

router.get('/products', systemController.getProductList);
router.post('/products', systemController.saveProduct);
router.delete('/products/:id', systemController.deleteProduct);

router.get('/staff', systemController.getStaffList);
router.post('/staff', systemController.saveStaff);
router.delete('/staff/:id', systemController.deleteStaff);

router.get('/customers', systemController.getCustomerList);
router.post('/customers', systemController.saveCustomer);
router.delete('/customers/:id', systemController.deleteCustomer);

module.exports = router;
