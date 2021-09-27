import {
  startProcess, endProcess, downloadFile,
  imageDataToDataUrl
} from '../utils/index.js'
import {TYPE_STRUCTURE} from './structure.js'
import {TYPE_INLINE_BLOCK} from './structure-enhance.js'

const ERROR_PIXEL = 2
const TAG_DIV = '<div${attributes}>${content}</div>'
const TAG_SPAN = '<span${attributes}>${content}</span>'
const TAG_IMG = '<img${attributes}/>'

const g_classNameCounter = {}
const g_stylesGroup = {}
let g_detailedStuff

const mergedTypes = {
  ...TYPE_STRUCTURE,
  ...TYPE_INLINE_BLOCK
}
for (const key in mergedTypes) {
  const value = mergedTypes[key]
  g_classNameCounter[value] = 0
}

export function generateCode (structure, detailedStuff) {
  g_detailedStuff = detailedStuff
  const html = generateHtml(structure)
  const indentedHtml = indentHtml(html)
  const stylesGroup = getStylesGroup()
  const css = generateCss(stylesGroup)
  const completeCode = generateCompleteCode(indentedHtml, css)
  // downloadFile(completeCode, 'demo.html', 'text/html')
  return completeCode
}

function generateHtml (structure) {
  startProcess('generateHtml', _ => console.info(_))
  const html = recursivelyGenerateHtml(structure)
  endProcess('generateHtml', _ => console.info(_))
  return html
}

function recursivelyGenerateHtml (structure, parent) {
  let html = ''
  const typeTagMap = {
    [TYPE_STRUCTURE.BLOCK]: TAG_DIV,
    [TYPE_STRUCTURE.ROW]: TAG_DIV,
    [TYPE_STRUCTURE.COLUMN]: TAG_DIV,
    [TYPE_INLINE_BLOCK.TEXT]: TAG_SPAN,
    [TYPE_INLINE_BLOCK.IMAGE]: TAG_IMG
  }
  structure.forEach((structureItem, index) => {
    const {
      type, src, text, styles,
      children, subStructure
    } = structureItem
    const commonClassName = type
    const currentCount = ++g_classNameCounter[type]
    const specificClassName = `${type}${currentCount}`
    const classNames = [commonClassName, specificClassName]
    const attributes = {class: classNames.join(' ')}
    switch (type) {
      case TYPE_INLINE_BLOCK.IMAGE:
        attributes.src = src
        break
    }
    let content
    if (children && children.length) {
      content = recursivelyGenerateHtml(children, structureItem)
    } else if (subStructure && subStructure.length) {
      content = recursivelyGenerateHtml(subStructure, structureItem)
    } else {
      content = text
    }
    const currentHtml = generateHtmlTag(typeTagMap[type], attributes, content)
    html += currentHtml
    setStylesGroup(specificClassName, styles)
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

function indentHtml (html) {
  startProcess('indentHtml', _ => console.info(_))
  html = html.trim()
  let indentedHtml = ''
  let indentSize = 0
  let prevTagIsClosed = false
  for (let index in html) {
    index = Number(index)
    const secondPrevLetter = index > 1 ? html[index - 2] : null
    const prevLetter = index > 0 ? html[index - 1] : null
    const letter = html[index]
    const nextLetter = index < html.length - 1 ? html[index + 1] : null
    /* For image tag */
    if (secondPrevLetter === '/' && prevLetter === '>' && letter === '<') {
      indentSize -= 2
      prevTagIsClosed = true
    }
    /* For starter tag */
    if (prevLetter === '>' && letter === '<' && nextLetter !== '/') {
      indentSize += 2
      indentedHtml += `\n${' '.repeat(indentSize)}`
      prevTagIsClosed = false
    }
    /* For closer tag */
    if (letter === '<' && nextLetter === '/') {
      if (prevTagIsClosed) {
        indentedHtml += `\n${' '.repeat(indentSize)}`
      }
      indentSize -= 2
      prevTagIsClosed = true
    }
    indentedHtml += letter
  }
  endProcess('indentHtml', _ => console.info(_))
  return indentedHtml
}

function setStylesGroup (key, value) {
  if (!Object.keys(value).length) return
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
}
span, img {
  display: inline-block;
  margin-right: -3px;
  vertical-align: top;
}\n`
  for (const className in stylesGroup) {
    const styles = stylesGroup[className]
    css += `.${className} {\n`
    for (let key in styles) {
      let value = styles[key]
      if (typeof value === 'number') value += 'px'
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
