import {sobel} from '../utils/edge-detection.js'

const PIXEL_GRAY_LIMIT = 5
const PIXEL_DISTANCE_LIMIT = 3

export function extractSkeleton (imageData) {
  const edgeImageData = detectEdge(imageData)
  const rawStuff = extractRawStuff(edgeImageData)
  const stuff = processRawStuff(rawStuff)
}

function detectEdge (imageData) {
  const edgeImageData = sobel(imageData)
  window.processCtx.putImageData(edgeImageData, 0, 0)
  return edgeImageData
}

function extractRawStuff (imageData) {
  const {width, height, data} = imageData
  const allStuffByLine = []
  for (let i = 0; i < height; i++) {
    const lineStuff = []
    let tempStuff = []
    for (let j = 0; j < width; j++) {
      const index = (i * width + j) * 4
      const gray = data[index]
      if (gray > PIXEL_GRAY_LIMIT) {
        tempStuff.push(j)
      } else {
        if (tempStuff.length) {
          const lastJ = tempStuff[tempStuff.length - 1]
          if (j - lastJ > PIXEL_DISTANCE_LIMIT) {
            const tempStuffRange = [
              tempStuff[0],
              tempStuff[tempStuff.length - 1]
            ]
            lineStuff.push(tempStuffRange)
            tempStuff = []
          }
        }
      }
    }
    if (tempStuff.length) {
      const tempStuffRange = [
        tempStuff[0],
        tempStuff[tempStuff.length - 1]
      ]
      lineStuff.push(tempStuffRange)
    }
    allStuffByLine[i] = lineStuff
  }
  return allStuffByLine
}

function processRawStuff (rawStuff) {
  console.log(rawStuff)
  const finalStuff = []
  const activeStuff = []
  rawStuff.forEach((lineStuff, i) => {
    const activeStuffExisted = Boolean(activeStuff.length)
    lineStuff.forEach((singleStuff, j) => {
      if (activeStuffExisted) {
        activeStuff.forEach((oneActiveStuff, k) => {
          let start = i - PIXEL_DISTANCE_LIMIT
          if (start < 0) start = 0
          const stop = i
          for (let l = start; l < stop; l++) {
            oneActiveStuff[l].forEach((singleActiveStuff, m) => {

            })
          }
        })
      } else {
        const activeStuffToPush = Array(rawStuff.length).fill([])
        activeStuffToPush[i] = [singleStuff]
        activeStuff.push(activeStuffToPush)
      }
    })
  })
  return finalStuff
}

function checkShareRange (rangeA, rangeB) {

}
