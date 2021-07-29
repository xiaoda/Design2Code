import {
  startProcess, endProcess, downloadFile,
  imageDataToDataUrl
} from '../utils/index.js'
import {TYPE_STRUCTURE} from './structure.js'

const ERROR_PIXEL = 2

export function addStylesToStructure (structure) {
  addStyles(structure)
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
    if (type === TYPE_STRUCTURE.ROW && children.length) {
      styles.display = 'flex'
    }
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
    structureItem.styles = styles
    if (children.length) {
      recursivelyAddStyles(children, structureItem)
    }
  })
}

function beyondError (number) {
  return Math.abs(number) > ERROR_PIXEL
}
