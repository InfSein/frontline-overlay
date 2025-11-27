'use client';

import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'

interface PieChartProps {
  data: { amount: number; label: string }[]
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0)

  const chartData = data.map((item) => ({
    value: item.amount,
    name: item.label,
    percent: ((item.amount / totalAmount) * 100).toFixed(2),
  }))

  const legend = chartData.length <= 12 ? {
    orient: 'vertical',
    left: 'left',
    data: chartData.map(item => item.name),
  } : undefined

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}: ${params.value} (${params.percent}%)`
      },
    },
    legend: legend,
    series: [
      {
        name: 'Amount Distribution',
        type: 'pie',
        radius: '70%',
        data: chartData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }

  return (
    <ReactECharts option={option} echarts={echarts} />
  )
}

export default PieChart;
