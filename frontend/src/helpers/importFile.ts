export function importFile({ type = 'application/json' }: { type: 'application/json'}) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = type
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const result = event.target?.result as string
          const parsed = JSON.parse(result)
          resolve(parsed)
        } catch (err) {
          reject(new Error('Erreur lors de la lecture du fichier JSON.'))
        } finally {
          input.remove()
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })
  
}