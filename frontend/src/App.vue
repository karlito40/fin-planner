<script setup lang="ts">
import { ref, reactive } from 'vue'
import axios from 'axios'
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
import { computed, provide } from 'vue'

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

const form = reactive({
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
        { name: 'Apple', value: 20 },
        { name: 'Microsoft', value: 80 }
      ] as {name: string, value: number}[]
    },
    { name: 'Obligations', value: 30, subAllocations: [] as {name: string, value: number}[] },
    { name: 'Or', value: 10, subAllocations: [] as {name: string, value: number}[] },
    { name: 'Eau', value: 10, subAllocations: [] as {name: string, value: number}[] }
  ]
})


const loading = ref(false)

const addAllocation = () => {
  form.allocations.push({ name: '', value: 10, subAllocations: [] as {name: string, value: number}[] })
}

const removeAllocation = (index: number) => {
  form.allocations.splice(index, 1)
}

const addSubAllocation = (index: number) => {
  if (!form.allocations[index].subAllocations) {
    form.allocations[index].subAllocations = [] as {name: string, value: number}[]
  }
  form.allocations[index].subAllocations.push({ name: '', value: 100 })
}

const removeSubAllocation = (allocIndex: number, subIndex: number) => {
  form.allocations[allocIndex].subAllocations.splice(subIndex, 1)
}

const getSubTotal = (index: number) => {
  const alloc = form.allocations[index]
  if (!alloc.subAllocations) return 0
  return alloc.subAllocations.reduce((sum, item) => sum + item.value, 0)
}

const totalAllocation = computed(() => {
  return form.allocations.reduce((sum, item) => sum + item.value, 0)
})

const pieChartOptions = computed(() => {
  const innerData: any[] = []
  const outerData: any[] = []

  form.allocations.forEach(alloc => {
    innerData.push({
      name: alloc.name,
      value: alloc.value
    })
    
    if (alloc.subAllocations && alloc.subAllocations.length > 0) {
      alloc.subAllocations.forEach(sub => {
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
      formatter: function(params: any) {
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

const isCustomInvested = ref(false)
const customInvestedAmount = ref(0)

const displayInvestedAmount = computed({
  get: () => isCustomInvested.value ? customInvestedAmount.value : totalInvested.value,
  set: (val: number) => {
    isCustomInvested.value = true
    customInvestedAmount.value = val
  }
})

const investedPerAllocation = computed(() => {
  const referenceAmount = displayInvestedAmount.value
  return form.allocations.map(alloc => {
    let subAllocAmounts: {name: string, amount: number}[] = []
    if (alloc.subAllocations && alloc.subAllocations.length > 0) {
      subAllocAmounts = alloc.subAllocations.map(sub => ({
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

const submitPlan = async () => {
  loading.value = true
  try {
    await axios.post('http://localhost:3333/api/plans', form)
    ElMessage.success('Plan successfully saved!')
  } catch (error) {
    ElMessage.error('Error saving the plan. Make sure backend is running.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <h2>Financial Investment Planner</h2>
    </el-header>
    <el-main>
      <div class="left-column">
        <el-card class="form-card" shadow="hover">
          <el-form :model="form" label-position="top">
            <el-form-item label="Plan">
              <el-input v-model="form.title" placeholder="My Retirement Plan, etc." />
            </el-form-item>

            <el-form-item label="Horizon de Temps (Années)">
              <el-slider v-model="form.timeHorizon" :min="1" :max="40" :step="1" show-input />
            </el-form-item>
            
            <el-form-item label="Capital Initial (€)">
              <el-input-number v-model="form.initialCapital" :min="0" :step="100" style="width: 100%" />
            </el-form-item>

            <el-form-item label="DCA Mensuel (€)">
              <el-input-number v-model="form.monthlyDca" :min="0" :step="50" style="width: 100%" />
            </el-form-item>

            <el-form-item label="Taux d'intérêt estimé (%)">
              <el-slider v-model="form.expectedAnnualReturn" :min="1" :max="20" :step="0.5" show-input />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitPlan" :loading="loading" class="submit-btn">
                Générer le plan
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="form-card allocation-card" shadow="hover">
          <h3 class="allocation-title">Répartition des investissements</h3>
          
          <div v-for="(item, index) in form.allocations" :key="index" class="allocation-block">
            <div class="allocation-row">
              <el-input v-model="item.name" placeholder="Nom (ex: Actions)" class="allocation-input" />
              <el-input-number v-model="item.value" :min="0" :max="100" class="allocation-number" />
              <span class="allocation-percent">%</span>
              <el-button type="danger" @click="removeAllocation(index)" circle size="small">X</el-button>
            </div>
            
            <div class="sub-allocations-container">
              <div v-for="(sub, sIndex) in item.subAllocations" :key="sIndex" class="sub-allocation-row">
                <span class="sub-arrow">↳</span>
                <el-input v-model="sub.name" placeholder="Sous-section..." size="small" class="sub-input" />
                <el-input-number v-model="sub.value" :min="0" :max="100" size="small" class="sub-number" />
                <span class="sub-percent">%</span>
                <el-button type="danger" @click="removeSubAllocation(index, sIndex)" circle size="small" plain>X</el-button>
              </div>
              <el-button type="primary" link @click="addSubAllocation(index)" class="add-sub-btn" size="small">
                + Ajouter une sous-section
              </el-button>
              
              <div v-if="item.subAllocations && item.subAllocations.length > 0 && getSubTotal(index) !== 100" class="sub-error-text">
                Total sous-section : {{ getSubTotal(index) }}% (Devrait être 100%)
              </div>
            </div>
          </div>

          <el-button type="default" @click="addAllocation" class="add-btn">
            + Ajouter une section
          </el-button>

          <div v-if="totalAllocation !== 100" class="error-text">
            Total : {{ totalAllocation }}% (Devrait être 100%)
          </div>

          <div class="pie-chart-container">
            <v-chart class="chart pie-chart" :option="pieChartOptions" autoresize />
          </div>
        </el-card>
      </div>

      <div class="right-column">
        <el-card class="chart-card" shadow="hover">
          <v-chart class="chart" :option="chartOptions" autoresize />
          

          <div class="final-resume">
            <div class="final-value-container">
              <h3>Total à la fin de l'investissement:</h3>
              <span class="final-amount">€{{ finalBalance.toLocaleString(undefined, {maximumFractionDigits: 0}) }}</span>
            </div>
            <div class="final-value-container">
              <h3>Gain total:</h3>
              <span class="final-amount">€{{ finalGain.toLocaleString(undefined, {maximumFractionDigits: 0}) }}</span>
            </div>
            <div class="final-value-container">
              <h3>Gain mensuel:</h3>
              <span class="final-amount">€{{ monthlyGain.toLocaleString(undefined, {maximumFractionDigits: 0}) }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="chart-card invest-allocation-card" shadow="hover">
          <div class="allocation-header-container">
            <h3 class="allocation-title">Montant investi par allocation</h3>
            <el-button v-if="isCustomInvested" size="small" type="primary" link @click="isCustomInvested = false">
              Réinitialiser
            </el-button>
          </div>
          
          <div class="custom-amount-slider">
            <span class="slider-label">Capital de référence: <strong>€{{ displayInvestedAmount.toLocaleString(undefined, {maximumFractionDigits: 0}) }}</strong></span>
            <el-slider 
              v-model="displayInvestedAmount" 
              :min="0" 
              :max="Math.max(totalInvested * 3, 100000)" 
              :step="1000" 
              :show-tooltip="false"
            />
          </div>

          <div class="allocation-amounts-list">
            <div v-for="item in investedPerAllocation" :key="item.name" class="amount-item">
              <div class="amount-row">
                <span class="amount-name">{{ item.name }}</span>
                <span class="amount-value">€{{ item.amount.toLocaleString(undefined, {maximumFractionDigits: 0}) }}</span>
              </div>
              <div v-if="item.subAllocations && item.subAllocations.length" class="sub-amount-list">
                <div v-for="sub in item.subAllocations" :key="sub.name" class="sub-amount-row">
                  <span class="sub-amount-name">↳ {{ sub.name }}</span>
                  <span class="sub-amount-value">€{{ sub.amount.toLocaleString(undefined, {maximumFractionDigits: 0}) }}</span>
                </div>
              </div>
            </div>
            
            <el-divider></el-divider>
            
            <div class="amount-row total-invested-row">
              <span class="amount-name">Total distribué</span>
              <span class="amount-value">€{{ displayInvestedAmount.toLocaleString(undefined, {maximumFractionDigits: 0}) }}</span>
            </div>
            <div v-if="isCustomInvested" class="amount-row real-total-row">
              <span class="amount-name">Total investi réel</span>
              <span class="amount-value">€{{ totalInvested.toLocaleString(undefined, {maximumFractionDigits: 0}) }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </el-main>
  </el-container>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background-color: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.app-header h2 {
  margin: 0;
  font-weight: 500;
}

.el-main {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 50px;
}

.left-column {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-card {
  width: 100%;
  border-radius: 8px;
}

.allocation-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  color: #303133;
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
  margin-top: 20px;
  height: 350px;
  width: 100%;
}

.pie-chart {
  height: 100%;
  width: 100%;
}

.submit-btn {
  width: 100%;
  margin-top: 20px;
}

.right-column {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-left: 20px;
}

.chart-card {
  width: 100%;
  border-radius: 8px;
}

.amount-item {
  margin-bottom: 15px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.amount-value {
  color: #409EFF;
  font-weight: bold;
}

.sub-amount-list {
  margin-top: 8px;
  padding-left: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sub-amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.sub-amount-value {
  color: #909399;
}

.total-invested-row {
  margin-top: 15px;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}
.total-invested-row .amount-value {
  color: #67c23a;
}

.real-total-row {
  margin-top: 5px;
  font-size: 14px;
  color: #909399;
}
.real-total-row .amount-value {
  color: #909399;
  font-weight: normal;
}

.allocation-header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.allocation-header-container .allocation-title {
  margin-bottom: 0;
}

.custom-amount-slider {
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.slider-label {
  display: block;
  margin-bottom: 15px;
  font-size: 14px;
  color: #606266;
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
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-top: 5px;
}

/* Mobile Responsiveness */
@media (max-width: 1140px) {
  .el-main {
    flex-direction: column;
    align-items: center;
    padding: 20px 10px;
  }
  .left-column, .right-column {
    max-width: 100%;
  }
  .right-column {
    margin-left: 0;
    margin-top: 20px;
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
  .allocation-row, .sub-allocation-row {
    flex-wrap: wrap;
  }
  .allocation-input, .sub-input {
    flex: 1 1 100%;
  }
  .chart, .pie-chart-container {
    height: 300px;
  }
  .allocation-header-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .amount-row {
    font-size: 14px;
  }
  .total-invested-row {
    font-size: 16px;
  }
}

.chart-card :deep(.el-card__body) {
  overflow: visible;
}
</style>


