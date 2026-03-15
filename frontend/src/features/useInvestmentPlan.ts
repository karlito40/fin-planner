import { importFile } from "../helpers/importFile"
import { exportJsonFile } from "../helpers/exportJsonFile"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { ID } from "../helpers/ID"
import { Storage } from "../libs/storage"

const STORAGE_KEY = 'finplanner:plans'

export function useInvestmentPlan() {
  const savedPlans = ref<any[]>(Storage.get(STORAGE_KEY))

  async function importPlans() {
    try {
      const plans = await importFile({ type: 'application/json' })
      if (Array.isArray(plans)) {
        savedPlans.value = plans
        Storage.set(STORAGE_KEY, savedPlans.value)
        ElMessage.success('Plans importés avec succès!')
      } else {
        ElMessage.error('Le fichier ne contient pas de plans valides.')
      }
    } catch(e) {
      ElMessage.error('Erreur lors de la lecture du fichier JSON.')
    }
  }

  async function exportPlans() {
    if (savedPlans.value.length === 0) {
      ElMessage.warning('Aucun plan à exporter')
      return
    }

    await exportJsonFile({ data: savedPlans.value, filename: 'finplanner.json' })
    ElMessage.success('Plans exportés avec succès!')
  }

  function savePlan(form: any) {
    const planToSave = JSON.parse(JSON.stringify(form))
    if (!planToSave.id) {
      planToSave.id = ID()
      savedPlans.value.push(planToSave)
    } else {
      const index = savedPlans.value.findIndex((plan: any) => plan.id === planToSave.id)
      if (index !== -1) {
        savedPlans.value[index] = planToSave
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlans.value))
    ElMessage.success('Plan successfully saved!')

    return planToSave
  }

  function deletePlan(plan: any) {
    const index = savedPlans.value.findIndex((p: any) => p.id === plan.id)
    if (index !== -1) {
      savedPlans.value.splice(index, 1)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlans.value))
      ElMessage.success('Plan supprimé!')
    }
  }

  return {
    savedPlans,
    importPlans,
    savePlan,
    deletePlan,
    exportPlans
  }
}

export function getPlanById(planId: string) {
  const plans = Storage.get(STORAGE_KEY) || []
  return plans.find((plan: any) => plan.id === planId)
} 