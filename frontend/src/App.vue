<script setup lang="ts">
import { ref, reactive } from 'vue'
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


const savedPlans = ref<any[]>([])
loadPlans()

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


async function loadPlans() {
  const plans = localStorage.getItem('finplanner:plans')
  if (plans) {
    try {
      savedPlans.value = JSON.parse(plans)
    } catch (e) {
      console.error('Failed to parse saved plans', e)
    }
  }
}

const submitPlan = () => {
  const planToSave = JSON.parse(JSON.stringify(form))
  savedPlans.value.push(planToSave)
  localStorage.setItem('finplanner:plans', JSON.stringify(savedPlans.value))
  ElMessage.success('Plan successfully saved!')
}

const loadPlan = (plan: any) => {
  Object.assign(form, JSON.parse(JSON.stringify(plan)))
  ElMessage.info(`Plan chargé: ${plan.title || 'Sans titre'}`)
}

const deletePlan = (index: number) => {
  savedPlans.value.splice(index, 1)
  localStorage.setItem('finplanner:plans', JSON.stringify(savedPlans.value))
  ElMessage.success('Plan supprimé!')
}

const exportPlans = () => {
  if (savedPlans.value.length === 0) {
    ElMessage.warning('Aucun plan à exporter')
    return
  }
  const dataStr = JSON.stringify(savedPlans.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'finplanner.json')
  document.body.appendChild(link)
  link.click()
  // document.body.removeChild(link)
  
  // setTimeout(() => {
  //   URL.revokeObjectURL(url)
  // }, 1000)

  ElMessage.success('Plans exportés avec succès!')
}

const importPlans = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.onchange = (e) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string
        const parsed = JSON.parse(result)
        if (Array.isArray(parsed)) {
          savedPlans.value = parsed
          localStorage.setItem('finplanner:plans', JSON.stringify(savedPlans.value))
          ElMessage.success('Plans importés avec succès!')
        } else {
          ElMessage.error('Le fichier ne contient pas de plans valides.')
        }
      } catch (err) {
        ElMessage.error('Erreur lors de la lecture du fichier JSON.')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}
</script>

<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <h2>Investment Planner</h2>
      <div class="spacer"></div>
      <el-button size="default" plain @click="importPlans">
        Importer
        <el-icon class="el-icon--right">
          <Upload />
        </el-icon>
      </el-button>
      <el-button size="default" plain @click="exportPlans">
        Exporter
        <el-icon class="el-icon--right">
          <Download />
        </el-icon>
      </el-button>
    </el-header>
    <el-main>
      <div class="left-column">
        <el-card v-if="savedPlans.length > 0" class="form-card plans-card" shadow="hover">
          <h3 class="card-title">Plans Sauvegardés</h3>
          <div class="plans-card__body">
            <div v-for="(plan, index) in savedPlans" :key="index" style="display: flex; align-items: center;">
              <el-button size="small" @click="loadPlan(plan)">
                {{ plan.title || 'Plan sans titre' }}
              </el-button>
              <el-button class="delete-btn" type="danger" circle plain size="small" @click="deletePlan(index)">X</el-button>
            </div>
          </div>
        </el-card>

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
              <el-button type="primary" class="submit-btn" @click="submitPlan">
                Générer le plan
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="form-card allocation-card" shadow="hover">
          <h3 class="card-title">Répartition des investissements</h3>
          
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
                <el-input v-model="sub.name" placeholder="Sous-section..." size="small" class="sub-input" />
                <el-input-number v-model="sub.value" :min="0" :max="100" size="small" class="sub-number" />
                <span class="sub-percent">%</span>
                <el-button type="danger" circle size="small" plain @click="removeSubAllocation(index, sIndex)">X</el-button>
              </div>
              <el-button type="primary" link class="add-sub-btn" size="small" @click="addSubAllocation(index)">
                + Ajouter une sous-section
              </el-button>
              
              <div v-if="item.subAllocations && item.subAllocations.length > 0 && getSubTotal(index) !== 100" class="sub-error-text">
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
            <h3 class="card-title">Montant investi par allocation</h3>
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
  display: flex;
  align-items: center;
  background-color: #409EFF;
  color: white;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.spacer { flex: 1 }

.export-btn {
  
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

.card-title {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1rem;
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

.chart-card {
  width: 100%;
  border-radius: 8px;
}

.amount-item {
  margin-bottom: 0.9rem;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  font-weight: 500;
  color: #303133;
}

.amount-value {
  color: #409EFF;
  font-weight: bold;
}

.sub-amount-list {
  margin-top: 0.3rem;
  padding-left: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.sub-amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #606266;
}

.sub-amount-value {
  color: #909399;
}

.total-invested-row {
  margin-top: 0.9rem;
  font-size: 1rem;
  font-weight: bold;
  color: #303133;
}
.total-invested-row .amount-value {
  color: #67c23a;
}

.real-total-row {
  margin-top: 0.3rem;
  font-size: 0.9rem;
  color: #909399;
}
.real-total-row .amount-value {
  color: #909399;
  font-weight: normal;
}

.custom-amount-slider {
  margin-bottom: 1.5rem;
  padding: 0.9rem;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.slider-label {
  display: block;
  margin-bottom: 0.9rem;
  font-size: 0.9rem;
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
  font-size: 1.75rem;
  font-weight: bold;
  color: #303133;
  margin-top: 0.3rem;
}

/* Mobile Responsiveness */
@media (max-width: 1140px) {
  .el-main {
    flex-direction: column;
    align-items: center;
    padding: 1.2rem 0.6rem;
  }
  .left-column, .right-column {
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
    font-size: 0.9rem;
  }
  .total-invested-row {
    font-size: 1rem;
  }
}

.chart-card :deep(.el-card__body) {
  overflow: visible;
}

.delete-btn { margin-left: 0.4rem; }

.plans-card { margin-bottom: 0.3rem; }
.plans-card__body {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
</style>


