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

export function getColorsVariance (colorA, colorB) {
  const {r, g, b} = hexToRgb(colorA)
  const {
    r: anotherR,
    g: anotherG,
    b: anotherB
  } = hexToRgb(colorB)
  const variance = (
    (r - anotherR) ** 2 +
    (g - anotherG) ** 2 +
    (b - anotherB) ** 2
  ) ** 0.5
  return variance
}
