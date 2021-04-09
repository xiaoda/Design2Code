export function startProcess (name) {
  console.info(`>>> ${name} start`)
}

export function endProcess (name) {
  console.info(`>>> ${name} end`)
}

export function rgbToHex (r, g, b) {
  return `${decToHex(r)}${decToHex(g)}${decToHex(b)}`
}

export function hexToRgb (hex) {
  return {
    r: hexToDec(hex.slice(0, 2)),
    g: hexToDec(hex.slice(2, 4)),
    b: hexToDec(hex.slice(4, 6))
  }
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

export function roundSize (size) {
  const mod = size % 10
  if (mod > 0 && mod <= 2) {
    size -= mod
  } else if (mod >= 8) {
    size += mod
  }
  return size
}

function decToHex (dec) {
  const hex = dec.toString(16)
  return hex.length === 1 ? `0${hex}` : hex
}

function hexToDec (hex) {
  return parseInt(hex, 16)
}
