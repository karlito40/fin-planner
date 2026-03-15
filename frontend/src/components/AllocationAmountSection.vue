<template>
  <div class="AllocationAmountSection">
    <div class="custom-amount-slider">
      <span class="slider-label">Capital de référence: <strong>€{{ displayInvestedAmount!.toLocaleString(undefined, {maximumFractionDigits: 0}) }}</strong></span>
      <el-slider 
        v-model="displayInvestedAmount" 
        :min="0" 
        :max="Math.max(totalInvested * 3, 100000)" 
        :step="1000" 
        :show-tooltip="false"
      />
    </div>

    <div class="allocation-amount-list">
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
        <span class="amount-value">€{{ displayInvestedAmount!.toLocaleString(undefined, {maximumFractionDigits: 0}) }}</span>
      </div>
      <div v-if="isCustomInvested" class="amount-row real-total-row">
        <span class="amount-name">Total investi réel</span>
        <span class="amount-value">€{{ totalInvested.toLocaleString(undefined, {maximumFractionDigits: 0}) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const displayInvestedAmount = defineModel('displayInvestedAmount', { type: Number })

defineProps<{ 
  totalInvested: number,
  investedPerAllocation: any[],
  isCustomInvested: boolean
 }>()

</script>

<style scoped>
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

</style>