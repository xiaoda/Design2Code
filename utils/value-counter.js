class ValueCounter {
  constructor () {
    this.init()
  }

  init () {
    this.allValues = []
    this.totalCount = 0
    this.valueCountMap = {}
    this.cache = {}
    this.cacheId = null
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

  checkCache (key) {
    return Object.keys(this.cache).includes(key)
  }

  getCache (key) {
    return this.cache[key]
  }

  setCache (key, value) {
    this.cache[key] = value
  }

  clearCache () {
    this.cache = {}
  }
}

export default ValueCounter
