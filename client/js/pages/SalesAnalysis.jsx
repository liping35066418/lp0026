const { useState, useEffect, useRef } = React;
const { Row, Col, Card, Select, Tabs, Table, Tag, Empty, Spin, Button, Space, Divider, Breadcrumb, message } = antd;
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
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productData, setProductData] = useState([]);
  const [productTrendData, setProductTrendData] = useState([]);
  const [drillOverview, setDrillOverview] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  
  const categoryPieRef = useRef(null);
  const productTrendChartRef = useRef(null);
  
  const getDrillLevel = () => {
    if (selectedProduct) return 'product';
    if (selectedCategory) return 'category';
    return 'all';
  };
  
  const getCurrentOverview = () => {
    if (drillOverview && (selectedCategory || selectedProduct)) {
      return drillOverview;
    }
    return overview;
  };
  
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
  
  useEffect(() => {
    if (selectedCategory) {
      loadProductData();
      loadDrillOverview();
    } else {
      setProductData([]);
      setDrillOverview(null);
    }
    setSelectedProduct(null);
    setProductTrendData([]);
  }, [selectedCategory, dateRange]);
  
  useEffect(() => {
    if (selectedProduct) {
      loadProductTrend();
      loadDrillOverview();
    } else {
      setProductTrendData([]);
    }
  }, [selectedProduct, dateRange]);
  
  const loadOverview = async () => {
    try {
      const data = await api.sales.getOverview(dateRange);
      setOverview(data || {});
    } catch (error) {
      console.error('加载销售概览失败:', error);
    }
  };
  
  const loadDrillOverview = async () => {
    setDrillLoading(true);
    try {
      const params = { ...dateRange };
      if (selectedCategory) params.categoryId = selectedCategory.category_id;
      if (selectedProduct) params.productId = selectedProduct.product_id;
      const data = await api.sales.getCategoryDrillOverview(params);
      setDrillOverview(data || {});
    } catch (error) {
      console.error('加载下钻概览失败:', error);
    } finally {
      setDrillLoading(false);
    }
  };
  
  const loadTrendData = async () => {
    try {
      const data = await api.sales.getTrend(dateRange);
      setTrendData({
        dates: data.map(d => d.period),
        sales: data.map(d => d.sales_amount),
        profit: data.map(d => d.profit)
      });
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    }
  };
  
  const loadCategoryData = async () => {
    try {
      const data = await api.sales.getByCategory(dateRange);
      const total = data.reduce((sum, item) => sum + item.sales_amount, 0);
      const dataWithRatio = data.map(item => ({
        ...item,
        ratio: total > 0 ? Number(((item.sales_amount / total) * 100).toFixed(2)) : 0
      }));
      setCategoryData(dataWithRatio || []);
    } catch (error) {
      console.error('加载品类数据失败:', error);
    }
  };
  
  const loadProductData = async () => {
    if (!selectedCategory) return;
    setProductLoading(true);
    try {
      const data = await api.sales.getProductsByCategory({
        ...dateRange,
        categoryId: selectedCategory.category_id
      });
      setProductData(data || []);
    } catch (error) {
      console.error('加载商品数据失败:', error);
    } finally {
      setProductLoading(false);
    }
  };
  
  const loadProductTrend = async () => {
    if (!selectedProduct) return;
    setTrendLoading(true);
    try {
      const data = await api.sales.getProductDailyTrend({
        ...dateRange,
        productId: selectedProduct.product_id
      });
      setProductTrendData(data || []);
    } catch (error) {
      console.error('加载商品趋势失败:', error);
    } finally {
      setTrendLoading(false);
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
      setHourlyData({
        hours: data.map(d => d.hourLabel),
        sales: data.map(d => d.salesAmount),
        orders: data.map(d => d.orderCount)
      });
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
  
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedProduct(null);
  };
  
  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };
  
  const handleBreadcrumbClick = (level) => {
    if (level === 'all') {
      setSelectedCategory(null);
      setSelectedProduct(null);
    } else if (level === 'category') {
      setSelectedProduct(null);
    }
  };
  
  const handleExport = async () => {
    try {
      const params = { ...dateRange };
      if (selectedCategory) params.categoryId = selectedCategory.category_id;
      if (selectedProduct) params.productId = selectedProduct.product_id;
      
      const response = await api.sales.exportCategoryAnalysis(params);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let fileName = '品类分析报表';
      if (selectedCategory) {
        fileName += `_${selectedCategory.category_name}`;
      }
      if (selectedProduct) {
        fileName += `_${selectedProduct.product_name}`;
      }
      fileName += `_${dateRange.startDate}_${dateRange.endDate}.xlsx`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
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
    return {
      ...window.chartConfig.createPieChartOption(data, { seriesName: '品类销售' }),
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      }
    };
  };
  
  const getProductTrendChartOption = () => {
    return window.chartConfig.createLineChartOption(
      productTrendData.map(d => d.date),
      [
        { name: '销售额', data: productTrendData.map(d => d.sales_amount), color: '#1E3A5F', showArea: true },
        { name: '毛利额', data: productTrendData.map(d => d.profit), color: '#22C55E', showArea: true }
      ],
      { yFormatter: (value) => '¥' + value.toLocaleString(), title: `${selectedProduct?.product_name || ''} 日销售趋势` }
    );
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
  
  const renderBreadcrumb = () => {
    const items = [{ title: '全部', onClick: () => handleBreadcrumbClick('all') }];
    if (selectedCategory) {
      items.push({ title: selectedCategory.category_name, onClick: () => handleBreadcrumbClick('category') });
    }
    if (selectedProduct) {
      items.push({ title: selectedProduct.product_name });
    }
    
    return (
      <Breadcrumb style={{ marginBottom: '16px' }}>
        {items.map((item, index) => (
          <Breadcrumb.Item key={index}>
            {item.onClick ? (
              <a onClick={item.onClick} style={{ color: '#1E3A5F' }}>{item.title}</a>
            ) : (
              <span style={{ color: '#6B7280' }}>{item.title}</span>
            )}
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
    );
  };
  
  const renderCategoryAnalysis = () => {
    const currentOverview = getCurrentOverview();
    const isDrilling = selectedCategory || selectedProduct;
    
    return (
      <div>
        <Card 
          title="品类分析" 
          style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '16px' }}
          extra={
            <Space>
              {isDrilling && (
                <Button onClick={() => { setSelectedCategory(null); setSelectedProduct(null); }}>
                  返回全量
                </Button>
              )}
              <Button type="primary" onClick={handleExport}>
                导出报表
              </Button>
            </Space>
          }
        >
          <Spin spinning={drillLoading}>
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} sm={12} lg={6}>
                <window.StatCard
                  title="销售总额"
                  value={window.chartConfig.formatNumber(currentOverview.total_sales)}
                  prefix="¥"
                  icon="💰"
                  color="#1E3A5F"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <window.StatCard
                  title="毛利总额"
                  value={window.chartConfig.formatNumber(currentOverview.total_profit)}
                  prefix="¥"
                  icon="📈"
                  color="#22C55E"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <window.StatCard
                  title="客单价"
                  value={window.chartConfig.formatNumber(currentOverview.customer_price)}
                  prefix="¥"
                  icon="💳"
                  color="#3B82F6"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <window.StatCard
                  title="复购率"
                  value={window.chartConfig.formatPercent(currentOverview.repurchase_rate)}
                  icon="🔄"
                  color="#8B5CF6"
                />
              </Col>
            </Row>
          </Spin>
          
          {isDrilling && renderBreadcrumb()}
          
          <Row gutter={[16, 16]}>
            {!selectedCategory && (
              <>
                <Col xs={24} lg={12}>
                  <Card 
                    title="品类销售占比" 
                    size="small"
                    style={{ borderRadius: '8px' }}
                    extra={<span style={{ fontSize: '12px', color: '#6B7280' }}>点击饼图查看商品明细</span>}
                  >
                    <div
                      ref={categoryPieRef}
                      style={{ width: '100%', height: '360px' }}
                      onClick={(e) => {
                        if (e.target && e.target.getAttribute && e.target.getAttribute('data-name')) {
                          const categoryName = e.target.getAttribute('data-name');
                          const category = categoryData.find(c => c.category_name === categoryName);
                          if (category) handleCategoryClick(category);
                        }
                      }}
                    >
                      <window.ChartCard
                        title=""
                        option={getCategoryChartOption()}
                        height={360}
                        onEvents={{
                          click: (params) => {
                            if (params.name) {
                              const category = categoryData.find(c => c.category_name === params.name);
                              if (category) handleCategoryClick(category);
                            }
                          }
                        }}
                      />
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="品类销售明细" size="small" style={{ borderRadius: '8px' }}>
                    <Table
                      dataSource={categoryData}
                      rowKey="category_id"
                      size="small"
                      pagination={false}
                      scroll={{ y: 300 }}
                      onRow={(record) => ({
                        onClick: () => handleCategoryClick(record),
                        style: { cursor: 'pointer' }
                      })}
                      rowClassName={(record) => 
                        selectedCategory?.category_id === record.category_id 
                          ? 'ant-table-row-selected' 
                          : ''
                      }
                      columns={[
                        { 
                          title: '品类', 
                          dataIndex: 'category_name', 
                          key: 'category_name',
                          render: (text, record) => (
                            <span style={{ 
                              fontWeight: selectedCategory?.category_id === record.category_id ? '600' : '500',
                              color: selectedCategory?.category_id === record.category_id ? '#1E3A5F' : 'inherit'
                            }}>
                              {text}
                            </span>
                          )
                        },
                        { 
                          title: '销售额', 
                          dataIndex: 'sales_amount', 
                          key: 'sales_amount',
                          align: 'right',
                          render: (v) => <span style={{ fontWeight: '500' }}>¥{window.chartConfig.formatNumber(v)}</span>
                        },
                        { 
                          title: '毛利额', 
                          dataIndex: 'profit', 
                          key: 'profit',
                          align: 'right',
                          render: (v) => <span style={{ color: '#22C55E', fontWeight: '500' }}>¥{window.chartConfig.formatNumber(v)}</span>
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
              </>
            )}
            
            {selectedCategory && !selectedProduct && (
              <Col xs={24}>
                <Card 
                  title={`${selectedCategory.category_name} - 商品明细`} 
                  size="small"
                  style={{ borderRadius: '8px' }}
                  extra={<span style={{ fontSize: '12px', color: '#6B7280' }}>点击商品查看日销售趋势</span>}
                >
                  <Spin spinning={productLoading}>
                    {productData.length > 0 ? (
                      <Table
                        dataSource={productData}
                        rowKey="product_id"
                        size="small"
                        pagination={{ pageSize: 10 }}
                        scroll={{ y: 400 }}
                        onRow={(record) => ({
                          onClick: () => handleProductClick(record),
                          style: { cursor: 'pointer' }
                        })}
                        rowClassName={(record) => 
                          selectedProduct?.product_id === record.product_id 
                            ? 'ant-table-row-selected' 
                            : ''
                        }
                        columns={[
                          { 
                            title: '商品编码', 
                            dataIndex: 'sku', 
                            key: 'sku',
                            width: 120,
                            render: (v) => <Tag color="blue">{v}</Tag>
                          },
                          { 
                            title: '商品名称', 
                            dataIndex: 'product_name', 
                            key: 'product_name',
                            render: (text, record) => (
                              <span style={{ 
                                fontWeight: selectedProduct?.product_id === record.product_id ? '600' : '500',
                                color: selectedProduct?.product_id === record.product_id ? '#1E3A5F' : 'inherit'
                              }}>
                                {text}
                              </span>
                            )
                          },
                          { 
                            title: '销售额', 
                            dataIndex: 'sales_amount', 
                            key: 'sales_amount',
                            align: 'right',
                            width: 120,
                            render: (v) => <span style={{ color: '#1E3A5F', fontWeight: '600' }}>¥{window.chartConfig.formatNumber(v)}</span>,
                            sorter: (a, b) => a.sales_amount - b.sales_amount,
                            defaultSortOrder: 'descend'
                          },
                          { 
                            title: '销量', 
                            dataIndex: 'quantity', 
                            key: 'quantity',
                            align: 'right',
                            width: 100,
                            render: (v) => window.chartConfig.formatNumber(v, 0)
                          },
                          { 
                            title: '毛利额', 
                            dataIndex: 'profit', 
                            key: 'profit',
                            align: 'right',
                            width: 120,
                            render: (v) => <span style={{ color: '#22C55E', fontWeight: '500' }}>¥{window.chartConfig.formatNumber(v)}</span>
                          },
                          { 
                            title: '毛利率', 
                            dataIndex: 'profit_rate', 
                            key: 'profit_rate',
                            align: 'right',
                            width: 100,
                            render: (v) => {
                              const color = v >= 30 ? '#22C55E' : v >= 20 ? '#F59E0B' : '#EF4444';
                              return <span style={{ color, fontWeight: '500' }}>{window.chartConfig.formatPercent(v)}</span>;
                            }
                          },
                          { 
                            title: '订单数', 
                            dataIndex: 'order_count', 
                            key: 'order_count',
                            align: 'right',
                            width: 100,
                            render: (v) => window.chartConfig.formatNumber(v, 0)
                          },
                          { 
                            title: '占比', 
                            dataIndex: 'ratio', 
                            key: 'ratio',
                            align: 'right',
                            width: 100,
                            render: (v) => {
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ flex: 1, maxWidth: '60px', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(v || 0, 100)}%`, height: '100%', backgroundColor: '#1E3A5F' }} />
                                  </div>
                                  <span style={{ minWidth: '35px', textAlign: 'right', fontSize: '12px' }}>{window.chartConfig.formatPercent(v)}</span>
                                </div>
                              );
                            }
                          }
                        ]}
                      />
                    ) : (
                      <Empty description="该品类下暂无销售数据" />
                    )}
                  </Spin>
                </Card>
              </Col>
            )}
            
            {selectedProduct && (
              <Col xs={24}>
                <Card 
                  title={`${selectedProduct.product_name} - 日销售趋势`} 
                  size="small"
                  style={{ borderRadius: '8px' }}
                >
                  <Spin spinning={trendLoading}>
                    {productTrendData.length > 0 ? (
                      <div ref={productTrendChartRef}>
                        <window.ChartCard
                          title=""
                          option={getProductTrendChartOption()}
                          height={400}
                        />
                      </div>
                    ) : (
                      <Empty description="该商品暂无销售趋势数据" />
                    )}
                  </Spin>
                </Card>
              </Col>
            )}
          </Row>
        </Card>
      </div>
    );
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
            onRefresh={() => { 
              loadOverview(); 
              loadTrendData(); 
              loadCategoryData(); 
              loadStaffData(); 
              loadHourlyData(); 
              loadAnalysisData();
              if (selectedCategory) {
                loadProductData();
                loadDrillOverview();
              }
              if (selectedProduct) {
                loadProductTrend();
              }
            }}
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

      <Tabs defaultActiveKey="category" style={{ marginBottom: '16px' }}>
        <TabPane tab="销售趋势" key="trend">
          <window.ChartCard
            title="销售额与毛利趋势"
            option={getTrendChartOption()}
            height={360}
            onFullscreen={() => {}}
          />
        </TabPane>
        <TabPane tab="品类分析" key="category">
          {renderCategoryAnalysis()}
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
