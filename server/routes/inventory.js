const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/current', inventoryController.getInventoryList);
router.get('/flow', inventoryController.getInventoryFlow);
router.post('/calculate', inventoryController.calculateInventory);
router.post('/alert/check', inventoryController.checkAlerts);
router.post('/red-offset', inventoryController.redOffsetFlow);
router.post('/update', inventoryController.updateInventory);

module.exports = router;
