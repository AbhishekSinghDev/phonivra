# Third-party credits and notices

Phonivra is an independent, MIT-licensed desktop project inspired by Chatterbox. Thank you to the Resemble AI team and the Chatterbox contributors for releasing the inference code and models that make local narration possible.

## Speech synthesis and watermarking

- **Chatterbox TTS** by Resemble AI powers speech synthesis. Copyright (c) 2025 Resemble AI. [Upstream project](https://github.com/resemble-ai/chatterbox) · [MIT license at the pinned code revision](https://github.com/resemble-ai/chatterbox/blob/5de7a54aa4e5e2baadb0182dde554908b48b85c2/LICENSE) · [Suggested citation](https://github.com/resemble-ai/chatterbox#citation)
- **PerTh** by Resemble AI provides audio watermarking and detection. Copyright (c) 2025 Resemble AI. [Upstream project](https://github.com/resemble-ai/perth) · [MIT license at the locked dependency revision](https://github.com/resemble-ai/Perth/blob/ff1c8ac55a976971245cdd53c18d6131ca00d993/LICENSE)
- **Hugging Face Hub** hosts the model downloads. Phonivra loads the downloaded assets on-device. [Resemble AI model publisher page](https://huggingface.co/ResembleAI)

Chatterbox and PerTh share the same Resemble AI copyright notice and MIT terms. [License text](licenses/RESEMBLE-AI-MIT.txt)

| Phonivra model        | Publisher's model repository                                                      | Revision used by Phonivra                  |
| --------------------- | --------------------------------------------------------------------------------- | ------------------------------------------ |
| Multilingual          | [ResembleAI/chatterbox](https://huggingface.co/ResembleAI/chatterbox)             | `5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18` |
| Turbo                 | [ResembleAI/chatterbox-turbo](https://huggingface.co/ResembleAI/chatterbox-turbo) | `749d1c1a46eb10492095d68fbcf55691ccf137cd` |
| IndicF5               | [ai4bharat/IndicF5](https://huggingface.co/ai4bharat/IndicF5)                     | `fb652a96e508091045890dae5bb99fe511facbcf` |
| IndicF5 audio decoder | [charactr/vocos-mel-24khz](https://huggingface.co/charactr/vocos-mel-24khz)       | `0feb3fdd929bcd6649e0e7c5a688cf7dd012ef21` |

IndicF5 uses [F5-TTS](https://github.com/SWivid/F5-TTS/blob/main/LICENSE) and [Vocos](https://github.com/gemelo-ai/vocos/blob/main/LICENSE), both MIT-licensed inference libraries. AI4Bharat labels the IndicF5 weights MIT and publishes [voice cloning terms](https://huggingface.co/ai4bharat/IndicF5#terms-of-use).

Resemble AI labels the Chatterbox model repositories MIT. The Multilingual V3 label was verified at the pinned revision. The Turbo label was verified on its publisher card. The exact asset list and checksums are in the [model manifest](apps/engine/src/model-assets.json). See [Using generated audio](GENERATED_AUDIO.md) for rights and attribution when publishing audio.

## Desktop runtime and audio tools

Thanks to the [Electron](https://www.electronjs.org/) and [Chromium](https://www.chromium.org/) projects for the desktop runtime, [Python](https://www.python.org/) and [PyTorch](https://pytorch.org/) for the inference runtime, and the [FFmpeg project](https://ffmpeg.org/) for FFmpeg and FFprobe, which Phonivra uses for audio capture and processing.

Redistributors should retain applicable copyright and license texts for the components they ship. FFmpeg licensing depends on the binary's build configuration and linked libraries. The [FFmpeg licensing guidance](https://ffmpeg.org/legal.html) and [desktop release guide](apps/desktop/RELEASE.md) describe what to check for packaged releases.
