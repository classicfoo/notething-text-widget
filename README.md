# notething-text-widget

A lightweight, embeddable contenteditable text widget that mirrors the helpful typing behaviors from the original [Notething](https://github.com/classicfoo/notething) desktop app. It ships as plain HTML/CSS/JS so you can drop it into any web app.

## Features
- Auto-capitalizes headings that start with `#` and the first word of each line.
- Optional capitalization for indented lines to keep code-like text untouched.
- Auto-adds a period to the previous line when you press **Enter**, skipping headings or lines that already end with punctuation.
- Preserves indentation when inserting new lines.
- Highlight text with **Ctrl + Shift + H** (or toggle the feature off entirely).
- Accessible: uses `contenteditable`, announces itself as a multiline textbox, and exposes a placeholder.

## Usage
Include the CSS, import the widget, and point it at a container element:

```html
<link rel="stylesheet" href="src/notething-widget.css" />
<div id="notething"></div>
<script type="module">
  import { NotethingWidget } from './src/notething-widget.js';

  const editor = new NotethingWidget('#notething', {
    placeholder: 'Write notes with auto-formatting…',
    autoFullStop: true,
    autoCapitalizeHeadings: true,
    autoCapitalizeFirstWord: true,
    autoCapitalizeIndented: false,
  });
</script>
```

## Demo
Open `demo.html` in your browser to try the widget with live toggles for capitalization settings and the auto-full-stop behavior.

## Options
| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | `string` | `"Start typing…"` | Text shown when the editor is empty. |
| `autoCapitalizeHeadings` | `boolean` | `true` | Capitalize each word in markdown-style headings. |
| `autoCapitalizeFirstWord` | `boolean` | `true` | Capitalize the first word of each line. |
| `autoCapitalizeIndented` | `boolean` | `false` | When true, also capitalize indented lines. |
| `autoFullStop` | `boolean` | `true` | Append a period to the previous line on Enter if it ends without punctuation. |
| `highlightEnabled` | `boolean` | `true` | Enable Ctrl + Shift + H selection highlighting. |
| `highlightClass` | `string` | `"ntw-highlight"` | CSS class applied to highlighted selections. |

## Keyboard Shortcuts
- **Enter**: Inserts a new line, keeps current indentation, and optionally adds a period to the prior line.
- **Ctrl + Shift + H**: Wraps the current selection with the `highlightClass` span.
