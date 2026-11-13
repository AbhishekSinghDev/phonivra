# Using generated audio

Phonivra synthesizes audio locally with Resemble AI’s Chatterbox models and AI4Bharat’s IndicF5. The publishers label their model repositories MIT. IndicF5’s published terms require explicit permission to clone a voice. The MIT terms permit commercial use of the licensed material. Find the exact model sources, revision pins, and verification details in the [third-party notices](THIRD_PARTY_NOTICES.md#speech-synthesis-and-watermarking).

## Publishing or selling audio

Before publishing narration, delivering it to a client, or using it in a paid product:

- **Clear the script and recordings.** Use material you created or have permission to use for the intended project. Check separately for any third-party audio mixed into the result.
- **Get permission to clone a voice.** For someone else’s voice, obtain their consent for cloning and for the intended use of the generated audio, including commercial use where applicable. Permission to access a recording and permission to create and publish a voice replica are separate.
- **Check disclosure and delivery rules.** Follow applicable laws, contracts, and the publishing platform’s rules for synthetic audio. Label it as AI-generated where required. Chatterbox applies Resemble AI’s PerTh watermark during synthesis. A watermark is a provenance signal. Required disclosures still apply. [Chatterbox watermarking](https://github.com/resemble-ai/chatterbox#built-in-perth-watermarking-for-responsible-ai)

The app and model licenses cover their licensed material. Whether you can publish a specific clip or claim copyright in it depends on the inputs, permissions, applicable law, and the human contribution to the work. For U.S. background, see the Copyright Office’s reports on [digital replicas](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-1-Digital-Replicas-Report.pdf) and [copyrightability](https://www.copyright.gov/newsnet/2025/1060.html).

## Credits

The upstream MIT notices apply when redistributing copies or substantial portions of the licensed material. The reviewed Chatterbox MIT terms do not call for a credit line on ordinary generated narration. Any separate attribution obligations for scripts, recordings, or other material still apply.

If you’d like to credit the tools in your show notes or project credits, use:

> Narration generated locally with Phonivra using Chatterbox TTS by Resemble AI.

For research, use the publisher’s suggested citation for [Chatterbox](https://github.com/resemble-ai/chatterbox#citation) or [IndicF5](https://huggingface.co/ai4bharat/IndicF5#citation).
