<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'

import {
  PieChart as EPieChart
} from 'echarts/charts'

import {
  TooltipComponent,
  LegendComponent
} from 'echarts/components'

import { CanvasRenderer } from 'echarts/renderers'

// 注册 ECharts 模块（tree-shaking）
use([
  EPieChart,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

interface PieChartItem {
  amount: number
  label: string
}
interface PieChartProps {
  data: PieChartItem[]
}
const props = defineProps<PieChartProps>()

/**
 * 总数
 */
const totalAmount = computed(() =>
  props.data.reduce((sum, item) => sum + item.amount, 0)
)

/**
 * 转换后的图表数据
 */
const chartData = computed(() =>
  props.data.map(item => ({
    value: item.amount,
    name: item.label,
    percent: ((item.amount / totalAmount.value) * 100).toFixed(2)
  }))
)

/**
 * legend：只有 <= 12 个时才显示
 */
const legend = computed(() => {
  return chartData.value.length <= 10
    ? {
        orient: 'vertical',
        top: 'top',
        left: 'left',
        data: chartData.value.map(item => item.name),
        textStyle: {
          fontSize: 18,
        }
      }
    : undefined
})

/**
 * ECharts option
 */
const option = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (params: any) => {
      return `${params.name}: ${params.value} (${params.percent}%)`
    }
  },
  legend: legend.value,
  series: [
    {
      name: 'Amount Distribution',
      type: 'pie',
      radius: '80%',
      data: chartData.value,
      label: {
        fontSize: 16,
      },
      tooltip: {
        textStyle: {
          fontSize: 18,
        }
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
}))
</script>

<template>
  <VChart
    :option="option"
    autoresize
    style="width: 100%; height: 100%;"
  />
</template>

<style scoped>
</style>
