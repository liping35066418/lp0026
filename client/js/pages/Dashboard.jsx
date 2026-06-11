const { useState, useEffect } = React;
const { Row, Col, Card, Tag, List, Empty, Spin } = antd;

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({});
  const [trendData, setTrendData] = useState({ dates: [], sales: [], orders: [] });
  const [alerts, setAlerts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: window.dateUtils.getDateRange('today').startDate,
    endDate: window.dateUtils.getDateRange('today').endDate
  });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, trendsData, alertsData, topData, categorySalesData] = await Promise.all([
        api.dashboard.getOverview(dateRange),
        api.dashboard.getTrends(dateRange),
        api.dashboard.getAlerts({ limit: 10 }),
        api.dashboard.getTopProducts({ limit: 10, ...dateRange }),
        api.dashboard.getCategorySales(dateRange)
      ]);
      
      const salesTrend = ((overviewData?.today?.totalSales || 0) - (overviewData?.yesterday?.totalSales || 0)) / (overviewData?.yesterday?.totalSales || 1) * 100;
      const ordersTrend = ((overviewData?.today?.orderCount || 0) - (overviewData?.yesterday?.orderCount || 0)) / (overviewData?.yesterday?.orderCount || 1) * 100;
      const priceTrend = 0;
      
      setOverview({
        total_sales: overviewData?.sales?.totalSales || 0,
        total_profit: overviewData?.sales?.totalProfit || 0,
        total_orders: overviewData?.sales?.orderCount || 0,
        customer_price: overviewData?.sales?.customerPrice || 0,
        alert_count: overviewData?.inventory?.alertCount || 0,
        sales_trend: salesTrend >= 0 ? 'up' : 'down',
        sales_trend_value: Math.abs(salesTrend).toFixed(1),
        orders_trend: ordersTrend >= 0 ? 'up' : 'down',
        orders_trend_value: Math.abs(ordersTrend).toFixed(1),
        price_trend: priceTrend >= 0 ? 'up' : 'down',
        price_trend_value: Math.abs(priceTrend).toFixed(1),
        today_sales: overviewData?.today?.totalSales || 0,
        yesterday_sales: overviewData?.yesterday?.totalSales || 0
      });
      
      const trendDates = trendsData?.sales?.map(item => item.period) || [];
      const trendSales = trendsData?.sales?.map(item => item.sales_amount) || [];
      const trendOrders = trendsData?.sales?.map(item => item.order_count) || [];
      setTrendData({ dates: trendDates, sales: trendSales, orders: trendOrders });
      
      setAlerts(alertsData?.list || []);
      setTopProducts(topData?.list || []);
      setCategoryData(categorySalesData?.list || []);
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendChartOption = () => {
    return window.chartConfig.createLineChartOption(
      trendData.dates || [],
      [
        {
          name: '销售额',
          data: trendData.sales || [],
          color: '#1E3A5F',
          showArea: true
        },
        {
          name: '订单数',
          data: trendData.orders || [],
          color: '#3B82F6',
          showArea: false
        }
      ],
      {
        yFormatter: (value) => '¥' + value.toLocaleString()
      }
    );
  };

  const getCategoryChartOption = () => {
    const data = Array.isArray(categoryData) ? categoryData.map(item => ({
      name: item.category_name,
      value: item.sales_amount
    })) : [];
    return window.chartConfig.createPieChartOption(data, {
      seriesName: '品类销售'
    });
  };

  const getAlertIcon = (type) => {
    const icons = {
      low_stock: '⚠️',
      expiring: '⏰',
      slow_moving: '📉',
      overstock: '📦'
    };
    return icons[type] || '📋';
  };

  const getAlertText = (type) => {
    const texts = {
      low_stock: '库存不足',
      expiring: '即将过期',
      slow_moving: '滞销商品',
      overstock: '库存积压'
    };
    return texts[type] || '预警';
  };

  const getAlertColor = (type) => {
    const colors = {
      low_stock: '#EF4444',
      expiring: '#FF7A45',
      slow_moving: '#F59E0B',
      overstock: '#8B5CF6'
    };
    return colors[type] || '#6B7280';
  };

  return (
    <div className="page-dashboard">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#1E3A5F' }}>数据仪表盘</h2>
        <window.DateRangeFilter 
          value={dateRange} 
          onChange={setDateRange}
          showRefresh
          onRefresh={loadData}
        />
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <window.StatCard
              title="销售总额"
              value={window.chartConfig.formatNumber(overview.total_sales)}
              prefix="¥"
              trend={overview.sales_trend}
              trendValue={overview.sales_trend_value}
              description="较上期"
              icon="💰"
              color="#1E3A5F"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <window.StatCard
              title="订单总数"
              value={window.chartConfig.formatNumber(overview.total_orders, 0)}
              trend={overview.orders_trend}
              trendValue={overview.orders_trend_value}
              description="较上期"
              icon="📋"
              color="#3B82F6"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <window.StatCard
              title="客单价"
              value={window.chartConfig.formatNumber(overview.customer_price)}
              prefix="¥"
              trend={overview.price_trend}
              trendValue={overview.price_trend_value}
              description="较上期"
              icon="🛒"
              color="#22C55E"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <window.StatCard
              title="库存预警"
              value={overview.alert_count || 0}
              suffix="个"
              icon="⚠️"
              color="#EF4444"
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24} lg={16}>
            <window.ChartCard
              title="销售趋势"
              option={getTrendChartOption()}
              height={320}
              loading={loading}
              onFullscreen={() => {}}
            />
          </Col>
          <Col xs={24} lg={8}>
            <window.ChartCard
              title="品类销售占比"
              option={getCategoryChartOption()}
              height={320}
              loading={loading}
              onFullscreen={() => {}}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24} lg={12}>
            <Card
              title="热销商品TOP10"
              style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            >
              {topProducts.length > 0 ? (
                <List
                  dataSource={topProducts}
                  renderItem={(item, index) => (
                    <List.Item key={item.id}>
                      <List.Item.Meta
                        avatar={
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: index < 3 ? '#FF7A45' : '#E5E7EB',
                            color: index < 3 ? '#fff' : '#6B7280',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}>
                            {index + 1}
                          </span>
                        }
                        title={item.product_name}
                        description={`销量: ${item.quantity} | 销售额: ¥${window.chartConfig.formatNumber(item.sales_amount)}`}
                      />
                      <Tag color="blue">{item.category_name}</Tag>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <window.AlertList
              alerts={alerts}
              loading={loading}
              title="库存预警提醒"
              maxHeight={360}
            />
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

window.Dashboard = Dashboard;
