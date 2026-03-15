import { importFile } from "../helpers/importFile"
import { exportJsonFile } from "../helpers/exportJsonFile"
import { ElMessage } from "element-plus"
import { ref } from "vue"

const STORAGE_KEY = 'finplanner:plans'

export function useInvestmentPlan() {
  const savedPlans = ref<any[]>([])
  loadPlans()

  async function loadPlans() {
    const plans = localStorage.getItem(STORAGE_KEY)
    if (plans) {
      try {
        savedPlans.value = JSON.parse(plans)
      } catch (e) {
        console.error('Failed to parse saved plans', e)
      }
    }
  }

  async function importPlans() {
    try {
      const plans = await importFile({ type: 'application/json' })
      if (Array.isArray(plans)) {
        savedPlans.value = plans
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlans.value))
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
    savedPlans.value.push(planToSave)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlans.value))
    ElMessage.success('Plan successfully saved!')
  }

  function deletePlan(index: number) {
    savedPlans.value.splice(index, 1)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlans.value))
    ElMessage.success('Plan supprimé!')
  }


  return {
    savedPlans,
    importPlans,
    savePlan,
    deletePlan,
    exportPlans
  }
}

