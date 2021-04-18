import {
  startProcess, endProcess
} from '../utils/index.js'

export function extractStructure (detailedStuff) {
  analyzeStructure(detailedStuff)
}

function analyzeStructure (detailedStuff) {
  startProcess('analyzeStructure', _ => console.info(_))
  console.log('detailedStuff', detailedStuff)
  endProcess('analyzeStructure', _ => console.info(_))
}
