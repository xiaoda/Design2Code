import {sobel} from '../utils/edge-detection.js'
import {
  startProcess, endProcess
} from '../utils/index.js'

const PIXEL_GRAY_LIMIT = 5
const PIXEL_DISTANCE_LIMIT = 3

export function extractSkeleton (imageData) {
  const edgeImageData = detectEdge(imageData)
  const rawStuff = extractRawStuff(edgeImageData)
  const stuff = processRawStuff(rawStuff)
  console.log(stuff)
}

function detectEdge (imageData) {
  startProcess('detectEdge')
  const edgeImageData = sobel(imageData)
  if (window.processCtx) {
    window.processCtx.putImageData(edgeImageData, 0, 0)
  }
  endProcess('detectEdge')
  return edgeImageData
}

function extractRawStuff (imageData) {
  startProcess('extractRawStuff')
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
  endProcess('extractRawStuff')
  return allStuffByLine
}

function processRawStuff (rawStuff) {
  startProcess('processRawStuff')
  const finalStuff = []
  let activeStuff = []
  rawStuff.forEach((lineStuff, i) => {
    for (let j = activeStuff.length - 1; j >= 0; j--) {
      const oneActiveStuff = activeStuff[j]
      let isStillActive = false
      let start = i - PIXEL_DISTANCE_LIMIT
      if (start < 0) start = 0
      const stop = i
      for (let k = start; k < stop; k++) {
        if (isStillActive) break
        isStillActive = Boolean(oneActiveStuff[k].length)
      }
      if (!isStillActive) {
        finalStuff.push(oneActiveStuff)
        activeStuff.splice(j, 1)
      }
    }
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
                PIXEL_DISTANCE_LIMIT, singleStuff, singleActiveStuff
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
    if (activeStuffExisted) {
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
        const newActiveStuff = connectionsCombo
          .map(combo => mergeActiveSingleStuff(
            activeStuff, lineStuff, combo, i
          ))
        activeStuff = newActiveStuff
      }
    }
  })
  if (activeStuff.length) {
    finalStuff.push(...activeStuff)
  }
  endProcess('processRawStuff')
  return finalStuff
}

function checkShareRange (distance, rangeA, rangeB) {
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
  function getRelatives (active) {
    const activeGroup = [active]
    const singleGroup = []
    function loop (index) {
      const tempSingleGroup = activeSingleMap[index]
      tempSingleGroup.forEach(single => {
        if (!singleGroup.includes(single)) {
          singleGroup.push(single)
        }
        const tempActiveGroup = singleActiveMap[single]
        tempActiveGroup.forEach(active => {
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
  return combo
}

function mergeActiveSingleStuff (
  activeStuff, lineStuff, combo, lineIndex
) {
  const {
    activeGroup, singleGroup
  } = combo
  const mergedStuff = []
  for (let i = 0; i < activeStuff[0].length; i++) {
    const tempRanges = []
    activeGroup.forEach(index => {
      tempRanges.push(...activeStuff[index][i])
    })
    const currentlineStuff = mergeRanges(
      PIXEL_DISTANCE_LIMIT, ...tempRanges
    )
    mergedStuff[i] = currentlineStuff
  }
  const latestLineStuff = mergeRanges(
    PIXEL_DISTANCE_LIMIT,
    ...singleGroup.map(single => lineStuff[single])
  )
  mergedStuff[lineIndex] = latestLineStuff
  return mergedStuff
}

function mergeRanges (distance, ...ranges) {
  let maxRangeBorder = 0
  ranges.forEach(range => {
    if (range[1] > maxRangeBorder) {
      maxRangeBorder = range[1]
    }
  })
  const rawRanges = Array(maxRangeBorder).fill(false)
  ranges.forEach(range => {
    for (let i = range[0]; i <= range[1]; i++) {
      rawRanges[i] = true
    }
  })
  const mergedRanges = []
  let tempRange = []
  rawRanges.forEach((range, index) => {
    if (range) {
      tempRange.push(index)
    } else {
      if (tempRange.length) {
        const lastTempRangeIndex = tempRange[tempRange.length - 1]
        if (index - lastTempRangeIndex > distance) {
          const rangeToPush = [
            tempRange[0],
            tempRange[tempRange.length - 1]
          ]
          mergedRanges.push(rangeToPush)
          tempRange = []
        }
      }
    }
  })
  if (tempRange.length) {
    const rangeToPush = [
      tempRange[0],
      tempRange[tempRange.length - 1]
    ]
    mergedRanges.push(rangeToPush)
  }
  return mergedRanges
}
