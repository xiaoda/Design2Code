import {
  startProcess, endProcess
} from '../utils/index.js'

const TAG_DIV = '<div${attributes}>${content}</div>'

export function generateCode (
  structure, detailedStuff, imageData
) {
  const html = generateHtml(structure)
  const indentedHtml = indentHtml(html)
  console.log(indentedHtml)
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
    const className = type
    const attributes = {class: className}
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
    } else if (
      letter === '<' &&
      nextLetter === '/'
    ) {
      indentedHtml += `\n${' '.repeat(indentSize)}`
      indentSize -= 2
    }
    indentedHtml += letter
  }
  endProcess('generateHtml', _ => console.info(_))
  return indentedHtml
}
