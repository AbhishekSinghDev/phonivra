import contract from '../../../engine/src/contract.json'

export const {
  protocolVersion,
  loopbackHost,
  maxTextLength,
  maxReferenceTranscriptLength,
  scriptExtensions,
  audioExtensions,
  deviceModes,
  indicLanguages,
  sampleRates,
  nativeSampleRate
} = contract

export const devRendererPort = 5173
export const devRendererOrigin = `http://${loopbackHost}:${devRendererPort}`
export const appOrigin = 'phonivra://app'
export const mediaOrigin = 'phonivra://media'
