const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/overview', dashboardController.getOverview);
router.get('/trends', dashboardController.getTrends);
router.get('/alerts', dashboardController.getAlerts);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/category-sales', dashboardController.getCategorySales);
router.post('/refresh-alerts', dashboardController.refreshAlerts);

module.exports = router;
