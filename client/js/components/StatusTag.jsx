const { Tag } = antd;

function StatusTag({ status, text }) {
  const statusConfig = {
    normal: { color: 'success', label: text || '正常' },
    low_stock: { color: 'orange', label: text || '库存不足' },
    expiring: { color: 'warning', label: text || '即将临期' },
    slow_moving: { color: 'default', label: text || '滞销' },
    overstock: { color: 'processing', label: text || '库存积压' },
    pending: { color: 'default', label: text || '待处理' },
    counting: { color: 'processing', label: text || '盘点中' },
    counted: { color: 'warning', label: text || '已盘点' },
    completed: { color: 'success', label: text || '已完成' },
    void: { color: 'error', label: text || '已作废' }
  };

  const config = statusConfig[status] || { color: 'default', label: text || status };

  return (
    <Tag color={config.color} style={{ borderRadius: '4px', padding: '2px 8px' }}>
      {config.label}
    </Tag>
  );
}

window.StatusTag = StatusTag;
