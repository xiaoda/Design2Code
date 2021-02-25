import {extractSkeleton} from './core/structure.js'

/* Config */
const DESIGN_SRC = './design/kbl-2.png'

/* Constants */
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

/* Init */
loadDesign(imageData => {
  extractSkeleton(imageData)
})

/* Functions */
function loadDesign (callback) {
  const image = new Image()
  image.onload = function () {
    canvas.width = this.width
    canvas.height = this.height
    canvas.style.width = `${canvas.width / 2}px`
    canvas.style.height = `${canvas.height / 2}px`
    console.warn('Canvas width', canvas.width)
    ctx.drawImage(this, 0, 0)
    const imageData = ctx.getImageData(
      0, 0, canvas.width, canvas.height
    )
    callback(imageData)
  }
  image.src = DESIGN_SRC
}
