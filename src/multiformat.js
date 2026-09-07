"use strict";
const prettier = require("prettier/standalone");
const babel = require("prettier/plugins/babel");
const estree = require("prettier/plugins/estree");
const typescript = require("prettier/plugins/typescript");
const flow = require("prettier/plugins/flow");
const postcss = require("prettier/plugins/postcss");
const glimmer = require("prettier/plugins/glimmer");
const xmlModule = require("@prettier/plugin-xml");
const xml = xmlModule.default || xmlModule;
const liquid = require("@shopify/prettier-plugin-liquid");
const { formatEdits: twigEdits, minimalEdit } = require("./formatter/format");
const { formatTemplate } = require("./template");
const { parsers } = require("./options");
function frontmatter(source) {
  if (!/^(?:\uFEFF)?---\r?\n/.test(source)) return 0;
  const closing = /^(?:---|\.\.\.)\s*\r?$/gm;
  closing.lastIndex = source.indexOf("\n") + 1;
  const match = closing.exec(source);
  if (!match) throw new Error("Unclosed frontmatter");
  return (
    match.index +
    match[0].length +
    (source[match.index + match[0].length] === "\n" ? 1 : 0)
  );
}
// QML uses JavaScript-like strings/comments, but is not JavaScript. Reindent only;
// preserve every other character and skip lines that begin inside a literal/comment.
function qmlFormat(source, options) {
  let depth = 0,
    quote = null,
    comment = false,
    escape = false;
  const unit =
    options.insertSpaces === false
      ? "\t"
      : " ".repeat(Math.max(1, Math.min(16, options.tabSize || 2)));
  const result = source
    .split(/(?<=\n)/)
    .map((line) => {
      const raw = line;
      if (!quote && !comment)
        line =
          unit.repeat(Math.max(0, depth - (/^\s*[}\]]/.test(line) ? 1 : 0))) +
          line.replace(/^[\t ]*/, "");
      for (let i = 0; i < raw.length; i++) {
        const c = raw[i],
          n = raw[i + 1];
        if (comment) {
          if (c === "*" && n === "/") {
            comment = false;
            i++;
          }
          continue;
        }
        if (quote) {
          if (escape) escape = false;
          else if (c === "\\") escape = true;
          else if (c === quote) quote = null;
          continue;
        }
        if (c === "/" && n === "/") break;
        if (c === "/" && n === "*") {
          comment = true;
          i++;
          continue;
        }
        if (['"', "'", "`"].includes(c)) {
          quote = c;
          continue;
        }
        if (c === "{" || c === "[") depth++;
        if (c === "}" || c === "]") depth--;
        if (depth < 0 || depth > 256) throw new Error("Unbalanced QML braces");
      }
      return line;
    })
    .join("");
  if (depth || quote || comment) throw new Error("Incomplete QML document");
  return result;
}
async function formatEdits(source, options = {}, range) {
  if (Buffer.byteLength(source) > 2 * 1024 * 1024)
    throw new Error("Document exceeds 2 MiB");
  const parser = parsers[options.language];
  if (!parser) throw new Error("No bundled parser for " + options.language);
  const prefix = ["twig", "template", "liquid-html", "glimmer"].includes(parser)
    ? frontmatter(source)
    : 0;
  const body = source.slice(prefix);
  const localRange = range
    ? { start: Math.max(0, range.start - prefix), end: range.end - prefix }
    : undefined;
  if (localRange?.end <= 0) return [];
  if (parser === "twig")
    return (await twigEdits(body, options, localRange)).map((e) => ({
      ...e,
      start: e.start + prefix,
      end: e.end + prefix,
    }));
  let output;
  if (parser === "template") output = await formatTemplate(body, options);
  else if (parser === "qml") output = qmlFormat(body, options);
  else {
    const prettierOptions = {
      parser,
      plugins: [babel, estree, typescript, flow, postcss, glimmer, xml, liquid],
      tabWidth: Math.max(1, Math.min(16, options.tabSize || 2)),
      useTabs: options.insertSpaces === false,
      printWidth: options.wrap > 0 ? options.wrap : 80,
      endOfLine: options.eol === "\r\n" ? "crlf" : "lf",
      xmlWhitespaceSensitivity: "strict",
      xmlQuoteAttributes: "preserve",
    };
    if (options.quoteConvert === "single") prettierOptions.singleQuote = true;
    if (options.quoteConvert === "double") prettierOptions.singleQuote = false;
    if (options.endComma === "always") prettierOptions.trailingComma = "all";
    if (options.endComma === "never") prettierOptions.trailingComma = "none";
    if (localRange) {
      prettierOptions.rangeStart = localRange.start;
      prettierOptions.rangeEnd = localRange.end;
    }
    output = await prettier.format(body, prettierOptions);
    // Avoid changing final-newline preferences when explicitly disabled.
    if (options.newLine === false && !body.endsWith("\n"))
      output = output.replace(/\r?\n$/, "");
  }
  const edit = minimalEdit(source, prefix, source.length, output);
  if (edit && range && (edit.start < range.start || edit.end > range.end))
    throw new Error(
      "Selection requires formatting a larger syntax unit; use Format Document",
    );
  return edit ? [edit] : [];
}
module.exports = { formatEdits, frontmatter, qmlFormat };
