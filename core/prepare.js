import ColorCounter from '../utils/color-counter.js'
import {rgbToHex} from '../utils/index.js'

export function checkDesign (imageData) {
  checkBoundary(imageData)
}

function checkBoundary (imageData) {
  const {
    data, width, height
  } = imageData

  // Left Boundary
  let extraLineOnLeft = false
  {}

  // Right Boundary
  let extraLineOnRight = false
  if (!extraLineOnLeft) {
    const {
      extraLineFound, count
    } = checkExtraLineVertically(imageData, 'right')
    console.log(extraLineFound, count)
  }

  // Top Boundary
  let extraLineOnTop = false
  {}
}

function checkExtraLineVertically (imageData, direction) {
  const {
    data, width, height
  } = imageData
  const lineDataGroup = []
  let extraLineFound = false
  let count = 0
  while (
    !extraLineFound &&
    count < 3
  ) {
    const start = (
      direction === 'left' ?
      0 :
      (width - 1 - count) * 4
    )
    const step = width * 4
    const lineData = getLineDataByLoop(
      imageData, start, step
    )
    if (lineDataGroup.length) {
      const lastLineData = lineDataGroup[
        lineDataGroup.length - 1
      ]
      const lastLineAverage = lastLineData.getAverage()
      const lastLineVariance = lastLineData.getVariance()
      const lineAverage = lineData.getAverage()
      const lineVariance = lineData.getVariance()
      const varianceOfLines = lineData
        .getVarianceFromAnother(lastLineData)
      const conditionA = (
        lastLineVariance < 1 &&
        lineVariance > 100
      )
      const conditionB = (
        lastLineVariance < 1 &&
        lineVariance < 1 &&
        varianceOfLines > 100
      )
      if (conditionA || conditionB) {
        extraLineFound = true
        break
      }
    }
    lineDataGroup.push(lineData)
    count++
  }
  return {extraLineFound, count}
}

function getLineDataByLoop (imageData, start, step, stop) {
  const {data} = imageData
  const lineData = new ColorCounter()
  if (!stop) stop = data.length
  for (let i = start; i < stop; i += step) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const hex = rgbToHex(r, g, b)
    lineData.addValue(hex)
  }
  return lineData
}
