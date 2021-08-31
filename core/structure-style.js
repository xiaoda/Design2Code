import {
  startProcess, endProcess,
  rgbToHex, imageDataToDataUrl
} from '../utils/index.js'
import ColorCounter from '../utils/color-counter.js'
import {TYPE_STRUCTURE} from './structure.js'
import {findText} from './recognize.js'

export const TYPE_INLINE_BLOCK = {
  IMAGE: 'image',
  TEXT: 'text'
}
const ERROR_PIXEL = 2

let g_detailedStuff

export function addStylesToStructure (structure, detailedStuff) {
  g_detailedStuff = detailedStuff
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
    preStyles.backgroundColor = backgroundColor

    structureItem.styles = styles
    structureItem.preStyles = preStyles
    if (children.length) {
      recursivelyAddStyles(children, structureItem)
    } else {
      addSubStructure(structureItem)
    }
  })
}

function getBackgroundColor (structure) {
  const {
    left, top, width, height,
    children
  } = structure
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

function addSubStructure (structure) {
  const {
    top: structureTop,
    bottom: structureBottom,
    left: structureLeft,
    right: structureRight
  } = structure
  const htmlObjectGroup = []
  const sortedDetailedStuff = getSortedDetailedStuff(
    structure.detailedStuffIds
  )
  sortedDetailedStuff.forEach(detailedStuff => {
    const {
      left, top, width, height, id
    } = detailedStuff
    const imageData = window.ctx.getImageData(
      left, top, width, height
    )
    const dataUrl = imageDataToDataUrl(imageData)
    const options = {detailedStuffId: id}
    const text = findText(dataUrl, options)
    if (text === null) {
      const type = TYPE_INLINE_BLOCK.IMAGE
      const src = dataUrl
      htmlObjectGroup.push({type, src})
    } else {
      const type = TYPE_INLINE_BLOCK.TEXT
      const content = text
      htmlObjectGroup.push({type, content})
    }
  })

  function _getStyles (index) {
    const styles = {}
    const {top, left} = sortedDetailedStuff[index]
    if (index) {
      const {
        bottom: prevBottom,
        right: prevRight
      } = sortedDetailedStuff[index - 1]
      const marginTop = top - prevBottom
      const marginLeft = left - prevRight
      if (beyondPositiveError(marginTop)) {
        styles.marginTop = marginTop
      } else if (beyondPositiveError(marginLeft)) {
        styles.marginLeft = marginLeft
      }
    }
    if (!styles.marginTop) {
      const marginTop = top - structureTop
      if (beyondPositiveError(marginTop)) {
        styles.marginTop = marginTop
      }
    }
    if (!styles.marginLeft) {
      const marginLeft = left - structureLeft
      if (beyondPositiveError(marginLeft)) {
        styles.marginLeft = marginLeft
      }
    }
    return styles
  }

  let subStructureGroup = []
  let tempCurrentIndex = 0
  htmlObjectGroup.forEach((htmlObject, index) => {
    if (index < tempCurrentIndex) return
    const {
      type, content, src
    } = htmlObject
    switch (type) {
      case TYPE_INLINE_BLOCK.TEXT: {
        let text = ''
        let styles = {}
        for (
          let i = index;
          i < htmlObjectGroup.length;
          i++
        ) {
          const tempHtmlObject = htmlObjectGroup[i]
          const {content, type} = tempHtmlObject
          if (type === TYPE_INLINE_BLOCK.TEXT) {
            text += content
            if (i === htmlObjectGroup.length - 1) {
              styles = _getStyles(index)
              subStructureGroup.push({type, text, styles})
              tempCurrentIndex = htmlObjectGroup.length
            }
          } else {
            styles = _getStyles(index)
            subStructureGroup.push({
              type: TYPE_INLINE_BLOCK.TEXT,
              text, styles
            })
            tempCurrentIndex = i - 1
            break
          }
        }
        break
      }
      case TYPE_INLINE_BLOCK.IMAGE: {
        const styles = _getStyles(index)
        subStructureGroup.push({type, src, styles})
        tempCurrentIndex = index
        break
      }
    }
  })
  structure.subStructure = subStructureGroup
}

function getSortedDetailedStuff (detailedStuffIds) {
  let sortedDetailedStuff = []
  ;(_ => {
    const detailedStuff = detailedStuffIds.map(id => {
      const stuff = g_detailedStuff.find(tempStuff => {
        return tempStuff.id === id
      })
      return stuff
    })
    if (detailedStuffIds.length > 1) {
      const [stuff1, stuff2] = detailedStuff
      let direction
      if (
        stuff1.top > stuff2.bottom ||
        stuff2.top > stuff1.bottom
      ) direction = 'vertical'
      else if (
        stuff1.left > stuff2.right ||
        stuff2.left > stuff1.right
      ) direction = 'horizontal'
      if (!direction) {
        console.warn('Direction empty in getSortedDetailedStuff.')
        return
      }
      const directionPropMap = {
        vertical: 'top',
        horizontal: 'left'
      }
      const prop = directionPropMap[direction]
      sortedDetailedStuff = detailedStuff
        .sort((stuff1, stuff2) => stuff1[prop] - stuff2[prop])
    } else {
      sortedDetailedStuff = [...detailedStuff]
    }
  })()
  return sortedDetailedStuff
}

function adjustStyles (structure) {
  startProcess('adjustStyles', _ => console.info(_))
  // todo
  endProcess('adjustStyles', _ => console.info(_))
}

function beyondError (number) {
  return Math.abs(number) > ERROR_PIXEL
}

function beyondPositiveError (number) {
  return number > ERROR_PIXEL
}
