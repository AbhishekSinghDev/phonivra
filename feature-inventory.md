1. Product summary
Chatterbox Narrator is a local narration studio for Resemble AI's Chatterbox TTS models. It turns scripts into spoken audio using English-only Turbo/Nano/Original models or the 23-language Multilingual V3 model, with zero-shot voice cloning from a reference recording. It also provides text cleanup, pronunciation rules, pause and emotion markup, audio mastering, multiple export formats, subtitles, transcripts, batch chapter generation, a local output library, and portable project files. Models are downloaded on first use and cached locally; generation runs on CUDA when available and otherwise on CPU. Output is watermarked with Resemble Perth, and there is no account, login, cloud storage, or telemetry in the product.
2. Feature inventory
2.0 Entry points observed
Entry point	Purpose
run.sh	Sets HF_HOME and starts .venv/bin/python app.py.
app.py main block	Starts Gradio on CHATTERBOX_HOST:CHATTERBOX_PORT, optional CHATTERBOX_SHARE.
launcher.py	Desktop single-instance launcher; checks /config, starts run.sh, opens http://127.0.0.1:<port>, shows an error dialog on failure.
Gradio /config	Used by the launcher as a readiness check; expects the title Chatterbox Turbo Narrator.
Gradio event queue / generated HTTP/WebSocket transport	The app has no hand-written REST or WebSocket API. Each wired handler is exposed through Gradio's generated event/queue API.
Wired handlers	import_script, save_dictionary, chunk_preview, _sync_language, _stats, model_note, selected_voice_info, refresh_voices, save_voice_preset, delete_voice_preset, preview_generation, restore_defaults, generate, stop_generation, save_project, load_project, batch_generate, history_load, refresh_history, history_watermark, history_delete, open_outputs, and demo.load(refresh_history).
Startup hooks	Creates outputs/, voices/, voices/previews/, projects/; reads settings.json and dictionary.json; detects device; refreshes history on page load. No scheduled/background jobs.
Upstream developer entry points	Python classes ChatterboxTTS, ChatterboxMultilingualTTS, ChatterboxTurboTTS, ChatterboxVC; demo scripts gradio_tts_app.py, gradio_tts_turbo_app.py, gradio_vc_app.py, multilingual_app.py; example scripts.
CLI	None. No argparse, no console-script entry point in pyproject.toml, no subcommands, no flags.
Evidence: launcher.py, app.py lines 1026–1300, run.sh, pyproject.toml, upstream src/chatterbox/*.py.
2.1 Startup, launcher, and access
Feature: desktop launch and single-instance reuse. Double-clicking the desktop entry starts the app in the background and opens the local page; repeated clicks reuse the running app. Startup failures are logged to server.log and shown through zenity or notify-send if available.
Name	Type	Default	Allowed values / range	Effect
CHATTERBOX_PORT	environment integer	7860	any usable port	Port used by both launcher and app.
launcher timeout	fixed	120 seconds	fixed	If the app is not ready, an error dialog is shown.
.launcher.lock	internal lock file	created automatically	—	Serializes simultaneous launches.
Status: working on Linux. The desktop file hardcodes a local path, and the launcher uses fcntl, xdg-open, zenity/notify-send; Windows is not supported by this path.
Evidence: launcher.py, chatterbox-narrator.desktop, README lines 7–24.
Feature: local web access and network exposure. The app can be opened locally or exposed on a LAN or through a temporary Gradio share link.
Name	Type	Default	Allowed values / range	Effect
CHATTERBOX_HOST	environment string	127.0.0.1	any bind address, e.g. 0.0.0.0	Changes the network interface the server listens on.
CHATTERBOX_PORT	environment integer	7860	any usable port	Changes the listening port.
CHATTERBOX_SHARE	environment flag	0	1 enables share; anything else disables	Creates a temporary Gradio share link.
authentication	—	none	—	There is no login, token, or access control.
Status: working, but partial from a security perspective: exposing CHATTERBOX_HOST=0.0.0.0 or enabling sharing exposes an unauthenticated app.
Evidence: app.py main block; README lines 17–24.
Feature: hardware detection and device status. The page reports the active device and, on CUDA, the GPU name and total VRAM.
Name	Type	Default	Allowed values / range	Effect
CHATTERBOX_DEVICE	environment enum	auto	auto, cpu, cuda	auto selects CUDA if available, otherwise CPU. cuda raises an error if CUDA is unavailable. mps is rejected.
Status: working for CPU/CUDA; partial overall because there is no MPS option, no GPU index selection, and no free-VRAM display (only total VRAM).
Evidence: app.py lines 31–44; README line 3.
2.2 Script input, import, and title
Feature: write or paste a script and import script files. The user can paste text or load one .txt, .md, .markdown, .srt, or .vtt file. Subtitle files are converted to dialogue; Markdown can be stripped on import.
Name	Type	Default	Allowed values / range	Effect
narration text	string	empty	no hard maximum	The script that will be synthesized.
title	string	""	up to 120 characters in settings; filename limited to 60	Used for output filename, metadata, and project filename. Empty falls back to narration/project.
import file	file path	none	.txt, .md, .markdown, .srt, .vtt	Replaces the current script with the file contents. One file per import action.
strip_markdown	boolean	true	on/off	Strips Markdown on import of .md/.markdown and during generation cleanup when enabled.
import status	read-only text	—	—	Reports the loaded filename and character count, or an error.
Subtitle conversion removes cue numbers, timing lines, WEBVTT headers, HTML tags, and consecutive duplicate paragraphs. It is a heuristic parser, not a full SRT/VTT object model. All-digit dialogue lines are also removed.
Status: working. Subtitle import is partial because it is line/paragraph heuristics rather than a standards-complete subtitle parser.
Evidence: app.py:import_script; narrator_core.py:read_script_file, subtitle_to_text, SCRIPT_EXTS.
2.3 Text cleanup and pronunciation
Feature: optional text normalization before synthesis. These toggles are applied only when generating; the original script in the editor is not rewritten.
Name	Type	Default	Allowed values / range	Effect
normalize_punct	boolean	false	on/off	Converts smart quotes to ASCII, en/em dashes to hyphens, ellipsis to ..., non-breaking spaces to spaces; removes spaces before punctuation; collapses repeated !/?; reduces 4+ dots to ....
convert_numbers	boolean	false	on/off	Converts numbers, decimals, percentages, currency symbols (₹, $, €, £), and English ordinal suffixes to words. Only English and Hindi.
expand_abbrevs	boolean	false	on/off	Expands a fixed list: mr., mrs., ms., dr., prof., sr., jr., st., vs., etc., e.g., i.e., approx., dept., govt., min., max., no., fig., vol., est., ft., hr.
strip_markdown	boolean	true	on/off	Removes code fences, heading markers, blockquote markers, list markers, horizontal rules, emphasis markers, links (keeps link text), image links (keeps alt text), URLs, HTML tags, and pipes.
remove_emoji	boolean	true	on/off	Removes broad emoji ranges, variation selectors, and zero-width joiners.
pronounce	boolean	false	on/off	Enables the pronunciation dictionary for generation/batch.
pronunciation dictionary	multiline text	empty	one rule per line; =/=>/-> separators; # comments	Case-insensitive, whole-word/phrase replacement, applied longest source first, left to right.
Order of operations: pause markers are protected first; then Markdown stripping, emoji removal, punctuation normalization, abbreviation expansion, dictionary replacement, number conversion, whitespace cleanup. Model-level punc_norm runs afterward regardless of these toggles: it capitalizes the first letter, collapses whitespace, rewrites some punctuation, and adds a terminal punctuation mark. The exact punc_norm rules differ slightly between Original/Multilingual and Turbo/Nano.
Status: working, with partial coverage:
- Number conversion is only English/Hindi; other languages pass numbers through unchanged.
- Hindi ordinal suffixes are not converted as ordinals; _number_words ignores the ordinal flag for Hindi.
- No date, time, phone-number, unit, or thousands-separator normalization is implemented.
- Dictionary replacement is sequential and can re-replace text produced by an earlier rule.
- The cleanup happens after the script is imported, so generated output can differ from the editor text.
Evidence: narrator_core.py:normalize_text, _strip_markdown, _remove_emoji, _normalize_punctuation, _expand_abbreviations, _convert_numbers, parse_dictionary, apply_dictionary; upstream tts.py, tts_turbo.py, mtl_tts.py punc_norm.
2.4 Pauses, reaction tags, and markup
Feature: insert custom pauses and paralinguistic reaction tags. The user can insert [pause] or type [pause=1.5] between text; reaction tags are inserted at the cursor.
Name	Type	Default	Allowed values / range	Effect
[pause] / <pause>	text marker	none	literal marker	Adds a silence using the current gap value.
[pause=N]	text marker	none	N is a non-negative number of seconds; no upper clamp	Adds explicit silence.
gap	float	0.38	UI 0–3, coerced 0–6	Default silence for markers; see the partial-status note below.
reaction tags	text literals	none	[laugh], [chuckle], [cough], [sigh], [gasp], [groan], [sniff], [shush], [clear throat]	Native paralinguistic tags for Turbo/Nano. Other models do not interpret them as reactions.
SSML	—	—	not supported	No <speak>, <break>, <prosody>, <emphasis>, phoneme, or SSML parsing.
Important pause behavior: in split_script, gap is attached only to the last chunk of each pause-delimited segment. Automatically split chunks inside a segment receive pause_after = 0. Therefore, without an explicit [pause], changing “Pause between parts” does not insert silence between automatically split parts; it mainly changes the duration used by [pause] markers without a number. The final chunk’s pause is also zeroed, and a leading pause is dropped. This contradicts the README’s broader “pause between parts” description.
Status: partial. Reaction tags are native only to Turbo/Nano; on Multilingual/Original they are sent through as ordinary text. The gap behavior is a functional discrepancy that needs a product decision.
Evidence: narrator_core.py:PAUSE_RE, split_script lines 666–688; app.py:EMOTION_TAGS, run_generation pause insertion; README lines 59–61, 77.
2.5 Language selection and detection
Feature: choose one of 23 languages, or detect the language from the script. Language selection controls pronunciation/model language; it does not translate.
Name	Type	Default	Allowed values / range	Effect
language	enum	en	23 codes listed in section 4	Passed to Multilingual V3; also determines whether English-only models are allowed.
auto_detect	boolean	false	on/off	When on, the script is heuristically detected while typing and again at generation.
Detection details:
- Unicode-script detection covers Devanagari, Arabic, Hebrew, Greek, Cyrillic, Japanese kana, Hangul, and CJK ideographs.
- Latin-script detection uses stopword lists for English, German, Spanish, French, Italian, Portuguese, Dutch, Danish, Norwegian, Swedish, Finnish, Polish, Turkish, Malay, and Swahili.
- A language needs at least 2 Unicode-script characters, or at least 3 words with a stopword score of 2+ and a score higher than English.
- Short, ambiguous, mixed, or unsupported text falls back to English.
- Danish/Norwegian/Swedish are especially easy to confuse.
- Detection is per generation or per batch unit, not per sentence. The whole generated unit is tokenized with one language marker.
Status: partial. It is a heuristic, not a language identifier with confidence; mixed-language scripts and locale variants are not represented.
Evidence: narrator_core.py:LANGUAGES, _UNICODE_LANGUAGE_TESTS, _STOPWORDS, detect_language; app.py:_sync_language, generate, batch_generate.
2.6 Voices, audition, cloning, and presets
Feature: choose, audition, clone, save, refresh, and delete voices. A voice can be a built-in preset, an external recording discovered in voices/, or a custom preset saved from a reference upload/recording.
Name	Type	Default	Allowed values / range	Effect
voice	dropdown key	default	default, built-in preset keys, file:<name>, custom:<slug>-<hex>	Selects the reference voice. default uses the model checkpoint’s built-in conditionals.
reference recording	audio file	none	upload or microphone; at least 5 seconds; 6+ recommended	Overrides the selected preset for generation and preview until cleared.
preset label	string	My voice if blank	up to 60 characters	Label for a saved custom preset.
delete confirmation	boolean	false	on/off	Required before deleting a custom preset.
refresh action	button	—	—	Rescans voices/ and updates the voice list.
Behavior:
- Built-in presets: Original narrator (default), Male 1, Male 2, Female 1, Female 2, Deep / dramatic.
- Any top-level audio file in voices/ with an extension in .wav, .mp3, .flac, .ogg, .m4a, .opus, .aiff, .aif becomes an external entry labeled Recording · <name>, unless it is already a built-in file or starts with custom_.
- Custom presets are stored as mono 24 kHz, 16-bit WAV files, peak-normalized only if the decoded peak exceeds 1.0, and truncated to 40 seconds on save. They are recorded in voices/custom_voices.json.
- Deleting is allowed only for custom: entries; built-in and externally added recordings are protected.
- An uploaded reference overrides the preset selection. Saving a preset does not clear the uploaded reference, so it continues to override the newly saved preset until the user clears it.
- “Generate preview with current settings” synthesizes a fixed language-specific sentence with the selected model/voice/reference and a subset of current settings. It uses hard-coded preview settings: WAV, 24 kHz, part size 320, gap 0.2, loudness target −16 LUFS, silence trimming on, fade 20 ms. It does not use the user’s dictionary, cleanup flags, part size, gap, format, sample-rate, mastering settings, or script.
- There is no training or fine-tuning; cloning is zero-shot reference conditioning.
Reference-length behavior:
- Narrator accepts a reference at exactly 5.0 seconds, but Turbo/Nano assert “Audio prompt must be longer than 5 seconds!”; an exactly-5.0-second reference can therefore pass narrator validation and fail inside the Turbo/Nano model.
- The decoder uses up to the first 10 seconds of reference audio for all models.
- The speech-token encoder uses up to 6 seconds for Original/Multilingual and 15 seconds for Turbo/Nano.
- Turbo/Nano normalize the reference loudness to −27 LUFS; Original/Multilingual do not.
Status: working overall; partial for the exact-5-second edge, the lack of voice language metadata/consent gating, and the fact that saving a preset does not deactivate the uploaded reference.
Evidence: narrator_core.py:BUILTIN_VOICES, voice_entries, save_custom_voice, delete_custom_voice, save_reference_copy, validate_reference; app.py:preview_generation, _preview_settings, save_voice_preset, selected_voice_info; upstream tts.py, mtl_tts.py, tts_turbo.py conditionals.
2.7 Model selection and routing
Feature: choose Auto, Turbo, Nano, Multilingual V3, or Original. Auto routes English to Turbo and all other languages to Multilingual V3. Explicit English-only models reject non-English languages.
Name	Type	Default	Allowed values / range	Effect
model	enum	auto	auto, turbo, nano, multilingual, original	Selects the model family. Auto is a router, not a checkpoint.
resolved model	internal	—	turbo, nano, multilingual, original	Recorded in metadata as resolved_model.
Behavior:
- Auto: language == "en" → Turbo; any other language → Multilingual V3.
- Selecting Turbo, Nano, or Original with a non-English language raises an error telling the user to choose Multilingual V3 or Auto.
- Models are loaded lazily on first generation/preview, not at app startup.
- Switching to a different model releases the previous one and empties the CUDA cache.
- The model cache key includes language, so changing language while using Multilingual reloads the entire model even though the checkpoint is the same.
- On CUDA, Multilingual and Original run their T3 transformer in half precision; Turbo and Nano stay in full precision. There is no user precision/quantization control.
- Loading OOM is caught with a specific error suggesting Nano, a shorter script, or CPU. Other load errors propagate as generation errors.
Status: working for routing and loading; partial for model management because there is no installed-model list, download manager, deletion, pause/resume, or version choice.
Evidence: app.py:resolve_model, load_model, model_note, MODEL_KEY; README lines 26–38.
2.8 Generation settings
The following table covers every persisted generation setting. “UI range” is the control range in the current app; “coerced” is the backend clamp/validation in narrator_core._coerce_settings. Some backend values can be wider than the UI, especially when loading a hand-edited project.
Name	Type	Default	Allowed values / range	Effect
title	string	""	up to 120 chars	Output/project title and filename base.
language	enum	en	23 codes	Model language; must be supported.
model	enum	auto	5 choices	Model routing; see 2.7.
auto_detect	boolean	false	on/off	Detect language from script at generation and while typing.
voice	string key	default	available voice keys	Reference voice.
temperature	float	0.8	UI 0.1–1.5, step 0.05; backend accepts any finite finite	Sampling randomness; higher is more varied.
top_p	float	0.95	UI 0.0–1.0, step 0.01; backend no semantic clamp	Nucleus sampling.
top_k	integer	1000	UI 0–2000, step 10; backend any int	Top-k sampling. Only Turbo/Nano; ignored for Multilingual/Original.
min_p	float	0.05	UI 0.0–0.5, step 0.01; backend no semantic clamp	Min-p sampling. Only Multilingual/Original; ignored by Turbo/Nano.
repetition_penalty	float	1.2	UI 1.0–2.0, step 0.05; backend no semantic clamp	Penalizes repeated speech tokens.
exaggeration	float	0.5	UI 0.0–1.0, step 0.05; backend any finite	Expressiveness/emotion conditioning. Only Multilingual/Original; ignored by Turbo/Nano.
cfg_weight	float	0.5	UI 0.0–1.0, step 0.05; backend any finite	Classifier-free guidance / pacing. Only Multilingual/Original; ignored by Turbo/Nano.
chunk_limit	integer	260	60–500 chars, step 10	Maximum characters per generated part. Lower = shorter parts; higher = fewer joins.
gap	float	0.38	UI 0–3, step 0.05; coerced 0–6	Default pause for [pause]; see the partial gap behavior in 2.4.
seed	integer	0	0 or positive; negative coerced to 0	0 picks a random seed and records it; positive seeds the RNGs.
speed	float	1.0	UI 0.5–2.0, step 0.05; coerced 0.5–2.0	Pitch-preserving FFmpeg atempo time stretch after synthesis.
format	enum	wav	wav, mp3, flac, ogg, m4a	Output container/codec.
sample_rate	integer	24000	24000, 44100, 48000	Output sample rate; resampled with FFmpeg when needed.
loudness	boolean	true	on/off	Integrated loudness normalization.
loudness_target	float	-16.0	UI -24.0 to -9.0, step 0.5; coerced -30.0 to -5.0	Target LUFS.
trim_silence	boolean	true	on/off	Trims leading/trailing silence at −45 dB with 50 ms padding.
fade_ms	float	30	UI 0–1000, step 10; coerced 0–2000	Equal fade-in and fade-out duration.
normalize_punct	boolean	false	on/off	See 2.3.
convert_numbers	boolean	false	on/off	See 2.3; English/Hindi only.
expand_abbrevs	boolean	false	on/off	See 2.3.
strip_markdown	boolean	true	on/off	See 2.3.
remove_emoji	boolean	true	on/off	See 2.3.
pronounce	boolean	false	on/off	Enables the pronunciation dictionary.
Additional notes:
- top_k is silently irrelevant for Multilingual/Original because it is not passed to those models.
- min_p, exaggeration, and cfg_weight are silently irrelevant for Turbo/Nano because they are not passed to the Turbo/Nano generate call.
- The UI does not disable irrelevant controls per model, so a user can change a value that has no effect.
- Sampling values outside the UI ranges can be introduced through a hand-edited settings.json or project JSON; those values are parsed as finite numbers but are not semantically validated. For example, temperature=0, negative top_k, or top_p>1 are not clamped and may fail inside the sampler.
- The current persisted settings.json on this machine uses language: "hi", although the code default is en.
Status: working; partial because of model-specific ignored controls, the gap issue, and limited backend validation.
Evidence: narrator_core.py:DEFAULT_SETTINGS, _coerce_settings, load_settings, save_settings; app.py:_settings, UI control definitions in the Blocks section; upstream model generate signatures.
2.9 End-to-end generation pipeline
 1. Input comes from the editor, an imported script, or a batch unit. The title is used for naming/metadata.
 2. Normalization optionally strips Markdown/emoji, normalizes punctuation, expands abbreviations, applies the dictionary, converts numbers (English/Hindi), and protects pause markers.
 3. Chunking splits at sentence-ending punctuation followed by whitespace (. ! ? । ॥ 。 ！ ？), then packs words up to chunk_limit; an overlong word is hard-sliced. Pause markers create segment boundaries.
 4. Model/voice resolution chooses Auto routing, rejects English-only/non-English combinations, loads the model if needed, and prepares conditionals from the reference or the checkpoint’s built-in voice.
 5. Seeding sets Python, NumPy, CPU Torch, and CUDA RNGs. A seed of 0 is replaced by a random integer in 1..2^31-1.
 6. Per-part inference: each part is generated separately with the selected sampling parameters. The model applies its own punc_norm and tokenizer. Every model watermarks its output with Perth. Part audio is collected; configured pauses are inserted after parts only when pause_after is non-zero.
 7. Mastering: concatenate parts; optionally trim leading/trailing silence; optionally fade in/out; optionally normalize integrated loudness to the target with gain clamped to ±24 dB and a 0.99 peak ceiling.
 8. Export: optionally time-stretch with atempo, resample, encode the selected format, and write optional embedded metadata.
 9. Companions: measure duration, build sentence-weighted SRT/VTT cues (adjusted for speed and trim offset), write the cleaned-script transcript, and write the JSON sidecar.
10. Completion: return the audio path and companion files; the output becomes visible in the Library because it is written under outputs/.
There is no streaming/partial audio output. The generated file appears only after all parts and post-processing finish.
Status: working. The main caveats are the pause semantics, per-part token cap, and approximate subtitle timing.
Evidence: app.py:run_generation; narrator_core.py:normalize_text, split_script, build_cues, trim_silence, apply_fade, normalize_loudness, export_audio; upstream tts.py, mtl_tts.py, tts_turbo.py.
2.10 Progress reporting and cancellation
Feature: live progress, estimated time remaining, and a Stop control. During a main generation, the Stop button is enabled; a separate Stop Batch control exists for batch work.
Name	Type	Default	Allowed values / range	Effect
Stop	action	disabled until narration starts	click	Sets the job’s cancellation event; the job stops at the next checked step.
Stop Batch	action	always available	click	Stops the current batch or main job in the same browser session.
progress	read-only	—	0–100%	Reports model loading, preparation, part X of N, elapsed time, and estimated remaining time.
Progress phases:
- 1% loading a model (first time), 2% preparing, 3.5% preparing the voice reference.
- 5–95% across parts, including part number, elapsed time, and remaining estimate.
- 96% joining and finishing, 97.5% loudness, 98.5% encoding, 99.5% subtitles, 100% complete.
Cancellation semantics:
- Checks occur between parts, between stages, and through a forward hook on the T3 transformer during token generation.
- A first-time model download/load can finish before cancellation takes effect.
- An in-flight decoder step can finish before cancellation takes effect.
- FFmpeg export is not interrupted mid-command; cancellation is checked after it returns, then the unfinished output and companions are deleted.
- Aborted narration audio is discarded.
- Voice preview creates a job but has no wired Stop control; the main Stop button is not enabled for previews.
- Only one job per browser session; a second request reports “A generation is already running in this tab.”
- Globally, the model lock and Gradio concurrency serialize generation; only one model is loaded at a time.
Status: partial. Main narration/batch cancellation works, but preview cancellation is not exposed, and load/download/decoder/FFmpeg steps are not immediately interruptible.
Evidence: app.py:JobProgress, check_cancel, stop_generation, generate, preview_generation, batch_generate, MODEL_LOCK, JOBS; README lines 131.
2.11 Audio mastering and export
Feature: master and export the completed narration. The app trims, fades, normalizes loudness, time-stretches, resamples, encodes, and writes optional metadata.
Name	Type	Default	Allowed values / range	Effect
format	enum	wav	wav, mp3, flac, ogg, m4a	Output container/codec.
sample_rate	integer	24000	24000, 44100, 48000	Output sample rate.
speed	float	1.0	0.5–2.0	Pitch-preserving atempo stretch; no pitch control.
trim_silence	boolean	true	on/off	Removes leading/trailing silence below −45 dB, with 50 ms padding.
fade_ms	float	30	UI 0–1000; coerced 0–2000	Equal fade-in/out; skipped if the clip is too short for two fades.
loudness	boolean	true	on/off	Integrated loudness normalization.
loudness_target	float	-16.0	UI -24…-9; coerced -30…-5	Target LUFS. Gain clamped to ±24 dB and peak limited to 0.99.
title	string	""	up to 120 chars	Filename base and optional embedded title.
output filename	derived	—	—	<safe title>-<YYYYMMDD-HHMMSS>-<6 hex>.<format>; title limited to 60 filename characters; empty title becomes narration.
Format behavior:
- WAV: PCM 16-bit, mono. If speed is exactly 1.0 and output rate equals 24 kHz, the file is written directly by SoundFile, bypassing FFmpeg. This fast path does not embed title/artist/comment metadata; the JSON sidecar still has the information.
- MP3: libmp3lame, 192 kbps.
- FLAC: flac, 16-bit sample format.
- OGG: libvorbis, quality 6.
- M4A: AAC, 192 kbps.
- FFmpeg is required for compressed formats, resampling, or speed changes. If FFmpeg is unavailable, only a native-rate, 1× WAV can be produced (with a Librosa fallback); other formats/rates raise “ffmpeg is required for this output format or sample rate.”
- Embedded metadata: title (when FFmpeg path is used), artist Chatterbox Narrator, and comment containing model, language, and voice (truncated to 400 characters).
- No stereo, bit-depth, bitrate, channel-layout, pitch, or volume controls.
- No streaming or segmented export.
- FFmpeg subprocess timeout: 1800 seconds.
Status: working; partial for the missing WAV metadata on the fast path and the lack of user control over bitrate/bit depth/channels.
Evidence: narrator_core.py:export_audio, trim_silence, apply_fade, normalize_loudness, FORMAT_CHOICES, SAMPLE_RATE_CHOICES; app.py:run_generation export block.
2.12 Companion outputs: subtitles, transcript, and metadata
Feature: every completed narration gets companion files.
Output	Content	Notes
Audio	Selected format	Watermarked by Perth; mono; native model output is 24 kHz.
.srt	Per-sentence cues derived from generated part durations	Sentence-weighted, not forced alignment; wrapped at 44 characters and capped at 4 lines.
.vtt	Same cues in WebVTT format	Same timing/wrapping limitations.
.txt	Cleaned script after normalization	The actual text sent toward synthesis, not the raw editor text.
.json	Sidecar metadata	App/version, title, created time, file, format, duration, sample rate, language/code/label, requested/resolved model, voice key/label, seed, speed, trim start, loudness gain, part count, source characters, watermark label, settings snapshot, and per-part text/duration/pause details.
Batch ZIP	Audio + all companion files for completed batch units	Named batch-<timestamp>-<hex>.zip; duplicate companion names are skipped.
Subtitle limitations:
- Timing is derived from the generated duration of each part and character weights within that part; it is not word-level or phoneme-level alignment.
- Cue text longer than roughly 176 characters (4 lines × 44) is silently truncated in the SRT/VTT, even though the full sentence is used for timing.
- Cue durations are divided by speed; the trim offset is applied to start times.
- fit_cues clamps cues to the final audio duration.
- Cue start/end timings are approximate and may not match audible phonemes exactly.
- No subtitle editing, retiming, or translation.
Status: working; subtitles are partial by design/limitation.
Evidence: narrator_core.py:build_cues, _wrap_cue, write_subtitles, fit_cues; app.py:run_generation metadata block; README lines 85–94.
2.13 Batch generation and chapters
Feature: generate multiple files from uploaded scripts or a pasted chaptered script. Batch uses the current voice and generation settings.
Name	Type	Default	Allowed values / range	Effect
batch files	multiple file paths	none	.txt, .md, .markdown, .srt, .vtt	One output per file, or one output per chapter when splitting is enabled.
pasted text	string	empty	any length	If non-empty, uploaded files are ignored.
split chapters	boolean	true	on/off	Split at Markdown headings #, ##, ###.
inherited settings	all generation settings	current	—	Voice, model, language, cleanup, format, mastering, etc. are shared by all units.
auto-detect	inherited	current	on/off	Detected separately for each batch unit.
title	string	current title	up to 120	Used for the single pasted output when not splitting; uploaded files use their own stems/chapter names.
Chapter behavior:
- Headings become titles; content before the first heading becomes Introduction.
- Heading-only sections with no body are skipped.
- If no headings are found, the whole text is one unit.
- Pasted chaptered text works with heading splitting.
- .md file uploads with strip_markdown=true are stripped before chapter splitting, so the heading markers are gone and chapter splitting collapses to one unit. This is a current partial/bug; uploading a .txt with headings or pasting the text avoids it.
- A batch unit failure is logged and the batch continues; the status reports the first three errors.
- If every unit fails, the batch raises an error and no ZIP is produced.
- Cancellation keeps already completed files on disk but returns no list or ZIP for them.
- Batch has no per-unit voice or settings overrides; all units share the current configuration.
Status: working for basic batch and pasted chapters; partial for .md chapter splitting and cancellation result handling.
Evidence: app.py:batch_generate; narrator_core.py:split_chapters, read_script_file, _strip_markdown, zip_outputs; README lines 96–111.
2.14 Library, history, watermark, and output deletion
Feature: browse and manage previously generated audio files in outputs/. The library lists audio files newest first and loads the selected file with metadata and companions.
Name	Type	Default	Allowed values / range	Effect
saved narration selection	dropdown	newest file on load	any audio file in outputs/	Loads audio, metadata summary, companion files, and part timings.
refresh	action	—	—	Rescans outputs/ and selects the newest entry.
delete confirmation	boolean	false	on/off	Required before deletion.
delete selected	action	—	—	Deletes the audio plus .srt, .vtt, .txt, and .json companions.
verify Perth watermark	action	—	—	Runs Perth detection on the selected file and reports a numeric result.
open output folder	action	—	—	Opens outputs/ with xdg-open (Linux).
Limits and behavior:
- History scans only the top level of outputs/; subdirectories are ignored.
- Recognized audio extensions are .wav, .mp3, .flac, .ogg, .m4a, .opus, .aiff, .aif.
- Up to 150 entries are listed.
- Entries are sorted by file modification time, newest first.
- Missing sidecar metadata is tolerated: title falls back to filename, duration is measured from the audio, and model/language may be blank.
- Any audio file placed in outputs/ can appear, even if it was not generated by the app.
- No search, rename, tagging, favorites, bulk delete, pagination beyond 150, or library ZIP export.
- Deleting removes the selected audio and companions, not a whole batch or project.
- Watermark verification uses Perth’s detection API; heavy re-encoding/editing may weaken detection. If Perth is unavailable, it reports that the check needs the package. It reports “Watermark not detected” below a 0.5 numeric result.
- The audio player and explicit download control are separate from companion-file downloads.
Status: working; partial for search/rename/bulk operations and watermark reliability after editing.
Evidence: narrator_core.py:history_entries, resolve_output, delete_output, verify_watermark, companion_files, output_info, parts_table; app.py:refresh_history, history_load, history_delete, history_watermark, open_outputs.
2.15 Projects: save and load
Feature: save a portable JSON project and load it later. A project contains the script, title, voice selection, dictionary, and all generation settings.
Name	Type	Default	Allowed values / range	Effect
project file	JSON file	none	.json produced by this app	Save writes to projects/; load accepts an uploaded project JSON.
title	string	current title	up to 120	Used in the project filename (<safe title>-<timestamp>.json).
save project	action	—	—	Writes the project and also saves current settings/dictionary.
load project	action	—	—	Restores script, dictionary, settings, stats, and model note; saves settings to settings.json.
Behavior:
- Project schema marker: "app": "chatterbox-narrator", "version": 2.
- Contents: saved timestamp, settings, text, dictionary.
- No audio is included.
- A custom voice file must still exist on the loading machine; if the saved voice key is unavailable, loading falls back to default.
- The project file version is written but not explicitly validated/migrated; only the app marker is checked.
- There is no project list/browser, rename, delete, or autosave. The user must keep/download/upload the JSON manually.
- Two saves with the same title within the same second produce the same filename and overwrite each other.
- Project paths are portable, but voice-file paths are not embedded.
- Loading a project with an empty dictionary does not clear the existing dictionary (it only saves the dictionary if non-empty).
Status: working; partial for the missing project browser/autosave, same-second collision, and external voice dependency.
Evidence: narrator_core.py:project_payload, write_project, read_project; app.py:save_project, load_project; README lines 122–124.
2.16 Settings and dictionary persistence
Feature: settings survive restarts and can be reset. settings.json is loaded at startup and saved atomically on key actions.
Action	What is saved
Generate narration	All generation settings plus text-cleanup flags; dictionary text is also written.
Save project	Settings and dictionary.
Load project	Restored settings and dictionary (if non-empty) are written to disk.
Restore defaults	All settings reset to DEFAULT_SETTINGS; script and dictionary are untouched.
Save dictionary	Dictionary text only.
Change a control without generating/saving	Not persisted.
Behavior:
- settings.json has all 28 settings, including title, voice, language, model, sampling, cleanup, format, mastering, and seed.
- Invalid enum values fall back to defaults; numeric values are parsed and clamped as described in 2.8; unknown keys are ignored.
- restore_defaults resets title, language, model, voice, format, sample rate, and all advanced settings, but does not clear the script, dictionary, or uploaded reference.
- The current persisted settings.json has language: "hi"; the code default is en.
- The dictionary is stored as raw one-rule-per-line text in dictionary.json, not as parsed rules.
- The custom voice registry is voices/custom_voices.json; it is internal state, not a user-editable settings file.
Status: working; partial only for the distinction between persisted settings and unsaved control changes.
Evidence: narrator_core.py:DEFAULT_SETTINGS, load_settings, save_settings, load_dictionary_text, save_dictionary_text; app.py:_settings, restore_defaults, save_dictionary, save_project, load_project.
2.17 System, resource, and performance behavior
Capability	Behavior	Status
Device detection	CUDA if available, otherwise CPU; no MPS in narrator	partial
Device/VRAM display	Shows GPU name and total VRAM, or CPU	working
Precision	Fixed: Multilingual/Original T3 half precision on CUDA; Turbo/Nano full precision; CPU full precision	partial (no control)
Quantization	None exposed or implemented	absent
Model residency	One model loaded at a time; switching releases the old model and empties CUDA cache	working
Model reload on language change	Multilingual reloads because the cache key includes language	partial/performance cost
Concurrency	Gradio queue default_concurrency_limit=1; main/batch share concurrency_id="narration" with limit 1; global MODEL_LOCK serializes model work	working
Per-tab job guard	One job per browser session; second request rejected	working
CPU threads	torch.set_num_threads(min(6, cpu_count))	fixed, not configurable
CUDA allocator	PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True by default	working
GPU OOM	Load-time OOM has a friendly message; generation OOM surfaces through the generic generation error	partial
Batching	Text chunking and batch-file workflows; no parallel model batch inference	working/partial
Caching	HF model cache; one in-memory model; no generation/audio cache; fixed-conditionals recomputed per generation	partial
Memory limits	No user-set RAM/VRAM limits, no automatic model unload, no idle unload	absent
Performance estimate	Custom progress estimate based on completed characters/tokens; first-time load excluded	partial
Evidence: app.py lines 31–52, JobProgress, load_model, MODEL_LOCK; demo.queue(default_concurrency_limit=1); README lines 38, 128.
2.18 Model download, caching, and management
Feature: models download automatically on first use and are cached locally. There is no explicit model manager.
Name	Type	Default	Allowed values / range	Effect
model selection	enum	auto	5 choices	Determines which checkpoint is fetched/loaded.
HF_HOME	environment path	<app>/models/huggingface	any writable path	Cache location for Hugging Face model files.
HF_TOKEN	environment string	unset	any valid Hugging Face token	Explicitly read by the Turbo/Nano and Multilingual loaders; optional for public downloads.
Download behavior:
- Original: downloads ve.safetensors, t3_cfg.safetensors, s3gen.safetensors, tokenizer.json, conds.pt from ResembleAI/chatterbox.
- Multilingual V3: downloads ve.pt, t3_mtl23ls_v3.safetensors, s3gen.pt, grapheme_mtl_merged_expanded_v1.json, conds.pt, and Cangjie5_TC.json from ResembleAI/chatterbox.
- Turbo: ResembleAI/chatterbox-turbo; Nano: ResembleAI/chatterbox-nano; downloaded as filtered snapshots (*.safetensors, *.json, *.txt, *.pt, *.model).
- Turbo/Nano has an automatic fallback from Hugging Face Xet to the standard HTTP/LFS path when an Xet-related error occurs.
- Download progress is printed to the terminal/server.log via Hugging Face progress bars, not shown in the web UI.
- No installed-model listing, no model deletion, no pause/resume, no download cancel, no size display, no version selector, and no explicit offline mode.
- The downloaded model files remain in the HF cache; deleting them is a manual filesystem operation.
- Model availability depends on network access and Hugging Face; the app has no bundled model weights.
- No gated-access UI or license-acceptance flow is present in the read code.
Status: partial. Automatic download/cache works; model lifecycle management is largely absent.
Evidence: upstream tts.py:from_pretrained, mtl_tts.py:from_pretrained, tts_turbo.py:from_pretrained; app.py HF_HOME; run.sh.
2.19 Logging, health, errors, authentication, and telemetry
Capability	Behavior	Status
Logging	Launcher appends app stdout/stderr to server.log; generation and per-batch-item exceptions are logged with stack traces; Hugging Face/FFmpeg output also goes there	working
UI error handling	Expected validation errors use short messages; unexpected generation/preview errors are caught and shown as status text; batch item errors are collected	working/partial
Health/status	No dedicated health endpoint; launcher calls Gradio /config and checks the title; the page shows device/VRAM; progress is shown during generation	partial
Authentication	None	absent
Access tokens	No app token; optional HF_TOKEN only for model downloads	absent for app auth
Telemetry	No telemetry, analytics, or remote reporting code	absent
Rate limiting	None beyond queue concurrency and per-session job guard	absent
Job persistence	Jobs exist only in memory; restarting the app loses queue/job state	absent
Retry/resume	No retry of failed generations; no resume of downloads/jobs	absent
Log rotation	None	absent
Network security	No TLS, no login; 0.0.0.0 and share mode expose the app	partial/security gap
Evidence: launcher.py, server.log handling, app.py:generate, preview_generation, batch_generate, demo.queue, main launch block.
3. Models and voices catalog
3.1 Models
Model	Parameters	Repository / checkpoint	Languages	Voices	Special capabilities	Limitations
Auto	— (router)	none	All 23	Uses selected voice; default from resolved model	English → Turbo, all other languages → Multilingual V3	Not a downloadable model; cannot force a specific model for English unless selected explicitly
Chatterbox Turbo	350M	ResembleAI/chatterbox-turbo, t3_turbo_v1.safetensors, s3gen_meanflow.safetensors	English only	Built-in conds if present, or any reference	Fast, low VRAM, native reaction tags, top-k sampling, single-step/meanflow decoder (n_cfm_timesteps=2)	English only; exaggeration/CFG/min-p not used; 1000-token part cap; full precision
Chatterbox Nano	110M	ResembleAI/chatterbox-nano; same Turbo class with nano=True, GPT2-small backbone	English only	Built-in conds if present, or any reference	Smallest/fastest, CPU-oriented, native reaction tags, top-k sampling	English only; same ignored controls as Turbo; full precision
Chatterbox Multilingual V3	500M	ResembleAI/chatterbox, t3_mtl23ls_v3.safetensors	23 languages	Built-in conds if present, or any reference; cross-language cloning	23-language narration, exaggeration, CFG, min-p/top-p, improved speaker similarity/hallucination behavior	No top-k; slower and more memory; one language marker per generation; T3 half precision on CUDA; optional Hebrew/Russian preprocessors not bundled
Original Chatterbox	500M	ResembleAI/chatterbox, t3_cfg.safetensors	English only	Built-in conds if present, or any reference	Expressive CFG and exaggeration controls, min-p/top-p	English only; no native reaction tags; no top-k; T3 half precision on CUDA
Single Language Pack	500M each	Six upstream finetunes (Chinese, Latam Spanish, Brazilian Portuguese, Spain Spanish, Portugal Portuguese, Hindi)	6 dedicated finetunes	Not integrated	Upstream README describes language/region-specific models	Not available in Narrator; no UI or loader path
ChatterboxVC	S3Gen-based	ChatterboxVC in upstream	Input audio speech, not text	Source audio + target voice	Voice conversion (speech-to-speech)	Not integrated into Narrator
Notes:
- Model sizes are parameter counts from the upstream README, not measured disk sizes.
- The code license is MIT. Model-weight licenses and gated-access terms are not stated in the files read; the upstream README links model cards.
- All models output 24 kHz mono audio and apply Perth watermarking.
- Multilingual V3 is hard-coded by Narrator. Upstream V2 is selectable only through the library API/demo, not the product.
- Original/Multilingual generate caps at max_new_tokens=1000; Turbo/Nano inference_turbo caps at max_gen_len=1000. At 25 speech tokens/second this is roughly 40 seconds of model speech per part before any speed change.
- Turbo/Nano use n_cfm_timesteps=2; Original/Multilingual use the S3Gen default of 10.
3.2 Per-model parameter support
Capability	Turbo	Nano	Multilingual V3	Original
temperature	yes	yes	yes	yes
top_p	yes	yes	yes	yes
top_k	yes	yes	no/ignored	no/ignored
min_p	ignored	ignored	yes	yes
repetition_penalty	yes	yes	yes	yes
exaggeration	ignored	ignored	yes	yes
cfg_weight	ignored	ignored	yes	yes
language_id	no	no	yes	no
Native reaction tags	yes	yes	no (ordinary text)	no (ordinary text)
Reference audio	yes, >5 s	yes, >5 s	yes, narrator validates ≥5 s	yes, narrator validates ≥5 s
Reference loudness normalization	always on (−27 LUFS)	always on	no	no
Built-in voice conditionals	optional	optional	optional	optional
Watermark	yes	yes	yes	yes
Output sample rate	24 kHz	24 kHz	24 kHz	24 kHz
T3 precision on CUDA	full	full	half	half
Max new speech tokens	1000	1000	1000	1000
3.3 Voices
Current voice catalog on this checkout:
Key	Label	Source	Kind	Notes
default	Original narrator	Model checkpoint conds.pt	built-in	Uses whichever model is selected; no audio file; requires checkpoint conditionals.
male_1	Male 1	voices/male_1.wav	built-in	12-second reference from Resemble's Turbo demo clips.
male_2	Male 2	voices/male_2.wav	built-in	12-second reference.
female_1	Female 1	voices/female_1.wav	built-in	12-second reference.
female_2	Female 2	voices/female_2.wav	built-in	12-second reference.
deep	Deep / dramatic	voices/deep.wav	built-in	12-second reference derived from the dark gaming clip.
file:dark_gaming_voice_prompt.mp3	Recording · Dark gaming voice prompt	voices/dark_gaming_voice_prompt.mp3	external auto-discovered	Appears because it is a top-level audio file not reserved by a registry key.
file:ivr_female_01_prompt.wav	Recording · Ivr female 01 prompt	voices/ivr_female_01_prompt.wav	external auto-discovered	Appears automatically.
file:ivr_female_02_prompt.wav	Recording · Ivr female 02 prompt	voices/ivr_female_02_prompt.wav	external auto-discovered	Appears automatically.
file:ivr_male_01_prompt.wav	Recording · Ivr male 01 prompt	voices/ivr_male_01_prompt.wav	external auto-discovered	Appears automatically.
file:ivr_male_02_prompt.wav	Recording · Ivr male 02 prompt	voices/ivr_male_02_prompt.wav	external auto-discovered	Appears automatically.
custom:<slug>-<hex>	User label	voices/custom_<slug>-<hex>.wav	custom	None saved currently; registry voices/custom_voices.json is empty.
Additional voice facts:
- Built-in previews exist in voices/previews/ for default, male_1, male_2, female_1, female_2, and deep.
- If a preset preview file is missing, auditioning plays the reference file itself.
- External recordings have no preview file and are played directly.
- The preset source clips come from Resemble's official Turbo demo page; voices/README.md documents the source mapping.
- Any top-level audio file in voices/ can become a voice; subdirectories are not scanned.
- There is no language, gender, style, or consent metadata attached to voices. The labels Male 1, Female 1, etc. are only labels.
- Voice selection is not filtered by language. A voice can be used with any supported language, though the reference accent may carry into cross-language output.
- The app does not train, fine-tune, or persist speaker embeddings independently; conditionals are recomputed from the reference at generation time.
3.4 Voice cloning and style controls
- Zero-shot reference cloning from a 5+ second clip; 6+ seconds recommended.
- No text transcript needed for the reference.
- No discrete emotion presets or emotion embeddings exposed. Style is controlled by the reference clip, exaggeration, cfg_weight, and (Turbo/Nano only) native reaction tags.
- No per-voice default exaggeration/CFG, speed, or language.
- No voice mixing, interpolation, or multi-speaker dialogue.
- No consent confirmation in the UI; the README warns not to clone without permission.
4. Languages list
All 23 languages are supported by Multilingual V3. Auto uses Turbo for English and Multilingual V3 for every other language. Turbo, Nano, and Original are English-only.
Code	Language	Native label	Models covering it	Processing notes
ar	Arabic	العربية	Multilingual, Auto	Arabic Unicode script detection; no special preprocessor beyond tokenizer normalization.
da	Danish	Dansk	Multilingual, Auto	Stopword detection; can be confused with Norwegian/Swedish.
de	German	Deutsch	Multilingual, Auto	Stopword detection.
el	Greek	Ελληνικά	Multilingual, Auto	Greek Unicode range detection.
en	English	English	Turbo, Nano, Multilingual, Original, Auto (Turbo)	Default language; English number/abbreviation expansion; all models.
es	Spanish	Español	Multilingual, Auto	Stopword detection.
fi	Finnish	Suomi	Multilingual, Auto	Stopword detection.
fr	French	Français	Multilingual, Auto	Stopword detection.
he	Hebrew	עברית	Multilingual, Auto	Hebrew Unicode detection; optional dicta_onnx diacritics are not installed/dependency-declared, so normalization is skipped unless added.
hi	Hindi	हिन्दी	Multilingual, Auto	Devanagari detection; number-to-Hindi-words support; sentence splitting includes ।/॥ when followed by whitespace.
it	Italian	Italiano	Multilingual, Auto	Stopword detection.
ja	Japanese	日本語	Multilingual, Auto	pykakasi hiragana normalization is installed; CJK text may not split at punctuation without whitespace.
ko	Korean	한국어	Multilingual, Auto	Hangul syllable decomposition; CJK-style chunking issue.
ms	Malay	Bahasa Melayu	Multilingual, Auto	Stopword detection.
nl	Dutch	Nederlands	Multilingual, Auto	Stopword detection.
no	Norwegian	Norsk	Multilingual, Auto	Stopword detection; shares many cues with Danish/Swedish.
pl	Polish	Polski	Multilingual, Auto	Stopword detection.
pt	Portuguese	Português	Multilingual, Auto	Stopword detection. No Brazil/Portugal locale selection.
ru	Russian	Русский	Multilingual, Auto	Cyrillic detection; optional russian_text_stresser stress marks are not installed/dependency-declared, so skipped unless added.
sv	Swedish	Svenska	Multilingual, Auto	Stopword detection.
sw	Swahili	Kiswahili	Multilingual, Auto	Stopword detection.
tr	Turkish	Türkçe	Multilingual, Auto	Stopword detection.
zh	Chinese	中文	Multilingual, Auto	Cangjie mapping + pkuseg segmentation installed; CJK punctuation may not split without whitespace.
Additional language limitations:
- No locale variants such as en-US, en-GB, pt-BR, pt-PT, es-ES, or es-MX.
- No mixed-language generation; one language_id is applied to the whole generation or batch unit.
- No translation. Selecting a language changes pronunciation/model behavior, not the words.
- No per-sentence language switching.
- Auto detection is a heuristic with no confidence score and falls back to English.
- The six Single Language Pack finetunes in the upstream README are not integrated.
5. User workflows
A. First launch and model acquisition
1. Launch the app from the desktop entry or run.sh.
2. The app detects CUDA/CPU, loads saved settings and dictionary, and refreshes the library.
3. Choose a model/language/voice and generate.
4. On first use of a model, Hugging Face downloads the checkpoint into models/huggingface; progress appears in server.log/terminal, not the UI.
5. The model loads; later generations reuse it. Switching models releases the previous one.
Capabilities used: launcher, device detection, settings load, model download/cache, lazy model load, generation progress.
B. Basic narration
1. Paste/write a script or import a .txt/.md/.srt/.vtt file.
2. Optionally enter a project title.
3. Optionally enable text cleanup or dictionary rules.
4. Choose a voice, language/model, format, and speed.
5. Generate.
6. Watch part-by-part progress or press Stop.
7. Play the result, download the audio, and download SRT/VTT/TXT/JSON companions.
8. Inspect generation details: model, language, voice, seed, duration, loudness gain, parts, and part timings.
9. The file is available in the Library.
Capabilities used: import, normalization, chunking, model routing, voice reference, progress, mastering, export, companions, metadata, history.
C. Voice audition and cloning
1. Select a preset and play its existing preview, or upload/record a reference of at least 5 seconds (6+ recommended).
2. The uploaded reference overrides the selected preset.
3. Optionally generate a short preview with the current model, language, voice, seed, speed, and sampling settings.
4. Save the reference as a custom preset with a label; the app writes a mono 24 kHz WAV and registry entry.
5. Refresh the voice list to discover externally added files.
6. Delete a custom preset after confirming; built-in/external recordings are protected.
Capabilities used: voice discovery, audition, reference validation, preview synthesis, preset save/delete, custom voice registry.
D. Preview a voice/settings combination
1. Select model/language/voice/reference and adjust sampling/expression/seed/speed.
2. Press “Generate preview with current settings.”
3. The app synthesizes a fixed sentence in the selected language.
4. Listen to the preview; no subtitles/transcript are produced for previews.
5. Preview files accumulate in voices/previews/ and are not in the Library.
Limitations: previews use hard-coded chunk/gap/format/mastering settings, do not use the user’s script or dictionary, and have no Stop control.
E. Batch script files
1. Upload one or more .txt/.md/.markdown/.srt/.vtt files, or paste text.
2. If pasted text is non-empty, files are ignored.
3. Optionally split at Markdown headings.
4. Batch uses the current voice/model/language/settings.
5. Generation runs sequentially; progress reports n/N.
6. Completed files plus companion files are offered as a ZIP.
7. Errors are collected per item; successful items remain available.
Limitations: .md uploads with Markdown stripping enabled lose headings before chapter splitting; cancel does not return completed items or a ZIP.
F. Chaptered batch
1. Paste Markdown with #, ##, or ### headings.
2. Enable “Split at Markdown headings.”
3. Each heading becomes a separate audio unit; text before the first heading becomes Introduction.
4. Each unit gets its own title, audio, subtitles, transcript, and metadata.
5. Download the combined ZIP.
Limitation: the same heading-splitting feature on uploaded .md files is affected by the strip-order bug.
G. Save and restore a project
1. Enter a title and script, choose a voice and settings, and optionally edit the dictionary.
2. Save the project; a JSON file is written under projects/ and offered for download.
3. Later, upload the project JSON and load it.
4. Script, dictionary, settings, stats, and model note are restored; the voice falls back to default if unavailable.
5. Audio is not included; custom voice files must still exist.
Limitations: no project browser/list, no autosave, no rename/delete, same-second filename collision, external voice dependency.
H. Library review and maintenance
1. Open the library; the newest output is selected automatically.
2. Select another output to load audio, metadata summary, companion files, and part timings.
3. Refresh after external changes.
4. Verify the Perth watermark.
5. Open the output folder.
6. Delete the selected audio and companions after confirming.
Limitations: 150-entry cap, no search/rename/bulk delete, no library ZIP export.
I. Stop/cancel
1. Start a narration or batch.
2. Press Stop (or Stop Batch).
3. The app sets the cancellation event and reports “Stopping after the current step…”
4. Narration stops between parts/stages or at the next checked token step; unfinished audio is discarded.
5. Batch keeps completed items on disk but does not return them in the UI/ZIP.
Limitation: model load/download, in-flight decoding, and FFmpeg encoding may finish before cancellation; previews have no Stop control.
J. Network/share access
1. Set CHATTERBOX_HOST=0.0.0.0 for LAN access or CHATTERBOX_SHARE=1 for a temporary share link.
2. Open the app from another machine.
3. There is no login or access control.
Security limitation: exposing the app shares full generation, library deletion, and project/file access.
6. States and edge cases the UI must represent
6.1 Startup, loading, and device states
- First launch: directories/settings/dictionary load; history refresh; no model loaded yet.
- Model loading: first generation may show “Loading <model> — time estimate starts after loading.” No download progress in the UI.
- Model download: can take minutes; only terminal/log progress; no cancel/pause/resume.
- CUDA unavailable with CHATTERBOX_DEVICE=cuda: startup error “NVIDIA GPU is not available. Reboot after installing the driver, or run with CHATTERBOX_DEVICE=cpu.”
- Invalid device: “CHATTERBOX_DEVICE must be auto, cpu, or cuda.”
- Launcher failure: waits 120 seconds, then shows a desktop error dialog pointing to server.log.
- OOM while loading: “The GPU ran out of memory while loading this model. Try Chatterbox Nano, a shorter script, or CPU mode.”
- OOM during generation: surfaces as “Could not generate audio: …” and is logged.
- CPU-only: allowed; may be very slow for long scripts.
- No streaming: no partial audio until the whole job completes.
6.2 Input and text states
- Empty script: “Add a script on the left, then generate your narration.” The editor is focused.
- Only whitespace/emoji/pause markers: “Paste narration or upload a script first.” or “The script is empty after text cleanup.”
- Unsupported import type: “Supported script types: .txt, .md, .markdown, .srt, .vtt.”
- No file selected: “No file selected.”
- Import success: “Loaded <filename> · <n> characters.”
- No text length limit: a very long script is accepted and chunked; no warning.
- CJK chunking: sentence splitting requires whitespace after 。/！/？; long Chinese/Japanese text can be hard-chopped at the character limit rather than sentence boundaries.
- Pause markers: [pause], <pause>, [pause=1.5]; non-numeric markers remain literal; leading pause is dropped; final pause is dropped.
- Pause-between-parts: changing gap without explicit markers does not insert silence between auto-split chunks.
- Part preview with gap=0: the preview helper falls back to 0.38 when gap is falsy, so preview can show a different pause than generation.
- Markdown chapter bug: uploaded .md with strip enabled becomes one batch unit instead of chapters.
- HTML/SSML: no SSML; <pause> is the only angle-bracket control recognized; other tags are stripped only if Markdown stripping is on.
6.3 Language/model unsupported combinations
- Explicit Turbo/Nano/Original + non-English language → “<Model> is English-only. Choose Multilingual V3 or Auto for <Language>.”
- Auto + English → Turbo; Auto + non-English → Multilingual.
- Auto-detect on + an English-only model + detected non-English text → generation error at run time.
- Invalid language → “Please choose a supported language.”
- Invalid model → “Please choose a supported model.”
- top_k changed while using Multilingual/Original → no effect.
- min_p, exaggeration, or cfg_weight changed while using Turbo/Nano → no effect.
- Reaction tags on Multilingual/Original → ordinary text, not native reactions.
- Numbers with non-English/Hindi convert_numbers → unchanged.
- Mixed-language script → one language marker for all parts.
- Auto-detection of short/ambiguous text → likely English.
- Unsupported script/language → English fallback.
6.4 Voice states
- No reference and default voice: uses checkpoint built-in conditionals; if absent, “This model needs a voice reference. Choose a preset or upload a clean WAV of at least 6 seconds.”
- Reference shorter than 5 s: “The reference recording is X.Xs; Chatterbox needs at least 5 seconds (6+ recommended).”
- Reference exactly 5.0 s: narrator accepts it; Turbo/Nano can fail with “Audio prompt must be longer than 5 seconds!”
- Empty/unreadable reference: “The reference recording is empty.” or a duration-based error.
- Reference file disappeared: “The uploaded reference recording is no longer available. Please upload it again.”
- Selected voice deleted/missing: “That voice is no longer available. Refresh the voice list and choose another.”
- Voice reference path missing: “The selected voice reference file is missing.”
- No reference for save: “Upload or record a reference clip first.”
- Delete without confirmation: “Tick the confirmation box before deleting a custom preset.”
- Delete non-custom: “Only custom presets saved in this app can be deleted here.”
- Delete missing custom: “That custom preset was not found.”
- Custom registry corrupt/missing: custom custom_* files are excluded from external discovery, so saved presets can disappear from the list.
- Uploaded reference override: persists until cleared; saving a preset does not clear it.
- No voice language metadata: same voice can be selected for any language.
6.5 Generation, progress, and cancellation states
- Queued: Gradio queue may wait behind another generation; no queue-position display.
- Preparing/loading: progress phases as listed in 2.10.
- Part progress: “Part X of N · elapsed · about/under 5s left”; initial estimate says “calculating time remaining…”.
- Stop requested: “Stopping after the current step…”.
- Stop completed: “Stopped. The unfinished take was discarded.”
- Stop with no job: “No generation is running in this tab.”
- Second concurrent request: “A generation is already running in this tab.”
- Cancellation during model load/download: load may finish first.
- Cancellation during decoder: in-flight step may finish first.
- Cancellation during FFmpeg: export may finish, then output is deleted.
- Preview: returns “Preview ready — …” or “Could not create preview: …”; no Stop wiring.
- No streaming: no partial audio download.
6.6 Output and export states
- FFmpeg missing: only native-rate 1× WAV works; compressed formats/resampling/speed fail with “ffmpeg is required for this output format or sample rate.”
- Unsupported format: “Unsupported output format: <fmt>” (not reachable through the normal dropdown).
- FFmpeg failure: displays FFmpeg stderr or “ffmpeg failed.”
- Fast-path WAV: no embedded title/artist/comment metadata; sidecar still written.
- Short clip + fade: fade is skipped if the clip is shorter than two fade lengths.
- Silent/very quiet clip: loudness normalization may skip or hit gain limits; trim may return unchanged if all samples are below threshold.
- FFmpeg export timeout: 1800 seconds; a very large file can fail.
- Write failure: audio/companions are cleaned up for the failed output.
- Output file name collision: avoided with timestamp + six hex characters, except projects use timestamp only.
- No stereo/bit-depth/bitrate controls.
6.7 Subtitle states
- Approximate timing: cues are sentence-weighted, not forced-aligned.
- Long cue: text beyond 4 wrapped lines (~176 characters) is silently truncated.
- Cue clamping: a cue ending after final audio is clamped; cue duration minimum 0.10 s.
- Trimmed start: cue starts subtract the trim offset divided by speed.
- Speed change: durations and gaps are divided by speed.
- No word-level timing, no translation, no editing, no karaoke-style highlighting.
6.8 Batch states
- No files/pasted text: “Upload one or more scripts, or paste a chaptered script.”
- No text after split: “No text was found to generate.”
- Unreadable file: error includes the filename and aborts the batch setup.
- Per-item generation failure: item is skipped; errors collected; successful items continue.
- All items fail: “No batch items finished. …”
- Partial success: status reports completed count and first three errors; ZIP contains successes.
- Cancel: “Batch stopped after N finished part(s)”; completed files remain on disk but are not returned; no ZIP.
- Auto-detect per unit: language can differ across units; English-only model + non-English unit can fail that unit.
- Same settings/voice: no per-chapter overrides.
- .md chapter stripping: headings are removed before splitting.
6.9 Library states
- Empty: “No saved narrations yet.”
- No selection: “Select a saved narration.”
- Missing metadata: filename fallback; duration measured; model/language may be blank.
- External audio: appears if placed in outputs/.
- Delete without confirmation: “Tick the confirmation box first.”
- Missing file: “That file was not found.”
- Watermark: detected, not detected (may have been re-encoded/edited), package missing, or check failed.
- Open folder failure: “Could not open the folder: …”
- 150-entry cap: older entries are not listed until files are removed.
- No search/rename/bulk delete.
6.10 Project states
- No file: “Choose a Chatterbox project JSON file first.”
- Wrong JSON: “This is not a Chatterbox Narrator project file.”
- Malformed JSON: underlying JSON error is shown.
- Voice unavailable: silently falls back to default.
- Same-second save: overwrites the previous same-title project.
- No project list: only manual upload.
- No audio included.
- Dictionary empty on load: existing dictionary is not cleared.
- Version not validated: version is written but not enforced.
6.11 Configuration and security states
- Invalid .json settings: defaults/fallbacks; unknown keys ignored.
- Invalid sampling values: not semantically clamped; may fail in the sampler.
- Current settings vs defaults: current settings.json can differ from code defaults; a new UI should distinguish “reset default” from “persisted value.”
- LAN/share exposure: no auth, no TLS.
- No telemetry, no health endpoint, no job persistence.
- Linux-only launcher and desktop integration; Windows unsupported by this path.
6.12 Important limits
Limit	Value	Consequence
Whole-script text length	no hard limit	Long scripts are chunked; no UI warning.
Chunk size	60–500 chars	Controls part length; model still caps tokens.
Model speech per part	1000 tokens (~40 s at 25 tokens/s)	Long parts, especially CJK at 500 chars, can be cut at the model cap.
Reference minimum	5.0 s	6+ recommended; exactly 5.0 s can fail Turbo/Nano.
Reference save maximum	40 s	Longer files are truncated on preset save.
Decoder reference use	first 10 s	Voice conditioning ignores later audio.
Speech-token reference use	6 s Original/Multilingual; 15 s Turbo/Nano	Later reference audio does not affect those encoders.
History entries	150	Older files hidden.
Part preview rows	400	Longer tables are truncated.
Subtitle text	44 chars/line, 4 lines	Long cue text is truncated.
Title	120 chars in settings; 60 in filename	Longer titles are shortened for filenames.
Project filename title	50 chars	Project names are shortened.
Voice label	60 chars	Longer labels shortened.
Metadata comment	400 chars	Model/language/voice comment truncated.
FFmpeg export timeout	1800 s	Very large exports can fail.
CPU threads	min(6, CPU count)	Fixed.
Concurrent jobs	1 globally	Queue/lock waits.
Loaded models	1	Switching unloads previous.
Preview cleanup	none	Preview WAV/JSON files accumulate.
Batch count	no explicit limit	Memory/disk/queue dependent.
6.13 Actual error messages worth representing
- “Add a script on the left, then generate your narration.”
- “Paste narration or upload a script first.”
- “The script is empty after text cleanup.”
- “Please choose a supported language.”
- “Please choose a supported model.”
- “<Model> is English-only. Choose Multilingual V3 or Auto for <Language>.”
- “The GPU ran out of memory while loading this model. Try Chatterbox Nano, a shorter script, or CPU mode.”
- “A generation is already running in this tab.”
- “No generation is running in this tab.”
- “Stopping after the current step…”
- “Stopped. The unfinished take was discarded.”
- “Could not generate audio: …”
- “Could not create preview: …”
- “Preview stopped.”
- “This model needs a voice reference. Choose a preset or upload a clean WAV of at least 6 seconds.”
- “The reference recording is X.Xs; Chatterbox needs at least 5 seconds (6+ recommended).”
- “Audio prompt must be longer than 5 seconds!” (Turbo/Nano internal assertion)
- “The reference recording is empty.”
- “The reference recording must be at least 5 seconds long.”
- “The uploaded reference recording is no longer available. Please upload it again.”
- “That voice is no longer available. Refresh the voice list and choose another.”
- “The selected voice reference file is missing.”
- “Upload or record a reference clip first.”
- “Tick the confirmation box before deleting a custom preset.”
- “Only custom presets saved in this app can be deleted here.”
- “That custom preset was not found.”
- “ffmpeg is required for this output format or sample rate.”
- “Unsupported output format: …”
- “ffmpeg failed” or FFmpeg stderr.
- “Upload one or more scripts, or paste a chaptered script.”
- “No text was found to generate.”
- “No batch items finished. …”
- “Batch stopped after N finished part(s).”
- “Tick the confirmation box first.”
- “That file was not found.”
- “Choose a Chatterbox project JSON file first.”
- “This is not a Chatterbox Narrator project file.”
- “No file selected.”
- “Supported script types: .txt, .md, .markdown, .srt, .vtt”
- “No saved narrations yet.”
- “Select a saved narration.”
- “Watermark check needs the Perth package: …”
- “Watermark not detected: 0.xx. The file may have been re-encoded or edited heavily.”
- “Could not check the watermark: …”
- “Could not open the folder: …”
- “CHATTERBOX_DEVICE must be auto, cpu, or cuda.”
- “NVIDIA GPU is not available. Reboot after installing the driver, or run with CHATTERBOX_DEVICE=cpu.”
7. Settings a user might want to control
This classification is a product judgment based on how the code uses each value, independent of where the current UI places it.
Essential
Setting	Why it is essential
Script text	The content being narrated; no product without it.
Title	Controls output filename, project filename, and metadata.
Language + auto-detect	Determines model eligibility and pronunciation; auto is convenient but heuristic.
Model / Auto	Changes voice/quality/language support and speed. Most users can leave Auto.
Voice + reference audio	The primary creative choice; uploaded reference overrides presets.
Format	Directly determines deliverable compatibility (WAV/MP3/etc.).
Speed	Audible pacing control; 0.5×–2.0×.
Generate / Stop	Core actions; Stop is safety-critical for long scripts and CPU generation.
Playback + download	Required to consume and export the result.
Advanced
Setting	Why it is advanced
Sample rate	Technical export choice; most users use 24 kHz or 48 kHz.
Loudness normalize + target LUFS	Publishing-oriented; default −16 is a good YouTube-oriented value.
Trim silence	Affects edges only; default does what most users want.
Fade in/out	Cosmetic/technical; usually 20–50 ms.
Part size (chunk_limit)	Quality/latency tradeoff; default 260 is safe.
Pause between parts (gap)	Currently misleading because it does not apply between auto-split parts.
Seed	Reproducibility/power-user control; 0 is correct for most users.
Temperature	Sampling randomness; most users should use defaults.
Top-p	Advanced sampling; default 0.95.
Top-k	Only Turbo/Nano; expert control.
Min-p	Only Multilingual/Original; expert control.
Repetition penalty	Expert control; default 1.2.
Exaggeration	Creative control for Multilingual/Original; ignored by Turbo/Nano.
CFG weight	Creative/pacing control for Multilingual/Original; ignored by Turbo/Nano.
Text cleanup toggles	Useful for web/Markdown imports but defaults already handle common cases.
Pronunciation dictionary	Power-user feature; requires rule-file knowledge.
Device (CHATTERBOX_DEVICE)	Setup-level, not per-narration; CPU fallback for unsupported GPUs.
HF_HOME / HF_TOKEN	Setup/network/storage-level.
Host/share	Network/security-level.
Controls that do not exist: pitch, volume (other than loudness target), bitrate, bit depth, channels/stereo, streaming, SSML, subtitle language, per-part voice, translation, model precision/quantization, GPU index, queue priority, output folder selection.
8. Partial, experimental, or planned items
There are no feature flags or experimental routes in the Narrator itself. The following are incomplete, quirky, or only available upstream.
Item	Status	Evidence / impact
Pause between auto-split parts	partial/bug	split_script gives auto-split chunks pause_after=0; gap mainly applies to [pause] markers. README overstates it.
Batch .md chapter splitting	partial/bug	read_script_file strips headings before split_chapters when strip_markdown=true, collapsing chapters into one unit.
Preview “current settings”	partial	Hard-coded chunk/gap/format/mastering; ignores dictionary/cleanup/script.
Preview cancellation	partial	Job is created but no Stop control is wired; main Stop remains disabled.
Subtitle text truncation	partial	_wrap_cue keeps first 4 lines at 44 chars; long cues lose text.
Subtitle timing	partial by design	Sentence-weighted from part durations, not forced alignment.
CJK sentence chunking	partial	Sentence split requires whitespace after terminal punctuation; Chinese/Japanese can be hard-chopped at char limit.
Hindi ordinal conversion	partial	_number_words ignores ordinal for Hindi; “1st” becomes cardinal.
Numbers outside English/Hindi	partial	_convert_numbers returns text unchanged for other languages.
Hebrew diacritics	partial	dicta_onnx is optional and not installed/dependency-declared; skipped.
Russian stress marks	partial	russian_text_stresser is optional and not installed/dependency-declared; skipped.
Model download manager	partial	Automatic download only; no list/delete/pause/resume/progress UI.
Model listing/deletion	absent	No app code. Manual HF cache management only.
Download pause/resume	absent	No app code.
Authentication	absent	No app login/token.
Telemetry	absent	No code.
Streaming audio	absent	Full-file generation only.
Dedicated health/metrics endpoint	partial	Only Gradio /config readiness check and device label.
Voice conversion (VC)	upstream only	ChatterboxVC and gradio_vc_app.py exist; Narrator has no route.
Multilingual V2	upstream only	mtl_tts.py supports V2; Narrator hard-codes V3.
Single Language Pack	upstream only	Six finetunes documented; no Narrator integration.
MPS support	upstream only	Model classes accept mps; Narrator rejects it at startup.
Direct Python API	upstream only	Classes are callable; Narrator exposes only Gradio events.
MCP server	upstream demo only	multilingual_app.py launches with mcp_server=True; Narrator does not.
Fast-path WAV metadata	partial	Native-rate 1× WAV bypasses FFmpeg and lacks embedded title/artist/comment.
Seed reproducibility	partial	RNGs are seeded, but deterministic algorithms are not enabled; GPU nondeterminism can still change output.
Project same-second collision	partial	Filename uses second-resolution timestamp without UUID.
Batch cancel result	partial	Completed files remain on disk but are not returned; no ZIP.
Preview file accumulation	partial	Preview WAV/JSON files are never cleaned automatically.
Settings range consistency	partial	UI ranges are narrower than coercion ranges (e.g., LUFS, fade); sampling values lack semantic clamps.
Model-specific controls	partial	Top-k/min-p/exaggeration/CFG are not disabled or explained per model; some are silently ignored.
Reaction tags on non-Turbo	partial	Tags are ordinary text on Multilingual/Original.
Watermark detection	partial	Perth detection can fail after heavy editing/re-encoding; package absent is reported.
Original model with CFG=0	needs verification	Code conditionally duplicates text when cfg_weight>0, while T3 inference builds a two-item BOS batch unconditionally; this appears inconsistent for CFG exactly 0.
chunk_preview with gap=0	partial/bug	float(gap or 0.38) turns 0.0 into 0.38 in preview.
dictionary_to_text, count_sentences	dead helpers	Defined but not used by current product paths.
Upstream TODOs	upstream internal	Hard-coded 1000 max tokens, CLAP not implemented, prepend_prompt_speech_tokens not implemented, S3Gen speed-control branch ignored.
Legacy files	not runtime	app-before-gpu.py, app-before-progress.py, app-before-stop.py, run-before-gpu.sh, packages-before-gpu.txt are older snapshots; run.sh launches only app.py.
9. Gaps and open questions
 1. Pause semantics: should “Pause between parts” apply between every auto-split chunk, or should it remain a default only for [pause] markers? The code currently does the latter, while the README implies the former.
 2. Text length: should there be a maximum script length, a warning, or a duration estimate that accounts for pauses/model speed? Currently there is no limit or warning.
 3. Mixed-language scripts: should the product support per-sentence or per-part language switching, or explicitly state one language per generation?
 4. Locale variants: should en-US/en-GB, pt-BR/pt-PT, es-ES/es-MX, etc. be exposed, or is the code's language-only model sufficient?
 5. CJK chunking: should sentence splitting handle CJK punctuation without whitespace, and should the part cap be reduced for character-based languages to avoid the 40-second model cap?
 6. Preview behavior: should preview use the actual chunk/gap/mastering/cleanup settings and the user's text, and should it be cancellable?
 7. Seed reproducibility: should exact reproducibility be guaranteed (deterministic algorithms) or only seeded RNG behavior?
 8. Model-specific controls: should top-k/min-p/exaggeration/CFG be hidden/disabled when they have no effect, or shown with warnings?
 9. Original CFG=0: verify whether CFG weight exactly 0 works on Original; the code path looks inconsistent and the UI allows 0.
10. Exactly-5-second references: should the minimum be 5.0 or strictly greater than 5.0? Narrator and Turbo disagree.
11. Reference save limit: should the 40-second save truncation be surfaced, and should the user be able to choose the conditioning window?
12. Model management: should the new UI include download/list/delete/pause/resume/progress, or rely entirely on Hugging Face cache behavior?
13. Model versions: should V2, V3, and Single Language Pack be selectable, or keep V3 hard-coded?
14. Voice conversion: is ChatterboxVC intended to become a product feature, or remain an upstream developer capability?
15. MPS/Apple support: should the app support MPS, or is Linux/CUDA/CPU the intended platform?
16. Precision/quantization: should users control half precision or quantization, or keep the current fixed policy?
17. Authentication/network: should LAN/share access remain unauthenticated, or should the product add a token/login?
18. API: should there be a documented stable HTTP API, or is the Gradio-generated event API acceptable?
19. Subtitles: should cues preserve full text (remove the 4-line truncation), and is approximate sentence timing sufficient, or is word-level alignment required?
20. SSML: should [pause]/tags remain the only markup, or should SSML-compatible tags be supported?
21. Reaction tags: should tags be blocked/warned on models that read them literally?
22. Project management: should projects be listable, renamable, deletable, autosaved, and collision-safe?
23. Batch cancellation: should completed units be returned/zipped when the user stops mid-batch?
24. Preview/cache cleanup: should preview files and downloaded models have in-app cleanup?
25. WAV metadata: should the fast-path WAV also embed title/artist/comment?
26. Output options: should bitrate, bit depth, stereo, channels, pitch, or additional sample rates be exposed?
27. Voice metadata: should voices store language, style, consent, and source information?
28. History: should the library support search, rename, favorites, bulk delete, and ZIP export beyond the 150-item cap?
29. Licensing/gating: model-weight licenses and gated-access terms are not in the read files; confirm what must be shown or accepted before download.
30. Current settings vs defaults: the persisted file currently says Hindi while code defaults to English; decide whether the new UI should show persisted values, defaults, or both.
