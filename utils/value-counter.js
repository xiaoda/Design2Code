class ValueCounter {
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

  useCache (name, callback) {
    if (Object.keys(this.cache).includes(name)) {
      return this.cache[name]
    } else {
      const result = callback()
      this.cache[name] = result
      return result
    }
  }

  clearCache () {
    this.cache = {}
  }
}

export default ValueCounter
