import { create } from 'zustand'
import type { StudioSnapshot } from '../../../shared/studio'

interface StudioStore {
  snapshot: StudioSnapshot | null
  error: string | null
  accept: (snapshot: StudioSnapshot) => void
  setError: (message: string | null) => void
}
export const useStudioStore = create<StudioStore>((set) => ({
  snapshot: null,
  error: null,
  accept: (snapshot) =>
    set((state) => {
      const previous = state.snapshot
      if (previous && previous.revision >= snapshot.revision) return {}
      const accepted = { ...snapshot }
      if (previous && previous.scenario === snapshot.scenario) {
        // IPC clones payloads. Preserve unchanged slice identities so progress does not
        // re-render script fields, catalog selectors, or large output lists.
        if (
          Object.entries(snapshot.settings).every(
            ([key, value]) => previous.settings[key as keyof typeof previous.settings] === value
          )
        )
          accepted.settings = previous.settings
        if (
          snapshot.voices.length === previous.voices.length &&
          snapshot.voices.every(
            (voice, index) =>
              voice.id === previous.voices[index].id &&
              voice.label === previous.voices[index].label &&
              voice.available === previous.voices[index].available
          )
        )
          accepted.voices = previous.voices
        if (
          snapshot.outputs.length === previous.outputs.length &&
          snapshot.outputs.every((output, index) => output.id === previous.outputs[index].id)
        )
          accepted.outputs = previous.outputs
        if (
          snapshot.units.length === previous.units.length &&
          snapshot.units.every(
            (unit, index) =>
              unit.id === previous.units[index]?.id &&
              unit.title === previous.units[index]?.title &&
              unit.language === previous.units[index]?.language &&
              unit.outputId === previous.units[index]?.outputId &&
              unit.status === previous.units[index]?.status &&
              unit.message === previous.units[index]?.message
          )
        )
          accepted.units = previous.units
      }
      return { snapshot: accepted, error: null }
    }),
  setError: (error) => set({ error })
}))
