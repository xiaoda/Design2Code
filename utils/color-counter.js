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

  getVariance () {
    return this.useCache('variance', _ => {
      const {
        r: averageR,
        g: averageG,
        b: averageB
      } = hexToRgb(this.getAverage())
      const varianceSum = {
        r: 0, g: 0, b: 0
      }
      for (const hex in this.valueCountMap) {
        const {r, g, b} = hexToRgb(hex)
        const count = this.valueCountMap[hex]
        varianceSum.r += (r - averageR) ** 2 * count
        varianceSum.g += (g - averageG) ** 2 * count
        varianceSum.b += (b - averageB) ** 2 * count
      }
      const variance = (
        varianceSum.r ** 2 +
        varianceSum.g ** 2 +
        varianceSum.b ** 2
      ) ** 0.5 / this.totalCount
      return variance
    })
  }

  getVarianceFromAnother (another) {
    const varianceSum = {
      r: 0, g: 0, b: 0
    }
    for (let i = 0; i < this.totalCount; i++) {
      const {r, g, b} = hexToRgb(this.allValues[i])
      const {
        r: anotherR,
        g: anotherG,
        b: anotherB
      } = hexToRgb(another.allValues[i])
      varianceSum.r += (r - anotherR) ** 2
      varianceSum.g += (g - anotherG) ** 2
      varianceSum.b += (b - anotherB) ** 2
    }
    const variance = (
      varianceSum.r ** 2 +
      varianceSum.g ** 2 +
      varianceSum.b ** 2
    ) ** 0.5 / this.totalCount
    return variance
  }

  getStandardDeviation () {
    return this.useCache('standardDeviation', _ => {
      const variance = this.getVariance()
      const standardDeviation = variance ** 0.5
      return standardDeviation
    })
  }
}
