# Contributing to Phonivra

You can help by reporting bugs, improving documentation, or contributing code to the desktop app, speech engine, website, or shared UI.

## Find something to work on

Search [GitHub Issues](https://github.com/AbhishekSinghDev/phonivra/issues) for existing reports or proposals. If an issue matches what you want to work on, comment with what you plan to change. If there is no matching issue, open one to discuss the change before submitting a pull request.

For a bug report, include the app version or commit, operating system, steps to reproduce, and what you expected to happen. For synthesis or playback issues, include the selected model, CPU or GPU, and output format if relevant. Remove tokens, private scripts, and personal recordings from anything you share.

## Set up your workspace

Fork the repository, clone your fork, and create a branch for your change. Follow the [README setup](README.md#development) for the desktop app or website. Engine changes can be checked without downloading a speech model. Runtime verification needs the prepared engine and any model required for the affected flow.

See the [workspace guides](AGENTS.md) for package boundaries and scoped commands. If your change affects the desktop–engine contract, check both sides. If it affects shared UI, check both apps.

## Verify and open a pull request

1. Run the relevant workspace checks. For changes that span workspaces, use the applicable [repository checks](README.md#checks).
2. Exercise the affected behavior. Use a native Electron window for desktop flows and include screenshots for visible UI changes when they help reviewers.
3. Open a pull request against the repository’s default branch. Link the issue, explain the user-visible change, and list the checks you ran and any verification you could not complete.
