const { useState, useEffect } = React;
const { Row, Col, Card, Tabs, Table, Tag, Empty, Spin, Button, Space, Input, Select, Modal, Form, InputNumber, DatePicker, message, Divider, Checkbox, List, Typography } = antd;
const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;
const { Title, Text } = Typography;

const AVAILABLE_METRICS = [
  { key: 'sales_amount', name: '销售额', category: '销售' },
  { key: 'order_count', name: '订单数', category: '销售' },
  { key: 'quantity', name: '商品数量', category: '销售' },
  { key: 'profit', name: '毛利额', category: '销售' },
  { key: 'profit_rate', name: '毛利率', category: '销售' },
  { key: 'customer_price', name: '客单价', category: '销售' },
  { key: 'repurchase_rate', name: '复购率', category: '销售' },
  { key: 'inventory_quantity', name: '库存数量', category: '库存' },
  { key: 'inventory_value', name: '库存金额', category: '库存' },
  { key: 'cost_price', name: '成本单价', category: '库存' },
  { key: 'purchase_amount', name: '采购金额', category: '采购' },
  { key: 'purchase_quantity', name: '采购数量', category: '采购' }
];

const AVAILABLE_DIMENSIONS = [
  { key: 'date', name: '日期' },
  { key: 'category', name: '品类' },
  { key: 'product', name: '商品' },
  { key: 'staff', name: '店员' },
  { key: 'customer', name: '客户' },
  { key: 'supplier', name: '供应商' },
  { key: 'hour', name: '时段' }
];

function ReportCenter() {
  const [loading, setLoading] = useState(false);
  const [templateList, setTemplateList] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [builderModalVisible, setBuilderModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [builderForm] = Form.useForm();
  
  const [selectedMetrics, setSelectedMetrics] = useState(['sales_amount', 'order_count', 'profit', 'profit_rate']);
  const [selectedDimensions, setSelectedDimensions] = useState(['date', 'category']);
  const [dateRange, setDateRange] = useState({
    startDate: window.dateUtils.getDateRange('month').startDate,
    endDate: window.dateUtils.getDateRange('month').endDate
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.report.getTemplates({ page: 1, pageSize: 100 });
      setTemplateList(data.list || []);
    } catch (error) {
      console.error('加载报表模板失败:', error);
    }
  };

  const handleSaveTemplate = async (values) => {
    try {
      await api.report.saveTemplate({
        ...values,
        metrics: selectedMetrics,
        dimensions: selectedDimensions
      });
      message.success('模板保存成功');
      setTemplateModalVisible(false);
      form.resetFields();
      loadTemplates();
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  };

  const handleGenerateReport = async (template = null) => {
    setLoading(true);
    try {
      const config = template ? template : {
        metrics: selectedMetrics,
        dimensions: selectedDimensions
      };
      const data = await api.report.generateReport({
        ...dateRange,
        metrics: config.metrics,
        dimensions: config.dimensions
      });
      setReportData(data);
      setBuilderModalVisible(false);
    } catch (error) {
      message.error('生成报表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setSelectedMetrics(template.metrics || []);
    setSelectedDimensions(template.dimensions || []);
    setBuilderModalVisible(true);
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.report.exportExcel({
        ...dateRange,
        metrics: selectedMetrics,
        dimensions: selectedDimensions
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `报表_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.report.exportPDF({
        ...dateRange,
        metrics: selectedMetrics,
        dimensions: selectedDimensions
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `报表_${dayjs().format('YYYYMMDDHHmmss')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleBatchExport = async () => {
    try {
      const templateIds = templateList.slice(0, 5).map(t => t.id);
      await api.report.batchExport({
        template_ids: templateIds,
        ...dateRange,
        format: 'excel'
      });
      message.success('批量导出任务已提交，请稍后查看');
    } catch (error) {
      message.error('批量导出失败');
    }
  };

  const handleDeleteTemplate = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此报表模板吗？',
      onOk: async () => {
        try {
          await api.report.deleteTemplate(id);
          message.success('删除成功');
          loadTemplates();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const getMetricLabel = (key) => {
    const metric = AVAILABLE_METRICS.find(m => m.key === key);
    return metric ? metric.name : key;
  };

  const getDimensionLabel = (key) => {
    const dim = AVAILABLE_DIMENSIONS.find(d => d.key === key);
    return dim ? dim.name : key;
  };

  const getReportColumns = () => {
    if (!reportData) return [];
    
    const dimensionCols = (reportData.dimensions || []).map(dim => ({
      title: getDimensionLabel(dim),
      dataIndex: dim,
      key: dim,
      fixed: 'left',
      width: 150,
      render: (text) => <span style={{ fontWeight: '500' }}>{text || '-'}</span>
    }));

    const metricCols = (reportData.metrics || []).map(metric => ({
      title: getMetricLabel(metric),
      dataIndex: metric,
      key: metric,
      align: 'right',
      width: 140,
      render: (value) => {
        if (metric.includes('rate')) {
          return <span style={{ color: '#3B82F6' }}>{window.chartConfig.formatPercent(value)}</span>;
        }
        if (metric.includes('amount') || metric.includes('value') || metric.includes('price') || metric.includes('profit')) {
          return <span style={{ color: '#1E3A5F', fontWeight: '500' }}>¥{window.chartConfig.formatNumber(value)}</span>;
        }
        return window.chartConfig.formatNumber(value, 0);
      }
    }));

    return [...dimensionCols, ...metricCols];
  };

  const metricCategories = [...new Set(AVAILABLE_METRICS.map(m => m.category))];

  return (
    <div className="page-report">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0, color: '#1E3A5F' }}>报表中心</h2>
        <Space>
          <Button onClick={handleBatchExport}>批量导出</Button>
          <Button type="primary" onClick={() => {
            setSelectedTemplate(null);
            setSelectedMetrics(['sales_amount', 'order_count', 'profit', 'profit_rate']);
            setSelectedDimensions(['date', 'category']);
            setBuilderModalVisible(true);
          }}>
            自定义报表
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="报表模板"
            value={templateList.length}
            suffix="个"
            icon="📄"
            color="#1E3A5F"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="可用指标"
            value={AVAILABLE_METRICS.length}
            suffix="个"
            icon="📊"
            color="#3B82F6"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="分析维度"
            value={AVAILABLE_DIMENSIONS.length}
            suffix="个"
            icon="🔍"
            color="#8B5CF6"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="本月导出"
            value={0}
            suffix="次"
            icon="📥"
            color="#22C55E"
          />
        </Col>
      </Row>

      <Tabs defaultActiveKey="templates">
        <TabPane tab="报表模板" key="templates">
          <Card
            style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            extra={
              <Button type="primary" onClick={() => setTemplateModalVisible(true)}>
                保存为模板
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              {templateList.length > 0 ? templateList.map(template => (
                <Col xs={24} sm={12} lg={8} key={template.id}>
                  <Card
                    size="small"
                    hoverable
                    actions={[
                      <Button type="link" onClick={() => handleUseTemplate(template)}>使用</Button>,
                      <Button type="link" danger onClick={() => handleDeleteTemplate(template.id)}>删除</Button>
                    ]}
                    style={{ borderRadius: '8px' }}
                  >
                    <Title level={5} style={{ margin: 0, marginBottom: 8 }}>{template.template_name}</Title>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>指标：</Text>
                      <Space size={4} wrap>
                        {(template.metrics || []).slice(0, 4).map(m => (
                          <Tag key={m} color="blue" style={{ margin: 2, fontSize: '11px' }}>{getMetricLabel(m)}</Tag>
                        ))}
                        {(template.metrics || []).length > 4 && (
                          <Tag style={{ margin: 2, fontSize: '11px' }}>+{(template.metrics || []).length - 4}</Tag>
                        )}
                      </Space>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>维度：</Text>
                      <Space size={4} wrap>
                        {(template.dimensions || []).map(d => (
                          <Tag key={d} color="green" style={{ margin: 2, fontSize: '11px' }}>{getDimensionLabel(d)}</Tag>
                        ))}
                      </Space>
                    </div>
                  </Card>
                </Col>
              )) : (
                <Col span={24}>
                  <Empty description="暂无报表模板，点击上方按钮创建自定义报表" />
                </Col>
              )}
            </Row>
          </Card>
        </TabPane>
        <TabPane tab="报表结果" key="result">
          <Card
            style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            extra={
              reportData && (
                <Space>
                  <Button onClick={handleExportExcel}>导出Excel</Button>
                  <Button onClick={handleExportPDF}>导出PDF</Button>
                </Space>
              )
            }
          >
            <Spin spinning={loading}>
              {reportData ? (
                <>
                  <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 8 }}>
                    <Row gutter={[16, 8]}>
                      <Col span={12}>
                        <Text type="secondary">统计周期：</Text>
                        <Text strong>{dateRange.startDate} 至 {dateRange.endDate}</Text>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">数据条数：</Text>
                        <Text strong>{reportData.total || 0} 条</Text>
                      </Col>
                      <Col span={24}>
                        <Text type="secondary">指标：</Text>
                        <Space size={4}>
                          {(reportData.metrics || []).map(m => (
                            <Tag key={m} color="blue">{getMetricLabel(m)}</Tag>
                          ))}
                        </Space>
                        <Divider type="vertical" />
                        <Text type="secondary">维度：</Text>
                        <Space size={4}>
                          {(reportData.dimensions || []).map(d => (
                            <Tag key={d} color="green">{getDimensionLabel(d)}</Tag>
                          ))}
                        </Space>
                      </Col>
                    </Row>
                  </div>
                  <window.DataTable
                    columns={getReportColumns()}
                    dataSource={reportData.data || []}
                    rowKey={(record, index) => index}
                    scroll={{ x: 1200 }}
                    pagination={{
                      pageSize: 20,
                      showSizeChanger: true
                    }}
                  />
                </>
              ) : (
                <Empty description="请先生成报表或使用报表模板">
                  <Button type="primary" onClick={() => setBuilderModalVisible(true)}>创建报表</Button>
                </Empty>
              )}
            </Spin>
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="保存报表模板"
        open={templateModalVisible}
        width={500}
        onCancel={() => { setTemplateModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveTemplate}>
          <Form.Item name="template_name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="例如：月度销售分析报表" />
          </Form.Item>
          <Form.Item name="description" label="模板说明">
            <Input.TextArea rows={3} placeholder="简要说明此报表的用途" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存模板</Button>
              <Button onClick={() => { setTemplateModalVisible(false); form.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="自定义报表"
        open={builderModalVisible}
        width={900}
        onCancel={() => setBuilderModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBuilderModalVisible(false)}>取消</Button>,
          <Button key="generate" type="primary" onClick={() => handleGenerateReport()} loading={loading}>
            生成报表
          </Button>
        ]}
      >
        <Form form={builderForm} layout="vertical">
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label="统计周期">
                <window.DateRangeFilter
                  value={dateRange}
                  onChange={setDateRange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Card 
                title="选择指标" 
                size="small"
                style={{ height: '400px', overflow: 'auto' }}
                extra={
                  <Button type="text" size="small" onClick={() => setSelectedMetrics([])}>
                    清空
                  </Button>
                }
              >
                {metricCategories.map(category => (
                  <div key={category} style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>{category}指标</Text>
                    <Checkbox.Group
                      value={selectedMetrics}
                      onChange={(values) => setSelectedMetrics(values)}
                    >
                      <Space direction="vertical">
                        {AVAILABLE_METRICS.filter(m => m.category === category).map(metric => (
                          <Checkbox key={metric.key} value={metric.key}>
                            {metric.name}
                          </Checkbox>
                        ))}
                      </Space>
                    </Checkbox.Group>
                  </div>
                ))}
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                title="选择维度" 
                size="small"
                style={{ height: '400px', overflow: 'auto' }}
                extra={
                  <Button type="text" size="small" onClick={() => setSelectedDimensions([])}>
                    清空
                  </Button>
                }
              >
                <Checkbox.Group
                  value={selectedDimensions}
                  onChange={(values) => setSelectedDimensions(values)}
                >
                  <Space direction="vertical">
                    {AVAILABLE_DIMENSIONS.map(dim => (
                      <Checkbox key={dim.key} value={dim.key}>
                        {dim.name}
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              </Card>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

window.ReportCenter = ReportCenter;
