<script setup lang="ts">
import { useInvestmentPlan } from './features/useInvestmentPlan'

const { importPlans, exportPlans } = useInvestmentPlan()
</script>

<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <h2>Investment Planner</h2>
      <div class="spacer"></div>

      <el-button size="default" plain @click="importPlans">
        <span class="hidden-sm-and-down">Importer</span>
        <el-icon class="el-icon--right">
          <Upload />
        </el-icon>
      </el-button>
      <el-button size="default" plain @click="exportPlans">
        <span class="hidden-sm-and-down">Exporter</span>
        <el-icon class="el-icon--right">
          <Download />
        </el-icon>
      </el-button>
    </el-header>
    <el-main>
      <router-view />
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
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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

/* Mobile Responsiveness */
@media (max-width: 1140px) {
  .el-main {
    flex-direction: column;
    align-items: center;
    padding: 1.2rem 0.6rem;
  }
}
</style>
