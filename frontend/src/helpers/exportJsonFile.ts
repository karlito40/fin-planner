import { Capacitor } from '@capacitor/core';

export function exportJsonFile({ data, filename }: { data: any, filename: string }) {
  if (Capacitor.isNativePlatform()) {
    return  exportViaCapacitor({ data, filename });
  }
  return exportViaBlob({ data, filename });
}

function exportViaBlob({ data, filename }: { data: any, filename: string }) {
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
    }, 0)
  })
}
  

async function exportViaCapacitor({ data, filename }: { data: any, filename: string }) {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');

  const result = await Filesystem.writeFile({
    path: filename,
    data: JSON.stringify(data, null, 2),
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });

  await Share.share({ title: filename, url: result.uri });
}