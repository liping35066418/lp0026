const { useState, useEffect } = React;
const { Row, Col, Card, Tabs, Table, Tag, Empty, Spin, Button, Space, Input, Select, Modal, Form, InputNumber, Switch, message, Divider, Descriptions, Typography } = antd;
const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;
const { Title, Text } = Typography;

function SystemConfig() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  
  const [products, setProducts] = useState({ list: [], total: 0 });
  const [categories, setCategories] = useState([]);
  const [staff, setStaff] = useState({ list: [], total: 0 });
  const [customers, setCustomers] = useState({ list: [], total: 0 });
  const [users, setUsers] = useState({ list: [], total: 0 });
  const [configs, setConfigs] = useState([]);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  
  const [form] = Form.useForm();

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, page, pageSize]);

  const loadTabData = async (tab) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'products':
          const prodData = await api.system.getProducts({ page, pageSize });
          setProducts(prodData || { list: [], total: 0 });
          break;
        case 'categories':
          const catData = await api.system.getCategories({ page: 1, pageSize: 100 });
          setCategories(catData.list || []);
          break;
        case 'staff':
          const staffData = await api.system.getStaff({ page, pageSize });
          setStaff(staffData || { list: [], total: 0 });
          break;
        case 'customers':
          const custData = await api.system.getCustomers({ page, pageSize });
          setCustomers(custData || { list: [], total: 0 });
          break;
        case 'users':
          const userData = await api.system.getUsers({ page, pageSize });
          setUsers(userData || { list: [], total: 0 });
          break;
        case 'config':
          const configData = await api.system.getConfigList();
          setConfigs(configData || []);
          break;
      }
    } catch (error) {
      console.error(`加载${tab}数据失败:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (values) => {
    try {
      await api.system.saveProduct(values);
      message.success('商品保存成功');
      setProductModalVisible(false);
      form.resetFields();
      loadTabData('products');
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  };

  const handleSaveCategory = async (values) => {
    try {
      await api.system.saveCategory(values);
      message.success('分类保存成功');
      setCategoryModalVisible(false);
      form.resetFields();
      loadTabData('categories');
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  };

  const handleSaveStaff = async (values) => {
    try {
      await api.system.saveStaff(values);
      message.success('员工保存成功');
      setStaffModalVisible(false);
      form.resetFields();
      loadTabData('staff');
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  };

  const handleSaveCustomer = async (values) => {
    try {
      await api.system.saveCustomer(values);
      message.success('客户保存成功');
      setCustomerModalVisible(false);
      form.resetFields();
      loadTabData('customers');
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  };

  const handleSaveUser = async (values) => {
    try {
      await api.system.saveUser(values);
      message.success('用户保存成功');
      setUserModalVisible(false);
      form.resetFields();
      loadTabData('users');
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  };

  const handleSaveConfig = async (values) => {
    try {
      await api.system.setConfig(values);
      message.success('配置保存成功');
      setConfigModalVisible(false);
      form.resetFields();
      loadTabData('config');
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  };

  const handleDelete = async (type, id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此记录吗？删除后无法恢复。',
      onOk: async () => {
        try {
          switch (type) {
            case 'product':
              await api.system.deleteProduct(id);
              break;
            case 'category':
              await api.system.deleteCategory(id);
              break;
            case 'staff':
              await api.system.deleteStaff(id);
              break;
            case 'customer':
              await api.system.deleteCustomer(id);
              break;
            case 'user':
              await api.system.deleteUser(id);
              break;
            case 'config':
              await api.system.deleteConfig(id);
              break;
          }
          message.success('删除成功');
          loadTabData(activeTab);
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const productColumns = [
    {
      title: '商品编码',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 140,
      render: (text) => <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{text}</code>
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name'
    },
    {
      title: '品类',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 120
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
      width: 120
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80
    },
    {
      title: '售价',
      dataIndex: 'sale_price',
      key: 'sale_price',
      align: 'right',
      width: 120,
      render: (value) => <span style={{ fontWeight: '500' }}>¥{window.chartConfig.formatNumber(value)}</span>
    },
    {
      title: '进价',
      dataIndex: 'cost_price',
      key: 'cost_price',
      align: 'right',
      width: 120,
      render: (value) => <span>¥{window.chartConfig.formatNumber(value)}</span>
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (value) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>
        {value === 'ACTIVE' ? '在售' : '停售'}
      </Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" danger onClick={() => handleDelete('product', record.id)}>
          删除
        </Button>
      )
    }
  ];

  const categoryColumns = [
    {
      title: '分类编码',
      dataIndex: 'category_code',
      key: 'category_code',
      width: 140,
      render: (text) => <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{text}</code>
    },
    {
      title: '分类名称',
      dataIndex: 'category_name',
      key: 'category_name'
    },
    {
      title: '上级分类',
      dataIndex: 'parent_name',
      key: 'parent_name',
      width: 150,
      render: (value) => value || '一级分类'
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      align: 'center'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" danger onClick={() => handleDelete('category', record.id)}>
          删除
        </Button>
      )
    }
  ];

  const staffColumns = [
    {
      title: '工号',
      dataIndex: 'staff_code',
      key: 'staff_code',
      width: 120,
      render: (text) => <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{text}</code>
    },
    {
      title: '姓名',
      dataIndex: 'staff_name',
      key: 'staff_name'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      width: 120
    },
    {
      title: '入职日期',
      dataIndex: 'hire_date',
      key: 'hire_date',
      width: 120,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD') : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (value) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>
        {value === 'ACTIVE' ? '在职' : '离职'}
      </Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" danger onClick={() => handleDelete('staff', record.id)}>
          删除
        </Button>
      )
    }
  ];

  const customerColumns = [
    {
      title: '会员号',
      dataIndex: 'customer_code',
      key: 'customer_code',
      width: 140,
      render: (text) => <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{text}</code>
    },
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      key: 'customer_name'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '会员等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (value) => {
        const colors = { '1': 'default', '2': 'blue', '3': 'gold', '4': 'purple' };
        const names = { '1': '普通会员', '2': '银卡会员', '3': '金卡会员', '4': '钻石会员' };
        return <Tag color={colors[value] || 'default'}>{names[value] || '普通会员'}</Tag>;
      }
    },
    {
      title: '累计消费',
      dataIndex: 'total_consumption',
      key: 'total_consumption',
      align: 'right',
      width: 120,
      render: (value) => <span style={{ fontWeight: '500' }}>¥{window.chartConfig.formatNumber(value)}</span>
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      align: 'right',
      width: 100,
      render: (value) => window.chartConfig.formatNumber(value, 0)
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" danger onClick={() => handleDelete('customer', record.id)}>
          删除
        </Button>
      )
    }
  ];

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
      key: 'real_name'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (value) => {
        const roles = { 'ADMIN': '系统管理员', 'MANAGER': '门店经理', 'CASHIER': '收银员', 'STOCK': '库存管理员' };
        return <Tag>{roles[value] || value}</Tag>;
      }
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (value) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>
        {value === 'ACTIVE' ? '启用' : '禁用'}
      </Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" danger onClick={() => handleDelete('user', record.id)}>
          删除
        </Button>
      )
    }
  ];

  const configColumns = [
    {
      title: '配置键',
      dataIndex: 'config_key',
      key: 'config_key',
      width: 200,
      render: (text) => <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{text}</code>
    },
    {
      title: '配置值',
      dataIndex: 'config_value',
      key: 'config_value'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => {
            form.setFieldsValue(record);
            setConfigModalVisible(true);
          }}>编辑</Button>
          <Button type="link" danger onClick={() => handleDelete('config', record.config_key)}>
            删除
          </Button>
        </Space>
      )
    }
  ];

  const getTableColumns = () => {
    switch (activeTab) {
      case 'products': return productColumns;
      case 'categories': return categoryColumns;
      case 'staff': return staffColumns;
      case 'customers': return customerColumns;
      case 'users': return userColumns;
      case 'config': return configColumns;
      default: return [];
    }
  };

  const getTableData = () => {
    switch (activeTab) {
      case 'products': return products.list;
      case 'categories': return categories;
      case 'staff': return staff.list;
      case 'customers': return customers.list;
      case 'users': return users.list;
      case 'config': return configs;
      default: return [];
    }
  };

  const getTotal = () => {
    switch (activeTab) {
      case 'products': return products.total;
      case 'categories': return categories.length;
      case 'staff': return staff.total;
      case 'customers': return customers.total;
      case 'users': return users.total;
      case 'config': return configs.length;
      default: return 0;
    }
  };

  const handleAdd = () => {
    form.resetFields();
    switch (activeTab) {
      case 'products':
        setProductModalVisible(true);
        break;
      case 'categories':
        setCategoryModalVisible(true);
        break;
      case 'staff':
        setStaffModalVisible(true);
        break;
      case 'customers':
        setCustomerModalVisible(true);
        break;
      case 'users':
        setUserModalVisible(true);
        break;
      case 'config':
        setConfigModalVisible(true);
        break;
    }
  };

  return (
    <div className="page-system">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0, color: '#1E3A5F' }}>系统管理</h2>
        <Button type="primary" onClick={handleAdd}>新增</Button>
      </div>

      <Card
        style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          tabBarExtraContent={
            <Text type="secondary">共 {getTotal()} 条记录</Text>
          }
        >
          <TabPane tab="商品管理" key="products">
            <Spin spinning={loading}>
              <window.DataTable
                columns={getTableColumns()}
                dataSource={getTableData()}
                rowKey="id"
                scroll={{ x: 1200 }}
                pagination={{
                  current: page,
                  pageSize: pageSize,
                  total: getTotal(),
                  onChange: (p, ps) => { setPage(p); setPageSize(ps); }
                }}
              />
            </Spin>
          </TabPane>
          <TabPane tab="品类管理" key="categories">
            <Spin spinning={loading}>
              <Table
                columns={getTableColumns()}
                dataSource={getTableData()}
                rowKey="id"
                pagination={false}
              />
            </Spin>
          </TabPane>
          <TabPane tab="员工管理" key="staff">
            <Spin spinning={loading}>
              <window.DataTable
                columns={getTableColumns()}
                dataSource={getTableData()}
                rowKey="id"
                scroll={{ x: 1000 }}
                pagination={{
                  current: page,
                  pageSize: pageSize,
                  total: getTotal(),
                  onChange: (p, ps) => { setPage(p); setPageSize(ps); }
                }}
              />
            </Spin>
          </TabPane>
          <TabPane tab="客户管理" key="customers">
            <Spin spinning={loading}>
              <window.DataTable
                columns={getTableColumns()}
                dataSource={getTableData()}
                rowKey="id"
                scroll={{ x: 1100 }}
                pagination={{
                  current: page,
                  pageSize: pageSize,
                  total: getTotal(),
                  onChange: (p, ps) => { setPage(p); setPageSize(ps); }
                }}
              />
            </Spin>
          </TabPane>
          <TabPane tab="用户管理" key="users">
            <Spin spinning={loading}>
              <window.DataTable
                columns={getTableColumns()}
                dataSource={getTableData()}
                rowKey="id"
                scroll={{ x: 900 }}
                pagination={{
                  current: page,
                  pageSize: pageSize,
                  total: getTotal(),
                  onChange: (p, ps) => { setPage(p); setPageSize(ps); }
                }}
              />
            </Spin>
          </TabPane>
          <TabPane tab="系统配置" key="config">
            <Spin spinning={loading}>
              <Table
                columns={getTableColumns()}
                dataSource={getTableData()}
                rowKey="config_key"
                pagination={false}
              />
            </Spin>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="新增商品"
        open={productModalVisible}
        width={600}
        onCancel={() => { setProductModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveProduct}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="product_code" label="商品编码" rules={[{ required: true }]}>
                <Input placeholder="请输入商品编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="product_name" label="商品名称" rules={[{ required: true }]}>
                <Input placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category_id" label="所属品类" rules={[{ required: true }]}>
                <Select placeholder="请选择品类">
                  {categories.map(c => (
                    <Option key={c.id} value={c.id}>{c.category_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="spec" label="规格">
                <Input placeholder="例如：500ml/瓶" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sale_price" label="售价" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cost_price" label="进价" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warning_threshold" label="预警阈值" initialValue={10}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="单位" initialValue="件">
                <Input placeholder="件/瓶/个等" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => { setProductModalVisible(false); form.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增品类"
        open={categoryModalVisible}
        width={500}
        onCancel={() => { setCategoryModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveCategory}>
          <Form.Item name="category_code" label="分类编码" rules={[{ required: true }]}>
            <Input placeholder="请输入分类编码" />
          </Form.Item>
          <Form.Item name="category_name" label="分类名称" rules={[{ required: true }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="parent_id" label="上级分类">
            <Select placeholder="一级分类无需选择">
              <Option value={null}>无（一级分类）</Option>
              {categories.map(c => (
                <Option key={c.id} value={c.id}>{c.category_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => { setCategoryModalVisible(false); form.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增员工"
        open={staffModalVisible}
        width={500}
        onCancel={() => { setStaffModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveStaff}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="staff_code" label="工号" rules={[{ required: true }]}>
                <Input placeholder="请输入工号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="staff_name" label="姓名" rules={[{ required: true }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position" label="岗位">
                <Select placeholder="请选择岗位">
                  <Option value="店长">店长</Option>
                  <Option value="收银员">收银员</Option>
                  <Option value="理货员">理货员</Option>
                  <Option value="采购员">采购员</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => { setStaffModalVisible(false); form.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增客户"
        open={customerModalVisible}
        width={500}
        onCancel={() => { setCustomerModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveCustomer}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_code" label="会员号" rules={[{ required: true }]}>
                <Input placeholder="请输入会员号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_name" label="客户名称" rules={[{ required: true }]}>
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="会员等级" initialValue="1">
                <Select>
                  <Option value="1">普通会员</Option>
                  <Option value="2">银卡会员</Option>
                  <Option value="3">金卡会员</Option>
                  <Option value="4">钻石会员</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => { setCustomerModalVisible(false); form.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增用户"
        open={userModalVisible}
        width={500}
        onCancel={() => { setUserModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveUser}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="real_name" label="真实姓名" rules={[{ required: true }]}>
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="password" label="密码" rules={[{ required: true }]}>
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="role" label="角色" rules={[{ required: true }]} initialValue="CASHIER">
                <Select>
                  <Option value="ADMIN">系统管理员</Option>
                  <Option value="MANAGER">门店经理</Option>
                  <Option value="CASHIER">收银员</Option>
                  <Option value="STOCK">库存管理员</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => { setUserModalVisible(false); form.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="系统配置"
        open={configModalVisible}
        width={500}
        onCancel={() => { setConfigModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
          <Form.Item name="config_key" label="配置键" rules={[{ required: true }]}>
            <Input placeholder="例如：store.name" />
          </Form.Item>
          <Form.Item name="config_value" label="配置值" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请输入配置值" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input placeholder="配置说明" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => { setConfigModalVisible(false); form.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

window.SystemConfig = SystemConfig;
