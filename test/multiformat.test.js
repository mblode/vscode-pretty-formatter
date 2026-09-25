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
const exact = [
  [
    "#14 CFML void tags keep their expression text",
    "cfml",
    "<div>\n<cfset x = 1>\n<cfset y = 2 />\n<p>hi</p>\n</div>",
    "<div>\n  <cfset x = 1>\n  <cfset y = 2 />\n  <p>hi</p>\n</div>",
  ],
  [
    "#14 CFML branches, paired and optional tags",
    "cfml",
    '<cfif x EQ 1>\n<p>a</p>\n<cfelseif x  EQ 2>\n<cfparam name="b" default="">\n<cfelse>\n<cftry>\n<cfthrow message="x">\n<cfcatch type="any">\n<cfdump var="#cfcatch#">\n</cfcatch>\n</cftry>\n</cfif>\n<cfhttp url="a">\n<cfhttpparam type="url" name="a" value="1">\n</cfhttp>\n<cfhttp url="b">\n<p>after</p>',
    '<cfif x EQ 1>\n  <p>a</p>\n<cfelseif x  EQ 2>\n  <cfparam name="b" default="">\n<cfelse>\n  <cftry>\n    <cfthrow message="x">\n    <cfcatch type="any">\n      <cfdump var="#cfcatch#">\n    </cfcatch>\n  </cftry>\n</cfif>\n<cfhttp url="a">\n  <cfhttpparam type="url" name="a" value="1">\n</cfhttp>\n<cfhttp url="b">\n<p>after</p>',
  ],
  [
    "EEX do blocks, else and case clauses",
    "eex",
    '<ul>\n<%= for item <- @items do %>\n<li><%= item.name %></li>\n<% end %>\n</ul>\n<%= if @x do %>\n<p>x</p>\n<% else %>\n<p>y</p>\n<% end %>\n<%= case @y do %>\n<% :a -> %>\n<p>a</p>\n<% _ -> %>\n<p>b</p>\n<% end %>\n<%= form_for @c, "/", fn f -> %>\n<%= text_input f, :name %>\n<% end %>',
    '<ul>\n  <%= for item <- @items do %>\n    <li><%= item.name %></li>\n  <% end %>\n</ul>\n<%= if @x do %>\n  <p>x</p>\n<% else %>\n  <p>y</p>\n<% end %>\n<%= case @y do %>\n  <% :a -> %>\n    <p>a</p>\n  <% _ -> %>\n    <p>b</p>\n<% end %>\n<%= form_for @c, "/", fn f -> %>\n  <%= text_input f, :name %>\n<% end %>',
  ],
  [
    "ERB do, if/elsif/else, unless and brace blocks",
    "erb",
    "<ul>\n<% @items.each do |item| %>\n<li><%= item %></li>\n<% end %>\n</ul>\n<% if a %>\n<p>a</p>\n<% elsif b %>\n<p>b</p>\n<% else %>\n<p>c</p>\n<% end %>\n<%- unless x -%>\n<p>x</p>\n<% end -%>\n<% if a then b end %>\n<% xs.each { |x| %>\n<b><%= x %></b>\n<% } %>",
    "<ul>\n  <% @items.each do |item| %>\n    <li><%= item %></li>\n  <% end %>\n</ul>\n<% if a %>\n  <p>a</p>\n<% elsif b %>\n  <p>b</p>\n<% else %>\n  <p>c</p>\n<% end %>\n<%- unless x -%>\n  <p>x</p>\n<% end -%>\n<% if a then b end %>\n<% xs.each { |x| %>\n  <b><%= x %></b>\n<% } %>",
  ],
  [
    "EJS brace blocks",
    "ejs",
    "<ul>\n<% items.forEach(function(item){ %>\n<li><%= item %></li>\n<% }) %>\n</ul>\n<% if (a) { %>\n<p>a</p>\n<% } else { %>\n<p>b</p>\n<% } %>",
    "<ul>\n  <% items.forEach(function(item){ %>\n    <li><%= item %></li>\n  <% }) %>\n</ul>\n<% if (a) { %>\n  <p>a</p>\n<% } else { %>\n  <p>b</p>\n<% } %>",
  ],
  [
    "Freemarker paired, branch and void directives",
    "ftl",
    '<#list users as user>\n<div>${user}</div>\n<#sep>\n<hr>\n<#else>\n<p>none</p>\n</#list>\n<#if a>\n<p>a</p>\n<#elseif b>\n<p>b</p>\n<#else>\n<p>c</p>\n</#if>\n<#macro greet name>\n<p>${name}</p>\n<#nested>\n<#return>\n</#macro>\n<@greet name="x">\n<b>x</b>\n</@greet>\n<@greet name="y"/>\n<#assign x = 1>\n<#assign y>\n<i>cap</i>\n</#assign>\n<#switch x>\n<#case 1>\n<p>one</p>\n<#break>\n<#default>\n<p>other</p>\n</#switch>\n<#include "a.ftl">\n<#import "b.ftl" as b>\n<p>end</p>',
    '<#list users as user>\n  <div>${user}</div>\n<#sep>\n  <hr>\n<#else>\n  <p>none</p>\n</#list>\n<#if a>\n  <p>a</p>\n<#elseif b>\n  <p>b</p>\n<#else>\n  <p>c</p>\n</#if>\n<#macro greet name>\n  <p>${name}</p>\n  <#nested>\n  <#return>\n</#macro>\n<@greet name="x">\n  <b>x</b>\n</@greet>\n<@greet name="y"/>\n<#assign x = 1>\n<#assign y>\n  <i>cap</i>\n</#assign>\n<#switch x>\n  <#case 1>\n    <p>one</p>\n    <#break>\n  <#default>\n    <p>other</p>\n</#switch>\n<#include "a.ftl">\n<#import "b.ftl" as b>\n<p>end</p>',
  ],
  [
    "template tags inside attributes, comments and scripts stay opaque",
    "cfml",
    '<input <cfif x>checked</cfif> type="checkbox">\n<!--- <cfif y> --->\n<script>\n<cfif z>\nvar a = 1;\n</cfif>\n</script>\n<CFIF w>\n<p>w</p>\n</CFIF>',
    '<input <cfif x>checked</cfif> type="checkbox">\n<!--- <cfif y> --->\n<script>\n<cfif z>\nvar a = 1;\n</cfif>\n</script>\n<CFIF w>\n  <p>w</p>\n</CFIF>',
  ],
  [
    "unquoted values before /> and mustache text keep their bytes",
    "erb",
    '<div>\n<input value=<%= x %> />\n<input value=1 />\n<p :title="{{a|b}}">{{x}} {%raw%}</p>\n</div>',
    '<div>\n  <input value=<%= x %> />\n  <input value=1 />\n  <p :title="{{a|b}}">{{x}} {%raw%}</p>\n</div>',
  ],
];
for (const [name, language, source, expected] of exact)
  test(name, async () => {
    const output = await format(source, language);
    assert.equal(output, expected);
    assert.equal(await format(output, language), output, "idempotence");
    assert.equal(output.replace(/\s/g, ""), source.replace(/\s/g, ""));
    const tabs = await format(source, language, { insertSpaces: false });
    assert.equal(
      tabs,
      expected.replace(/^((?:  )+)/gm, (m) => "\t".repeat(m.length / 2)),
    );
  });
test("unbalanced template blocks are left unchanged", async () => {
  for (const [source, language] of [
    ["<div>\n<cfif x>\n<p>a</p>\n</div>", "cfml"],
    ["<cfset x = 1></cfset>", "cfml"],
    ["<div>\n<cfelse>\n</div>", "cfml"],
    ["<#if a>\n<p>a</p>\n</#list>", "ftl"],
    ["<@greet>\n<p>a</p>", "ftl"],
    ["<ul>\n<%= for x <- @xs do %>\n<li>x</li>\n</ul>", "eex"],
    ["<% if a %>\n<p>a</p>\n<% } %>", "erb"],
    ["<% if (a) { %>\n<p>a</p>", "ejs"],
    ["<div>\n{{ unclosed\n</div>", "ejs"],
  ])
    await assert.rejects(format(source, language), source);
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
