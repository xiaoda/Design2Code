export default class ValueCounter {
  constructor () {
    this.init()
  }

  init () {
    this.allValues = []
    this.totalCount = 0
    this.valueCountMap = {}
    this.cache = {}
  }

  addValue (value) {
    const valueAlreadyExists = Object
      .keys(this.valueCountMap)
      .includes(value)
    if (valueAlreadyExists) {
      this.valueCountMap[value] ++
    } else {
      this.valueCountMap[value] = 1
    }
    this.totalCount = this.allValues.push(value)
    this.clearCache()
  }

  getFirstValueByCount () {
    const cacheKey = `firstValueByCountOrderDesc`
    return this.useCache(cacheKey, _ => {
      let firstValue
      let tempCount = 0
      for (const value in this.valueCountMap) {
        const count = this.valueCountMap[value]
        if (count > tempCount) {
          firstValue = value
          tempCount = count
        }
      }
      return firstValue
    })
  }

  getAllValuesByCount (order = 'desc') {
    const capitalizedOrder = `${order[0].toUpperCase()}${order.slice(1)}`
    const cacheKey = `allValuesByCountOrder${capitalizedOrder}`
    return this.useCache(cacheKey, _ => {
      let sortedAllValues = []
      for (const value in this.valueCountMap) {
        const count = this.valueCountMap[value]
        let inserted = false
        for (let i = 0; i < sortedAllValues.length; i++) {
          const tempValue = sortedAllValues[i]
          const tempCount = this.valueCountMap[tempValue]
          if (count > tempCount) {
            sortedAllValues.splice(i, 0, value)
            inserted = true
            break
          }
        }
        if (!inserted) {
          sortedAllValues.push(value)
        }
      }
      if (order === 'asc') {
        sortedAllValues = sortedAllValues.reverse()
      }
      return sortedAllValues
    })
  }

  useCache (key, callback) {
    if (Object.keys(this.cache).includes(key)) {
      return this.cache[key]
    } else {
      const result = callback()
      this.cache[key] = result
      return result
    }
  }

  clearCache () {
    this.cache = {}
  }
}
