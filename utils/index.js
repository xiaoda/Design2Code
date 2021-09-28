const timeRecorder = {}

export function startProcess (name, callback) {
  const startTimeStamp = new Date().getTime()
  timeRecorder[name] = startTimeStamp
  const text = `>>> ${name} START`
  if (callback) callback(text)
  else console.info(text)
}

export function endProcess (name, callback) {
  const endTimeStamp = new Date().getTime()
  const startTimeStamp = timeRecorder[name]
  delete timeRecorder[name]
  const milliseconds = endTimeStamp - startTimeStamp
  const text = `>>> ${name} END within ${milliseconds}ms`
  if (callback) callback(text)
  else console.info(text)
}

export function capitalize (string) {
  const capitalizedString = `${string[0].toUpperCase()}${string.slice(1)}`
  return capitalizedString
}

export function generateRandomString (prefix) {
  const randomString = (
    Math.random().toString(36).substring(7)
  )
  return (
    prefix ?
    `${prefix}-${randomString}`:
    randomString
  )
}

export function roundSize (size) {
  const mod = size % 10
  if (mod > 0 && mod <= 2) {
    size -= mod
  } else if (mod >= 8) {
    size += mod
  }
  return size
}

export function rgbToHex (r, g, b) {
  return `${decToHex(r)}${decToHex(g)}${decToHex(b)}`
}

function decToHex (dec) {
  const hex = dec.toString(16)
  return hex.length === 1 ? `0${hex}` : hex
}

export function hexToRgb (hex) {
  return {
    r: hexToDec(hex.slice(0, 2)),
    g: hexToDec(hex.slice(2, 4)),
    b: hexToDec(hex.slice(4, 6))
  }
}

function hexToDec (hex) {
  return parseInt(hex, 16)
}

export function mixColors (...colors) {
  const colorSum = {r: 0, g: 0, b: 0}
  colors.forEach(color => {
    const {r, g, b} = hexToRgb(color)
    colorSum.r += r
    colorSum.g += g
    colorSum.b += b
  })
  const averageColor = {
    r: Math.round(colorSum.r / colors.length),
    g: Math.round(colorSum.g / colors.length),
    b: Math.round(colorSum.b / colors.length)
  }
  const mixedColor = rgbToHex(
    averageColor.r, averageColor.g, averageColor.b
  )
  return mixedColor
}

export function accumulateColors (...colors) {
  const colorSum = {r: 0, g: 0, b: 0}
  colors.forEach(color => {
    const {r, g, b} = hexToRgb(color)
    colorSum.r += r
    colorSum.g += g
    colorSum.b += b
  })
  const maxLimit = 255
  const limitedColor = {
    r: colorSum.r > maxLimit ? maxLimit : colorSum.r,
    g: colorSum.g > maxLimit ? maxLimit : colorSum.g,
    b: colorSum.b > maxLimit ? maxLimit : colorSum.b,
  }
  const accumulatedColor = rgbToHex(
    limitedColor.r, limitedColor.g, limitedColor.b
  )
  return accumulatedColor
}

export function getColorsStandardVariance (...colors) {
  const averageColor = hexToRgb(mixColors(...colors))
  let varianceSum = 0
  colors.forEach(color => {
    const {r, g, b} = hexToRgb(color)
    const variance = (
      (r - averageColor.r) ** 2 +
      (g - averageColor.g) ** 2 +
      (b - averageColor.b) ** 2
    ) ** 0.5
    varianceSum += variance
  })
  const averageVariance = varianceSum / colors.length
  return averageVariance
}

export function imageDataToDataUrl (imageData) {
  const {width, height} = imageData
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.putImageData(imageData, 0, 0)
  const dataUrl = canvas.toDataURL('image/png')
  return dataUrl
}

export function saveImage (canvas, name = 'save') {
  const dataUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = name
  link.click()
}

export function downloadFile (
  data, name = 'file', type = 'text/plain'
) {
  const file = new Blob([data], {type})
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
}
