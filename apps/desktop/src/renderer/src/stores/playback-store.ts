import { create } from 'zustand'

export const usePlaybackStore = create<{
  outputId: string | null
  playing: boolean
  position: number
}>(() => ({
  outputId: null,
  playing: false,
  position: 0
}))
