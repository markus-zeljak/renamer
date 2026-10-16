# Renamer

Batch rename scene layers in Cavalry with a live preview.

**Version:** 1.0.1 · **Cavalry target:** 2.7.2 or later

## Features

- Rename a selection or replace matching text.
- Keep existing names and add ascending or descending numbers.
- Clean up trailing numbers, version suffixes and bracket tags.

## Install

1. Download [`Renamer.js`](https://github.com/markus-zeljak/renamer/releases/latest/download/Renamer.js).
2. In Cavalry, choose **Scripts → Show Scripts Folder**.
3. Copy `Renamer.js` into that folder.
4. Open **Scripts → Renamer**.

To update, replace the file, then close and reopen the panel.

**Scripts** may be under **Window** in some versions; **Show Scripts Folder** may also appear under **Help**. See [Cavalry's installation guide](https://cavalry.studio/docs/tech-info/scripting/script-uis/).

## Use

1. Select scene layers.
2. Enter **Rename to**. Optionally enter **Match** to replace specific text.
3. Check the preview and click **Rename**.

| Token | Result |
| --- | --- |
| `{name}` | Current layer name |
| `{up}` | Ascending number in selection order |
| `{down}` | Descending number in selection order |

**Start ascending from** sets the first ascending number.

> [!TIP]
> Use `Shape {up}` starting at 1 to get `Shape 1`, `Shape 2`, `Shape 3`.

## Notes

- Match is literal and case-sensitive. It replaces every occurrence.
- Leave Match empty to replace the whole name, or leave Rename to empty to remove matching text. Empty resulting names are blocked.
- The **⋯** cleanup menu uses selected layers. With no selection, it offers cleanup of the active composition.
- No extra software or assets are required.

## Credits

I did not write any of the code. All code was generated with OpenAI Codex from my prompts and feedback.

Renamer is closely modeled on Figma's Rename popup. It is an independent Cavalry tool and is not affiliated with Figma.

## Feedback

Found a problem? [Open an issue](https://github.com/markus-zeljak/renamer/issues/new?template=bug_report.yml) with your tool version, Cavalry version, operating system and steps to reproduce.

## License

[MIT](LICENSE). Free to use, modify and share.
