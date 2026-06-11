const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/overview', salesController.getOverview);
router.post('/analysis', salesController.getAnalysis);
router.get('/trend', salesController.getTrend);
router.get('/by-category', salesController.getByCategory);
router.get('/by-staff', salesController.getByStaff);
router.get('/detail', salesController.getDetail);
router.get('/hourly', salesController.getHourly);
router.get('/category/products', salesController.getProductsByCategory);
router.get('/product/trend', salesController.getProductDailyTrend);
router.get('/category/drill-overview', salesController.getCategoryDrillOverview);
router.post('/category/export', salesController.exportCategoryAnalysis);

module.exports = router;
