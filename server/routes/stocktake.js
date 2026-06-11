const express = require('express');
const router = express.Router();
const stocktakeController = require('../controllers/stocktakeController');

router.post('/create', stocktakeController.createOrder);
router.get('/order', stocktakeController.getOrderList);
router.get('/order/:id', stocktakeController.getOrderDetail);
router.post('/order/:id/input', stocktakeController.inputActualQty);
router.post('/order/:id/redo', stocktakeController.redoStocktake);
router.post('/order/:id/adjust', stocktakeController.confirmAdjust);
router.post('/order/:id/void', stocktakeController.voidSalesOrder);
router.post('/recalculate', stocktakeController.recalculateInventory);

module.exports = router;
