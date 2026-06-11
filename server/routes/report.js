const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/templates', reportController.getTemplateList);
router.post('/templates', reportController.saveTemplate);
router.delete('/templates/:id', reportController.deleteTemplate);

router.post('/generate', reportController.generateReport);
router.post('/export/excel', reportController.exportExcel);
router.post('/export/pdf', reportController.exportPDF);
router.post('/export/batch', reportController.batchExport);

module.exports = router;
