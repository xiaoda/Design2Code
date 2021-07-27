import {
  startProcess, endProcess, downloadFile,
  imageDataToDataUrl
} from '../utils/index.js'
import {TYPE_STRUCTURE} from './structure.js'
import {findText} from './recognize.js'

const TYPE_INLINE_BLOCK = {
  IMG: 'img',
  SPAN: 'span'
}
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

export function generateCode (
  structure, detailedStuff, imageData
) {
  g_detailedStuff = detailedStuff
  const html = generateHtml(structure)
  const indentedHtml = indentHtml(html)
  const stylesGroup = getStylesGroup()
  const css = generateCss(stylesGroup)
  const completeCode = generateCompleteCode(indentedHtml, css)
  downloadFile(completeCode, 'demo.html', 'text/html')
  // console.log(completeCode)
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
    const currentCount = ++g_classNameCounter[type]
    const specificClassName = `${type}${currentCount}`
    const classNames = [commonClassName, specificClassName]
    const attributes = {class: classNames.join(' ')}
    const content = (
      children.length ?
      recursivelyGenerateHtml(children, structureItem) :
      generateStructureHtml(structureItem)
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
    setStylesGroup(specificClassName, styles)
  })
  return html
}

function generateStructureHtml (structure) {
  const {
    top: structureTop,
    bottom: structureBottom,
    left: structureLeft,
    right: structureRight
  } = structure
  const sortedDetailedStuff = getSortedDetailedStuff(
    structure.detailedStuffIds
  )
  const htmlObjectGroup = []

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
    let attributes = {}
    let content, type
    if (text === null) {
      const src = dataUrl
      attributes = {src}
      type = 'image'
    } else {
      content = text
      type = 'text'
    }
    htmlObjectGroup.push({
      attributes, content, type
    })
  })

  let structureHtml = ''
  let tempCurrentIndex = 0

  function _setStyle (type, attributes, index) {
    const commonClassName = type
    const currentCount = ++g_classNameCounter[type]
    const specificClassName = `${type}${currentCount}`
    const classNames = [commonClassName, specificClassName]
    attributes.class = classNames.join(' ')
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
    setStylesGroup(specificClassName, styles)
  }

  htmlObjectGroup.forEach((htmlObject, index) => {
    if (index < tempCurrentIndex) return
    const {
      attributes, content, type
    } = htmlObject
    switch (type) {
      case 'text': {
        let html = ''
        for (
          let i = index;
          i < htmlObjectGroup.length;
          i++
        ) {
          const tempHtmlObject = htmlObjectGroup[i]
          const {content, type} = tempHtmlObject
          if (type === 'text') {
            html += content
            if (i === htmlObjectGroup.length - 1) {
              tempCurrentIndex = htmlObjectGroup.length
              if (index !== 0) {
                _setStyle('span', attributes, index)
                html = generateHtmlTag(TAG_SPAN, attributes, html)
              }
            }
          } else {
            _setStyle('span', attributes, index)
            html = generateHtmlTag(TAG_SPAN, attributes, html)
            tempCurrentIndex = i - 1
            break
          }
        }
        structureHtml += html
        break
      }
      case 'image': {
        _setStyle('img', attributes, index)
        const html = generateHtmlTag(TAG_IMG, attributes)
        structureHtml += html
        tempCurrentIndex = index
        break
      }
    }
  })
  return structureHtml
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
    const secondPrevLetter = (
      index > 1 ?
      html[index - 2] : null
    )
    const prevLetter = (
      index > 0 ?
      html[index - 1] : null
    )
    const letter = html[index]
    const nextLetter = (
      index < html.length - 1 ?
      html[index + 1] : null
    )
    /* For image tag */
    if (
      secondPrevLetter === '/' &&
      prevLetter === '>' &&
      letter === '<'
    ) {
      indentSize -= 2
      prevTagIsClosed = true
    }
    /* For starter tag */
    if (
      prevLetter === '>' &&
      letter === '<' &&
      nextLetter !== '/'
    ) {
      indentSize += 2
      indentedHtml += `\n${' '.repeat(indentSize)}`
      prevTagIsClosed = false
    }
    /* For closer tag */
    if (
      letter === '<' &&
      nextLetter === '/'
    ) {
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

function beyondError (number) {
  return Math.abs(number) > ERROR_PIXEL
}

function beyondPositiveError (number) {
  return number > ERROR_PIXEL
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
