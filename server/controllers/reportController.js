const reportService = require('../services/reportService');

const reportController = {
  async getTemplateList(req, res, next) {
    try {
      const { reportType, isDefault } = req.query;
      const data = reportService.getTemplateList({
        reportType,
        isDefault: isDefault !== undefined ? isDefault === 'true' : undefined
      });
      res.success(data, '获取报表模板列表成功');
    } catch (err) {
      next(err);
    }
  },

  async saveTemplate(req, res, next) {
    try {
      const { id, name, reportType, metrics, dimensions, filters, layoutConfig, creatorId, isDefault } = req.body;
      
      if (id) {
        const data = reportService.updateTemplate(parseInt(id), {
          name,
          metrics,
          dimensions,
          filters,
          layoutConfig,
          isDefault
        });
        res.success(data, '模板更新成功');
      } else {
        const data = reportService.saveTemplate({
          name,
          reportType,
          metrics,
          dimensions,
          filters,
          layoutConfig,
          creatorId: parseInt(creatorId) || 1,
          isDefault: isDefault ? 1 : 0
        });
        res.success(data, '模板创建成功');
      }
    } catch (err) {
      next(err);
    }
  },

  async deleteTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const data = reportService.deleteTemplate(parseInt(id));
      res.success(data, '模板删除成功');
    } catch (err) {
      next(err);
    }
  },

  async generateReport(req, res, next) {
    try {
      const { templateId, reportType, startDate, endDate, metrics, dimensions, filters } = req.body;
      const data = reportService.generateReport({
        templateId: templateId ? parseInt(templateId) : undefined,
        reportType,
        startDate,
        endDate,
        metrics,
        dimensions,
        filters
      });
      res.success(data, '报表生成成功');
    } catch (err) {
      next(err);
    }
  },

  async exportExcel(req, res, next) {
    try {
      const reportData = req.body;
      const buffer = reportService.exportToExcel(reportData);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="report_${Date.now()}.xlsx"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  },

  async exportPDF(req, res, next) {
    try {
      const reportData = req.body;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report_${Date.now()}.pdf"`);
      
      const stream = reportService.exportToPDF(reportData, res);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  async batchExport(req, res, next) {
    try {
      const { reports, format } = req.body;
      const data = reportService.batchExport({ reports, format });
      
      if (format === 'xlsx') {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="reports_${Date.now()}.zip"`);
      }
      
      res.success(data, '批量导出成功');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = reportController;
