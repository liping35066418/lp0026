const { useState, useEffect } = React;
const { Layout, Menu, theme, Button, Avatar, Dropdown, Space, Tag, Typography } = antd;
const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const { defaultAlgorithm, compactAlgorithm } = theme;

const menuItems = [
  {
    key: 'dashboard',
    icon: '📊',
    label: '数据仪表盘',
    component: window.Dashboard
  },
  {
    key: 'sales',
    icon: '💰',
    label: '销售分析',
    component: window.SalesAnalysis
  },
  {
    key: 'inventory',
    icon: '📦',
    label: '库存管理',
    component: window.Inventory
  },
  {
    key: 'purchase',
    icon: '🛒',
    label: '采购管理',
    component: window.Purchase
  },
  {
    key: 'stocktake',
    icon: '📋',
    label: '盘点管理',
    component: window.Stocktake
  },
  {
    key: 'report',
    icon: '📄',
    label: '报表中心',
    component: window.ReportCenter
  },
  {
    key: 'system',
    icon: '⚙️',
    label: '系统管理',
    component: window.SystemConfig
  }
];

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState({
    username: 'admin',
    real_name: '系统管理员',
    role: 'ADMIN'
  });

  const getRoleText = (role) => {
    const roles = {
      'ADMIN': '系统管理员',
      'MANAGER': '门店经理',
      'CASHIER': '收银员',
      'STOCK': '库存管理员'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'ADMIN': 'red',
      'MANAGER': 'orange',
      'CASHIER': 'blue',
      'STOCK': 'green'
    };
    return colors[role] || 'default';
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: '个人信息'
      },
      {
        key: 'settings',
        label: '系统设置'
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        label: '退出登录',
        danger: true
      }
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        antd.message.info('已退出登录');
      }
    }
  };

  const CurrentPage = menuItems.find(item => item.key === selectedKey)?.component || window.Dashboard;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        theme="light"
        style={{
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
          borderRight: '1px solid #F3F4F6'
        }}
      >
        <div className="logo" style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0 16px' : '0 24px',
          borderBottom: '1px solid #F3F4F6'
        }}>
          <span style={{
            fontSize: collapsed ? 28 : 32,
            marginRight: collapsed ? 0 : 12
          }}>🏪</span>
          {!collapsed && (
            <div>
              <Title level={5} style={{ margin: 0, color: '#1E3A5F', fontWeight: 700 }}>零售分析</Title>
              <Text type="secondary" style={{ fontSize: 11 }}>Data Analysis Platform</Text>
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => setSelectedKey(key)}
          style={{ borderRight: 0, padding: '12px 8px' }}
          items={menuItems.map(item => ({
            key: item.key,
            icon: <span style={{ fontSize: 18 }}>{item.icon}</span>,
            label: item.label,
            style: {
              borderRadius: '8px',
              marginBottom: '4px'
            }
          }))}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
          height: 64
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? '☰' : '⟨'}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18 }}
            />
            <Text type="secondary" style={{ fontSize: 13 }}>
              今日：{dayjs().format('YYYY年MM月DD日')}
            </Text>
          </Space>
          <Space size="large">
            <Tag color="green" icon={<span>●</span>}>
              服务正常
            </Tag>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1E3A5F', verticalAlign: 'middle' }}>
                  {currentUser.real_name?.charAt(0)}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <Text strong style={{ fontSize: 14 }}>{currentUser.real_name}</Text>
                  <Tag color={getRoleColor(currentUser.role)} style={{ margin: 0, fontSize: 10, padding: '0 6px', height: 18, lineHeight: '16px' }}>
                    {getRoleText(currentUser.role)}
                  </Tag>
                </div>
                <span style={{ color: '#9CA3AF', fontSize: 12 }}>▼</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: '24px',
            background: '#F9FAFB',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto'
          }}
        >
          <CurrentPage />
        </Content>
      </Layout>
    </Layout>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
