import {
  startProcess, endProcess
} from '../utils/index.js'
import {
  TYPE_STUFF_COMMON,
  TYPE_STUFF_BOUNDARY,
  TYPE_STUFF_BLOCK
} from './stuff.js'

const PIXEL_ERROR_LIMIT = 4
const PIXEL_BORDER_LIMIT = 2
const TYPE_STRUCTURE_BLOCK = 'block'

export function extractStructure (detailedStuff) {
  const structure = analyzeStructure(detailedStuff)
}

function analyzeStructure (detailedStuff) {
  startProcess('analyzeStructure', _ => console.info(_))
  console.log('detailedStuff', detailedStuff)
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
    const mergedStuff = mergeRelavantStuff(stuff)
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
    const verticallyCoincident = (
      (top - areaBottom) * (bottom - areaTop)
    ) < 0
    const horizontallyCoincident = (
      (left - areaRight) * (right - areaLeft)
    ) < 0
    return verticallyCoincident && horizontallyCoincident
  })
  return stuffInArea
}

function mergeRelavantStuff (stuff) {
 // todo
}
