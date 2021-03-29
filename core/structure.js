import {sobel} from '../utils/edge-detection.js'

export function extractSkeleton (imageData) {
  detectEdge(imageData)
}

function detectEdge (imageData) {
  const edgeImageData = sobel(imageData)
  window.processCtx.putImageData(edgeImageData, 0, 0)
}
