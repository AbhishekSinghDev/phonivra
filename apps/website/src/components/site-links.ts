const repository = 'https://github.com/AbhishekSinghDev/phonivra'
const source = `${repository}/blob/master`

export const siteLinks = {
  repository,
  setup: `${repository}#run-the-desktop-app`,
  releases: `${repository}/releases`,
  generatedAudio: `${source}/GENERATED_AUDIO.md`,
  chatterbox: 'https://github.com/resemble-ai/chatterbox',
  author: 'https://www.heyabhishek.in/'
} as const
