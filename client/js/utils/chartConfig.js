const chartColors = {
  primary: '#1E3A5F',
  secondary: '#3B82F6',
  success: '#22C55E',
  warning: '#FF7A45',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  amber: '#F59E0B',
  lime: '#84CC16'
};

const colorPalette = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.success,
  chartColors.warning,
  chartColors.danger,
  chartColors.info,
  chartColors.purple,
  chartColors.pink,
  chartColors.amber,
  chartColors.lime
];

const baseChartOption = {
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '15%',
    containLabel: true
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    textStyle: {
      color: '#1F2937'
    },
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#1E3A5F'
      }
    }
  },
  legend: {
    top: 'top',
    textStyle: {
      color: '#6B7280'
    }
  }
};

function createLineChartOption(xData, seriesData, options = {}) {
  const series = seriesData.map((item, index) => ({
    name: item.name,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    data: item.data,
    itemStyle: {
      color: item.color || colorPalette[index % colorPalette.length]
    },
    lineStyle: {
      width: 3,
      color: item.color || colorPalette[index % colorPalette.length]
    },
    areaStyle: item.showArea ? {
      opacity: 0.1,
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: item.color || colorPalette[index % colorPalette.length] },
        { offset: 1, color: 'rgba(255, 255, 255, 0.1)' }
      ])
    } : undefined
  }));
  
  return {
    ...baseChartOption,
    ...options,
    xAxis: {
      type: 'category',
      data: xData,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      axisLabel: {
        color: '#6B7280'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6'
        }
      },
      axisLabel: {
        color: '#6B7280',
        formatter: options.yFormatter || (value => value.toLocaleString())
      }
    },
    series
  };
}

function createBarChartOption(xData, seriesData, options = {}) {
  const series = seriesData.map((item, index) => ({
    name: item.name,
    type: 'bar',
    data: item.data,
    barWidth: item.barWidth || '40%',
    itemStyle: {
      color: item.color || colorPalette[index % colorPalette.length],
      borderRadius: [4, 4, 0, 0]
    }
  }));
  
  return {
    ...baseChartOption,
    ...options,
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      axisLabel: {
        color: '#6B7280',
        interval: options.xInterval || 0,
        rotate: options.xRotate || 0
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6'
        }
      },
      axisLabel: {
        color: '#6B7280',
        formatter: options.yFormatter || (value => value.toLocaleString())
      }
    },
    series
  };
}

function createPieChartOption(data, options = {}) {
  return {
    ...baseChartOption,
    ...options,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: {
        color: '#6B7280'
      }
    },
    series: [
      {
        name: options.seriesName || '数据',
        type: 'pie',
        radius: options.radius || ['40%', '70%'],
        center: options.center || ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold',
            formatter: '{b}\n{d}%'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map((item, index) => ({
          ...item,
          itemStyle: {
            color: item.color || colorPalette[index % colorPalette.length]
          }
        }))
      }
    ]
  };
}

function createHeatmapOption(xData, yData, data, options = {}) {
  return {
    ...baseChartOption,
    ...options,
    tooltip: {
      position: 'top',
      formatter: (params) => `${params.marker} ${params.name[1]} ${params.name[0]}: ${params.value[2]}`
    },
    grid: {
      height: '50%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: xData,
      splitArea: {
        show: true
      }
    },
    yAxis: {
      type: 'category',
      data: yData,
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...data.map(d => d[2])),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#EBF5FF', '#3B82F6', '#1E3A5F']
      }
    },
    series: [
      {
        name: options.seriesName || '热力图',
        type: 'heatmap',
        data: data,
        label: {
          show: true
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
}

function createRadarChartOption(indicator, data, options = {}) {
  return {
    ...baseChartOption,
    ...options,
    radar: {
      indicator: indicator,
      shape: 'circle',
      splitNumber: 4,
      axisName: {
        color: '#6B7280'
      },
      splitLine: {
        lineStyle: {
          color: ['#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF']
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(30, 58, 95, 0.05)', 'rgba(30, 58, 95, 0.1)']
        }
      }
    },
    series: [
      {
        type: 'radar',
        data: data.map((item, index) => ({
          ...item,
          areaStyle: {
            color: item.color || colorPalette[index % colorPalette.length],
            opacity: 0.3
          },
          lineStyle: {
            color: item.color || colorPalette[index % colorPalette.length],
            width: 2
          },
          itemStyle: {
            color: item.color || colorPalette[index % colorPalette.length]
          }
        }))
      }
    ]
  };
}

function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatCurrency(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '¥0.00';
  return '¥' + formatNumber(num, decimals);
}

function formatPercent(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0%';
  return formatNumber(num, decimals) + '%';
}

window.chartConfig = {
  chartColors,
  colorPalette,
  baseChartOption,
  createLineChartOption,
  createBarChartOption,
  createPieChartOption,
  createHeatmapOption,
  createRadarChartOption,
  formatNumber,
  formatCurrency,
  formatPercent
};
