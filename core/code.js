import {
  startProcess, endProcess
} from '../utils/index.js'
import {TYPE_STRUCTURE} from './structure.js'

const TAG_DIV = '<div${attributes}>${content}</div>'

const classNameCounter = {}
for (const key in TYPE_STRUCTURE) {
  const value = TYPE_STRUCTURE[key]
  classNameCounter[value] = 0
}

export function generateCode (
  structure, detailedStuff, imageData
) {
  const html = generateHtml(structure)
  const indentedHtml = indentHtml(html)
  // console.info('INDENTED_HTML', `\n${indentedHtml}`)
}

function generateHtml (structure) {
  startProcess('generateHtml', _ => console.info(_))
  const html = recursivelyGenerateHtml(structure)
  endProcess('generateHtml', _ => console.info(_))
  return html
}

function recursivelyGenerateHtml (structure) {
  let html = ''
  structure.forEach(structureItem => {
    const {type, children} = structureItem
    const commonClassName = type
    const currentCount = classNameCounter[type]++
    const specificClassName = `${type}${currentCount}`
    const classNames = [commonClassName, specificClassName]
    const attributes = {class: classNames.join(' ')}
    const content = (
      children.length ?
      recursivelyGenerateHtml(children) : ''
    )
    const currentHtml = generateHtmlTag(
      TAG_DIV, attributes, content
    )
    html += currentHtml
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
