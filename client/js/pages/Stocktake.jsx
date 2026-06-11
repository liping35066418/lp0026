const { useState, useEffect } = React;
const { Row, Col, Card, Tabs, Table, Tag, Empty, Spin, Button, Space, Input, Select, Modal, Form, InputNumber, DatePicker, message, Divider, Descriptions } = antd;
const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;

function Stocktake() {
  const [loading, setLoading] = useState(false);
  const [orderList, setOrderList] = useState({ list: [], total: 0 });
  const [orderDetail, setOrderDetail] = useState(null);
  const [products, setProducts] = useState([]);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [voidModalVisible, setVoidModalVisible] = useState(false);
  const [redoModalVisible, setRedoModalVisible] = useState(false);
  const [recalcModalVisible, setRecalcModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [inputForm] = Form.useForm();

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, [page, pageSize, status, keyword]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.stocktake.getOrders({
        page, pageSize, status, keyword
      });
      setOrderList(data || { list: [], total: 0 });
    } catch (error) {
      console.error('加载盘点单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await api.system.getProducts({ page: 1, pageSize: 500 });
      setProducts(data.list || []);
    } catch (error) {
      console.error('加载商品失败:', error);
    }
  };

  const loadOrderDetail = async (id) => {
    try {
      const data = await api.stocktake.getOrderDetail(id);
      setOrderDetail(data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('加载单据详情失败');
    }
  };

  const handleCreateOrder = async (values) => {
    try {
      await api.stocktake.createOrder({
        ...values,
        items: products.slice(0, 20).map(p => ({
          product_id: p.id,
          expected_quantity: p.current_quantity || 0
        }))
      });
      message.success('盘点单创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadOrders();
    } catch (error) {
      message.error('创建失败: ' + error.message);
    }
  };

  const handleInputActualQty = async (values) => {
    try {
      const items = orderDetail.items.map((item, index) => ({
        ...item,
        actual_quantity: values[`qty_${index}`] ?? item.expected_quantity
      }));
      await api.stocktake.inputActualQty(orderDetail.id, { items });
      message.success('实盘数量录入成功');
      setInputModalVisible(false);
      loadOrderDetail(orderDetail.id);
      loadOrders();
    } catch (error) {
      message.error('录入失败: ' + error.message);
    }
  };

  const handleRedoStocktake = async () => {
    try {
      await api.stocktake.redoStocktake(orderDetail.id, {});
      message.success('复盘成功');
      setRedoModalVisible(false);
      loadOrderDetail(orderDetail.id);
      loadOrders();
    } catch (error) {
      message.error('复盘失败: ' + error.message);
    }
  };

  const handleConfirmAdjust = async () => {
    Modal.confirm({
      title: '确认库存调整',
      content: '确认后将根据盘点差异调整库存，并生成出入库流水记录。',
      onOk: async () => {
        try {
          await api.stocktake.confirmAdjust(orderDetail.id, {});
          message.success('库存调整成功');
          setAdjustModalVisible(false);
          loadOrderDetail(orderDetail.id);
          loadOrders();
        } catch (error) {
          message.error('调整失败: ' + error.message);
        }
      }
    });
  };

  const handleVoidSalesOrder = async (values) => {
    try {
      await api.stocktake.voidSalesOrder(orderDetail.id, values);
      message.success('红冲成功');
      setVoidModalVisible(false);
      loadOrderDetail(orderDetail.id);
      loadOrders();
    } catch (error) {
      message.error('红冲失败: ' + error.message);
    }
  };

  const handleRecalculateInventory = async (values) => {
    try {
      await api.stocktake.recalculateInventory(values);
      message.success('库存重算成功');
      setRecalcModalVisible(false);
      loadOrders();
    } catch (error) {
      message.error('重算失败: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'CREATED': 'default',
      'INPUTTING': 'processing',
      'CHECKED': 'orange',
      'CONFIRMED': 'green',
      'CANCELLED': 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      'CREATED': '已创建',
      'INPUTTING': '录入中',
      'CHECKED': '已核对',
      'CONFIRMED': '已确认',
      'CANCELLED': '已取消'
    };
    return texts[status] || status;
  };

  const getDiffColor = (diff) => {
    if (diff > 0) return '#22C55E';
    if (diff < 0) return '#EF4444';
    return '#6B7280';
  };

  const orderColumns = [
    {
      title: '盘点单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160,
      render: (text) => <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{text}</code>
    },
    {
      title: '盘点名称',
      dataIndex: 'order_name',
      key: 'order_name'
    },
    {
      title: '商品数',
      dataIndex: 'product_count',
      key: 'product_count',
      align: 'right',
      render: (value) => window.chartConfig.formatNumber(value, 0)
    },
    {
      title: '盘盈数量',
      dataIndex: 'profit_quantity',
      key: 'profit_quantity',
      align: 'right',
      render: (value) => <span style={{ color: '#22C55E' }}>+{window.chartConfig.formatNumber(value, 0)}</span>
    },
    {
      title: '盘亏数量',
      dataIndex: 'loss_quantity',
      key: 'loss_quantity',
      align: 'right',
      render: (value) => <span style={{ color: '#EF4444' }}>-{window.chartConfig.formatNumber(value, 0)}</span>
    },
    {
      title: '差异金额',
      dataIndex: 'diff_amount',
      key: 'diff_amount',
      align: 'right',
      render: (value) => {
        const color = (value || 0) >= 0 ? '#22C55E' : '#EF4444';
        const prefix = (value || 0) >= 0 ? '+' : '';
        return <span style={{ color, fontWeight: '500' }}>{prefix}¥{window.chartConfig.formatNumber(value)}</span>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => <Tag color={getStatusColor(value)}>{getStatusText(value)}</Tag>
    },
    {
      title: '盘点日期',
      dataIndex: 'stocktake_date',
      key: 'stocktake_date',
      width: 120,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD') : '-'
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 100
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" onClick={() => loadOrderDetail(record.id)}>详情</Button>
          {record.status === 'CREATED' && (
            <Button type="link" type="primary" onClick={() => { setOrderDetail(record); setInputModalVisible(true); }}>
              录入实盘
            </Button>
          )}
          {record.status === 'INPUTTING' && (
            <>
              <Button type="link" onClick={() => { setOrderDetail(record); setRedoModalVisible(true); }}>
                复盘
              </Button>
              <Button type="link" type="primary" onClick={handleConfirmAdjust}>
                确认调整
              </Button>
            </>
          )}
          {record.status === 'CONFIRMED' && (
            <Button type="link" danger onClick={() => { setOrderDetail(record); setVoidModalVisible(true); }}>
              红冲
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-stocktake">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0, color: '#1E3A5F' }}>盘点管理</h2>
        <Space>
          <Button onClick={() => setRecalcModalVisible(true)}>库存重算</Button>
          <Button type="primary" onClick={() => setCreateModalVisible(true)}>新建盘点单</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="本月盘点单"
            value={orderList.total || 0}
            suffix="单"
            icon="📋"
            color="#1E3A5F"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="待处理"
            value={orderList.list?.filter(o => ['CREATED', 'INPUTTING'].includes(o.status)).length || 0}
            suffix="单"
            icon="⏳"
            color="#FF7A45"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="盘盈金额"
            value={window.chartConfig.formatNumber(0)}
            prefix="¥"
            icon="📈"
            color="#22C55E"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="盘亏金额"
            value={window.chartConfig.formatNumber(0)}
            prefix="¥"
            icon="📉"
            color="#EF4444"
          />
        </Col>
      </Row>

      <Card
        style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        extra={
          <Space>
            <Search
              placeholder="搜索单号/名称"
              allowClear
              style={{ width: 250 }}
              onSearch={(value) => { setKeyword(value); setPage(1); }}
            />
            <Select
              placeholder="单据状态"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => { setStatus(value); setPage(1); }}
            >
              <Option value="CREATED">已创建</Option>
              <Option value="INPUTTING">录入中</Option>
              <Option value="CHECKED">已核对</Option>
              <Option value="CONFIRMED">已确认</Option>
              <Option value="CANCELLED">已取消</Option>
            </Select>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <window.DataTable
            columns={orderColumns}
            dataSource={orderList.list}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: orderList.total,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); }
            }}
          />
        </Spin>
      </Card>

      <Modal
        title="新建盘点单"
        open={createModalVisible}
        width={500}
        onCancel={() => { setCreateModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrder}>
          <Form.Item name="order_name" label="盘点名称" rules={[{ required: true, message: '请输入盘点名称' }]}>
            <Input placeholder="例如：2024年1月月末盘点" />
          </Form.Item>
          <Form.Item name="stocktake_date" label="盘点日期" rules={[{ required: true, message: '请选择盘点日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建盘点单</Button>
              <Button onClick={() => { setCreateModalVisible(false); form.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="盘点单详情"
        open={detailModalVisible}
        width={900}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
      >
        {orderDetail && (
          <div>
            <Descriptions column={3} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="盘点单号">{orderDetail.order_no}</Descriptions.Item>
              <Descriptions.Item label="盘点名称">{orderDetail.order_name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(orderDetail.status)}>{getStatusText(orderDetail.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="商品数">{orderDetail.product_count} 个</Descriptions.Item>
              <Descriptions.Item label="盘盈数量">
                <span style={{ color: '#22C55E' }}>+{orderDetail.profit_quantity}</span>
              </Descriptions.Item>
              <Descriptions.Item label="盘亏数量">
                <span style={{ color: '#EF4444' }}>-{orderDetail.loss_quantity}</span>
              </Descriptions.Item>
              <Descriptions.Item label="差异金额" span={3}>
                <span style={{ 
                  color: (orderDetail.diff_amount || 0) >= 0 ? '#22C55E' : '#EF4444',
                  fontWeight: '500',
                  fontSize: '16px'
                }}>
                  {(orderDetail.diff_amount || 0) >= 0 ? '+' : ''}¥{window.chartConfig.formatNumber(orderDetail.diff_amount)}
                </span>
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">盘点明细</Divider>
            <Table
              dataSource={orderDetail.items}
              rowKey="id"
              size="small"
              scroll={{ y: 300 }}
              columns={[
                { title: '商品编码', dataIndex: 'product_code', width: 120, render: t => <code>{t}</code> },
                { title: '商品名称', dataIndex: 'product_name' },
                { title: '规格', dataIndex: 'spec', width: 100 },
                { 
                  title: '账面库存', 
                  dataIndex: 'expected_quantity', 
                  align: 'right',
                  width: 100
                },
                { 
                  title: '实盘数量', 
                  dataIndex: 'actual_quantity', 
                  align: 'right',
                  width: 100,
                  render: (v) => v !== null ? v : '-'
                },
                { 
                  title: '差异数', 
                  dataIndex: 'diff_quantity', 
                  align: 'right',
                  width: 100,
                  render: (v) => {
                    if (v === null || v === undefined) return '-';
                    const color = getDiffColor(v);
                    const prefix = v > 0 ? '+' : '';
                    return <span style={{ color, fontWeight: '500' }}>{prefix}{v}</span>;
                  }
                },
                { 
                  title: '差异金额', 
                  dataIndex: 'diff_amount', 
                  align: 'right',
                  width: 120,
                  render: (v) => {
                    if (v === null || v === undefined) return '-';
                    const color = (v || 0) >= 0 ? '#22C55E' : '#EF4444';
                    const prefix = (v || 0) >= 0 ? '+' : '';
                    return <span style={{ color }}>{prefix}¥{window.chartConfig.formatNumber(v)}</span>;
                  }
                }
              ]}
              pagination={false}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="录入实盘数量"
        open={inputModalVisible}
        width={800}
        onCancel={() => setInputModalVisible(false)}
        onOk={() => inputForm.validateFields().then(handleInputActualQty)}
        okText="保存录入"
      >
        {orderDetail && (
          <Form form={inputForm} layout="vertical">
            <Table
              dataSource={orderDetail.items}
              rowKey="id"
              size="small"
              scroll={{ y: 400 }}
              pagination={false}
              columns={[
                { title: '商品名称', dataIndex: 'product_name' },
                { title: '规格', dataIndex: 'spec', width: 100 },
                { 
                  title: '账面库存', 
                  dataIndex: 'expected_quantity', 
                  align: 'right',
                  width: 100,
                  render: (v) => <strong>{v}</strong>
                },
                {
                  title: '实盘数量',
                  key: 'actual',
                  width: 160,
                  render: (_, record, index) => (
                    <Form.Item
                      name={`qty_${index}`}
                      initialValue={record.actual_quantity ?? record.expected_quantity}
                      style={{ margin: 0 }}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  )
                },
                {
                  title: '差异',
                  key: 'diff',
                  width: 100,
                  align: 'right',
                  render: (_, record, index) => {
                    const actual = inputForm.getFieldValue(`qty_${index}`) ?? record.expected_quantity;
                    const diff = actual - record.expected_quantity;
                    const color = getDiffColor(diff);
                    const prefix = diff > 0 ? '+' : '';
                    return <span style={{ color, fontWeight: '500' }}>{prefix}{diff}</span>;
                  }
                }
              ]}
            />
          </Form>
        )}
      </Modal>

      <Modal
        title="确认复盘"
        open={redoModalVisible}
        onCancel={() => setRedoModalVisible(false)}
        onOk={handleRedoStocktake}
        okText="确认复盘"
      >
        <p>复盘将清空当前录入的实盘数量，重新开始盘点。</p>
        <p style={{ color: '#FF7A45' }}>⚠️ 已录入的数据将被清除，请确认。</p>
      </Modal>

      <Modal
        title="红冲单据"
        open={voidModalVisible}
        width={500}
        onCancel={() => setVoidModalVisible(false)}
        onOk={() => form.validateFields().then(handleVoidSalesOrder)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="reason" label="红冲原因" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请输入红冲原因" />
          </Form.Item>
          <p style={{ color: '#EF4444' }}>
            ⚠️ 红冲后将生成反向调整流水，库存将恢复到盘点前状态。
          </p>
        </Form>
      </Modal>

      <Modal
        title="库存重算"
        open={recalcModalVisible}
        width={500}
        onCancel={() => setRecalcModalVisible(false)}
        onOk={() => form.validateFields().then(handleRecalculateInventory)}
        okText="开始重算"
        okButtonProps={{ danger: true }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="recalc_date" label="重算截止日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <p>库存重算将根据所有出入库流水重新计算库存数量和加权平均成本。</p>
          <p style={{ color: '#EF4444' }}>⚠️ 此操作会覆盖现有库存数据，请谨慎操作。</p>
        </Form>
      </Modal>
    </div>
  );
}

window.Stocktake = Stocktake;
