export function sobel (imageData) {
  const {width, height, data} = imageData
  const grayData = []
  const ratio = {r: 1 / 3, g: 1 / 3, b: 1 / 3}
  for (let i = 0; i < data.length; i += 4) {
    const gray = (
      ratio.r * data[i] +
      ratio.g * data[i + 1] +
      ratio.b * data[i + 2]
    )
    grayData.push(gray)
  }
  const radius = 1
  const xWeightArr = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ]
  const yWeightArr = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ]
  const grayX = []
  const grayY = []
  Array(
    [xWeightArr, grayX],
    [yWeightArr, grayY]
  ).forEach(([weightArr, grayDirection]) => {
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const index = i * width + j
        let gray = 0
        for (let k = 0; k < radius * 2 + 1; k++) {
          let x = i + k - radius
          if (x < 0) {
            x *= -1
          } else if (x > height - 1) {
            x = (height - 1) * 2 - x
          }
          for (let l = 0; l < radius * 2 + 1; l++) {
            let y = j + l - radius
            if (y < 0) {
              y *= -1
            } else if (y > width - 1) {
              y = (width - 1) * 2 - y
            }
            const index = x * width + y
            const weight = weightArr[k][l]
            gray += grayData[index] * weight
          }
        }
        gray = GeometryUtils.clamp(
          0, 255, Math.round(Math.abs(gray))
        )
        grayDirection.push(gray)
      }
    }
  })
  const edgeImageData = window.ctx.createImageData(
    width, height
  )
  for (let i = 0; i < grayData.length - 1; i++) {
    const index = i * 4
    edgeImageData.data[index] =
    edgeImageData.data[index + 1] =
    edgeImageData.data[index + 2] =
      (grayX[i] ** 2 + grayY[i] ** 2) ** .5
    edgeImageData.data[index + 3] = 255
  }
  return edgeImageData
}
