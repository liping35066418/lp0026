const { List, Card, Badge, Button, Typography, Space } = antd;
const { Text, Title } = Typography;

function AlertList({ alerts, loading = false, onRefresh, onHandle }) {
  const getAlertConfig = (status) => {
    const configs = {
      low_stock: { color: 'orange', icon: '⚠️', label: '库存不足' },
      expiring: { color: 'warning', icon: '⏰', label: '即将临期' },
      slow_moving: { color: 'default', icon: '📉', label: '滞销商品' },
      overstock: { color: 'processing', icon: '📈', label: '库存积压' }
    };
    return configs[status] || { color: 'default', icon: 'ℹ️', label: status };
  };

  const getAlertDescription = (alert) => {
    if (alert.alert_status === 'low_stock') {
      return `当前库存: ${alert.quantity}，预警阈值: ${alert.warning_threshold}`;
    }
    if (alert.alert_status === 'expiring') {
      return `剩余天数: ${alert.days_to_expire}天，到期日期: ${dateUtils.formatDate(alert.expire_date)}`;
    }
    if (alert.alert_status === 'slow_moving') {
      return `未销售天数: ${alert.days_no_sale}天`;
    }
    if (alert.alert_status === 'overstock') {
      return `当前库存: ${alert.quantity}，预警阈值: ${alert.warning_threshold * 5}`;
    }
    return '';
  };

  return (
    <Card
      title={
        <Space>
          <span>预警提醒</span>
          <Badge count={alerts?.length || 0} color="#EF4444" />
        </Space>
      }
      extra={
        <Button type="text" icon={<span>🔄</span>} onClick={onRefresh}>
          刷新
        </Button>
      }
      style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
    >
      <List
        loading={loading}
        dataSource={alerts || []}
        locale={{ emptyText: '暂无预警信息' }}
        renderItem={(alert) => {
          const config = getAlertConfig(alert.alert_status);
          return (
            <List.Item
              key={alert.id}
              actions={[
                onHandle && (
                  <Button type="link" size="small" onClick={() => onHandle(alert)}>
                    处理
                  </Button>
                )
              ]}
              style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px', 
                    backgroundColor: '#FFF7ED',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    {config.icon}
                  </div>
                }
                title={
                  <Space>
                    <Text strong>{alert.product_name}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{alert.sku}</Text>
                    <Badge color={config.color} text={config.label} />
                  </Space>
                }
                description={
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {alert.category_name}
                    </Text>
                    <Text type="warning" style={{ fontSize: '12px' }}>
                      {getAlertDescription(alert)}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
}

window.AlertList = AlertList;
