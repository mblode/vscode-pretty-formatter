"use strict";
const { formatEdits, applyEdits } = require("./formatter/format");
const { scan } = require("./formatter/lexer");
const words = (s) => new Set(s.split(" "));
// CFML tags with no end tag. Tags missing from both lists pair only when a matching end tag exists.
const CF_VOID = words(
  "abort applet application argument associate break chartdata collection content continue cookie dbinfo directory dump error exit feed file flush ftp gridcolumn gridrow header httpparam image import include index input invokeargument ldap location log loginuser logout mailparam object objectcache param pdfparam pop procparam procresult property queryparam registry rethrow return schedule set setting sleep slider spreadsheet trace wddx zipparam",
);
const CF_PAIRED = words(
  "if loop output query function component interface try catch finally switch case defaultcase savecontent lock mail mailpart silent document documentitem documentsection form select xml while timer chart chartseries storedproc table",
);
const FTL_PAIRED = words(
  "if list items macro function switch attempt compress escape noescape autoesc noautoesc outputformat",
);
const FTL_VOID = words(
  "include import return break continue nested recurse visit flush stop t lt rt nt ftl setting fallback",
);
const FTL_BRANCH = {
  else: ["#if", "#list"],
  elseif: ["#if"],
  sep: ["#list", "#items"],
  recover: ["#attempt"],
  case: ["#switch"],
  on: ["#switch"],
  default: ["#switch"],
};
// Block structure per dialect: { type: open|branch|close, name, required, parents, style }.
function role(raw, language) {
  if (language === "cfm" || language === "cfml") {
    const m = /^<(\/?)cf([\w-]*)/i.exec(raw);
    if (!m) return null;
    const name = m[2].toLowerCase();
    if (m[1]) return { type: "close", name };
    if (name === "else" || name === "elseif")
      return { type: "branch", parents: ["if"] };
    if (/\/\s*>$/.test(raw) || CF_VOID.has(name)) return null;
    return { type: "open", name, required: CF_PAIRED.has(name) };
  }
  if (language === "ftl") {
    const m = /^<(\/?)([#@])([\w.:-]*)/.exec(raw);
    if (!m || raw.startsWith("<#--")) return null;
    const bare = m[3].toLowerCase(),
      name = m[2] + bare;
    if (m[1]) return { type: "close", name };
    if (m[2] === "#" && Object.hasOwn(FTL_BRANCH, bare))
      return {
        type: "branch",
        parents: FTL_BRANCH[bare],
        style: ["case", "on", "default"].includes(bare) ? "case" : "if",
      };
    if (/\/\s*>$/.test(raw) || (m[2] === "#" && FTL_VOID.has(bare)))
      return null;
    return {
      type: "open",
      name,
      required: m[2] === "@" || FTL_PAIRED.has(bare),
    };
  }
  if (!["eex", "erb", "ejs"].includes(language) || !raw.startsWith("<%"))
    return null;
  if (/^<%[%#]|^<%!--/.test(raw)) return null;
  const code = raw
    .slice(2, -2)
    .replace(/^[=\-_]+|[-_=]$/g, "")
    .trim();
  const open = (name) => ({ type: "open", name, required: true });
  const branch = (parents, style = "if") => ({
    type: "branch",
    parents,
    style,
  });
  if (language === "eex") {
    if (/^end\b/.test(code)) return { type: "close", name: "end" };
    if (/^(?:else|rescue|catch|after)$/.test(code)) return branch(["end"]);
    if (/\bfn\b[\s\S]*->$|\bdo$/.test(code)) return open("end");
    if (/->$/.test(code)) return branch(["end"], "case");
    return null;
  }
  if (language === "erb") {
    if (/^end\b/.test(code)) return { type: "close", name: "end" };
    if (/^\}/.test(code)) return { type: "close", name: "}" };
    if (/^(?:else|elsif|when|in|rescue|ensure)\b/.test(code))
      return branch(["end"]);
    if (/\bend$/.test(code)) return null;
    if (
      /^(?:if|unless|while|until|for|case|begin)\b/.test(code) ||
      /\bdo(?:\s*\|[^|]*\|)?$/.test(code)
    )
      return open("end");
    if (/\{(?:\s*\|[^|]*\|)?$/.test(code)) return open("}");
    return null;
  }
  if (/^\}/.test(code))
    return /\{$/.test(code) ? branch(["}"]) : { type: "close", name: "}" };
  return /\{$/.test(code) ? open("}") : null;
}
// Pair openers with closers. Optional tags with no end tag become void; anything else unbalanced throws.
function structure(items) {
  const stack = [];
  for (const item of items) {
    const r = item.role;
    if (r.type === "open") {
      stack.push((item.frame = { ...r, item, style: null }));
      continue;
    }
    const target =
      r.type === "close"
        ? (f) => f.name === r.name || (r.name === "@" && f.name[0] === "@")
        : (f) => r.parents.includes(f.name);
    while (stack.length && !target(stack.at(-1)) && !stack.at(-1).required)
      stack.pop().item.frame = null;
    const frame = stack.at(-1);
    if (!frame || !target(frame)) throw new Error("Unbalanced template blocks");
    item.frame = frame;
    if (r.type === "close") stack.pop();
    else if (frame.style && frame.style !== r.style)
      throw new Error("Mixed template branch styles");
    else frame.style = r.style;
  }
  for (const frame of stack.reverse()) {
    if (frame.required) throw new Error("Unclosed template block");
    frame.item.frame = null;
  }
}
// Opaque template spans keep their exact bytes. Only surrounding HTML indentation changes.
// Block directives become Twig if/switch placeholders so the shared core indents their bodies.
function projectTemplate(source, language) {
  let prefix = "PRETTY_OPAQUE_";
  while (source.includes(prefix)) prefix += "X";
  const replacements = [];
  const mask = (raw, kind = "comment") => {
    const id = prefix + replacements.length;
    const placeholder = kind === "output" ? `{{ ${id} }}` : `{# ${id} #}`;
    replacements.push({ raw, placeholder, id, role: role(raw, language) });
    return placeholder;
  };
  // CFScript is a distinct language; preserve its complete body, including strings/comments.
  let result = source.replace(
    /<cfscript\b[^>]*>[\s\S]*?<\/cfscript\s*>|<#noparse\b[^>]*>[\s\S]*?<\/#noparse\s*>/gi,
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
  // CFML tags hold expressions, not attributes: `<cfset x = 1>` keeps every byte.
  if (language === "cfm" || language === "cfml")
    result = result.replace(
      /<\/?cf[\w-]*(?:"[^"]*"|'[^']*'|[^'">])*>/gi,
      (raw) => mask(raw),
    );
  // Mustache-style text (Vue, Angular, Handlebars) is not this dialect's syntax; keep it exact.
  const own = new Set(replacements.map((r) => r.placeholder));
  result = result.replace(
    /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g,
    (raw) => (own.has(raw) ? raw : mask(raw)),
  );
  const byPlaceholder = new Map(replacements.map((r) => [r.placeholder, r]));
  const tokens = scan(result);
  structure(tokens.map((t) => byPlaceholder.get(t.raw)).filter((r) => r?.role));
  result = tokens
    .map((t) => {
      const r = byPlaceholder.get(t.raw);
      if (r?.frame) {
        const kind = r.frame.style === "case" ? "switch" : "if";
        r.placeholder =
          r.role.type === "open"
            ? `{% ${kind} ${r.id} %}`
            : r.role.type === "close"
              ? `{% end${kind} ${r.id} %}`
              : `{% ${kind === "switch" ? "case" : "elseif"} ${r.id} %}`;
        return r.placeholder;
      }
      // Removing the space in `value=x />` would make `/` part of the unquoted value.
      if (
        t.type === "html" &&
        t.selfClosing &&
        /(?:=\s*[^\s"'=<>`]+|[}#]\})\s+\/>$/.test(t.raw)
      )
        return mask(t.raw);
      return t.raw;
    })
    .join("");
  return {
    text: result,
    restore(output) {
      for (const { raw, placeholder } of replacements.slice().reverse()) {
        if (output.split(placeholder).length !== 2)
          throw new Error("Template placeholder changed");
        output = output.replace(placeholder, () => raw);
      }
      return output;
    },
  };
}
async function formatTemplate(source, options) {
  const projection = projectTemplate(source, options.language);
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
