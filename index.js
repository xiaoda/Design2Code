import {
  DESIGN_WIDTH, DESIGN_SIZE_RATIO
} from './core/constants.js'
import {checkDesign} from './core/prepare.js'
import {extractSkeleton} from './core/structure.js'

/* Config */
const DESIGN_SRC = './design/kbl-2.png'

/* Constants */
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

/* Init */
loadDesign(data => {
  checkDesign(data)
  extractSkeleton()
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
    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width / designSizeRatio}px`
    canvas.style.height = `${height / designSizeRatio}px`
    ctx.drawImage(this, 0, 0)
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = {width, height, imageData}
    callback(data)
  }
  image.src = DESIGN_SRC
}
