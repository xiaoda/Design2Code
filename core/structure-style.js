import {
  startProcess, endProcess, rgbToHex
} from '../utils/index.js'
import ColorCounter from '../utils/color-counter.js'
import {TYPE_STRUCTURE} from './structure.js'

const ERROR_PIXEL = 2

export function addStylesToStructure (structure) {
  addStyles(structure)
  adjustStyles(structure)
  return structure
}

function addStyles (structure) {
  startProcess('addStyles', _ => console.info(_))
  recursivelyAddStyles(structure)
  endProcess('addStyles', _ => console.info(_))
}

function recursivelyAddStyles (structure, parent) {
  structure.forEach((structureItem, index) => {
    const {
      type, children,
      top, bottom, left, right,
      width, height
    } = structureItem
    const styles = {}
    const preStyles = {}
    if (type === TYPE_STRUCTURE.ROW && children.length) {
      styles.display = 'flex'
    }

    /* Padding or size */
    if (children.length) {
      const childrenTop = Math.min(
        ...children.map(child => child.top)
      )
      const childrenLeft = Math.min(
        ...children.map(child => child.left)
      )
      const childrenRight = Math.max(
        ...children.map(child => child.right)
      )
      const childrenBottom = Math.max(
        ...children.map(child => child.bottom)
      )
      const paddingTop = childrenTop - top
      const paddingLeft = childrenLeft - left
      const paddingRight = right - childrenRight
      const paddingBottom = bottom - childrenBottom
      if (beyondError(paddingTop)) {
        styles.paddingTop = paddingTop
      }
      if (beyondError(paddingLeft)) {
        styles.paddingLeft = paddingLeft
      }
      if (beyondError(paddingRight)) {
        styles.paddingRight = paddingRight
      }
      if (beyondError(paddingBottom)) {
        styles.paddingBottom = paddingBottom
      }
    } else {
      styles.width = width
      styles.height = height
    }

    /* Margin */
    if (parent && structure.length > 1) {
      let tempBottom = Math.min(
        ...structure.map(item => item.top)
      )
      const structureAbove = structure.filter(item => {
        return item.bottom < top
      })
      if (structureAbove.length) {
        structureAbove.forEach(item => {
          if (item.bottom > tempBottom) {
            tempBottom = item.bottom
          }
        })
      }
      const marginTop = top - tempBottom
      if (beyondError(marginTop)) {
        styles.marginTop = marginTop
      }

      let tempRight = Math.min(
        ...structure.map(item => item.left)
      )
      const leftSideStructure = structure.filter(item => {
        return item.right < left
      })
      if (leftSideStructure.length) {
        leftSideStructure.forEach(item => {
          if (item.right > tempRight) {
            tempRight = item.right
          }
        })
      }
      const marginLeft = left - tempRight - 1
      if (beyondError(marginLeft)) {
        styles.marginLeft = marginLeft
      }
    }

    /* Background color */
    const backgroundColor = getBackgroundColor(structureItem)
    console.log('backgroundColor', backgroundColor)

    structureItem.styles = styles
    structureItem.preStyles = preStyles
    if (children.length) {
      recursivelyAddStyles(children, structureItem)
    }
  })
}

function getBackgroundColor (structureItem) {
  const {
    left, top, width, height,
    children
  } = structureItem
  const childrenAreaGroup = []
  children.forEach(child => {
    const {
      top: childTop,
      left: childLeft,
      width: childWidth,
      height: childHeight
    } = child
    const loopStart = childTop - top
    const loopEnd = loopStart + childHeight
    for (let i = loopStart; i <= loopEnd; i += 1) {
      const rangeStart = i * width + (childLeft - left)
      const rangeEnd = rangeStart + childWidth
      const area = [rangeStart, rangeEnd]
      childrenAreaGroup.push(area)
    }
  })

  function _inChildrenArea (index) {
    return childrenAreaGroup.some(area => {
      const [start, end] = area
      return index >= start && index <= end
    })
  }

  const colorData = new ColorCounter()
  const imageData = window.ctx.getImageData(
    left, top, width, height
  )
  const {data} = imageData
  for (let i = 0; i < data.length; i += 4) {
    const index = i / 4
    if (!_inChildrenArea(index)) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const hex = rgbToHex(r, g, b)
      colorData.addValue(hex)
    }
  }
  const backgroundColor = colorData.getFirstValueByCount()
  return backgroundColor
}

function adjustStyles (structure) {
  startProcess('adjustStyles', _ => console.info(_))
  endProcess('adjustStyles', _ => console.info(_))
}

function beyondError (number) {
  return Math.abs(number) > ERROR_PIXEL
}
