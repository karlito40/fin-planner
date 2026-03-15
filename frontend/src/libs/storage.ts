const cache = new Map()
export const Storage = {
  get(key: string) {
    if (cache.has(key)) {
      return cache.get(key)
    }

    const item = localStorage.getItem(key)
    const parsedItem = item ? JSON.parse(item) : null
    cache.set(key, parsedItem)
    return parsedItem
  },
  set(key: string, value: any) {
    cache.set(key, value)
    localStorage.setItem(key, JSON.stringify(value))
  },
  remove(key: string) {
    cache.delete(key)
    localStorage.removeItem(key)
  }
}