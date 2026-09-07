# Pretty Formatter

Format Twig and HTML without losing template code, with bundled Prettier parsers for JavaScript, TypeScript, stylesheets, JSON, XML and Liquid. No project configuration, plugins or external runtime are required.

Choose **Format Document With… → Pretty Formatter → Configure Default Formatter**, or configure a language:

```json
{
  "[twig]": { "editor.defaultFormatter": "mblode.pretty-formatter" },
  "[typescript]": { "editor.defaultFormatter": "mblode.pretty-formatter" }
}
```

For Twig highlighting, snippets and HTML completion, install [Twig Language 2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2). Both extensions share the Twig formatter. Select one default formatter per language.

## Languages

| Language IDs | Behavior |
|---|---|
| `twig`, `html` | Source-preserving Twig/HTML formatter. Conditional attributes, crossing HTML/Twig blocks, raw regions and inline text are preserved. Safe embedded JS/CSS uses Prettier. |
| `jinja`, `nunjucks`, `volt` | Shared template formatting for compatible delimiters. Expressions retain their source tokens; this is not a complete compiler for these dialects. |
| `javascript`, `js`, `javascriptreact`, `jsx`, `flow` | Prettier JavaScript/JSX/Flow parsers. |
| `typescript`, `typescriptreact`, `ts`, `tsx` | Prettier TypeScript parser. |
| `json`, `jsonc`, `css`, `scss`, `less`, `handlebars` | Corresponding bundled Prettier parsers. |
| `xml`, `xslt` | Prettier XML plugin, with strict text whitespace preservation. |
| `liquid` | Shopify's Liquid parser and printer. |
| `eex`, `ejs`, `erb`, `aspx`, `tpl`, `ftl`, `cfm`, `cfml` | Conservative surrounding HTML indentation. Template spans and CFScript bodies retain their exact bytes; expressions and dialect control-flow layout are not rewritten. |
| `qml` | Brace indentation only, preserving colon spacing and strings. |

YAML frontmatter remains byte-for-byte unchanged in template documents. Language extensions provide any language IDs not built into VS Code; Pretty Formatter does not take ownership of file associations.

The old PrettyDiff listing claimed other dialects without reliable parser support. `vtl`, `dust`, `genshi`, `htl`, `mustache`, `SilverStripe`, `spacebars`, `leaf`, `vash`, `alloy-tss`, `tss` and indented `sass` currently have no formatter provider. Python and C# are also unsupported. They are never guessed as JavaScript or HTML. Additional dialects need a real parser and regression evidence before support is restored.

## Settings and migration from 0.2.x

Changes apply immediately and respect document, workspace-folder and language overrides.

- `pretty-formatter.formatting`: enable formatting, default `true`.
- `pretty-formatter.disableLanguages`: list of language IDs to skip.
- `pretty-formatter.ignore`: path globs with `*`, `**`, `?`; a bare directory such as `vendor` matches any path segment.
- `pretty-formatter.indentSize`: `0` uses the editor's current document indentation. Positive values override the width; tabs follow `editor.insertSpaces`.
- `pretty-formatter.wrap`: preferred width; `0` uses 80 for Prettier and retains Twig/HTML attribute wrapping.
- `pretty-formatter.forceAttribute`, `spaceClose`: Twig/HTML attribute layout.
- `pretty-formatter.quoteConvert`: `single` or `double` for Prettier code; Twig literals retain their quotes.
- `pretty-formatter.endComma`: `always` or `never` for applicable Prettier code; `none` uses parser defaults.
- `pretty-formatter.newLine`: final-newline preference where it does not modify literal template text.
- `pretty-formatter.embeddedFormatting`: safe embedded JavaScript/CSS in Twig/HTML, default `true`.
- `pretty-formatter.formatTimeout`: worker limit in milliseconds, default 5000.

Other PrettyDiff settings are deprecated and explicitly marked unused in VS Code. Version 0.3.0 removes PrettyDiff, so supported code languages adopt Prettier layout defaults. It never loads project Prettier configuration or third-party workspace plugins.

Formatting runs in a disposable worker with cancellation, stale-document checks and a 2 MiB limit. A parser error or timeout returns no edits and a diagnostic in **Output → Pretty Formatter**. Twig selections use full-document context. Other parsers may require a larger syntax unit; when an edit would escape the selection, use Format Document.

VS Code 1.85+ desktop and remote extension hosts are supported, including untrusted workspaces and non-file documents. A browser-only extension host is not included.

## Development

Use Node 22. Run `npm ci`, `composer install --working-dir=test/php`, `npm test`, `npm run test:oracle`, `npm run package`, and `npm run test:extension`. PHP is used only for the independent Twig lexer/render tests. CI tests the extracted VSIX in current stable VS Code. The regression corpus comes from the [three-extension audit](https://github.com/mblode/vscode-twig-language-2/blob/master/docs/formatter-audit.md).
