const { Card, Spin, Tooltip, Button } = antd;
const { useState, useEffect, useRef } = React;

function ChartCard({ title, option, height = 320, loading = false, extra, onFullscreen }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && option) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }
      chartInstance.current.setOption(option, true);
    }

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [option]);

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
    }
  };

  return (
    <Card
      className="chart-card"
      title={title}
      style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
      extra={
        <div style={{ display: 'flex', gap: '8px' }}>
          {extra}
          {onFullscreen && (
            <Tooltip title="全屏查看">
              <Button type="text" icon={<span>⛶</span>} onClick={handleFullscreen} />
            </Tooltip>
          )}
        </div>
      }
    >
      <Spin spinning={loading}>
        <div ref={chartRef} style={{ width: '100%', height }} />
      </Spin>
    </Card>
  );
}

window.ChartCard = ChartCard;
