"use strict";
const { formatEdits, applyEdits } = require("./formatter/format");
// Opaque template spans keep their exact bytes. Only surrounding HTML indentation changes.
// No dialect expressions are parsed as JavaScript or Twig.
function projectTemplate(source) {
  let prefix = "PRETTY_OPAQUE_";
  while (source.includes(prefix)) prefix += "X";
  const replacements = [];
  const mask = (raw, kind = "comment") => {
    const id = prefix + replacements.length;
    const placeholder = kind === "output" ? `{{ ${id} }}` : `{# ${id} #}`;
    replacements.push({ raw, placeholder });
    return placeholder;
  };
  // CFScript is a distinct language; preserve its complete body, including strings/comments.
  let result = source.replace(
    /<cfscript\b[^>]*>[\s\S]*?<\/cfscript\s*>/gi,
    (raw) => mask(raw),
  );
  result = result.replace(
    /<%[\s\S]*?%>|<#--[\s\S]*?-->|<\/?[\#@](?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^'">])*\>|\$\{(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^'"}])*\}/g,
    (raw) =>
      mask(
        raw,
        raw.startsWith("${") || raw.startsWith("<%=") ? "output" : "comment",
      ),
  );
  if (/<%|<\/?[#@]|\$\{/.test(result))
    throw new Error("Incomplete template delimiter");
  return {
    text: result,
    restore(output) {
      for (const { raw, placeholder } of replacements) {
        if (output.split(placeholder).length !== 2)
          throw new Error("Template placeholder changed");
        output = output.replace(placeholder, () => raw);
      }
      return output;
    },
  };
}
async function formatTemplate(source, options) {
  const projection = projectTemplate(source);
  return projection.restore(
    applyEdits(
      projection.text,
      await formatEdits(projection.text, {
        ...options,
        embeddedFormatting: false,
        wrap: 0,
        forceAttribute: false,
        newLine: false,
      }),
    ),
  );
}
module.exports = { formatTemplate, projectTemplate };
