const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

router.post('/order', purchaseController.createOrder);
router.get('/order', purchaseController.getOrderList);
router.get('/order/:id', purchaseController.getOrderDetail);
router.post('/order/:id/warehouse', purchaseController.confirmWarehouse);
router.post('/order/:id/return', purchaseController.purchaseReturn);

router.get('/supplier', purchaseController.getSupplierList);
router.post('/supplier', purchaseController.saveSupplier);
router.delete('/supplier/:id', purchaseController.deleteSupplier);

module.exports = router;
