<a href="https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter">
  <img src="https://github.com/mblode/vscode-pretty-formatter/blob/master/icon.png?raw=true" alt="VS Code Pretty Format" width=100 height=100>
</a>

# VS Code Pretty Formatter

**VS Code extension to format your files using [Pretty Diff](https://prettydiff.com/)**

[![Version](https://vsmarketplacebadge.apphb.com/version-short/mblode.pretty-formatter.svg)](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/mblode.pretty-formatter.svg)](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter)
[![Ratings](https://vsmarketplacebadge.apphb.com/rating-short/mblode.pretty-formatter.svg)](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter)

## Is Pretty Formatter for you?

Pretty Formatter VS Code extension provides advanced formatting functionality using Pretty Diff (<http://prettydiff.com/>) beautify with support for a large variety of programming languages. You can customise all different settings and a rules while adding the best in class formatting support for all these languages that VS Code can't normally format.

## Supported programming languages

Markup

* Apache Velocity
* ASP Inline Expression
* CFML (ColdFusion Markup Language)
* Django Inline HTML
* Dust.js
* EEX Elixir Templates
* EJS (Embedded JavaScript) Templates
* ERB (Embedded Ruby)
* FreeMarker
* Genshi
* Handlebars
* HTL (HTML Templating Language)
* HTML
* Jekyll
* Jinja
* JSTL (Java Standard Tag Library)
* Liquid
* Mustache
* Nunjucks
* SGML
* SilverStripe
* Spacebars templates
* ThymeLeaf
* Underscore Templates (TPL)
* Twig
* Vapor Leaf
* Vash
* Volt
* XML
* XSLT

Script

* Flow
* JavaScript / ECMAScript
* JSON
* QML
* React JSX
* styled-components
* styled-jsx
* TSS (Titanium Style Sheets)
* TSX
* TypeScript

Style

* CSS
* LESS
* PostCSS
* SCSS (Sass)

45 total languages

## Installation

Install through Visual Studio Code extensions. Search for `Pretty Formatter`

[Visual Studio Code Market Place: Pretty Formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter)

## How to use

Launch VS Code. Open the Command Palette (Ctrl+Shift+P) and type 'format document' while the file is open.

Pretty Formatter registers itself as a document formatter for the supported languages. This means it can run automatically if you have `editor.formatOnSave` enabled, or if you have selected it as your default formatter for a language. It does **not** reformat anything on its own otherwise — formatting only happens when you explicitly format a document or when VS Code's own format-on-save invokes it.

## Disabling formatting for specific files or languages

If you want to keep the extension installed but prevent it from formatting certain files or languages, use these settings:

* `pretty-formatter.formatting` (boolean, default `true`) — set to `false` to disable the formatter entirely without uninstalling.
* `pretty-formatter.disableLanguages` (array) — a list of language IDs the extension should ignore, e.g. `["json", "typescript"]`.
* `pretty-formatter.ignore` (array) — a list of `.prettierignore`-style glob patterns for files that should never be formatted, e.g. `["*.min.js", "dist/**", "package.json"]`.

## Indentation

By default Pretty Formatter follows your editor's `editor.tabSize`. To override the indentation width independently, set `pretty-formatter.indentSize` to the number of spaces you want (a value of `0` falls back to `editor.tabSize`).

## License

MIT

---

Crafted by [<img src="https://matthewblode.com/avatar-circle.png" width="20" align="top" />](https://matthewblode.com) [Matthew Blode](https://matthewblode.com)
