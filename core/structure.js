import {
  rgbToHex, getColorsVariance
} from '../utils/index.js'

export function extractSkeleton (imageData) {
  extractBlocks(imageData)
}

function extractBlocks (imageData) {
  const {data, width, height} = imageData
  const firstColumnData = getColumnData(imageData, 0)
  const lastColumnData = getColumnData(imageData, (width - 1) * 4)
  compareLineData(firstColumnData, lastColumnData)
}

function getColumnData (imageData, index) {
  const {data, width, height} = imageData
  const colors = []
  const counts = []
  for (let i = index; i < data.length; i += width * 4) {
    const lastColorIndex = i - width * 4
    const lastColor = (
      lastColorIndex >= 0 ?
      rgbToHex(
        data[lastColorIndex],
        data[lastColorIndex + 1],
        data[lastColorIndex + 2]
      ) :
      null
    )
    const color = rgbToHex(data[i], data[i + 1], data[i + 2])
    if (
      lastColor &&
      getColorsVariance(color, lastColor) < 5
    ) {
      counts[counts.length - 1]++
    } else {
      colors.push(color)
      counts.push(1)
    }
  }
  const columnData = colors.map((color, index) => {
    const length = counts[index]
    return {color, length}
  })
  return columnData
}

function compareLineData (lineDataA, lineDataB) {
  console.log(lineDataA)
  console.log(lineDataB)
  const sameBlocksNumber = (
    lineDataA.length === lineDataB.length
  )
  const sameBlocksState = lineDataA
    .every((block, index) => {
      const anotherBlock = lineDataB[index]
      // todo
    })
}
