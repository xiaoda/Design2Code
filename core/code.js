import {
  startProcess, endProcess, downloadFile
} from '../utils/index.js'
import {TYPE_STRUCTURE} from './structure.js'
import {findText} from './recognize.js'

const ERROR_PIXEL = 2
const TAG_DIV = '<div${attributes}>${content}</div>'

const g_classNameCounter = {}
const g_stylesGroup = {}
let g_detailedStuff
let g_imageData

for (const key in TYPE_STRUCTURE) {
  const value = TYPE_STRUCTURE[key]
  g_classNameCounter[value] = 0
}

export function generateCode (
  structure, detailedStuff, imageData
) {
  g_detailedStuff = detailedStuff
  g_imageData = imageData
  const html = generateHtml(structure)
  const indentedHtml = indentHtml(html)
  const stylesGroup = getStylesGroup()
  const css = generateCss(stylesGroup)
  const completeCode = generateCompleteCode(indentedHtml, css)
  // downloadFile(completeCode, 'demo.html', 'text/html')
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
    const currentCount = g_classNameCounter[type]++
    const specificClassName = `${type}${currentCount}`
    const classNames = [commonClassName, specificClassName]
    const attributes = {class: classNames.join(' ')}
    const content = (
      children.length ?
      recursivelyGenerateHtml(children, structureItem) :
      recognizeContent(structureItem)
    )
    const currentHtml = generateHtmlTag(
      TAG_DIV, attributes, content
    )
    html += currentHtml

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
    setStylesGroup(specificClassName, styles)
  })
  return html
}

function recognizeContent (structure) {
  structure.detailedStuffIds.forEach(id => {
    const detailedStuff = g_detailedStuff.find(stuff => {
      return stuff.id === id
    })
    const {
      left, top, width, height
    } = detailedStuff
    const imageData = window.ctx.getImageData(
      left, top, width, height
    )
    const options = {detailedStuffId: id}
    const text = findText(imageData, options)
    // todo
  })
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

function beyondError (number) {
  return Math.abs(number) > ERROR_PIXEL
}

function setStylesGroup (key, value) {
  g_stylesGroup[key] = value
}

function getStylesGroup () {
  return g_stylesGroup
}

function generateCss (stylesGroup) {
  startProcess('generateCss', _ => console.info(_))
  let css = `*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}\n`
  for (const className in stylesGroup) {
    const styles = stylesGroup[className]
    css += `.${className} {\n`
    for (let key in styles) {
      let value = styles[key]
      if (typeof value === 'number') {
        value += 'px'
      }
      key = key.replace(/[A-Z]/g, match => {
        return `-${match.toLowerCase()}`
      })
      css += `  ${key}: ${value};\n`
    }
    css += '}\n'
  }
  endProcess('generateCss', _ => console.info(_))
  return css
}

function generateCompleteCode (html, css) {
  startProcess('generateCompleteCode', _ => console.info(_))
  const template =
`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=750">
  <title>Demo</title>
  <style>
${indentCodeBlock(css, 4)}
  </style>
</head>
<body>
${indentCodeBlock(html, 2)}
</body>
</html>`
  endProcess('generateCompleteCode', _ => console.info(_))
  return template
}

function indentCodeBlock (code, size = 0) {
  const indentedCode = ' '.repeat(size) + code.replaceAll(
    '\n', `\n${' '.repeat(size)}`
  ).trim()
  return indentedCode
}
