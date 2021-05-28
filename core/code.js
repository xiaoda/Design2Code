import {
  startProcess, endProcess
} from '../utils/index.js'
import {TYPE_STRUCTURE} from './structure.js'

const ERROR_PIXEL = 2
const TAG_DIV = '<div${attributes}>${content}</div>'

const classNameCounter = {}
const stylesGroup = {}

for (const key in TYPE_STRUCTURE) {
  const value = TYPE_STRUCTURE[key]
  classNameCounter[value] = 0
}

export function generateCode (
  structure, detailedStuff, imageData
) {
  const html = generateHtml(structure)
  const indentedHtml = indentHtml(html)
  console.log('indentedHtml', `\n${indentedHtml}`)
  console.log('stylesGroup', stylesGroup)
}

function generateHtml (structure) {
  startProcess('generateHtml', _ => console.info(_))
  const html = recursivelyGenerateHtml(structure)
  endProcess('generateHtml', _ => console.info(_))
  return html
}

function recursivelyGenerateHtml (structure, parent) {
  let html = ''
  structure.forEach((structureItem, index) => {
    const {
      type, children,
      top, bottom, left, right,
      width, height
    } = structureItem
    const commonClassName = type
    const currentCount = classNameCounter[type]++
    const specificClassName = `${type}${currentCount}`
    const classNames = [commonClassName, specificClassName]
    const attributes = {class: classNames.join(' ')}
    const content = (
      children.length ?
      recursivelyGenerateHtml(children, structureItem) :
      specificClassName
    )
    const currentHtml = generateHtmlTag(
      TAG_DIV, attributes, content
    )
    html += currentHtml

    const styles = {}
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
      let tempBottom = parent.top
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

      let tempRight = parent.left
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
    stylesGroup[specificClassName] = styles
  })
  return html
}

function generateHtmlTag (tag, attributes, content) {
  let attributesText = ''
  for (const key in attributes) {
    const value = attributes[key]
    const text = `${key}="${value}"`
    attributesText += ` ${text}`
  }
  const htmlTag = tag
    .replace('${attributes}', attributesText)
    .replace('${content}', content)
  return htmlTag
}

function beyondError (number) {
  return Math.abs(number) > ERROR_PIXEL
}

function indentHtml (html) {
  startProcess('generateHtml', _ => console.info(_))
  html = html.trim()
  let indentedHtml = ''
  let indentSize = 0
  let lastTagIsClosed = false
  for (let index in html) {
    index = Number(index)
    const letter = html[index]
    const lastLetter = (
      index > 0 ?
      html[index - 1] : null
    )
    const nextLetter = (
      index < html.length - 1 ?
      html[index + 1] : null
    )
    if (
      lastLetter === '>' &&
      letter === '<' &&
      nextLetter !== '/'
    ) {
      indentSize += 2
      indentedHtml += `\n${' '.repeat(indentSize)}`
      lastTagIsClosed = false
    } else if (
      letter === '<' &&
      nextLetter === '/'
    ) {
      if (lastTagIsClosed) {
        indentedHtml += `\n${' '.repeat(indentSize)}`
      }
      indentSize -= 2
      lastTagIsClosed = true
    }
    indentedHtml += letter
  }
  endProcess('generateHtml', _ => console.info(_))
  return indentedHtml
}
