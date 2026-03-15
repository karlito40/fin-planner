<template>
  <el-form :model="form" label-position="top">
    <el-form-item label="Mon plan">
      <el-input v-model="form.title" placeholder="Millionaire en 20 ans, ..." />
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
      <!-- should be on el-form but not possible with element -->
      <el-button v-if="form.title && form.timeHorizon && form.initialCapital && form.monthlyDca && form.expectedAnnualReturn" type="primary" class="submit-btn" @click="$emit('submit')">
        Générer le plan
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
defineEmits(['submit'])
defineProps<{ form: any }>()
</script>