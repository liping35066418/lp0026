const { Tag } = antd;

function FlowTypeTag({ type, showIcon = true }) {
  const typeConfig = {
    purchase_in: { color: 'success', icon: '📥', label: '采购入库' },
    sales_out: { color: 'blue', icon: '📤', label: '销售出库' },
    return_in: { color: 'cyan', icon: '↩️', label: '退货入库' },
    exchange_out: { color: 'purple', icon: '🔄', label: '换货出库' },
    exchange_in: { color: 'geekblue', icon: '🔄', label: '换货入库' },
    adjust_in: { color: 'orange', icon: '➕', label: '调整入库' },
    adjust_out: { color: 'gold', icon: '➖', label: '调整出库' },
    stocktake: { color: 'magenta', icon: '📋', label: '盘点调整' },
    purchase_return: { color: 'red', icon: '↪️', label: '采购退货' }
  };

  const config = typeConfig[type] || { color: 'default', icon: '📦', label: type };

  return (
    <Tag color={config.color} style={{ borderRadius: '4px', padding: '2px 8px' }}>
      {showIcon && <span style={{ marginRight: '4px' }}>{config.icon}</span>}
      {config.label}
    </Tag>
  );
}

window.FlowTypeTag = FlowTypeTag;
