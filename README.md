<div align="center">

# Pretty Formatter

**[Pretty Diff](https://prettydiff.com/) as a VS Code document formatter for 38 template, script, and style languages**

Run Format Document in a Twig, Liquid, or Handlebars file, or set it as the default formatter for a language and let format-on-save handle it.

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter">
    <img src="https://img.shields.io/visual-studio-marketplace/v/mblode.pretty-formatter?style=flat&colorA=000000&colorB=000000" />
  </a>
  <a href="https://github.com/mblode/vscode-pretty-formatter/blob/master/LICENSE.md">
    <img src="https://img.shields.io/github/license/mblode/vscode-pretty-formatter?style=flat&colorA=000000&colorB=000000" />
  </a>
</p>

</div>

## Install

```bash
ext install mblode.pretty-formatter
```

Paste that into Quick Open (`cmd+P`), or search "Pretty Formatter" in the Extensions panel.

## Quickstart

Open a supported file and run Format Document from the Command Palette (`cmd+shift+P`). To hand a language over to it permanently, add this to your `settings.json`:

```json
{
  "[twig]": {
    "editor.defaultFormatter": "mblode.pretty-formatter"
  },
  "editor.formatOnSave": true
}
```

Formatting a selection works too, through Format Selection.

## Supported languages

- **Markup and templating:** Apache Velocity, ASP inline expressions, CFML, Dust.js, EEX, EJS, ERB, FreeMarker, Genshi, Handlebars, HTL, HTML, Jinja, Liquid, Mustache, Nunjucks, SilverStripe, Spacebars, Underscore templates, Twig, Vapor Leaf, Vash, Volt, XML, XSLT.
- **Script:** Flow, JavaScript, React JSX, TypeScript, TSX, JSON, JSONC, QML, Titanium Style Sheets.
- **Style:** CSS, LESS, SCSS, Sass.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `pretty-formatter.formatting` | `true` | Turn the formatter off without uninstalling. |
| `pretty-formatter.disableLanguages` | `[]` | Language ids to skip, such as `["json", "typescript"]`. |
| `pretty-formatter.ignore` | `[]` | Glob patterns never to format, such as `["*.min.js", "dist/**"]`. |
| `pretty-formatter.indentSize` | `0` | Indent width, where `0` follows the editor's `editor.tabSize`. |

Another 36 Pretty Diff options sit under the same prefix, covering brace style, quote conversion, attribute indentation, comment handling, and wrap width. Changing any of them re-registers the formatter without a window reload.

## Notes

- Nothing is reformatted on its own. Formatting happens when you run it, or when VS Code's own format-on-save invokes it.
- Pretty Diff is pinned at 101.2.6, its last release, published September 2019. The bundled beautifier works, but no upstream fixes are coming.
- Requires VS Code 1.84 or newer.

## License

MIT

---

Crafted by [<img src="https://blode.co/avatar-circle.png" width="20" align="top" />](https://blode.co) [Matthew Blode](https://blode.co)
