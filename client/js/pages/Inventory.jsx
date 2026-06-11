const { useState, useEffect } = React;
const { Row, Col, Card, Tabs, Table, Tag, Empty, Spin, Button, Space, Input, Select, Modal, Form, InputNumber, DatePicker, message } = antd;
const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

function Inventory() {
  const [loading, setLoading] = useState(false);
  const [flowLoading, setFlowLoading] = useState(false);
  const [inventoryList, setInventoryList] = useState({ list: [], total: 0 });
  const [flowList, setFlowList] = useState({ list: [], total: 0 });
  const [alertList, setAlertList] = useState([]);
  const [stats, setStats] = useState({});
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [flowPage, setFlowPage] = useState(1);
  const [flowPageSize, setFlowPageSize] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [alertType, setAlertType] = useState('');
  const [flowType, setFlowType] = useState('');
  const [flowDateRange, setFlowDateRange] = useState(null);
  const [selectedAlertVisible, setAlertModalVisible] = useState(false);
  const [alertModalVisible, setRecalcModalVisible] = useState(false);

  useEffect(() => {
    loadInventory();
    loadStats();
    loadAlerts();
  }, [page, pageSize, searchKeyword, alertType]);

  useEffect(() => {
    loadFlow();
  }, [flowPage, flowPageSize, flowType, flowDateRange]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await api.inventory.getCurrent({
        page, pageSize, keyword: searchKeyword, alert_type: alertType });
      setInventoryList(data || { list: [], total: 0 });
    } catch (error) {
      console.error('加载库存数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const overview = await api.dashboard.getOverview();
      setStats({
        total_sku: overview.total_sku || 0,
        total_value: overview.total_inventory_value || 0,
        alert_count: overview.alert_count || 0,
        low_stock_count: overview.low_stock_count || 0,
        expiring_count: overview.expiring_count || 0,
        slow_moving_count: overview.slow_moving_count || 0
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadFlow = async () => {
    setFlowLoading(true);
    try {
      const params = { page: flowPage, pageSize: flowPageSize, flow_type: flowType };
      if (flowDateRange && flowDateRange.length === 2 && (params.startDate = flowDateRange[0].format('YYYY-MM-DD'), params.endDate = flowDateRange[1].format('YYYY-MM-DD')));
      const data = await api.inventory.getFlow(params);
      setFlowList(data || { list: [], total: 0 });
    } catch (error) {
      console.error('加载流水数据失败:', error);
    } finally {
      setFlowLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await api.dashboard.getAlerts({ limit: 100 });
      setAlertList(data || []);
    } catch (error) {
      console.error('加载预警数据失败:', error);
    }
  };

  const handleCheckAlerts = async () => {
    try {
      await api.inventory.checkAlerts();
      message.success('预警检查完成');
      loadInventory();
      loadStats();
      loadAlerts();
    } catch (error) {
      message.error('预警检查失败');
    }
  };

  const handleRecalculate = async () => {
    try {
      await api.inventory.calculate({});
      message.success('库存重算完成');
      loadInventory();
      loadStats();
      setRecalcModalVisible(false);
    } catch (error) {
      message.error('库存重算失败');
    }
  };

  const handleRedOffset = async (record) => {
    Modal.confirm({
      title: '确认红冲',
      content: `确定要红冲流水号【${record.flow_no}】吗？红冲后将生成反向流水记录。`,
      onOk: async () => {
        try {
          await api.inventory.redOffset({ flow_id: record.id });
          message.success('红冲成功');
          loadFlow();
          loadInventory();
          loadStats();
        } catch (error) {
          message.error('红冲失败');
        }
      }
    });
  };

  const inventoryColumns = [
    {
      title: '商品编码',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 120,
      render: (text) => <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{text}</code>
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: '500' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{record.category_name}</div>
        </div>
      )
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
      width: 100
    },
    {
      title: '当前库存',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      width: 100,
      render: (value, record) => {
        const color = (value || 0) <= (record.warning_threshold || 10) ? '#EF4444' : '#1F2937';
        return <span style={{ color, fontWeight: '500' }}>{window.chartConfig.formatNumber(value, 0)}</span>;
      },
      sorter: (a, b) => (a.quantity || 0) - (b.quantity || 0)
    },
    {
      title: '预警阈值',
      dataIndex: 'warning_threshold',
      key: 'warning_threshold',
      align: 'right',
      width: 100,
      render: (value) => window.chartConfig.formatNumber(value, 0)
    },
    {
      title: '库存成本',
      dataIndex: 'cost_price',
      key: 'cost_price',
      align: 'right',
      width: 120,
      render: (value) => <span>¥{window.chartConfig.formatNumber(value)}</span>
    },
    {
      title: '库存金额',
      dataIndex: 'total_value',
      key: 'total_value',
      align: 'right',
      width: 120,
      render: (value, record) => <span style={{ fontWeight: '500' }}>¥{window.chartConfig.formatNumber(record.quantity * record.cost_price)}</span>,
      sorter: (a, b) => (a.quantity * a.cost_price) - (b.quantity * b.cost_price)
    },
    {
      title: '最后销售',
      dataIndex: 'last_sale_date',
      key: 'last_sale_date',
      width: 120,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD') : '暂无'
    },
    {
      title: '有效期',
      dataIndex: 'expire_date',
      key: 'expire_date',
      width: 120,
      render: (value) => {
        if (!value) return '-';
        const days = Math.ceil((new Date(value) - new Date()) / (1000 * 60 * 60 * 24));
        const color = days <= 30 ? '#EF4444' : days <= 90 ? '#FF7A45' : '#6B7280';
        return <span style={{ color }}>{dayjs(value).format('YYYY-MM-DD')}</span>;
      }
    },
    {
      title: '预警状态',
      dataIndex: 'alert_status',
      key: 'alert_status',
      width: 100,
      render: (value) => <window.StatusTag status={value} />
    }
  ];

  const flowColumns = [
    {
      title: '流水号',
      dataIndex: 'flow_no',
      key: 'flow_no',
      width: 160,
      render: (text) => <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{text}</code>
    },
    {
      title: '流水类型',
      dataIndex: 'flow_type',
      key: 'flow_type',
      width: 100,
      render: (value) => <window.FlowTypeTag type={value} />
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name'
    },
    {
      title: '变动数量',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      width: 100,
      render: (value, record) => {
        const isOut = ['SALE', 'RETURN', 'ADJUST_DOWN', 'RED_OFFSET'].includes(record.flow_type);
        const color = isOut ? '#EF4444' : '#22C55E';
        const prefix = isOut ? '-' : '+';
        return <span style={{ color, fontWeight: '500' }}>{prefix}{window.chartConfig.formatNumber(Math.abs(value), 0)}</span>;
      }
    },
    {
      title: '变动后库存',
      dataIndex: 'after_quantity',
      key: 'after_quantity',
      align: 'right',
      width: 120,
      render: (value) => window.chartConfig.formatNumber(value, 0)
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      align: 'right',
      width: 100,
      render: (value) => <span>¥{window.chartConfig.formatNumber(value)}</span>
    },
    {
      title: '关联单据',
      dataIndex: 'related_no',
      key: 'related_no',
      width: 140,
      render: (text) => text ? <code style={{ color: '#6B7280' }}>{text}</code> : '-'
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 100
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => {
        if (record.is_red_offset !== 'Y') return <Tag color="default">已红冲</Tag>;
        return (
          <Button type="link" danger onClick={() => handleRedOffset(record)}>
            红冲
          </Button>
        );
      }
    }
  ];

  return (
    <div className="page-inventory">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0, color: '#1E3A5F' }}>库存管理</h2>
        <Space>
          <Button onClick={handleCheckAlerts}>检查预警</Button>
          <Button type="primary" onClick={() => setRecalcModalVisible(true)}>库存重算</Button>
          <Button onClick={() => setAlertModalVisible(true)}>查看预警</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="SKU总数"
            value={window.chartConfig.formatNumber(stats.total_sku, 0)}
            icon="📦"
            color="#1E3A5F"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="库存总值"
            value={window.chartConfig.formatNumber(stats.total_value)}
            prefix="¥"
            icon="💰"
            color="#3B82F6"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="预警商品"
            value={window.chartConfig.formatNumber(stats.alert_count, 0)}
            suffix="个"
            icon="⚠️"
            color="#EF4444"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="临期商品"
            value={window.chartConfig.formatNumber(stats.expiring_count, 0)}
            suffix="个"
            icon="⏰"
            color="#FF7A45"
          />
        </Col>
      </Row>

      <Tabs defaultActiveKey="current">
        <TabPane tab="当前库存" key="current">
          <Card
            style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            extra={
              <Space>
                <Search
                  placeholder="搜索商品名称/编码"
                  allowClear
                  style={{ width: 250
                }}
                onSearch={(value) => { setSearchKeyword(value); setPage(1); }}
              />
              <Select
                placeholder="预警状态"
                allowClear
                style={{ width: 150 }}
                onChange={(value) => { setAlertType(value); setPage(1); }}
              >
                <Option value="low_stock">库存不足</Option>
                <Option value="expiring">即将过期</Option>
                <Option value="slow_moving">滞销商品</Option>
                <Option value="overstock">库存积压</Option>
                <Option value="normal">正常</Option>
              </Select>
            </Space>
          }
        >
          <Spin spinning={loading}>
            <window.DataTable
              columns={inventoryColumns}
              dataSource={inventoryList.list}
              rowKey="id"
              scroll={{ x: 1300 }}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: inventoryList.total,
                onChange: (p, ps) => { setPage(p); setPageSize(ps); }
              }}
            />
          </Spin>
        </Card>
      </TabPane>
      <TabPane tab="出入库流水" key="flow">
        <Card
          style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          extra={
            <Space wrap>
              <RangePicker
                onChange={(dates) => { setFlowDateRange(dates); setFlowPage(1); }}
              />
              <Select
                placeholder="流水类型"
                allowClear
                style={{ width: 150 }}
                onChange={(value) => { setFlowType(value); setFlowPage(1); }}
              >
                <Option value="PURCHASE_IN">采购入库</Option>
                <Option value="SALE">销售出库</Option>
                <Option value="SALE_RETURN">销售退货</Option>
                <Option value="PURCHASE_RETURN">采购退货</Option>
                <Option value="STOCKTAKE">盘点调整</Option>
                <Option value="ADJUST_UP">库存增加</Option>
                <Option value="ADJUST_DOWN">库存减少</Option>
              </Select>
            </Space>
          }
        >
          <Spin spinning={flowLoading}>
            <window.DataTable
              columns={flowColumns}
              dataSource={flowList.list}
              rowKey="id"
              scroll={{ x: 1400 }}
              pagination={{
                current: flowPage,
                pageSize: flowPageSize,
                total: flowList.total,
                onChange: (p, ps) => { setFlowPage(p); setFlowPageSize(ps); }
              }}
            />
          </Spin>
        </Card>
      </TabPane>
      </Tabs>

      <Modal
        title="库存预警列表"
        open={alertModalVisible}
        width={800}
        onCancel={() => setAlertModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAlertModalVisible(false)}>关闭</Button>
        ]}
      >
        <window.AlertList
          alerts={alertList}
          loading={false}
          showTitle={false}
        />
      </Modal>

      <Modal
        title="确认库存重算"
        open={recalcModalVisible}
        onCancel={() => setRecalcModalVisible(false)}
        onOk={handleRecalculate}
        okText="确认重算"
        okButtonProps={{ danger: true }}
      >
        <p>库存重算将根据出入库流水重新计算所有商品的当前库存和加权平均成本。</p>
        <p style={{ color: '#EF4444' }}>⚠️ 此操作会重新计算库存数据，请确认后无法撤销。</p>
      </Modal>
    </div>
  );
}

window.Inventory = Inventory;
