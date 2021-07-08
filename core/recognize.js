import {fakeText} from '../data/recognize.js'

export function findText (dataUrl, options) {
  const {detailedStuffId} = options
  const text = (
    fakeText.hasOwnProperty(detailedStuffId) ?
    fakeText[detailedStuffId] : null
  )
  return text
}
