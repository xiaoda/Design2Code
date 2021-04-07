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
  if (window.processCtx) {
    window.processCtx.putImageData(edgeImageData, 0, 0)
  }
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
    const activeStuffConnections = []
    lineStuff.forEach((singleStuff, j) => {
      if (activeStuffExisted) {
        const connections = []
        activeStuff.forEach((oneActiveStuff, k) => {
          let connected = false
          let start = i - PIXEL_DISTANCE_LIMIT
          if (start < 0) start = 0
          const stop = i
          for (let l = start; l < stop; l++) {
            if (connected) break
            oneActiveStuff[l].forEach((singleActiveStuff, m) => {
              if (connected) return
              connected = checkShareRange(
                singleStuff, singleActiveStuff, PIXEL_DISTANCE_LIMIT
              )
            })
          }
          connections.push(connected)
        })
        activeStuffConnections.push(connections)
      } else {
        const activeStuffToPush = Array(rawStuff.length).fill([])
        activeStuffToPush[i] = [singleStuff]
        activeStuff.push(activeStuffToPush)
      }
    })
    const hasConnections = activeStuffConnections
      .some(connections => {
        return connections.some(connected => connected)
      })
    if (hasConnections) {
      const singleActiveMap = []
      const activeSingleMap = []
      activeStuffConnections.forEach((connections, j) => {
        singleActiveMap[j] = []
        connections.forEach((connected, k) => {
          if (!activeSingleMap[k]) {
            activeSingleMap[k] = []
          }
          if (connected) {
            singleActiveMap[j].push(k)
            activeSingleMap[k].push(j)
          }
        })
      })
      const connectionsCombo = getConnectionsCombo(
        activeSingleMap, singleActiveMap
      )
    }
  })
  return finalStuff
}

function checkShareRange (rangeA, rangeB, distance) {
  const halfDistance = distance / 2
  const correctedRangeA = Array(
    rangeA[0] - halfDistance,
    rangeA[1] + halfDistance
  )
  const correctedRangeB = Array(
    rangeB[0] - halfDistance,
    rangeB[1] + halfDistance
  )
  const hasShareRange = (
    (correctedRangeA[0] - correctedRangeB[1]) *
    (correctedRangeA[1] - correctedRangeB[0])
  ) <= 0
  return hasShareRange
}

function getConnectionsCombo (
  activeSingleMap, singleActiveMap
) {
  console.log('activeSingleMap', activeSingleMap)
  console.log('singleActiveMap', singleActiveMap)
  function getRelatives (active) {
    const activeGroup = [active]
    const singleGroup = []
    function loop (index) {
      const singleGroup = activeSingleMap[index]
      singleGroup.forEach(single => {
        if (!singleGroup.includes(single)) {
          singleGroup.push(single)
        }
        const activeGroup = singleActiveMap[single]
        activeGroup.forEach(active => {
          if (!activeGroup.includes(active)) {
            activeGroup.push(active)
            loop(active)
          }
        })
      })
    }
    loop(active)
    return {
      activeGroup, singleGroup
    }
  }

  const combo = []
  const usedActive = []
  for (let i = 0; i < activeSingleMap.length; i++) {
    if (usedActive.includes(i)) continue
    const {
      activeGroup, singleGroup
    } = getRelatives(i)
    combo.push({
      activeGroup, singleGroup
    })
    activeGroup.forEach(active => {
      if (!usedActive.includes(active)) {
        usedActive.push(active)
      }
    })
  }
  console.log('combo', combo)
  return combo
}
