# Renamer

Batch rename scene layers in Cavalry, with a live preview.

**Version:** 1.0.1 · **Requires:** Cavalry 2.7.2 or later

## Install

1. Download [`Renamer.js`](https://github.com/markus-zeljak/renamer/releases/latest/download/Renamer.js).
2. In Cavalry, open **Help → Show Scripts Folder** and copy the file there.
3. Open **Scripts → Renamer**. Close and reopen the panel after an update.

Scripts folder:

| Windows | macOS |
| --- | --- |
| `%APPDATA%\Cavalry\Scripts` | `~/Library/Application Support/Cavalry/Scripts` |

No extra software or assets are required.

## Use

1. Select scene layers.
2. Enter **Rename to**. Optionally enter **Match** to replace specific text within each name.
3. Check the preview and click **Rename**.

Match is literal and case-sensitive. It replaces every occurrence. Leave Match empty to replace the whole name, or leave Rename to empty to remove the matching text. Empty resulting names are blocked.

| Token | Result |
| --- | --- |
| `{name}` | Current layer name |
| `{up}` | Ascending number in selection order |
| `{down}` | Descending number in selection order |

**Start ascending from** sets the first ascending number. For example, `Shape {up}` starting at 1 produces `Shape 1`, `Shape 2`, `Shape 3`.

The **⋯** menu can clean up trailing numbers and version suffixes, or remove trailing bracket tags such as `[Duplicator]`. These commands use selected layers; with no selection, they offer cleanup of the active composition.

## Credits & transparency

I did not write any of the code. All code was generated with OpenAI Codex from my prompts and feedback.

Renamer is closely modeled on Figma's Rename popup. It is an independent Cavalry tool and is not affiliated with Figma.

## Feedback

Found a problem? [Open an issue](https://github.com/markus-zeljak/renamer/issues/new?template=bug_report.yml) with your Cavalry version and a small example.

## License

[MIT](LICENSE). Free to use, modify and share.
