<template>
  <el-card class="FinPlannerCard finplanner-card" shadow="hover">
    <div class="finplanner-card__header">
      <h3 class="card-title">
        {{ title }}
      </h3>
      <slot name="header-actions"></slot>
    </div>
    <div class="finplanner-card__body">
      <slot></slot>
    </div>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>