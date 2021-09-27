import ValueCounter from './value-counter.js'
import {
  hexToRgb, rgbToHex
} from './index.js'

export default class ColorCounter extends ValueCounter {
  getAverage () {
    return this.useCache('average', _ => {
      const sum = {
        r: 0, g: 0, b: 0
      }
      for (const hex in this.valueCountMap) {
        const count = this.valueCountMap[hex]
        const {r, g, b} = hexToRgb(hex)
        sum.r += r * count
        sum.g += g * count
        sum.b += b * count
      }
      const average = rgbToHex(
        Math.floor(sum.r / this.totalCount),
        Math.floor(sum.g / this.totalCount),
        Math.floor(sum.b / this.totalCount)
      )
      return average
    })
  }

  getStandardVariance () {
    return this.useCache('variance', _ => {
      const {
        r: averageR,
        g: averageG,
        b: averageB
      } = hexToRgb(this.getAverage())
      let varianceSum = 0
      for (const hex in this.valueCountMap) {
        const {r, g, b} = hexToRgb(hex)
        const count = this.valueCountMap[hex]
        const variance = (
          (r - averageR) ** 2 +
          (g - averageG) ** 2 +
          (b - averageB) ** 2
        ) ** 0.5 * count
        varianceSum += variance
      }
      const averageVariance = varianceSum / this.totalCount
      return averageVariance
    })
  }

  getStandardVarianceFromAnother (another) {
    let varianceSum = 0
    for (let i = 0; i < this.totalCount; i++) {
      const {r, g, b} = hexToRgb(this.allValues[i])
      const {
        r: anotherR,
        g: anotherG,
        b: anotherB
      } = hexToRgb(another.allValues[i])
      const averageR = (r + anotherR) / 2
      const averageG = (g + anotherG) / 2
      const averageB = (b + anotherB) / 2
      const variance = (
        (r - averageR) ** 2 +
        (g - averageG) ** 2 +
        (b - averageB) ** 2
      ) ** 0.5
      varianceSum += variance
    }
    const averageVariance = varianceSum / this.totalCount
    return averageVariance
  }

  getStandardDeviation () {
    return this.useCache('standardDeviation', _ => {
      const variance = this.getVariance()
      const standardDeviation = variance ** 0.5
      return standardDeviation
    })
  }
}
