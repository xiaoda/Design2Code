import {
  DESIGN_WIDTH, DESIGN_SIZE_RATIO
} from './utils/constants.js'
import {checkDesign} from './core/prepare.js'
import {extractSkeleton} from './core/structure.js'

/* Config */
const DESIGN_SRC = './design/kbl-2.png'
const WECHAT_HEADER = window.WECHAT_HEADER = true

/* Constants */
const canvas = document.getElementById('design')
const ctx = window.ctx = canvas.getContext('2d')
const processCanvas = document.getElementById('process')
const processCtx =
window.processCtx = processCanvas.getContext('2d')

/* Init */
loadDesign((imageData, designSizeRatio) => {
  imageData = checkDesign(imageData)
  initAssistance(imageData, designSizeRatio)
  extractSkeleton(imageData)
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
  function highlight (data, index) {
    data[index] = 255
    data[index + 1] = 127
    data[index + 2] = 0
  }

  canvas.addEventListener('click', event => {
    let {offsetX: x, offsetY: y} = event
    x = Math.round(x) * designSizeRatio
    y = Math.round(y) * designSizeRatio
    const {width, height} = imageData
    const focusImageData = ctx.createImageData(width, height)
    focusImageData.data.set(imageData.data)
    const {data} = focusImageData
    for (let i = width * y; i < width * (y + 1); i++) {
      highlight(data, i * 4)
    }
    for (let i = x; i < width * height; i += width) {
      highlight(data, i * 4)
    }
    ctx.putImageData(focusImageData, 0, 0)
    document.getElementById('positionX').innerText = x
    document.getElementById('positionY').innerText = y
  })
}
