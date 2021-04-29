import {
  startProcess, endProcess
} from '../utils/index.js'
import {
  TYPE_STUFF_COMMON,
  TYPE_STUFF_BOUNDARY,
  TYPE_STUFF_BLOCK,
  mergeRanges
} from './stuff.js'

const PIXEL_ERROR_LIMIT = 4
const PIXEL_BORDER_LIMIT = 2
const PIXEL_VERTICAL_ALIGNED = 8
const PIXEL_VERTICAL_DISTANCE = 40
const PIXEL_HORIZONTAL_ALIGNED = 8
const PIXEL_HORIZONTAL_DISTANCE = 30
const PIXEL_VERTICAL_SPACE_LIMIT = 0

const TYPE_STRUCTURE_BLOCK = 'block'
const TYPE_STRUCTURE_LINE = 'line'

export function extractStructure (detailedStuff) {
  const structure = analyzeStructure(detailedStuff)
}

function analyzeStructure (detailedStuff) {
  startProcess('analyzeStructure', _ => console.info(_))
  const structure = recursivelyAnalyze(detailedStuff)
  console.log('structure', structure)
  endProcess('analyzeStructure', _ => console.info(_))
}

function recursivelyAnalyze (stuff, area = {}) {
  const structure = []
  let {
    top: areaTop,
    bottom: areaBottom
  } = area
  if (!areaTop) areaTop = 0
  if (!areaBottom) areaBottom = Infinity
  const {
    widestDividingStuff, restStuff
  } = filterWidestDividingStuff(stuff)
  if (widestDividingStuff.length) {
    const dividingLeft = Math.min(
      ...widestDividingStuff.map(({left}) => left)
    )
    const dividingRight = Math.max(
      ...widestDividingStuff.map(({right}) => right)
    )
    const dividingWidth = dividingRight - dividingLeft + 1
    for (let i = 0; i <= widestDividingStuff.length; i++) {
      const lastDividingStuff = (
        i > 0 ? widestDividingStuff[i - 1] : null
      )
      const nextDividingStuff = (
        i < widestDividingStuff.length ?
        widestDividingStuff[i] :
        null
      )
      const type = TYPE_STRUCTURE_BLOCK
      const borderBottom = Boolean(
        nextDividingStuff &&
        nextDividingStuff.height > PIXEL_BORDER_LIMIT
      )
      const left = dividingLeft
      const right = dividingRight
      const width = dividingWidth
      let top = areaTop
      let bottom = areaBottom
      if (lastDividingStuff) {
        top = lastDividingStuff.bottom
      }
      if (nextDividingStuff) {
        bottom = nextDividingStuff.bottom - 1
      }
      const height = bottom - top + 1
      const stuffInArea = filterStuffInArea(restStuff, {
        top, bottom, left, right
      })
      const children = recursivelyAnalyze(stuffInArea, {
        top, bottom
      })
      const structureItem = {
        type, borderBottom,
        left, right, width,
        top, bottom, height,
        children
      }
      structure.push(structureItem)
    }
  } else {
    const mergedStuff = mergeRelevantStuff(stuff)
    const splitedStuff = splitStuffByHorizontalSpace(mergedStuff)
    console.log('splitedStuff', splitedStuff)
    splitedStuff.forEach(lineStuff => {
      const type = TYPE_STRUCTURE_LINE
      let top, bottom, left, right
      lineStuff.forEach((stuffItem, index) => {
        if (index) {
          if (stuffItem.top < top) top = stuffItem.top
          if (stuffItem.bottom > bottom) bottom = stuffItem.bottom
          if (stuffItem.left < left) left = stuffItem.left
          if (stuffItem.right < right) right = stuffItem.right
        } else {
          top = stuffItem.top
          bottom = stuffItem.bottom
          left = stuffItem.left
          right = stuffItem.right
        }
      })
      const width = right - left + 1
      const height = bottom - top + 1
      // todo
      const structureItem = {
        type,
        top, bottom, left, right,
        width, height
      }
      structure.push(structureItem)
    })
  }
  return structure
}

function filterWidestDividingStuff (stuff) {
  const widestDividingStuff = []
  const restStuff = []
  const dividingStuff = stuff.filter(({type}) => {
    return [TYPE_STUFF_BOUNDARY].includes(type)
  })
  const maxWidth = Math.max(
    ...dividingStuff.map(({width}) => width), 0
  )
  const widthLimit = maxWidth - PIXEL_ERROR_LIMIT
  stuff.forEach(stuffItem => {
    const {type, width} = stuffItem
    if (
      [TYPE_STUFF_BOUNDARY].includes(type) &&
      width > widthLimit
    ) {
      widestDividingStuff.push(stuffItem)
    } else {
      restStuff.push(stuffItem)
    }
  })
  return {
    widestDividingStuff,
    restStuff
  }
}

function filterStuffInArea (stuff, area) {
  const {
    top: areaTop,
    bottom: areaBottom,
    left: areaLeft,
    right: areaRight
  } = area
  const stuffInArea = stuff.filter(stuffItem => {
    const {
      top, bottom, left, right
    } = stuffItem
    const verticalCoincident = (
      (top - areaBottom) * (bottom - areaTop)
    ) <= 0
    const horizontalCoincident = (
      (left - areaRight) * (right - areaLeft)
    ) <= 0
    return (
      verticalCoincident &&
      horizontalCoincident
    )
  })
  return stuffInArea
}

function mergeRelevantStuff (stuff) {
  const relevanceMap = Array(stuff.length)
  for (let i = 0; i < relevanceMap.length; i++) {
    relevanceMap[i] = []
  }
  for (let i = 0; i < stuff.length - 1; i++) {
    const currentStuff = stuff[i]
    const restStuff = stuff.slice(i + 1)
    for (let j = 0; j < restStuff.length; j++) {
      const anotherStuff = restStuff[j]
      const relevance = checkStuffRelevance(
        currentStuff, anotherStuff
      )
      if (relevance) {
        const index = i + j + 1
        relevanceMap[i].push(index)
        relevanceMap[index].push(i)
      }
    }
  }
  const formattedRelevanceMap = formatRelevanceMap(
    relevanceMap
  )
  const mergedStuff = []
  formattedRelevanceMap.forEach(group => {
    let top, bottom, left, right
    const detailedStuffIds = []
    group.forEach((stuffIndex, index) => {
      const stuffItem = stuff[stuffIndex]
      if (index) {
        if (stuffItem.top < top) top = stuffItem.top
        if (stuffItem.bottom > bottom) bottom = stuffItem.bottom
        if (stuffItem.left < left) left = stuffItem.left
        if (stuffItem.right < right) right = stuffItem.right
      } else {
        top = stuffItem.top
        bottom = stuffItem.bottom
        left = stuffItem.left
        right = stuffItem.right
      }
      detailedStuffIds.push(stuffItem.id)
    })
    const width = right - left + 1
    const height = bottom - top + 1
    const newStuff = {
      top, bottom, left, right,
      width, height, detailedStuffIds
    }
    mergedStuff.push(newStuff)
  })
  return mergedStuff
}

function checkStuffRelevance (stuffA, stuffB) {
  let relevance = false
  const verticalContained = (
    (stuffA.top - stuffB.top) *
    (stuffA.bottom - stuffB.bottom)
  ) <= 0
  const verticalDistance = (
    verticalContained ? 0 :
    Math.min(
      Math.abs(stuffA.top - stuffB.bottom),
      Math.abs(stuffA.bottom - stuffB.top)
    )
  )
  const verticalAligned = (
    Math.abs(stuffA.left - stuffB.left) < PIXEL_VERTICAL_ALIGNED
  )
  const horizontalContained = (
    (stuffA.left - stuffB.left) *
    (stuffA.right - stuffB.right)
  ) <= 0
  const horizontalDistance = (
    horizontalContained ? 0 :
    Math.min(
      Math.abs(stuffA.left - stuffB.right),
      Math.abs(stuffA.right - stuffB.left)
    )
  )
  const horizontalAligned = (
    Math.abs(stuffA.top - stuffB.top) < PIXEL_HORIZONTAL_ALIGNED &&
    Math.abs(stuffA.bottom - stuffB.bottom) < PIXEL_HORIZONTAL_ALIGNED
  )
  if (
    verticalContained &&
    horizontalContained
  ) relevance = true
  else if (
    verticalAligned &&
    verticalDistance > 0 &&
    verticalDistance < PIXEL_VERTICAL_DISTANCE
  ) relevance = true
  else if (
    horizontalAligned &&
    horizontalDistance > 0 &&
    horizontalDistance < PIXEL_HORIZONTAL_DISTANCE
  ) relevance = true
  return relevance
}

function formatRelevanceMap (relevanceMap) {
  const formattedRelevanceMap = []

  function getRelevantGroup (index) {
    const lock = []
    function loop (i) {
      if (lock.includes(i)) return []
      lock.push(i)
      const group = [i]
      const relevantIndexes = relevanceMap[i]
      relevantIndexes.forEach(j => {
        const relevantGroup = loop(j)
        relevantGroup.forEach(k => {
          if (group.includes(k)) return
          group.push(k)
        })
      })
      return group
    }
    const group = loop(index)
    return group
  }

  for (let i = 0; i < relevanceMap.length; i++) {
    const alreadyExisted = (
      formattedRelevanceMap.findIndex(group => {
        return group.includes(i)
      })
    ) > -1
    if (alreadyExisted) continue
    const group = getRelevantGroup(i)
    formattedRelevanceMap.push(group)
  }
  return formattedRelevanceMap
}

function splitStuffByHorizontalSpace (mergedStuff) {
  const verticalRanges = mergedStuff.map(stuff => {
    const {top, bottom} = stuff
    return [top, bottom]
  })
  const verticalCoverage = mergeRanges(
    PIXEL_VERTICAL_SPACE_LIMIT, ...verticalRanges
  )
  const splitedStuff = Array(verticalCoverage.length)
  for (let i = 0; i < splitedStuff.length; i++) {
    splitedStuff[i] = []
  }
  mergedStuff.forEach(stuff => {
    const {top, bottom} = stuff
    for (let i = 0; i < verticalCoverage.length; i++) {
      const [topLimit, bottomLimit] = verticalCoverage[i]
      if (top >= topLimit && bottom <= bottomLimit) {
        splitedStuff[i].push(stuff)
      }
    }
  })
  return splitedStuff
}
