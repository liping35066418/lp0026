const { useState, useEffect } = React;
const { Row, Col, Card, Tabs, Table, Tag, Empty, Spin, Button, Space, Input, Select, Modal, Form, InputNumber, DatePicker, message, Divider, Descriptions } = antd;
const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;

function Purchase() {
  const [loading, setLoading] = useState(false);
  const [orderList, setOrderList] = useState({ list: [], total: 0 });
  const [supplierList, setSupplierList] = useState([]);
  const [orderDetail, setOrderDetail] = useState(null);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [supplierForm] = Form.useForm();

  useEffect(() => {
    loadOrders();
    loadSuppliers();
  }, [page, pageSize, status, keyword]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.purchase.getOrders({
        page, pageSize, status, keyword
      });
      setOrderList(data || { list: [], total: 0 });
    } catch (error) {
      console.error('加载采购单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await api.purchase.getSuppliers({ page: 1, pageSize: 100 });
      setSupplierList(data.list || []);
    } catch (error) {
      console.error('加载供应商失败:', error);
    }
  };

  const loadOrderDetail = async (id) => {
    try {
      const data = await api.purchase.getOrderDetail(id);
      setOrderDetail(data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('加载单据详情失败');
    }
  };

  const handleCreateOrder = async (values) => {
    try {
      await api.purchase.createOrder(values);
      message.success('采购单创建成功');
      setOrderModalVisible(false);
      form.resetFields();
      loadOrders();
    } catch (error) {
      message.error('创建失败: ' + error.message);
    }
  };

  const handleSaveSupplier = async (values) => {
    try {
      await api.purchase.saveSupplier(values);
      message.success('供应商保存成功');
      setSupplierModalVisible(false);
      supplierForm.resetFields();
      loadSuppliers();
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  };

  const handleConfirmWarehouse = async (values) => {
    try {
      await api.purchase.confirmWarehouse(orderDetail.id, values);
      message.success('入库确认成功');
      setWarehouseModalVisible(false);
      loadOrders();
      loadOrderDetail(orderDetail.id);
    } catch (error) {
      message.error('入库失败: ' + error.message);
    }
  };

  const handlePurchaseReturn = async (values) => {
    try {
      await api.purchase.purchaseReturn(orderDetail.id, values);
      message.success('退货成功');
      setReturnModalVisible(false);
      loadOrders();
      loadOrderDetail(orderDetail.id);
    } catch (error) {
      message.error('退货失败: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'orange',
      'WAREHOUSED': 'green',
      'PARTIAL': 'blue',
      'RETURNED': 'red',
      'CANCELLED': 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      'PENDING': '待入库',
      'WAREHOUSED': '已入库',
      'PARTIAL': '部分入库',
      'RETURNED': '已退货',
      'CANCELLED': '已取消'
    };
    return texts[status] || status;
  };

  const orderColumns = [
    {
      title: '采购单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160,
      render: (text) => <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{text}</code>
    },
    {
      title: '供应商',
      dataIndex: 'supplier_name',
      key: 'supplier_name'
    },
    {
      title: '商品数量',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      align: 'right',
      render: (value) => window.chartConfig.formatNumber(value, 0)
    },
    {
      title: '采购金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (value) => <span style={{ fontWeight: '500' }}>¥{window.chartConfig.formatNumber(value)}</span>
    },
    {
      title: '已入库数',
      dataIndex: 'warehoused_quantity',
      key: 'warehoused_quantity',
      align: 'right',
      render: (value) => window.chartConfig.formatNumber(value, 0)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => <Tag color={getStatusColor(value)}>{getStatusText(value)}</Tag>
    },
    {
      title: '入库日期',
      dataIndex: 'warehouse_date',
      key: 'warehouse_date',
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
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => loadOrderDetail(record.id)}>详情</Button>
          {record.status === 'PENDING' && (
            <Button type="link" type="primary" onClick={() => { setOrderDetail(record); setWarehouseModalVisible(true); }}>
              入库
            </Button>
          )}
          {(record.status === 'WAREHOUSED' || record.status === 'PARTIAL') && (
            <Button type="link" danger onClick={() => { setOrderDetail(record); setReturnModalVisible(true); }}>
              退货
            </Button>
          )}
        </Space>
      )
    }
  ];

  const supplierColumns = [
    {
      title: '供应商编码',
      dataIndex: 'supplier_code',
      key: 'supplier_code',
      width: 140,
      render: (text) => <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{text}</code>
    },
    {
      title: '供应商名称',
      dataIndex: 'supplier_name',
      key: 'supplier_name'
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact'
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>
        {value === 'ACTIVE' ? '正常' : '停用'}
      </Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button type="link" danger onClick={async () => {
          Modal.confirm({
            title: '确认删除',
            content: `确定要删除供应商【${record.supplier_name}】吗？`,
            onOk: async () => {
              try {
                await api.purchase.deleteSupplier(record.id);
                message.success('删除成功');
                loadSuppliers();
              } catch (error) {
                message.error('删除失败');
              }
            }
          });
        }}>删除</Button>
      )
    }
  ];

  return (
    <div className="page-purchase">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0, color: '#1E3A5F' }}>采购管理</h2>
        <Space>
          <Button type="primary" onClick={() => setOrderModalVisible(true)}>新建采购单</Button>
          <Button onClick={() => setSupplierModalVisible(true)}>管理供应商</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="本月采购额"
            value={window.chartConfig.formatNumber(0)}
            prefix="¥"
            icon="📦"
            color="#1E3A5F"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="待入库单"
            value={orderList.list?.filter(o => o.status === 'PENDING').length || 0}
            suffix="单"
            icon="⏳"
            color="#FF7A45"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="供应商数"
            value={supplierList.length}
            suffix="个"
            icon="🏢"
            color="#3B82F6"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <window.StatCard
            title="本月入库数"
            value={window.chartConfig.formatNumber(0)}
            suffix="件"
            icon="✅"
            color="#22C55E"
          />
        </Col>
      </Row>

      <Card
        style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        extra={
          <Space>
            <Search
              placeholder="搜索单号/供应商"
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
              <Option value="PENDING">待入库</Option>
              <Option value="WAREHOUSED">已入库</Option>
              <Option value="PARTIAL">部分入库</Option>
              <Option value="RETURNED">已退货</Option>
            </Select>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <window.DataTable
            columns={orderColumns}
            dataSource={orderList.list}
            rowKey="id"
            scroll={{ x: 1200 }}
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
        title="新建采购单"
        open={orderModalVisible}
        width={600}
        onCancel={() => { setOrderModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrder}>
          <Form.Item name="supplier_id" label="选择供应商" rules={[{ required: true, message: '请选择供应商' }]}>
            <Select placeholder="请选择供应商">
              {supplierList.map(s => (
                <Option key={s.id} value={s.id}>{s.supplier_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="items" label="采购商品" rules={[{ required: true, message: '请添加采购商品' }]}>
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'product_id']}
                        rules={[{ required: true, message: '请选择商品' }]}
                      >
                        <Select placeholder="商品" style={{ width: 200 }} showSearch optionFilterProp="children">
                          <Option value="1">商品A</Option>
                          <Option value="2">商品B</Option>
                          <Option value="3">商品C</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: '请输入数量' }]}
                      >
                        <InputNumber placeholder="数量" min={1} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'unit_price']}
                        rules={[{ required: true, message: '请输入单价' }]}
                      >
                        <InputNumber placeholder="单价" min={0} step={0.01} prefix="¥" />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>删除</Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<span>+</span>}>
                    添加商品
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建采购单</Button>
              <Button onClick={() => { setOrderModalVisible(false); form.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="供应商管理"
        open={supplierModalVisible}
        width={900}
        onCancel={() => setSupplierModalVisible(false)}
        footer={[
          <Button key="add" type="primary" onClick={() => supplierForm.resetFields()}>
            新增供应商
          </Button>,
          <Button key="close" onClick={() => setSupplierModalVisible(false)}>关闭</Button>
        ]}
      >
        <Card size="small" style={{ marginBottom: 16 }}>
          <Form form={supplierForm} layout="inline" onFinish={handleSaveSupplier}>
            <Form.Item name="supplier_code" rules={[{ required: true }]}>
              <Input placeholder="供应商编码" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="supplier_name" rules={[{ required: true }]}>
              <Input placeholder="供应商名称" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="contact">
              <Input placeholder="联系人" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="phone">
              <Input placeholder="联系电话" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="address">
              <Input placeholder="地址" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">保存</Button>
            </Form.Item>
          </Form>
        </Card>
        <Table
          dataSource={supplierList}
          rowKey="id"
          size="small"
          columns={supplierColumns}
          pagination={false}
          scroll={{ y: 300 }}
        />
      </Modal>

      <Modal
        title="采购单详情"
        open={detailModalVisible}
        width={800}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
      >
        {orderDetail && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="采购单号">{orderDetail.order_no}</Descriptions.Item>
              <Descriptions.Item label="供应商">{orderDetail.supplier_name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(orderDetail.status)}>{getStatusText(orderDetail.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="采购金额">¥{window.chartConfig.formatNumber(orderDetail.total_amount)}</Descriptions.Item>
              <Descriptions.Item label="商品数量">{orderDetail.total_quantity} 件</Descriptions.Item>
              <Descriptions.Item label="已入库">{orderDetail.warehoused_quantity} 件</Descriptions.Item>
            </Descriptions>
            <Table
              dataSource={orderDetail.items}
              rowKey="id"
              size="small"
              columns={[
                { title: '商品名称', dataIndex: 'product_name' },
                { title: '规格', dataIndex: 'spec' },
                { title: '采购数量', dataIndex: 'quantity', align: 'right' },
                { title: '已入库', dataIndex: 'warehoused_quantity', align: 'right' },
                { title: '单价', dataIndex: 'unit_price', align: 'right', render: v => '¥' + window.chartConfig.formatNumber(v) },
                { title: '金额', dataIndex: 'amount', align: 'right', render: v => '¥' + window.chartConfig.formatNumber(v) }
              ]}
              pagination={false}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="确认入库"
        open={warehouseModalVisible}
        onCancel={() => setWarehouseModalVisible(false)}
        onOk={() => form.validateFields().then(handleConfirmWarehouse)}
      >
        <p>确认对采购单【{orderDetail?.order_no}】进行入库操作？</p>
      </Modal>

      <Modal
        title="采购退货"
        open={returnModalVisible}
        onCancel={() => setReturnModalVisible(false)}
        onOk={() => form.validateFields().then(handlePurchaseReturn)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="reason" label="退货原因" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请输入退货原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

window.Purchase = Purchase;
