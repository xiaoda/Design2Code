import {
  DESIGN_WIDTH, DESIGN_SIZE_RATIO
} from './utils/constants.js'
import {checkDesign} from './core/prepare.js'
import {extractStuff} from './core/stuff.js'
import {extractStructure} from './core/structure.js'
import {generateCode} from './core/code.js'

/* Config */
const DESIGN_SRC = './design/kbl-2.png'
const WECHAT_HEADER = window.WECHAT_HEADER = true

/* Constants */
const canvas = document.getElementById('design')
const ctx = window.ctx = canvas.getContext('2d')
const processCanvas =
window.processCanvas = document.getElementById('process')
const processCtx =
window.processCtx = processCanvas.getContext('2d')

/* Init */
loadDesign((imageData, designSizeRatio) => {
  imageData = checkDesign(imageData)
  initAssistance(imageData, designSizeRatio)
  const detailedStuff = extractStuff(imageData)
  console.info('DETAILED_STUFF', detailedStuff)
  const structure = extractStructure(detailedStuff, imageData)
  console.info('STRUCTURE', structure)
  generateCode(structure, detailedStuff, imageData)
})

/* Functions */
function loadDesign (callback) {
  const image = new Image()
  image.onload = function () {
    const {width, height} = this
    if (!Object.values(DESIGN_WIDTH).includes(width)) {
      console.error(`Unexpected design width: ${width}`)
      return
    }
    const designSizeRatio = DESIGN_SIZE_RATIO[width]
    canvas.width = processCanvas.width = width
    canvas.height = processCanvas.height = height
    canvas.style.width =
    processCanvas.style.width = `${width / designSizeRatio}px`
    canvas.style.height =
    processCanvas.style.height = `${height / designSizeRatio}px`
    ctx.drawImage(this, 0, 0)
    const imageData = ctx.getImageData(0, 0, width, height)
    callback(imageData, designSizeRatio)
  }
  image.src = DESIGN_SRC
}

function initAssistance (imageData, designSizeRatio) {
  const focusPosition = {
    x: null, y: null
  }

  function focus (x, y) {
    function highlight (data, index) {
      data[index] = 255
      data[index + 1] = 127
      data[index + 2] = 0
    }

    const {width, height} = imageData
    x = GeometryUtils.clamp(0, width, x)
    y = GeometryUtils.clamp(0, height, y)
    const {x: latestX, y: latestY} = focusPosition
    if (x === latestX && y === latestY) return
    focusPosition.x = x
    focusPosition.y = y
    const focusImageData = ctx.createImageData(width, height)
    const {data} = focusImageData
    data.set(imageData.data)
    const index = (y * width + x) * 4
    const color = {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2]
    }
    for (let i = width * y; i < width * (y + 1); i++) {
      highlight(data, i * 4)
    }
    for (let i = x; i < width * height; i += width) {
      highlight(data, i * 4)
    }
    ctx.putImageData(focusImageData, 0, 0)
    document.getElementById('focusPositionX').innerText = x
    document.getElementById('focusPositionY').innerText = y
    document.getElementById('focusColorR').innerText = color.r
    document.getElementById('focusColorG').innerText = color.g
    document.getElementById('focusColorB').innerText = color.b
  }

  canvas.addEventListener('click', event => {
    const {offsetX, offsetY} = event
    const x = Math.floor(offsetX * designSizeRatio)
    const y = Math.floor(offsetY * designSizeRatio)
    focus(x, y)
  })

  document.addEventListener('keydown', event => {
    const {code} = event
    const arrowKeys = [
      'ArrowLeft', 'ArrowRight',
      'ArrowUp', 'ArrowDown'
    ]
    if (
      arrowKeys.includes(code) &&
      focusPosition.x !== null
    ) {
      let {x, y} = focusPosition
      switch (code) {
        case 'ArrowLeft':
          x--
          break
        case 'ArrowRight':
          x++
          break
        case 'ArrowUp':
          y--
          break
        case 'ArrowDown':
          y++
          break
      }
      focus(x, y)
    }
  })
}
