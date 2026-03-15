<template>
  <div class="PlanListSection">
    <router-link :to="{ name: 'plan:new' }">
      <el-button size="small" dashed>
        Ajouter
        <el-icon class="el-icon--right">
          <Plus />
        </el-icon>
      </el-button>
    </router-link>

    <div v-for="plan in plans" :key="plan.id" class="plan-item">
      <router-link :to="{ name: 'plan:edit', params: { planId: plan.id } }">
        <el-button size="small">
          {{ plan.title || 'Plan sans titre' }}
        </el-button>
      </router-link>

      <el-button class="delete-btn" type="danger" circle plain size="small" @click="$emit('click:delete', plan)">
        X
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ plans: any[] }>()
defineEmits(['click:load', 'click:delete', 'click:add'])
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

.delete-btn {
  margin-left: 0.4rem;
}
</style>