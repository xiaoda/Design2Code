import {
  startProcess, endProcess,
  generateRandomString
} from '../utils/index.js'
import {sobel} from '../utils/edge-detection.js'

const GRAY_PIXEL_LIMIT = 10
const PIXEL_DISTANCE_LIMIT = 6
const PIXEL_STUFF_LIMIT = 6
const PIXEL_BOUNDARY_LIMIT = 10
const RATIO_FULL_LIMIT = .95

export const TYPE_STUFF_COMMON = 'common'
export const TYPE_STUFF_BOUNDARY = 'boundary'
export const TYPE_STUFF_BLOCK = 'block'

export function extractStuff (imageData) {
  const edgeImageData = detectEdge(imageData)
  const rawStuff = extractRawStuff(edgeImageData)
  const processedStuff = processRawStuff(rawStuff)
  const detailedStuff = generateDetailedStuff(processedStuff)
  highlightStuff(edgeImageData, detailedStuff)
  return detailedStuff
}

function detectEdge (imageData) {
  startProcess('detectEdge', _ => console.info(_))
  const edgeImageData = sobel(imageData)
  if (window.processCtx) {
    window.processCtx.putImageData(edgeImageData, 0, 0)
  }
  endProcess('detectEdge', _ => console.info(_))
  return edgeImageData
}

function extractRawStuff (imageData) {
  startProcess('extractRawStuff', _ => console.info(_))
  const {width, height, data} = imageData
  const allStuffByLine = []
  for (let i = 0; i < height; i++) {
    const lineStuff = []
    let tempStuff = []
    for (let j = 0; j < width; j++) {
      const index = (i * width + j) * 4
      const gray = data[index]
      if (gray > GRAY_PIXEL_LIMIT) {
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
  endProcess('extractRawStuff', _ => console.info(_))
  return allStuffByLine
}

function processRawStuff (rawStuff) {
  startProcess('processRawStuff', _ => console.info(_))
  const processedStuff = []
  let activeStuff = []
  let newActiveStuff = []
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
        processedStuff.push(oneActiveStuff)
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
        const hasConnections = connections.some(connected => connected)
        if (!hasConnections) {
          const newActiveStuffToPush = Array(rawStuff.length)
          for (let k = 0; k < newActiveStuffToPush.length; k++) {
            newActiveStuffToPush[k] = []
          }
          newActiveStuffToPush[i] = [singleStuff]
          newActiveStuff.push(newActiveStuffToPush)
        }
      } else {
        const activeStuffToPush = Array(rawStuff.length)
        for (let k = 0; k < activeStuffToPush.length; k++) {
          activeStuffToPush[k] = []
        }
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
        const tempActiveStuff = connectionsCombo
          .map(combo => mergeActiveSingleStuff(
            activeStuff, lineStuff, combo, i
          ))
        activeStuff = [
          ...tempActiveStuff,
          ...newActiveStuff
        ]
        newActiveStuff = []
      }
    }
  })
  if (activeStuff.length) {
    processedStuff.push(...activeStuff)
  }
  endProcess('processRawStuff', _ => console.info(_))
  return processedStuff
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

export function mergeRanges (distance, ...ranges) {
  const maxRangeBorder = Math.max(
    ...ranges.map(range => range[1]), 0
  )
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

function generateDetailedStuff (processedStuff) {
  startProcess('generateDetailedStuff', _ => console.info(_))
  const detailedStuff = []
  processedStuff.forEach((stuff, i) => {
    const id = generateRandomString('ds')
    const processedStuffIndex = i
    let top, bottom, left, right
    const features = []
    stuff.forEach((lineStuff, j) => {
      if (lineStuff.length) {
        const firstStuff = lineStuff[0]
        const lastStuff = lineStuff[lineStuff.length - 1]
        if (!top && top !== 0) top = j
        if (!left && left !== 0) left = firstStuff[0]
        if (!right && right !== 0) right = lastStuff[1]
        if (firstStuff[0] < left) left = firstStuff[0]
        if (lastStuff[1] > right) right = lastStuff[1]
        bottom = j
        const range = lastStuff[1] - firstStuff[0] + 1
        const total = getTotalCountFromLineStuff(lineStuff)
        const feature = {range, total}
        features.push(feature)
      }
    })
    const height = bottom - top + 1
    const width = right - left + 1
    if (
      width < PIXEL_STUFF_LIMIT &&
      height < PIXEL_STUFF_LIMIT
    ) return 'Invalid stuff'
    const firstFeature = features[0]
    const lastFeature = features[features.length - 1]
    const topCoverage = firstFeature.total / width
    const bottomCoverage = lastFeature.total / width
    let type = TYPE_STUFF_COMMON
    if (
      height < PIXEL_BOUNDARY_LIMIT &&
      topCoverage > RATIO_FULL_LIMIT &&
      bottomCoverage > RATIO_FULL_LIMIT
    ) type = TYPE_STUFF_BOUNDARY
    else if (
      topCoverage > RATIO_FULL_LIMIT &&
      bottomCoverage > RATIO_FULL_LIMIT &&
      features.every(({range}) => range / width > RATIO_FULL_LIMIT)
    ) type = TYPE_STUFF_BLOCK
    const stuffToPush = {
      id, processedStuffIndex,
      top, bottom, left, right,
      width, height, type
    }
    detailedStuff.push(stuffToPush)
  })
  endProcess('generateDetailedStuff', _ => console.info(_))
  return detailedStuff
}

function getTotalCountFromLineStuff (lineStuff) {
  let totalCount = 0
  lineStuff.forEach(stuff => {
    const count = stuff[1] - stuff[0] + 1
    totalCount += count
  })
  return totalCount
}

function highlightStuff (edgeImageData, detailedStuff) {
  startProcess('highlightStuff', _ => console.info(_))
  const {width, height, data} = edgeImageData
  function highlight (start, stop, step) {
    for (let i = start; i < stop; i += step) {
      const index = i * 4
      data[index] = 0
      data[index + 1] = data[index + 2] = 255
    }
  }
  detailedStuff.forEach(stuff => {
    const {top, bottom, left, right} = stuff
    highlight(top * width + left, top * width + right, 1)
    highlight(bottom * width + left, bottom * width + right, 1)
    highlight(top * width + left, bottom * width + left, width)
    highlight(top * width + right, bottom * width + right, width)
  })
  if (window.processCtx) {
    window.processCtx.putImageData(edgeImageData, 0, 0)
  }
  endProcess('highlightStuff', _ => console.info(_))
}
