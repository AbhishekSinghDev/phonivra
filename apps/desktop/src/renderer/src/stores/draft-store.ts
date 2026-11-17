import { create } from 'zustand'

export type DraftCommand = 'script.update' | 'batch.text'

// The draft object's identity identifies the edit being acknowledged.
export const useDraftStore = create<Record<DraftCommand, { text: string } | null>>(() => ({
  'script.update': null,
  'batch.text': null
}))
