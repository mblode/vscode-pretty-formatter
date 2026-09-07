const test = require("node:test");
const assert = require("node:assert/strict");
const { formatEdits } = require("../src/multiformat");
const { applyEdits } = require("../src/formatter/format");
const { parsers, readOptions } = require("../src/options");
const format = async (source, language, options = {}) =>
  applyEdits(
    source,
    await formatEdits(source, {
      language,
      tabSize: 2,
      insertSpaces: true,
      ...options,
    }),
  );
const cases = [
  [
    "#15 TypeScript Vue shim",
    "typescript",
    "declare module '*.vue' {\nimport type {DefineComponent} from 'vue'\nconst component: DefineComponent <{}, {}, any>\nexport default component\n}",
    "DefineComponent<{}, {}, any>",
  ],
  [
    "#19 multiple TypeScript generic parameters",
    "typescript",
    "export class Thing<T extends string, U extends number> {\ncall(a: T,b: U): [T,U] {return [a,b]}\n}\nfunction after(){ return 2 }",
    "function after()",
  ],
  [
    "#18 CSS media queries",
    "css",
    "@media(max-width:600px){.foo{color:red;margin:0 1px}}",
    "@media (max-width: 600px)",
  ],
  [
    "#24 XML activation and strict text preservation",
    "xml",
    "<root><p>hello <b>world</b> !</p><empty/></root>",
    "hello <b>world</b> !",
  ],
  [
    "#8 Freemarker include and interpolation",
    "ftl",
    '<html>\n<body>\n<#include "../common/header.html" />\n<h1>Welcome ${user}!</h1>\n</body>\n</html>',
    '    <#include "../common/header.html" />',
  ],
  [
    "#9 EEX delimiters stay exact",
    "eex",
    "<div>\n<%= @name %>\n</div>",
    "  <%= @name %>",
  ],
  [
    "#14 CFML ID and opaque script",
    "cfml",
    '<div>\n<cfoutput>#name#</cfoutput>\n<cfscript>text = "  two spaces  ";</cfscript>\n</div>',
    '<cfscript>text = "  two spaces  ";</cfscript>',
  ],
  [
    "#13 QML colon spacing",
    "qml",
    'Item {\nproperty int x:1\nText {\ntext: " {  unchanged  } "\n}\n}',
    "  property int x:1",
  ],
  [
    "#22 frontmatter with Nunjucks custom slot",
    "nunjucks",
    '---\nlayout: base\n---\n\n<div>\n{% slot "main" %}\n<main>{{ content | safe }}</main>\n{% endslot %}\n</div>',
    "---\nlayout: base\n---\n\n",
  ],
  [
    "Liquid uses Shopify parser",
    "liquid",
    "<div>\n{% if product %}\n{{product.title}}\n{% endif %}\n</div>",
    "    {{ product.title }}",
  ],
  [
    "JSONC preserves comments",
    "jsonc",
    '{ // explanation\n"a":1,\n"b":true\n}',
    "// explanation",
  ],
  [
    "SCSS nesting",
    "scss",
    "$color:red; .x{color:$color;&:hover{color:blue}}",
    "&:hover",
  ],
  ["Less variables", "less", "@color:red;.x{color:@color}", "@color: red;"],
  [
    "JSX is parsed as JSX",
    "javascriptreact",
    'const x=<p title="x">Hello <b>world</b>!</p>;',
    "Hello <b>world</b>!",
  ],
];
for (const [name, language, source, needle] of cases)
  test(name, async () => {
    const output = await format(source, language);
    assert(output.includes(needle), output);
    assert.equal(await format(output, language), output, "idempotence");
    if (language === "ftl")
      assert.equal((output.match(/<body>/g) || []).length, 1);
  });
test("#23 tabs and #26 indentSize are document scoped", async () => {
  const config = { get: (k, f) => (k === "indentSize" ? 3 : f) };
  const options = readOptions(config, { insertSpaces: true, tabSize: 8 });
  assert.equal(options.tabSize, 3);
  assert(
    (await format("function x(){return 1}", "javascript", options)).includes(
      "\n   return",
    ),
  );
  assert(
    (
      await format("function x(){return 1}", "javascript", {
        insertSpaces: false,
      })
    ).includes("\n\treturn"),
  );
});
test("malformed syntax and unsupported languages do not produce edits", async () => {
  for (const [source, language] of [
    ["const x = {", "javascript"],
    ["<root>", "xml"],
    ["---\nlayout: x", "nunjucks"],
    ["<% unclosed", "eex"],
    ["Item {", "qml"],
    ["def x():", "python"],
  ])
    await assert.rejects(format(source, language));
});
test("frontmatter selection never rewrites metadata", async () => {
  const source = "---\nlayout: base\n---\n<div>{{x}}</div>";
  const prefix = source.indexOf("<div>");
  const edits = await formatEdits(
    source,
    { language: "twig" },
    { start: prefix, end: source.length },
  );
  assert(edits.length);
  assert(edits.every((e) => e.start >= prefix));
  assert.equal(
    applyEdits(source, edits).slice(0, prefix),
    source.slice(0, prefix),
  );
});
test("manifest activation covers each parser and has no wildcard startup", () => {
  const manifest = require("../package.json");
  assert.deepEqual(
    manifest.activationEvents,
    Object.keys(parsers).map((id) => "onLanguage:" + id),
  );
});
