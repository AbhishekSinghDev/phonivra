import { defaultSettings, languages, resolvedModel } from '../shared/data/catalog'
import { fixtures, makeSnapshot, sampleOutput, sampleScript } from '../shared/data/fixtures'
import type {
  BatchUnit,
  GenerationSettings,
  JobPhase,
  OutputRecord,
  StudioCommand,
  StudioSnapshot
} from '../shared/studio'

const activePhases: readonly JobPhase[] = [
  'queued',
  'downloading',
  'loading',
  'preparing',
  'generating',
  'mastering',
  'encoding',
  'companions',
  'stopping'
]
const phases: readonly JobPhase[] = [
  'queued',
  'loading',
  'preparing',
  'generating',
  'mastering',
  'encoding',
  'companions',
  'complete'
]

// Replace this adapter with backend services without changing the renderer contract.
// All files, recordings, exports and audio playback here are simulated in memory.
export class MockStudio {
  private state = makeSnapshot()
  private timer: ReturnType<typeof setInterval> | null = null
  private sequence = 1
  private jobSettings: GenerationSettings | null = null
  private jobScript = ''
  private jobVoice = 'Original narrator'
  constructor(private readonly publish: (state: StudioSnapshot) => void) {}
  snapshot(): StudioSnapshot {
    return structuredClone(this.state)
  }
  private emit(): StudioSnapshot {
    this.state.revision += 1
    const snapshot = this.snapshot()
    this.publish(snapshot)
    return snapshot
  }
  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
  dispose(): void {
    this.stopTimer()
  }
  private runTimer(): void {
    this.stopTimer()
    this.timer = setInterval(() => {
      if (!this.state.job.paused) this.advance()
    }, 1000)
  }
  selectScenario(id: string): StudioSnapshot {
    if (!fixtures.some((f) => f.id === id)) throw new Error('Unknown review scenario')
    this.stopTimer()
    const revision = this.state.revision
    const documentRevision = this.state.documentRevision + 1
    this.state = makeSnapshot(id)
    this.state.documentRevision = documentRevision
    this.jobSettings = { ...this.state.settings }
    this.jobScript = this.state.script
    this.jobVoice =
      this.state.reference.status === 'ready'
        ? this.state.reference.name
        : (this.state.voices.find((voice) => voice.id === this.state.settings.voice)?.label ??
          'Original narrator')
    this.state.revision = revision
    return this.emit()
  }
  setPaused(paused: boolean): StudioSnapshot {
    this.state.job.paused = paused
    if (this.state.job.kind === 'download')
      this.state.models.forEach((model) => {
        if (model.status === 'paused' || model.status === 'downloading')
          model.status = paused ? 'paused' : 'downloading'
      })
    if (!paused) this.runTimer()
    else this.stopTimer()
    return this.emit()
  }
  private createOutput(
    title: string,
    language = (this.jobSettings ?? this.state.settings).language
  ): OutputRecord {
    const settings = this.jobSettings ?? this.state.settings
    const output = structuredClone(sampleOutput)
    output.id = `take-${++this.sequence}`
    output.title = title || 'Narration'
    output.model = resolvedModel({ ...settings, language }).id
    output.language = language
    output.voice = this.jobVoice
    output.format = settings.format
    output.sampleRate = settings.sample_rate
    output.sourceCharacters = this.jobScript.length
    output.requestedModel = settings.model
    output.speed = settings.speed
    output.settingsSnapshot = { ...settings, language }
    output.filename = `narration-demo-${this.sequence}.${settings.format}`
    output.created = new Date().toISOString()
    output.seed = settings.seed || 482901
    this.state.outputs.unshift(output)
    this.state.selectedOutput = output.id
    return output
  }
  private prepareBatch(): void {
    const batch = this.state.batch
    // Illustrative plans, not a chapter parser or file reader. The backend will
    // return this same typed unit list for actual selected files and source text.
    if (batch.source === 'text') {
      this.state.units = batch.text.trim()
        ? batch.splitChapters
          ? [
              {
                id: 'unit-intro',
                title: 'Introduction',
                language: this.state.settings.language,
                status: 'pending'
              },
              {
                id: 'unit-crossing',
                title: 'The first crossing',
                language: this.state.settings.language,
                status: 'pending'
              },
              {
                id: 'unit-shore',
                title: 'A different shore',
                language: this.state.settings.auto_detect ? 'hi' : this.state.settings.language,
                status: 'pending'
              }
            ]
          : [
              {
                id: 'unit-pasted',
                title: this.state.settings.title || 'Narration',
                language: this.state.settings.language,
                status: 'pending'
              }
            ]
        : []
    } else {
      this.state.units = batch.files.flatMap((file): BatchUnit[] =>
        batch.splitChapters && file.name.endsWith('.md')
          ? [
              {
                id: `${file.id}-intro`,
                title: 'Introduction',
                language: this.state.settings.language,
                status: 'pending'
              },
              {
                id: `${file.id}-chapter`,
                title: 'The first crossing',
                language: this.state.settings.language,
                status: 'pending'
              }
            ]
          : [
              {
                id: file.id,
                title: file.name.replace(/\.[^.]+$/, ''),
                language: this.state.settings.language,
                status: 'pending'
              }
            ]
      )
    }
    batch.reviewed = true
  }
  advance(): StudioSnapshot {
    const job = this.state.job
    const settings = this.jobSettings ?? this.state.settings
    if (!activePhases.includes(job.phase)) {
      this.stopTimer()
      return this.snapshot()
    }
    job.elapsed += 4
    if (job.phase === 'stopping') {
      job.phase = 'stopped'
      job.message =
        job.kind === 'preview'
          ? 'Preview stopped.'
          : job.kind === 'batch'
            ? `Batch stopped after ${this.state.units.filter((u) => u.status === 'complete').length} finished part(s).`
            : 'Stopped. The unfinished take was discarded.'
      job.streaming = 'unavailable'
      this.state.models.forEach((model) => {
        if (model.status === 'downloading' || model.status === 'paused') {
          model.status = 'not-installed'
          model.progress = 0
        }
      })
      if (job.kind === 'batch')
        this.state.units.forEach((unit) => {
          if (unit.status === 'generating') {
            unit.status = 'pending'
            unit.message = 'Stopped before this item finished.'
          }
        })
      this.stopTimer()
      return this.emit()
    }
    if (job.phase === 'downloading') {
      job.progress = Math.min(100, job.progress + 12)
      const model = this.state.models.find((m) => m.status === 'downloading')
      if (model) model.progress = job.progress
      if (job.progress === 100) {
        if (model) {
          model.status = 'installed'
          model.bytes = 820000000
        }
        if (job.kind === 'download') {
          job.phase = 'complete'
          job.message = 'Model installed. Ready to use offline.'
          this.stopTimer()
        } else {
          job.phase = 'loading'
          job.progress = 1
          job.message = 'Model downloaded. Loading — time estimate starts after loading.'
        }
      }
      return this.emit()
    }
    if (
      job.phase === 'generating' &&
      job.kind === 'batch' &&
      this.state.units.some((unit) => unit.status === 'pending' || unit.status === 'generating')
    ) {
      const unit = this.state.units.find(
        (item) => item.status === 'pending' || item.status === 'generating'
      )!
      const model = resolvedModel({ ...settings, language: unit.language })
      if (!model.languages.includes(unit.language)) {
        unit.status = 'error'
        unit.message = `${model.label} is English-only. Choose Multilingual V3 or Auto for ${languages.find((language) => language.code === unit.language)?.label ?? unit.language}.`
      } else {
        unit.status = 'complete'
        unit.outputId = this.createOutput(unit.title, unit.language).id
        unit.message = undefined
      }
      job.part = this.state.units.filter(
        (item) => item.status === 'complete' || item.status === 'error'
      ).length
      job.progress = Math.round(5 + (90 * job.part) / job.total)
      job.message = `Item ${job.part} of ${job.total}`
      job.remaining = (job.total - job.part) * 4
    } else if (job.phase === 'generating' && job.kind !== 'batch' && job.part < job.total) {
      job.part += 1
      job.progress = Math.round(5 + (90 * job.part) / job.total)
      job.remaining = (job.total - job.part) * 4
      job.message = `Part ${job.part} of ${job.total}`
      job.streaming = 'ready'
    } else {
      job.phase = phases[Math.min(phases.indexOf(job.phase) + 1, phases.length - 1)]
      const messages: Partial<Record<JobPhase, string>> = {
        loading: `Loading ${resolvedModel(settings).label} — time estimate starts after loading.`,
        preparing: 'Preparing the script and voice reference.',
        generating:
          job.kind === 'batch'
            ? `Item 1 of ${job.total}`
            : `Part 1 of ${job.total} · calculating time remaining…`,
        mastering: 'Joining parts and applying audio mastering.',
        encoding: 'Encoding audio.',
        companions: 'Writing subtitles, transcript and metadata.',
        complete:
          job.kind === 'preview'
            ? `Preview ready — ${languages.find((language) => language.code === settings.language)?.label ?? settings.language} sample.`
            : 'Narration ready. Audio and companion files are available.'
      }
      job.message = messages[job.phase] ?? job.message
      job.progress =
        (
          {
            queued: 0,
            loading: 1,
            preparing: 3.5,
            generating: 5,
            mastering: 96,
            encoding: 98.5,
            companions: 99.5,
            complete: 100
          } as Partial<Record<JobPhase, number>>
        )[job.phase] ?? job.progress
      if (job.phase === 'preparing') {
        const effective = resolvedModel(settings)
        this.state.models.forEach((model) => {
          if (model.status === 'active') model.status = 'installed'
          if (model.id === effective.id) model.status = 'active'
        })
      }
      if (job.phase === 'generating') job.part = job.kind === 'batch' ? 0 : 1
      if (job.phase === 'complete') {
        job.streaming = 'unavailable'
        job.remaining = 0
        this.stopTimer()
        if (job.kind === 'preview') {
          this.state.preview = {
            id: `preview-${this.sequence}`,
            language: settings.language,
            duration: 6.4,
            text: 'A short voice sample in the selected language.'
          }
        }
        if (job.kind === 'narration') this.createOutput(settings.title)
        if (job.kind === 'batch') {
          const completed = this.state.units.filter((unit) => unit.status === 'complete').length
          const failed = this.state.units.filter((unit) => unit.status === 'error')
          job.message = completed
            ? `${completed} of ${job.total} items finished.${failed.length ? ` ${failed.length} failed; completed files are available.` : ' The batch is ready.'}`
            : `No batch items finished. ${failed[0]?.message ?? ''}`
          if (!completed) job.phase = 'error'
        }
      }
    }
    return this.emit()
  }
  dispatch(command: StudioCommand): StudioSnapshot {
    this.state.status = null
    this.state.statusIsError = false
    const fail = (message: string): StudioSnapshot => {
      this.state.status = message
      this.state.statusIsError = true
      return this.emit()
    }
    if (
      activePhases.includes(this.state.job.phase) &&
      [
        'batch.source',
        'batch.text',
        'batch.split',
        'batch.import',
        'batch.remove-file',
        'batch.prepare'
      ].includes(command.type)
    )
      return fail('Wait for the current job to finish before changing batch inputs.')
    switch (command.type) {
      case 'settings.update': {
        const changedLanguage =
          this.state.settings.language !== command.settings.language ||
          this.state.settings.auto_detect !== command.settings.auto_detect
        this.state.inspection = null
        this.state.settings = { ...command.settings }
        if (
          changedLanguage &&
          !(this.state.job.kind === 'batch' && activePhases.includes(this.state.job.phase))
        ) {
          this.state.batch.reviewed = false
          this.state.units = []
        }
        break
      }
      case 'batch.source':
        this.state.batch.source = command.source
        this.state.batch.reviewed = false
        this.state.units = []
        break
      case 'batch.text':
        this.state.batch.text = command.text
        this.state.batch.reviewed = false
        this.state.units = []
        break
      case 'batch.split':
        this.state.batch.splitChapters = command.enabled
        this.state.batch.reviewed = false
        this.state.units = []
        break
      case 'batch.import':
        this.state.batch.files = [
          {
            id: `file-${++this.sequence}`,
            name: 'A place to begin.md',
            characters: 2430,
            readable: true
          },
          {
            id: `file-${++this.sequence}`,
            name: 'A different shore.srt',
            characters: 1820,
            readable: true
          }
        ]
        this.state.batch.reviewed = false
        this.state.units = []
        break
      case 'batch.remove-file':
        this.state.batch.files = this.state.batch.files.filter((file) => file.id !== command.id)
        this.state.batch.reviewed = false
        this.state.units = []
        break
      case 'batch.prepare': {
        const unreadable =
          this.state.batch.source === 'files'
            ? this.state.batch.files.find((file) => !file.readable)
            : undefined
        if (unreadable) {
          this.state.units = []
          this.state.batch.reviewed = false
          return fail(`Could not read ${unreadable.name}: the file is unreadable.`)
        }
        this.prepareBatch()
        if (!this.state.units.length)
          return fail('Upload one or more scripts, or paste a chaptered script.')
        this.state.status = `${this.state.units.length} items ready to review.`
        break
      }
      case 'batch.start':
        if (activePhases.includes(this.state.job.phase))
          return fail('A generation is already running in this tab.')
        if (!this.state.batch.reviewed) return fail('Review the batch items before generating.')
        if (!this.state.units.length) return fail('No text was found to generate.')
        return this.dispatch({ type: 'job.start', kind: 'batch' })
      case 'preferences.save':
        this.state.configuration.saved = { ...this.state.settings }
        this.state.status = 'Generation defaults saved for this mock session.'
        break
      case 'device.set':
        if (activePhases.includes(this.state.job.phase))
          return fail('Stop the active job before changing devices.')
        if (command.mode === 'cuda' && this.state.device.label === 'CPU')
          return fail(
            'NVIDIA GPU is not available. Reboot after installing the driver, or run with CHATTERBOX_DEVICE=cpu.'
          )
        this.state.device.mode = command.mode
        if (command.mode === 'cpu') {
          this.state.device.label = 'CPU'
          this.state.device.vram = null
        }
        this.state.status = 'Device preference updated for this mock session.'
        break
      case 'storage.choose':
        this.state.configuration.preferences.cachePath = 'Selected folder / Phonivra models'
        this.state.status = 'Model cache folder selection simulated.'
        break
      case 'storage.open':
        this.state.status = 'Model cache folder action simulated.'
        break
      case 'credentials.set':
        this.state.configuration.preferences.tokenConfigured = Boolean(command.token.trim())
        this.state.status =
          'Credential connection simulated. The token was discarded and was not stored.'
        break
      case 'credentials.remove':
        this.state.configuration.preferences.tokenConfigured = false
        this.state.status = 'Download credential removed from this mock session.'
        break
      case 'previews.clear':
        this.state.configuration.preferences.previewBytes = 0
        this.state.preview = null
        this.state.status = 'Preview cleanup simulated. Saved narrations were kept.'
        break
      case 'diagnostics.refresh':
        this.state.status = 'Local diagnostic snapshot refreshed.'
        break
      case 'diagnostics.copy':
        this.state.status = 'Copy diagnostics simulated. No clipboard content was changed.'
        break
      case 'logs.open':
        this.state.status = 'Open logs simulated.'
        break
      case 'model.pause': {
        const model = this.state.models.find((item) => item.id === command.id)
        if (
          !model ||
          !['downloading', 'paused'].includes(model.status) ||
          this.state.job.kind !== 'download'
        )
          return fail('No model download is running.')
        model.status = command.paused ? 'paused' : 'downloading'
        this.state.job.paused = command.paused
        this.state.job.message = command.paused
          ? 'Download paused. Partial files are retained.'
          : 'Resuming model download.'
        if (command.paused) this.stopTimer()
        else this.runTimer()
        break
      }
      case 'settings.restore':
        this.state.settings = { ...defaultSettings }
        this.state.configuration.saved = { ...defaultSettings }
        this.state.status =
          'Generation defaults restored. Script, dictionary and reference were kept.'
        break
      case 'script.inspect': {
        if (!this.state.script.trim()) return fail('Paste narration or upload a script first.')
        // Deliberately illustrative mock parts. Real normalization/chunking belongs
        // in the backend adapter; the source editor is never rewritten here.
        const sections = this.state.script.split(/\n\s*\n/).filter(Boolean)
        this.state.inspection = {
          status: 'ready',
          preparedText: this.state.script,
          parts: sections.map((text, index) => ({
            id: `inspection-${index}`,
            index: index + 1,
            text,
            duration: 0,
            pause: 0
          })),
          notes: [
            'Pause markers reserve silence; narration text stays unchanged in the editor.',
            'Each part is limited to 1000 speech tokens (roughly 40 seconds).',
            'Model punctuation normalization runs after text preparation.'
          ],
          error: null
        }
        break
      }
      case 'status.dismiss':
        if (this.state.job.phase === 'error') {
          this.state.job.phase = 'idle'
          this.state.job.message = 'Ready when you are.'
        }
        this.state.status = null
        break
      case 'script.update':
        this.state.inspection = null
        this.state.script = command.text
        break
      case 'dictionary.save':
        this.state.dictionary = command.text
        this.state.status = 'Pronunciation dictionary saved in mock session.'
        break
      case 'job.start': {
        if (activePhases.includes(this.state.job.phase))
          return fail('A generation is already running in this tab.')
        if (command.kind === 'narration' && !this.state.script.trim())
          return fail('Paste narration or upload a script first.')
        const model = resolvedModel(this.state.settings)
        this.jobSettings = { ...this.state.settings }
        this.jobScript = command.kind === 'batch' ? this.state.batch.text : this.state.script
        this.jobVoice =
          this.state.reference.status === 'ready'
            ? this.state.reference.name
            : (this.state.voices.find((voice) => voice.id === this.state.settings.voice)?.label ??
              'Original narrator')
        const reference = this.state.reference
        if (reference.status === 'missing')
          return fail(
            'The uploaded reference recording is no longer available. Please upload it again.'
          )
        if (reference.status === 'error')
          return fail(reference.message ?? 'The reference recording is empty.')
        if (reference.status === 'recording' || reference.status === 'validating')
          return fail('Finish preparing the reference recording first.')
        if (reference.status === 'ready') {
          if (reference.duration <= 0) return fail('The reference recording is empty.')
          if (reference.duration < model.referenceMinimum)
            return fail(
              `The reference recording is ${reference.duration.toFixed(1)}s; Chatterbox needs at least 5 seconds (6+ recommended).`
            )
          if (model.referenceStrict && reference.duration === model.referenceMinimum)
            return fail('Audio prompt must be longer than 5 seconds!')
        } else if (
          !this.state.voices.some(
            (voice) => voice.id === this.state.settings.voice && voice.available
          )
        )
          return fail(
            'That voice is no longer available. Refresh the voice list and choose another.'
          )
        if (
          !this.state.dependencies.ffmpeg &&
          (this.state.settings.format !== 'wav' ||
            this.state.settings.sample_rate !== 24000 ||
            this.state.settings.speed !== 1)
        )
          return fail('ffmpeg is required for this output format or sample rate.')
        if (command.kind !== 'batch' && !model.languages.includes(this.state.settings.language))
          return fail(
            `${model.label} is English-only. Choose Multilingual V3 or Auto for ${languages.find((language) => language.code === this.state.settings.language)?.label ?? this.state.settings.language}.`
          )
        this.state.job = {
          ...this.state.job,
          id: `job-${++this.sequence}`,
          kind: command.kind,
          phase: 'queued',
          progress: 0,
          part: 0,
          total: command.kind === 'batch' ? this.state.units.length : 8,
          elapsed: 0,
          remaining: null,
          streaming: 'unavailable',
          paused: false,
          title: this.state.settings.title || 'Untitled narration',
          message: 'Waiting to start.'
        }
        this.state.configuration.saved = { ...this.state.settings }
        if (command.kind === 'batch')
          this.state.units.forEach((unit) => {
            unit.status = 'pending'
            unit.message = undefined
            delete unit.outputId
          })
        const installation = this.state.models.find((item) => item.id === model.id)
        if (installation?.status === 'not-installed') {
          if (!this.state.dependencies.online) {
            this.state.job.phase = 'error'
            this.state.job.message =
              'This model needs a download. Connect to the internet or choose an installed model.'
            return fail(this.state.job.message)
          }
          installation.status = 'downloading'
          installation.progress = 0
          this.state.job.phase = 'downloading'
          this.state.job.message = 'Downloading model for first use. Progress is simulated.'
        }
        this.runTimer()
        break
      }
      case 'job.cancel':
        if (!activePhases.includes(this.state.job.phase))
          return fail('No generation is running in this tab.')
        this.state.job.phase = 'stopping'
        this.state.job.message = 'Stopping after the current step…'
        this.state.job.paused = false
        this.runTimer()
        break
      case 'reference.attach':
        this.state.reference = {
          status: command.source === 'record' ? 'recording' : 'ready',
          name: command.source === 'record' ? 'Microphone reference.wav' : 'Studio reference.wav',
          duration: 18.4
        }
        break
      case 'reference.clear':
        this.state.reference = { status: 'empty', name: '', duration: 0 }
        break
      case 'voice.save': {
        if (this.state.reference.status !== 'ready')
          return fail('Upload or record a reference clip first.')
        const id = `custom:mock-${++this.sequence}`
        this.state.voices.push({
          id,
          label: command.label.trim() || 'My voice',
          kind: 'custom',
          description: 'Saved in this mock session.',
          duration: Math.min(this.state.reference.duration, 40),
          previewAvailable: true,
          available: true
        })
        this.state.status =
          'Voice saved. Reference override behavior remains an open product decision.'
        break
      }
      case 'voice.delete': {
        if (!command.confirmed)
          return fail('Tick the confirmation box before deleting a custom preset.')
        const voice = this.state.voices.find((v) => v.id === command.id)
        if (!voice) return fail('That custom preset was not found.')
        if (voice.kind !== 'custom')
          return fail('Only custom presets saved in this app can be deleted here.')
        this.state.voices = this.state.voices.filter((v) => v.id !== command.id)
        if (this.state.settings.voice === command.id) this.state.settings.voice = 'default'
        break
      }
      case 'model.download': {
        if (!this.state.dependencies.online)
          return fail('A network connection is required to download this model.')
        if (activePhases.includes(this.state.job.phase))
          return fail('A generation is already running in this tab.')
        const model = this.state.models.find((m) => m.id === command.id)
        if (model) {
          model.status = 'downloading'
          model.progress = 0
        }
        this.state.job = {
          ...this.state.job,
          id: `download-${++this.sequence}`,
          kind: 'download',
          title: resolvedModel({ model: command.id, language: this.state.settings.language }).label,
          phase: 'downloading',
          progress: 0,
          paused: false,
          message: 'Downloading model. Progress and sizes are simulated.'
        }
        this.runTimer()
        break
      }
      case 'model.remove': {
        if (!command.confirmed) return fail('Confirm model removal first.')
        if (activePhases.includes(this.state.job.phase))
          return fail('Stop the active job before removing a model.')
        const model = this.state.models.find((m) => m.id === command.id)
        if (model) {
          model.status = 'not-installed'
          model.bytes = null
          model.progress = 0
        }
        break
      }
      case 'output.select':
        if (!this.state.outputs.some((o) => o.id === command.id))
          return fail('That file was not found.')
        this.state.selectedOutput = command.id
        this.state.playback = { playing: false, position: 0, outputId: command.id }
        break
      case 'output.delete':
        if (!command.confirmed) return fail('Tick the confirmation box first.')
        if (!this.state.outputs.some((o) => o.id === command.id))
          return fail('That file was not found.')
        this.state.outputs = this.state.outputs.filter((o) => o.id !== command.id)
        this.state.selectedOutput = this.state.outputs[0]?.id ?? null
        this.state.playback = { playing: false, position: 0, outputId: null }
        break
      case 'output.watermark': {
        if (!this.state.outputs.some((output) => output.id === command.id))
          return fail('That file was not found.')
        const fixture = fixtures.find((item) => item.id === this.state.scenario)?.description ?? ''
        const unavailable =
          !this.state.dependencies.perth || /package missing|needs the Perth/i.test(fixture)
        const notDetected = /not detected|not-detected/i.test(fixture)
        const failed = /check failed|could not check/i.test(fixture)
        const message = unavailable
          ? 'Watermark check needs the Perth package: unavailable in this scenario.'
          : failed
            ? 'Could not check the watermark: simulated detector failure.'
            : notDetected
              ? 'Watermark not detected: 0.24. The file may have been re-encoded or edited heavily.'
              : 'Watermark detected: 0.94.'
        this.state.watermark = {
          outputId: command.id,
          state: unavailable
            ? 'unavailable'
            : failed
              ? 'error'
              : notDetected
                ? 'not-detected'
                : 'detected',
          score: unavailable || failed ? null : notDetected ? 0.24 : 0.94,
          message
        }
        this.state.status = message
        this.state.statusIsError = unavailable || failed
        break
      }
      case 'output.export':
        this.state.status = `${command.format.toUpperCase()} export simulated. No file was written.`
        break
      case 'playback.toggle': {
        const sameClip = this.state.playback.outputId === command.id
        this.state.playback.playing = sameClip ? !this.state.playback.playing : true
        this.state.playback.outputId = command.id
        if (!sameClip) this.state.playback.position = 0
        break
      }
      case 'playback.seek':
        if (command.id && command.id !== this.state.playback.outputId) {
          this.state.playback.outputId = command.id
          this.state.playback.playing = false
        }
        this.state.playback.position = Math.min(
          command.seconds,
          this.state.preview?.id === this.state.playback.outputId
            ? this.state.preview.duration
            : this.state.playback.outputId?.startsWith('stream:')
              ? Math.max(1, this.state.job.part * 4)
              : (this.state.outputs.find((o) => o.id === this.state.playback.outputId)?.duration ??
                0)
        )
        break
      case 'script.import':
        this.state.documentRevision += 1
        this.state.inspection = null
        this.state.script = sampleScript
        this.state.status = `Loaded journey.md · ${sampleScript.length} characters.`
        break
      case 'project.open':
        this.state.documentRevision += 1
        this.state.inspection = null
        this.state.script = sampleScript
        this.state.settings = { ...defaultSettings, title: 'A place to begin' }
        this.state.dictionary = ''
        this.state.configuration.saved = { ...this.state.settings }
        this.state.status = 'Example project opened. No file was read.'
        break
      case 'project.save':
        this.state.configuration.saved = { ...this.state.settings }
        this.state.status = 'Project save simulated. No file was written.'
        break
      case 'folder.open':
        this.state.status = 'Output folder action simulated.'
        break
      case 'outputs.refresh':
        this.state.selectedOutput = this.state.outputs[0]?.id ?? null
        this.state.playback = { outputId: this.state.selectedOutput, playing: false, position: 0 }
        this.state.status = this.state.outputs.length
          ? 'Library refreshed.'
          : 'No saved narrations yet.'
        break
      case 'voices.refresh':
        this.state.status = 'Voice list refreshed.'
        break
    }
    return this.emit()
  }
}
