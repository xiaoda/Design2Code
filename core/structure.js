import {startProcess, endProcess} from '../utils/index.js'
import {TYPE_STUFF, mergeRanges} from './stuff.js'

const PIXEL_ERROR_LIMIT = 4
const PIXEL_BORDER_LIMIT = 2
const PIXEL_VERTICAL_ALIGNED = 8
const PIXEL_VERTICAL_DISTANCE = 40
const PIXEL_VERTICAL_SPACE_LIMIT = 0
const PIXEL_HORIZONTAL_ALIGNED = 8
const PIXEL_HORIZONTAL_DISTANCE = 30
const PIXEL_HORIZONTAL_SPACE_LIMIT = 0

export const TYPE_STRUCTURE = {
  BLOCK: 'block',
  ROW: 'row',
  COLUMN: 'column'
}

export function extractStructure (detailedStuff, imageData) {
  const mergedStuff = mergeRelevantStuff(detailedStuff)
  const structure = analyzeStructure(mergedStuff, imageData)
  return structure
}

function mergeRelevantStuff (stuff) {
  startProcess('mergeRelevantStuff', _ => console.info(_))
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
        if (stuffItem.right > right) right = stuffItem.right
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
    const type = (
      group.length > 1 ?
      TYPE_STUFF.COMMON :
      stuff[group[0]].type
    )
    const newStuff = {
      top, bottom, left, right,
      width, height,
      detailedStuffIds, type
    }
    mergedStuff.push(newStuff)
  })
  endProcess('mergeRelevantStuff', _ => console.info(_))
  return mergedStuff
}

function checkStuffRelevance (stuffA, stuffB) {
  let relevance = false
  if (stuffA.type !== stuffB.type) {
    return relevance
  }
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

function analyzeStructure (mergedStuff, imageData) {
  startProcess('analyzeStructure', _ => console.info(_))
  const {width, height} = imageData
  const structure = recursivelyAnalyze(mergedStuff, {
    top: 0,
    left: 0,
    right: width - 1,
    bottom: height - 1
  })
  endProcess('analyzeStructure', _ => console.info(_))
  return structure
}

function recursivelyAnalyze (stuff, area = {}, options = {}) {
  let {
    top: areaTop,
    bottom: areaBottom,
    left: areaLeft,
    right: areaRight
  } = area
  const {
    inColumn = true,
    inRow = false,
    stuffCount = 0
  } = options
  const {
    widestDividingStuff, restStuff
  } = filterWidestDividingStuff(stuff)
  const structure = []

  function _handleDividingStuff (
    index, dividingLeft, dividingRight, dividingWidth
  ) {
    const lastDividingStuff = (
      index > 0 ? widestDividingStuff[index - 1] : null
    )
    const nextDividingStuff = (
      index < widestDividingStuff.length ?
      widestDividingStuff[index] :
      null
    )
    const type = TYPE_STRUCTURE.BLOCK
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
      top, bottom, left, right
    })
    const structureItem = {
      type, borderBottom,
      left, right, width,
      top, bottom, height,
      children
    }
    return structureItem
  }

  ;(_ => {
    if (widestDividingStuff.length) {
      const dividingLeft = Math.min(
        ...widestDividingStuff.map(({left}) => left)
      )
      const dividingRight = Math.max(
        ...widestDividingStuff.map(({right}) => right)
      )
      const dividingWidth = dividingRight - dividingLeft + 1
      for (let i = 0; i <= widestDividingStuff.length; i++) {
        const structureItem = _handleDividingStuff(
          i, dividingLeft, dividingRight, dividingWidth
        )
        structure.push(structureItem)
      }
    } else if (inColumn) {
      const splitedStuff = splitStuffByHorizontalSpace(stuff)
      if (
        stuffCount === 1 &&
        splitedStuff.length === 1
      ) return
      splitedStuff.forEach(rowStuff => {
        const type = TYPE_STRUCTURE.ROW
        const structureItem = handleSplitedStuff(
          type, rowStuff, splitedStuff
        )
        structure.push(structureItem)
      })
    } else if (inRow) {
      const splitedStuff = splitStuffByVerticalSpace(stuff)
      if (
        stuffCount === 1 &&
        splitedStuff.length === 1
      ) return
      splitedStuff.forEach(columnStuff => {
        const type = TYPE_STRUCTURE.COLUMN
        const structureItem = handleSplitedStuff(
          type, columnStuff, splitedStuff
        )
        structure.push(structureItem)
      })
    }
  })()
  return structure
}

function filterWidestDividingStuff (stuff) {
  const widestDividingStuff = []
  const restStuff = []
  const dividingStuff = stuff.filter(({type}) => {
    return [TYPE_STUFF.BOUNDARY].includes(type)
  })
  const maxWidth = Math.max(
    ...dividingStuff.map(({width}) => width), 0
  )
  const widthLimit = maxWidth - PIXEL_ERROR_LIMIT
  const otherStuff = stuff.filter(({type}) => {
    return ![TYPE_STUFF.BOUNDARY].includes(type)
  })
  const othersMaxWidth = Math.max(
    ...otherStuff.map(({width}) => width), 0
  )
  const othersWidthLimit = othersMaxWidth - PIXEL_ERROR_LIMIT
  if (maxWidth < othersWidthLimit) {
    return {
      widestDividingStuff,
      restStuff: stuff
    }
  }
  stuff.forEach(stuffItem => {
    const {type, width} = stuffItem
    if (
      [TYPE_STUFF.BOUNDARY].includes(type) &&
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

function splitStuffByHorizontalSpace (stuff) {
  const verticalRanges = stuff.map(stuffItem => {
    const {top, bottom} = stuffItem
    return [top, bottom]
  })
  const verticalCoverage = mergeRanges(
    PIXEL_VERTICAL_SPACE_LIMIT, ...verticalRanges
  )
  const splitedStuff = Array(verticalCoverage.length)
  for (let i = 0; i < splitedStuff.length; i++) {
    splitedStuff[i] = []
  }
  stuff.forEach(stuffItem => {
    const {top, bottom} = stuffItem
    for (let i = 0; i < verticalCoverage.length; i++) {
      const [topLimit, bottomLimit] = verticalCoverage[i]
      if (top >= topLimit && bottom <= bottomLimit) {
        splitedStuff[i].push(stuffItem)
      }
    }
  })
  return splitedStuff
}

function splitStuffByVerticalSpace (stuff) {
  const horizontalRanges = stuff.map(stuffItem => {
    const {left, right} = stuffItem
    return [left, right]
  })
  const horizontalCoverage = mergeRanges(
    PIXEL_HORIZONTAL_SPACE_LIMIT, ...horizontalRanges
  )
  const splitedStuff = Array(horizontalCoverage.length)
  for (let i = 0; i < splitedStuff.length; i++) {
    splitedStuff[i] = []
  }
  stuff.forEach(stuffItem => {
    const {left, right} = stuffItem
    for (let i = 0; i < horizontalCoverage.length; i++) {
      const [leftLimit, rightLimit] = horizontalCoverage[i]
      if (left >= leftLimit && right <= rightLimit) {
        splitedStuff[i].push(stuffItem)
      }
    }
  })
  return splitedStuff
}

function handleSplitedStuff (type, sectionStuff, splitedStuff) {
  let top, bottom, left, right
  sectionStuff.forEach((stuffItem, index) => {
    if (index) {
      if (stuffItem.top < top) top = stuffItem.top
      if (stuffItem.bottom > bottom) bottom = stuffItem.bottom
      if (stuffItem.left < left) left = stuffItem.left
      if (stuffItem.right > right) right = stuffItem.right
    } else {
      top = stuffItem.top
      bottom = stuffItem.bottom
      left = stuffItem.left
      right = stuffItem.right
    }
  })
  const width = right - left + 1
  const height = bottom - top + 1
  const containerIndex = sectionStuff.findIndex(stuffItem => {
    return (
      stuffItem.type === TYPE_STUFF.BLOCK &&
      stuffItem.top === top &&
      stuffItem.bottom === bottom &&
      stuffItem.left === left &&
      stuffItem.right === right
    )
  })
  let children
  if (containerIndex >= 0) {
    type = TYPE_STRUCTURE.BLOCK
    sectionStuff.splice(containerIndex, 1)
    children = recursivelyAnalyze(sectionStuff, {
      top, bottom, left, right,
      stuffCount: splitedStuff.length
    })
  } else {
    children = recursivelyAnalyze(sectionStuff, {
      top, bottom, left, right
    }, {
      inRow: type === TYPE_STRUCTURE.ROW,
      inColumn: type === TYPE_STRUCTURE.COLUMN,
      stuffCount: splitedStuff.length
    })
  }
  const [child] = children
  if (
    children.length === 1 &&
    !child.children.length &&
    top === child.top &&
    bottom === child.bottom &&
    left === child.left &&
    right === child.right
  ) {
    children = []
  }
  const structureItem = {
    type, children,
    top, bottom, left, right,
    width, height
  }
  if (!children.length) {
    const [stuff] = sectionStuff
    const {detailedStuffIds} = stuff
    structureItem.detailedStuffIds = detailedStuffIds
  }
  return structureItem
}
