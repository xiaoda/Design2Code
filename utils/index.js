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

function decToHex (dec) {
  const hex = dec.toString(16)
  return hex.length === 1 ? `0${hex}` : hex
}

function hexToDec (hex) {
  return parseInt(hex, 16)
}
