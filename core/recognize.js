import {imageDataToDataUrl} from '../utils/index.js'
import {fakeText} from '../data/recognize.js'

export function findText (imageData, options) {
  const {detailedStuffId} = options
  const dataUrl = imageDataToDataUrl(imageData)
  const text = (
    fakeText.hasOwnProperty(detailedStuffId) ?
    fakeText[detailedStuffId] : null
  )
  return text
}
