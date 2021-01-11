const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
let imageData

loadDesign()

function loadDesign () {
  const image = new Image()
  image.onload = function () {
    canvas.width = this.width
    canvas.height = this.height
    canvas.style.width = `${canvas.width / 2}px`
    canvas.style.height = `${canvas.height / 2}px`
    console.warn('Canvas width', canvas.width)
    ctx.drawImage(this, 0, 0)
    imageData = ctx.getImageData(
      0, 0, canvas.width, canvas.height
    )
    console.log(imageData)
  }
  image.src = '/design/kbl-1.png'
}
