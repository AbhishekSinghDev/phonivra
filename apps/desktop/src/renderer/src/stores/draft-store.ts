import { create } from 'zustand'
import type { GenerationSettings } from '../../../shared/studio'

export type DraftCommand = 'script.update' | 'batch.text'

// The draft object's identity identifies the edit being acknowledged.
export const useDraftStore = create<
  Record<DraftCommand, { text: string } | null> & { settings: Partial<GenerationSettings> }
>(() => ({ 'script.update': null, 'batch.text': null, settings: {} }))
