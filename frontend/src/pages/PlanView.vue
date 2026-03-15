<template>
  <div class="left-column">
    <FinPlannerCard title="Mes plans">
      <PlanList :plans="savedPlans" @click:add="resetForm" @click:load="loadPlan" @click:delete="deletePlan" />
    </FinPlannerCard>

    <el-card class="finplanner-card" shadow="hover">
      <PlanFormRenderer :form="form" @submit="submitPlan" />
    </el-card>

    <FinPlannerCard title="Répartition des investissements">
      <div v-for="(item, index) in form.allocations" :key="index" class="allocation-block">
        <div class="allocation-row">
          <el-input v-model="item.name" placeholder="Nom (ex: Actions)" class="allocation-input" />
          <el-input-number v-model="item.value" :min="0" :max="100" class="allocation-number" />
          <span class="allocation-percent">%</span>
          <el-button type="danger" circle size="small" @click="removeAllocation(index)">X</el-button>
        </div>

        <div class="sub-allocations-container">
          <div v-for="(sub, sIndex) in item.subAllocations" :key="sIndex" class="sub-allocation-row">
            <span class="sub-arrow">↳</span>
            <el-input v-model="sub.name" placeholder="iShare MSCI World, Amundi, SCPI..." size="small"
              class="sub-input" />
            <el-input-number v-model="sub.value" :min="0" :max="100" size="small" class="sub-number" />
            <span class="sub-percent">%</span>
            <el-button type="danger" circle size="small" plain @click="removeSubAllocation(index, sIndex)">X</el-button>
          </div>
          <el-button type="primary" link class="add-sub-btn" size="small" @click="addSubAllocation(index)">
            + Ajouter une sous-section
          </el-button>

          <div v-if="item.subAllocations && item.subAllocations.length > 0 && getSubTotal(index) !== 100"
            class="sub-error-text">
            Total sous-section : {{ getSubTotal(index) }}% (Devrait être 100%)
          </div>
        </div>
      </div>

      <el-button type="default" class="add-btn" @click="addAllocation">
        + Ajouter une section
      </el-button>

      <div v-if="totalAllocation !== 100" class="error-text">
        Total : {{ totalAllocation }}% (Devrait être 100%)
      </div>

      <div class="pie-chart-container">
        <v-chart class="chart pie-chart" :option="pieChartOptions" autoresize />
      </div>
    </FinPlannerCard>
  </div>

  <div class="right-column">
    <el-card class="finplanner-card" shadow="hover">
      <v-chart class="chart" :option="chartOptions" autoresize />

      <div class="final-resume">
        <div class="final-value-container">
          <h3>Total à la fin de l'investissement:</h3>
          <span class="final-amount">
            €{{ finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}
          </span>
        </div>
        <div class="final-value-container">
          <h3>Gain total:</h3>
          <span class="final-amount">
            €{{ finalGain.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}
          </span>
        </div>
        <div class="final-value-container">
          <h3>Gain mensuel:</h3>
          <span class="final-amount">
            €{{ monthlyGain.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}
          </span>
        </div>
      </div>
    </el-card>

    <FinPlannerCard title="Montant investi par allocation">
      <template v-if="isCustomInvested" #header-actions>
        <el-button size="small" type="primary" link @click="isCustomInvested = false">
          Réinitialiser
        </el-button>
      </template>
      <AllocationAmountSection v-model:displayInvestedAmount="displayInvestedAmount" :totalInvested="totalInvested"
        :investedPerAllocation="investedPerAllocation" :isCustomInvested="isCustomInvested" />
    </FinPlannerCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, provide, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { use } from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart, { THEME_KEY } from 'vue-echarts'
import { useInvestmentPlan, getPlanById } from '../features/useInvestmentPlan'
import PlanFormRenderer from '../components/PlanFormRenderer.vue'
import PlanList from '../components/PlanList.vue'
import FinPlannerCard from '../components/FinPlannerCard.vue'
import AllocationAmountSection from '../components/AllocationAmountSection.vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ planId?: string }>()

use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  PieChart,
  CanvasRenderer
])

provide(THEME_KEY, 'light')

const router = useRouter()

const { savedPlans, savePlan, deletePlan } = useInvestmentPlan()

const form = reactive(getInitialForm())
const isCustomInvested = ref(false)
const customInvestedAmount = ref(0)

watch(() => props.planId, resetForm, { immediate: true })

const totalAllocation = computed(() => {
  return form.allocations.reduce((sum: any, item: any) => sum + item.value, 0)
})

const pieChartOptions = computed(() => {
  const innerData: any[] = []
  const outerData: any[] = []

  form.allocations.forEach((alloc: any) => {
    innerData.push({
      name: alloc.name,
      value: alloc.value
    })

    if (alloc.subAllocations && alloc.subAllocations.length > 0) {
      alloc.subAllocations.forEach((sub: any) => {
        outerData.push({
          name: sub.name,
          value: (sub.value / 100) * alloc.value
        })
      })
    } else {
      outerData.push({
        name: alloc.name,
        value: alloc.value
      })
    }
  })

  return {
    tooltip: {
      trigger: 'item',
      formatter: function (params: any) {
        return `${params.name}: ${params.value.toFixed(1)}%`
      }
    },
    series: [
      {
        name: 'Allocations',
        type: 'pie',
        radius: [0, '40%'],
        label: {
          position: 'inner',
          fontSize: 11,
          show: true,
          color: '#fff',
          formatter: '{b}'
        },
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        data: innerData
      },
      {
        name: 'Sous allocations',
        type: 'pie',
        radius: ['50%', '75%'],
        label: {
          formatter: '{b}: {c}%'
        },
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        data: outerData
      }
    ]
  }
})

const chartOptions = computed(() => {
  const years = form.timeHorizon
  const initial = form.initialCapital
  const annualContribution = form.monthlyDca * 12
  const rate = form.expectedAnnualReturn / 100

  const xAxisData = []
  const seriesData = []

  let currentBalance = initial

  for (let i = 0; i <= years; i++) {
    xAxisData.push(`Year ${i}`)
    seriesData.push(Math.round(currentBalance))

    // Calculate next year's balance: compound interest + annual contribution (simplified at end of year)
    currentBalance = (currentBalance + annualContribution) * (1 + rate)
  }

  return {
    title: {
      text: 'Projection du portefeuille',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: function (params: any) {
        return `${params[0].name}<br/>Balance: €${params[0].value.toLocaleString()}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '€{value}'
      }
    },
    series: [
      {
        name: 'Balance',
        type: 'line',
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64,158,255,0.5)' },
              { offset: 1, color: 'rgba(64,158,255,0.1)' }
            ]
          }
        },
        data: seriesData
      }
    ]
  }
})

const finalBalance = computed(() => {
  const chartData = chartOptions.value.series[0].data
  return chartData[chartData.length - 1]
})

const finalGain = computed(() => {
  return finalBalance.value - form.initialCapital - (form.monthlyDca * 12 * form.timeHorizon)
})

const monthlyGain = computed(() => {
  return Math.floor(finalGain.value / form.timeHorizon / 12)
})

const totalInvested = computed(() => {
  return form.initialCapital + (form.monthlyDca * 12 * form.timeHorizon)
})

const displayInvestedAmount = computed({
  get: () => isCustomInvested.value ? customInvestedAmount.value : totalInvested.value,
  set: (val: number) => {
    isCustomInvested.value = true
    customInvestedAmount.value = val
  }
})

const investedPerAllocation = computed(() => {
  const referenceAmount = displayInvestedAmount.value
  return form.allocations.map((alloc: any) => {
    let subAllocAmounts: { name: string, amount: number }[] = []
    if (alloc.subAllocations && alloc.subAllocations.length > 0) {
      subAllocAmounts = alloc.subAllocations.map((sub: any) => ({
        name: sub.name,
        amount: (referenceAmount * alloc.value / 100) * (sub.value / 100)
      }))
    }

    return {
      name: alloc.name,
      amount: (referenceAmount * alloc.value) / 100,
      subAllocations: subAllocAmounts
    }
  })
})


function getInitialForm() {
  if (props.planId) {
    return getPlanById(props.planId)
  }

  return {
    id: null,
    title: '',
    timeHorizon: 5,
    initialCapital: 1000,
    monthlyDca: 200,
    expectedAnnualReturn: 5,
    allocations: [
      {
        name: 'Actions',
        value: 50,
        subAllocations: [
          // { name: 'Apple', value: 20 },
          // { name: 'Microsoft', value: 80 }
        ] as { name: string, value: number }[]
      },
      { name: 'Obligations', value: 30, subAllocations: [] as { name: string, value: number }[] },
      { name: 'Or', value: 10, subAllocations: [] as { name: string, value: number }[] },
      { name: 'Eau', value: 10, subAllocations: [] as { name: string, value: number }[] }
    ]
  }
}


function addAllocation() {
  form.allocations.push({ name: '', value: 10, subAllocations: [] as { name: string, value: number }[] })
}

function removeAllocation(index: number) {
  form.allocations.splice(index, 1)
}

function addSubAllocation(index: number) {
  if (!form.allocations[index].subAllocations) {
    form.allocations[index].subAllocations = [] as { name: string, value: number }[]
  }
  form.allocations[index].subAllocations.push({ name: '', value: 100 })
}

function removeSubAllocation(allocIndex: number, subIndex: number) {
  form.allocations[allocIndex].subAllocations.splice(subIndex, 1)
}

function getSubTotal(index: number) {
  const alloc = form.allocations[index]
  if (!alloc.subAllocations) return 0
  return alloc.subAllocations.reduce((sum: any, item: any) => sum + item.value, 0)
}

function loadPlan(plan: any) {
  Object.assign(form, JSON.parse(JSON.stringify(plan)))
  ElMessage.info(`Plan chargé: ${plan.title || 'Sans titre'}`)
}



function submitPlan() {
  const plan = savePlan(form)
  router.push({ name: 'plan:edit', params: { planId: plan.id } })
}

function resetForm() {
  Object.assign(form, getInitialForm())
}
</script>

<style scoped>
.left-column {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.allocation-block {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.allocation-block:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.allocation-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sub-allocations-container {
  margin-top: 10px;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-allocation-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-arrow {
  color: #c0c4cc;
  font-weight: bold;
}

.sub-input {
  flex: 1;
}

.sub-number {
  width: 90px;
}

.sub-percent {
  font-size: 13px;
  color: #909399;
}

.add-sub-btn {
  align-self: flex-start;
  margin-top: 5px;
}

.sub-error-text {
  color: #e6a23c;
  font-size: 12px;
  margin-top: 5px;
}

.allocation-input {
  flex: 1;
}

.allocation-number {
  width: 100px;
}

.allocation-percent {
  font-weight: bold;
  color: #606266;
}

.add-btn {
  width: 100%;
  border-style: dashed;
}

.error-text {
  color: #f56c6c;
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
}

.pie-chart-container {
  margin-top: 1.2rem;
  height: 21.875rem;
  width: 100%;
}

.submit-btn {
  width: 100%;
  margin-top: 1.2rem;
}

.right-column {
  width: 100%;
  max-width: 37.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-left: 1.2rem;
}

.chart {
  height: 400px;
  width: 100%;
}

.final-resume {
  display: flex;
  justify-content: space-between;
}

.final-value-container {
  margin-top: 20px;
  text-align: center;
  padding: 15px;
  background-color: #f0f9eb;
  border-radius: 8px;
  border: 1px solid #e1f3d8;
}

.final-value-container h3 {
  margin: 0;
  color: #67c23a;
  font-size: 16px;
  font-weight: 500;
}

.final-amount {
  display: block;
  font-size: 1.75rem;
  font-weight: bold;
  color: #303133;
  margin-top: 0.3rem;
}

@media (max-width: 1140px) {

  .left-column,
  .right-column {
    max-width: 100%;
  }

  .right-column {
    margin-left: 0;
    margin-top: 1.2rem;
  }
}


@media (max-width: 768px) {
  .final-resume {
    flex-direction: column;
    gap: 15px;
  }

  .final-value-container {
    margin-top: 0;
  }

  .allocation-row,
  .sub-allocation-row {
    flex-wrap: wrap;
  }

  .allocation-input,
  .sub-input {
    flex: 1 1 100%;
  }

  .chart,
  .pie-chart-container {
    height: 300px;
  }
}
</style>