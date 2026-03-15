<template>
  <div class="PlanListSection">
    <div v-for="(plan, index) in plans" :key="index" class="plan-item">
      <el-button size="small" @click="$emit('click:load', plan)">
        {{ plan.title || 'Plan sans titre' }}
      </el-button>
      <el-button class="delete-btn" type="danger" circle plain size="small" @click="$emit('click:delete', index)">X</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">

defineProps<{ plans: any[] }>()
defineEmits(['click:load', 'click:delete'])
</script>

<style scoped>
.PlanListSection {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.plan-item { 
  display: flex; 
  align-items: center;
}

.delete-btn { margin-left: 0.4rem; }
</style>