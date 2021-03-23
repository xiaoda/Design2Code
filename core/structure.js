import {
  rgbToHex, getColorsVariance, roundSize
} from '../utils/index.js'

export function extractSkeleton (imageData) {
  let blocks = extractBlocks(imageData)
  blocks = filterUselessBlocks(blocks)
  blocks = blocks.map(block => checkPadding(imageData, block))
  console.log(blocks)
}

function extractBlocks (imageData) {
  const {data, width, height} = imageData
  const firstColumnData = getColumnData(imageData, 0)
  const lastColumnData = getColumnData(imageData, (width - 1) * 4)
  let blocks = []
  if (compareLineData(firstColumnData, lastColumnData)) {
    blocks = firstColumnData
  }
  return blocks
}

function filterUselessBlocks (blocks) {
  if (window.WECHAT_HEADER) {
    const firstBlock = blocks[0]
    const colorsVariance = getColorsVariance(
      firstBlock.color, '1a191e'
    )
    const lengthDiff = Math.abs(firstBlock.length - 128)
    if (colorsVariance < 5 && lengthDiff < 3) {
      blocks.shift()
    }
  }
  return blocks
}

function checkPadding (imageData, block) {
  const {width, height, data} = imageData
  const {color, start, length} = block
  let padding = 0
  let paddingFound = false
  for (let i = width * start; i < width * (start + 1); i += 1) {
    if (paddingFound) break
    for (let j = 0; j < width * length; j += width) {
      if (paddingFound) break
      const index = (i + j) * 4
      const tempColor = rgbToHex(
        data[index],
        data[index + 1],
        data[index + 2]
      )
      const colorsVariance = getColorsVariance(
        color, tempColor
      )
      if (colorsVariance > 5) {
        padding = roundSize(i % width)
        paddingFound = true
      }
    }
  }
  block.padding = padding
  return block
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
  const columnData = []
  for (let i = 0; i < colors.length; i++) {
    const color = colors[i]
    const length = counts[i]
    const start = i > 0 ? (
      columnData[i - 1].start +
      columnData[i - 1].length
    ) : 0
    const item = {color, start, length}
    columnData.push(item)
  }
  return columnData
}

function compareLineData (lineDataA, lineDataB) {
  const sameBlocksNumber = (
    lineDataA.length === lineDataB.length
  )
  const sameBlocksState = lineDataA
    .every((block, index) => {
      const anotherBlock = lineDataB[index]
      const colorsVariance = getColorsVariance(
        block.color, anotherBlock.color
      )
      const lengthDiff = Math.abs(
        block.length - anotherBlock.length
      )
      return colorsVariance < 5 && lengthDiff < 3
    })
  return sameBlocksNumber && sameBlocksState
}
