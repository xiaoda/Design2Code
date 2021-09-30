import {
  startProcess, endProcess, rgbToHex
} from '../utils/index.js'
import ColorCounter from '../utils/color-counter.js'

const PIXEL_EXTRA_LINE_LIMIT = 4
const VARIANCE_MIN_LIMIT = 1
const VARIANCE_MAX_LIMIT = 30

export function checkDesign (imageData) {
  imageData = checkBoundary(imageData)
  return imageData
}

function checkBoundary (imageData) {
  startProcess('checkBoundary', _ => console.info(_))
  const {data, width, height} = imageData

  // Left Boundary
  let extraLineOnLeft = false
  {
    const {
      extraLineFound, index
    } = checkExtraLine(imageData, 'left')
    if (extraLineFound) {
      extraLineOnLeft = true
      imageData = correctImageData(imageData, 'left', index)
    }
  }

  // Right Boundary
  let extraLineOnRight = false
  if (!extraLineOnLeft) {
    const {
      extraLineFound, index
    } = checkExtraLine(imageData, 'right')
    if (extraLineFound) {
      extraLineOnRight = true
      imageData = correctImageData(imageData, 'right', index)
    }
  }

  // Top Boundary
  let extraLineOnTop = false
  {}

  if (
    extraLineOnLeft ||
    extraLineOnRight ||
    extraLineOnTop
  ) {
    window.ctx.putImageData(imageData, 0, 0)
  }
  endProcess('checkBoundary', _ => console.info(_))
  return imageData
}

function checkExtraLine (imageData, direction) {
  const {data, width, height} = imageData
  const lineDataGroup = []
  let extraLineFound = false
  let count = 0
  while (
    !extraLineFound &&
    count < PIXEL_EXTRA_LINE_LIMIT
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
      const lastLineVariance = lastLineData.getStandardVariance()
      const lineAverage = lineData.getAverage()
      const lineVariance = lineData.getStandardVariance()
      const varianceOfLines = lineData
        .getStandardVarianceFromAnother(lastLineData)
      const conditionA = (
        lastLineVariance < VARIANCE_MIN_LIMIT &&
        lineVariance > VARIANCE_MAX_LIMIT
      )
      const conditionB = (
        lastLineVariance < VARIANCE_MIN_LIMIT &&
        lineVariance < VARIANCE_MIN_LIMIT &&
        varianceOfLines > VARIANCE_MAX_LIMIT
      )
      if (conditionA || conditionB) {
        extraLineFound = true
        break
      }
    }
    lineDataGroup.push(lineData)
    count++
  }
  if (extraLineFound) console.warn(
    `Extra lines found on ${direction} with ${count} pixels.`
  )
  return {
    extraLineFound,
    index: count
  }
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

function correctImageData (imageData, direction, index) {
  const {data, width, height} = imageData
  const newImageData = new ImageData(width, height)
  for (let i = 0; i < data.length; i += 4) {
    const indexInRow = (i / 4) % width
    const indexFromBehindInRow = width - 1 - indexInRow
    const firstIndexInRow = Math.floor(i / 4 / width) * width
    const lastIndexInRow = Math.ceil(i / 4 / width) * width
    let j
    switch (direction) {
      case 'left': {
        j = (
          indexFromBehindInRow < index ?
          lastIndexInRow * 4 :
          i + index * 4
        )
        break
      }
      case 'right': {
        j = (
          indexInRow < index ?
          firstIndexInRow * 4 :
          i - index * 4
        )
        break
      }
    }
    newImageData.data[i] = data[j]
    newImageData.data[i + 1] = data[j + 1]
    newImageData.data[i + 2] = data[j + 2]
    newImageData.data[i + 3] = data[j + 3]
  }
  return newImageData
}
