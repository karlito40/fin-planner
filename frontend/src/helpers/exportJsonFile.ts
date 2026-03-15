export function exportJsonFile({ data, filename }: { data: any, filename: string }) {
  return new Promise(resolve => {
    const dataStr = JSON.stringify(data, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      link.remove()
      URL.revokeObjectURL(url)
      resolve(undefined)
    }, 2)
  })
}