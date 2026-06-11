const { Card, Tooltip, Typography } = antd;
const { Title, Text } = Typography;

function StatCard({ title, value, prefix, suffix, trend, trendValue, description, icon, color = '#1E3A5F', loading = false }) {
  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return '#22C55E';
    if (trend === 'down') return '#EF4444';
    return '#6B7280';
  };

  return (
    <Card 
      className="stat-card" 
      loading={loading}
      style={{ 
        borderRadius: '12px', 
        border: 'none',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text style={{ color: '#6B7280', fontSize: '14px' }}>{title}</Text>
          <Title level={3} style={{ margin: '8px 0', color, fontFamily: 'Roboto Mono, monospace' }}>
            {prefix && <span style={{ fontSize: '20px', marginRight: '4px' }}>{prefix}</span>}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span style={{ fontSize: '16px', marginLeft: '4px', fontWeight: 'normal', color: '#6B7280' }}>{suffix}</span>}
          </Title>
          
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: getTrendColor(), fontWeight: '600' }}>
                {getTrendIcon()} {Math.abs(trendValue)}%
              </span>
              {description && (
                <Text style={{ color: '#9CA3AF', fontSize: '12px' }}>{description}</Text>
              )}
            </div>
          )}
        </div>
        
        {icon && (
          <div 
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              backgroundColor: `${color}15`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '24px'
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

window.StatCard = StatCard;
