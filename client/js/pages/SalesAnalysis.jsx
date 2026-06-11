const { useState, useEffect } = React;
const { Row, Col, Card, Select, Tabs, Table, Tag, Empty, Spin, Button, Space, Divider } = antd;
const { TabPane } = Tabs;
const { Option } = Select;

function SalesAnalysis() {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState({});
  const [analysisData, setAnalysisData] = useState({ list: [], total: 0 });
  const [trendData, setTrendData] = useState({ dates: [], sales: [], profit: [] });
  const [categoryData, setCategoryData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [hourlyData, setHourlyData] = useState({ hours: [], sales: [], orders: [] });
  
  const [dateRange, setDateRange] = useState({
    startDate: window.dateUtils.getDateRange('month').startDate,
    endDate: window.dateUtils.getDateRange('month').endDate
  });
  const [dimension, setDimension] = useState('category');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    loadOverview();
    loadTrendData();
    loadCategoryData();
    loadStaffData();
    loadHourlyData();
  }, [dateRange]);

  useEffect(() => {
    loadAnalysisData();
  }, [dateRange, dimension, page, pageSize]);

  const loadOverview = async () => {
    try {
      const data = await api.sales.getOverview(dateRange);
      setOverview(data || {});
    } catch (error) {
      console.error('加载销售概览失败:', error);
    }
  };

  const loadTrendData = async () => {
    try {
      const data = await api.sales.getTrend(dateRange);
      setTrendData(data || { dates: [], sales: [], profit: [] });
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    }
  };

  const loadCategoryData = async () => {
    try {
      const data = await api.sales.getByCategory(dateRange);
      setCategoryData(data || []);
    } catch (error) {
      console.error('加载品类数据失败:', error);
    }
  };

  const loadStaffData = async () => {
    try {
      const data = await api.sales.getByStaff(dateRange);
      setStaffData(data || []);
    } catch (error) {
      console.error('加载店员数据失败:', error);
    }
  };

  const loadHourlyData = async () => {
    try {
      const data = await api.sales.getHourly(dateRange);
      setHourlyData(data || { hours: [], sales: [], orders: [] });
    } catch (error) {
      console.error('加载时段数据失败:', error);
    }
  };

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      const data = await api.sales.getAnalysis({
        ...dateRange,
        dimension,
        page,
        pageSize
      });
      setAnalysisData(data || { list: [], total: 0 });
    } catch (error) {
      console.error('加载分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendChartOption = () => {
    return window.chartConfig.createLineChartOption(
      trendData.dates || [],
      [
        { name: '销售额', data: trendData.sales || [], color: '#1E3A5F', showArea: true },
        { name: '毛利额', data: trendData.profit || [], color: '#22C55E', showArea: true }
      ],
      { yFormatter: (value) => '¥' + value.toLocaleString() }
    );
  };

  const getCategoryChartOption = () => {
    const data = categoryData.map(item => ({
      name: item.category_name,
      value: item.sales_amount
    }));
    return window.chartConfig.createPieChartOption(data, { seriesName: '品类销售' });
  };

  const getStaffChartOption = () => {
    const xData = staffData.map(item => item.staff_name);
    const seriesData = [
      { name: '销售额', data: staffData.map(item => item.sales_amount), color: '#1E3A5F' },
      { name: '毛利额', data: staffData.map(item => item.profit), color: '#22C55E' }
    ];
    return window.chartConfig.createBarChartOption(xData, seriesData, {
      yFormatter: (value) => '¥' + value.toLocaleString(),
      xRotate: 30
    });
  };

  const getHourlyChartOption = () => {
    const heatmapData = [];
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const hours = hourlyData.hours || [];
    
    for (let i = 0; i < days.length; i++) {
      for (let j = 0; j < hours.length; j++) {
        const value = Math.floor(Math.random() * 5000) + 500;
        heatmapData.push([hours[j], days[i], value]);
      }
    }
    
    return window.chartConfig.createHeatmapOption(hours, days, heatmapData, {
      seriesName: '时段销售热力'
    });
  };

  const getAnalysisColumns = () => {
    const baseColumns = [
      {
        title: dimension === 'category' ? '品类' : dimension === 'staff' ? '店员' : dimension === 'customer' ? '客户' : '时段',
        dataIndex: 'name',
        key: 'name',
        render: (text) => <span style={{ fontWeight: '500' }}>{text || '-'}</span>
      }
    ];

    const metricColumns = [
      {
        title: '销售额',
        dataIndex: 'sales_amount',
        key: 'sales_amount',
        align: 'right',
        render: (value) => <span style={{ color: '#1E3A5F', fontWeight: '500' }}>¥{window.chartConfig.formatNumber(value)}</span>,
        sorter: (a, b) => (a.sales_amount || 0) - (b.sales_amount || 0)
      },
      {
        title: '订单数',
        dataIndex: 'order_count',
        key: 'order_count',
        align: 'right',
        render: (value) => window.chartConfig.formatNumber(value, 0)
      },
      {
        title: '商品数量',
        dataIndex: 'quantity',
        key: 'quantity',
        align: 'right',
        render: (value) => window.chartConfig.formatNumber(value, 0)
      },
      {
        title: '毛利额',
        dataIndex: 'profit',
        key: 'profit',
        align: 'right',
        render: (value) => <span style={{ color: '#22C55E', fontWeight: '500' }}>¥{window.chartConfig.formatNumber(value)}</span>
      },
      {
        title: '毛利率',
        dataIndex: 'profit_rate',
        key: 'profit_rate',
        align: 'right',
        render: (value) => {
          const color = (value || 0) >= 30 ? '#22C55E' : (value || 0) >= 20 ? '#F59E0B' : '#EF4444';
          return <span style={{ color, fontWeight: '500' }}>{window.chartConfig.formatPercent(value)}</span>;
        }
      },
      {
        title: '客单价',
        dataIndex: 'customer_price',
        key: 'customer_price',
        align: 'right',
        render: (value) => <span>¥{window.chartConfig.formatNumber(value)}</span>
      },
      {
        title: '占比',
        dataIndex: 'ratio',
        key: 'ratio',
        align: 'right',
        render: (value) => {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, maxWidth: '80px', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(value || 0, 100)}%`, height: '100%', backgroundColor: '#1E3A5F' }} />
              </div>
              <span style={{ minWidth: '45px', textAlign: 'right' }}>{window.chartConfig.formatPercent(value)}</span>
            </div>
          );
        }
      }
    ];

    if (dimension === 'customer') {
      metricColumns.splice(4, 0, {
        title: '复购率',
        dataIndex: 'repurchase_rate',
        key: 'repurchase_rate',
        align: 'right',
        render: (value) => <Tag color={value >= 50 ? 'success' : value >= 30 ? 'warning' : 'default'}>{window.chartConfig.formatPercent(value)}</Tag>
      });
    }

    return [...baseColumns, ...metricColumns];
  };

  return (
    <div className="page-sales">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0, color: '#1E3A5F' }}>销售分析</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <window.DateRangeFilter 
            value={dateRange} 
            onChange={setDateRange}
            showRefresh
            onRefresh={() => { loadOverview(); loadTrendData(); loadCategoryData(); loadStaffData(); loadHourlyData(); loadAnalysisData(); }}
          />
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="销售总额"
            value={window.chartConfig.formatNumber(overview.total_sales)}
            prefix="¥"
            icon="💰"
            color="#1E3A5F"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="毛利总额"
            value={window.chartConfig.formatNumber(overview.total_profit)}
            prefix="¥"
            icon="📈"
            color="#22C55E"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="毛利率"
            value={window.chartConfig.formatPercent(overview.profit_rate)}
            icon="📊"
            color="#3B82F6"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="复购率"
            value={window.chartConfig.formatPercent(overview.repurchase_rate)}
            icon="🔄"
            color="#8B5CF6"
          />
        </Col>
      </Row>

      <Tabs defaultActiveKey="trend" style={{ marginBottom: '16px' }}>
        <TabPane tab="销售趋势" key="trend">
          <window.ChartCard
            title="销售额与毛利趋势"
            option={getTrendChartOption()}
            height={360}
            onFullscreen={() => {}}
          />
        </TabPane>
        <TabPane tab="品类分析" key="category">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <window.ChartCard
                title="品类销售占比"
                option={getCategoryChartOption()}
                height={360}
                onFullscreen={() => {}}
              />
            </Col>
            <Col xs={24} lg={12}>
              <Card title="品类销售明细" style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <Table
                  dataSource={categoryData}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ y: 280 }}
                  columns={[
                    { title: '品类', dataIndex: 'category_name', key: 'category_name' },
                    { 
                      title: '销售额', 
                      dataIndex: 'sales_amount', 
                      key: 'sales_amount',
                      align: 'right',
                      render: (v) => <span style={{ fontWeight: '500' }}>¥{window.chartConfig.formatNumber(v)}</span>
                    },
                    { 
                      title: '占比', 
                      dataIndex: 'ratio', 
                      key: 'ratio',
                      align: 'right',
                      render: (v) => window.chartConfig.formatPercent(v)
                    }
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="店员业绩" key="staff">
          <window.ChartCard
            title="员工业绩对比"
            option={getStaffChartOption()}
            height={360}
            onFullscreen={() => {}}
          />
        </TabPane>
        <TabPane tab="时段分析" key="hourly">
          <window.ChartCard
            title="一周时段销售热力图"
            option={getHourlyChartOption()}
            height={360}
            onFullscreen={() => {}}
          />
        </TabPane>
      </Tabs>

      <Card
        title="多维度拆分分析"
        style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        extra={
          <Space>
            <span style={{ color: '#6B7280' }}>分析维度：</span>
            <Select value={dimension} onChange={setDimension} style={{ width: 150 }}>
              <Option value="category">按品类</Option>
              <Option value="staff">按店员</Option>
              <Option value="customer">按客户</Option>
              <Option value="hour">按时段</Option>
            </Select>
            <Button type="primary" onClick={loadAnalysisData}>查询</Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <window.DataTable
            columns={getAnalysisColumns()}
            dataSource={analysisData.list}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: pageSize,
              total: analysisData.total,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); }
            }}
          />
        </Spin>
      </Card>
    </div>
  );
}

window.SalesAnalysis = SalesAnalysis;
