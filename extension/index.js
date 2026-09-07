"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// src/formatter/service.js
var require_service = __commonJS({
  "src/formatter/service.js"(exports2, module2) {
    "use strict";
    var { Worker } = require("node:worker_threads");
    function runFormatter2(workerPath, source, options, range, cancellation, timeout = 5e3) {
      if (cancellation?.isCancellationRequested)
        return { promise: Promise.resolve([]), dispose() {
        } };
      if (Buffer.byteLength(source, "utf8") > 2 * 1024 * 1024) {
        return {
          promise: Promise.reject(
            new Error("Document exceeds the 2 MiB formatting limit")
          ),
          dispose() {
          }
        };
      }
      const worker = new Worker(workerPath, {
        workerData: { source, options, range }
      });
      let settled = false, timer, subscription, finish;
      const promise = new Promise((resolve, reject) => {
        finish = (error, edits = []) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          subscription?.dispose();
          void worker.terminate();
          if (error) reject(error);
          else resolve(edits);
        };
        worker.once(
          "message",
          (result) => finish(result.error ? new Error(result.error) : null, result.edits)
        );
        worker.once("error", (error) => finish(error));
        worker.once("exit", (code) => {
          if (!settled)
            finish(
              new Error(`Formatter worker exited before returning edits (${code})`)
            );
        });
        timer = setTimeout(
          () => finish(new Error(`Formatting exceeded ${timeout} ms`)),
          timeout
        );
        subscription = cancellation?.onCancellationRequested(() => finish(null));
        if (cancellation?.isCancellationRequested) finish(null);
      });
      return {
        promise,
        dispose() {
          finish(null);
        }
      };
    }
    module2.exports = { runFormatter: runFormatter2 };
  }
});

// src/formatter/settings.js
var require_settings = __commonJS({
  "src/formatter/settings.js"(exports2, module2) {
    "use strict";
    function readOptions2(config, formatting) {
      const style = config.get("indentStyle", "editor");
      return {
        insertSpaces: style === "editor" ? formatting.insertSpaces : style === "space",
        tabSize: config.get("tabSize", 0) || formatting.tabSize,
        wrap: config.get("wrap", 0),
        forceAttribute: config.get("forceAttribute", false),
        spaceClose: config.get("spaceClose", false),
        newLine: config.get("newLine", true),
        embeddedFormatting: config.get("embeddedFormatting", true)
      };
    }
    function matchesIgnore2(patterns, paths) {
      return patterns.some((pattern) => {
        if (typeof pattern !== "string" || !pattern) return false;
        let regex = "";
        const normalized = pattern.replace(/\\/g, "/");
        for (let i = 0; i < normalized.length; i++) {
          const c = normalized[i];
          if (c === "*" && normalized[i + 1] === "*") {
            i++;
            if (normalized[i + 1] === "/") {
              i++;
              regex += "(?:.*/)?";
            } else regex += ".*";
          } else if (c === "*") regex += "[^/]*";
          else if (c === "?") regex += "[^/]";
          else regex += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
        const re = new RegExp("^" + regex + "(?:/.*)?$");
        return paths.some((path2) => re.test(path2.replace(/\\/g, "/")));
      });
    }
    module2.exports = { readOptions: readOptions2, matchesIgnore: matchesIgnore2 };
  }
});

// src/options.js
var require_options = __commonJS({
  "src/options.js"(exports2, module2) {
    "use strict";
    var parsers = Object.freeze({
      twig: "twig",
      html: "twig",
      jinja: "twig",
      nunjucks: "twig",
      volt: "twig",
      javascript: "babel",
      js: "babel",
      javascriptreact: "babel",
      jsx: "babel",
      flow: "flow",
      typescript: "typescript",
      typescriptreact: "typescript",
      ts: "typescript",
      tsx: "typescript",
      json: "json",
      jsonc: "jsonc",
      css: "css",
      scss: "scss",
      less: "less",
      xml: "xml",
      xslt: "xml",
      liquid: "liquid-html",
      handlebars: "glimmer",
      eex: "template",
      ejs: "template",
      erb: "template",
      aspx: "template",
      tpl: "template",
      ftl: "template",
      cfm: "template",
      cfml: "template",
      qml: "qml"
    });
    var languages2 = Object.keys(parsers);
    function readOptions2(config, editor) {
      return {
        insertSpaces: editor.insertSpaces,
        tabSize: config.get("indentSize", 0) || editor.tabSize,
        wrap: config.get("wrap", 0),
        forceAttribute: config.get("forceAttribute", false),
        spaceClose: config.get("spaceClose", false),
        newLine: config.get("newLine", true),
        embeddedFormatting: config.get("embeddedFormatting", true),
        quoteConvert: config.get("quoteConvert", "none"),
        endComma: config.get("endComma", "none")
      };
    }
    module2.exports = { parsers, languages: languages2, readOptions: readOptions2 };
  }
});

// src/extension.js
var vscode = require("vscode");
var path = require("node:path");
var { runFormatter } = require_service();
var { matchesIgnore } = require_settings();
var { readOptions, languages } = require_options();
function activate(context) {
  const pending = /* @__PURE__ */ new Map();
  const output = vscode.window.createOutputChannel("Pretty Formatter");
  context.subscriptions.push(output, {
    dispose() {
      for (const request of pending.values()) request.dispose();
      pending.clear();
    }
  });
  const configFor = (document) => vscode.workspace.getConfiguration("pretty-formatter", {
    uri: document.uri,
    languageId: document.languageId
  });
  async function provideEdits(document, options, cancellation, selection) {
    const config = configFor(document);
    if (!config.get("formatting", true) || config.get("disableLanguages", []).includes(document.languageId) || cancellation.isCancellationRequested)
      return [];
    const filename = document.uri.scheme === "file" ? document.uri.fsPath : document.uri.path || document.uri.fsPath;
    if (matchesIgnore(config.get("ignore", []), [
      filename,
      path.basename(filename),
      vscode.workspace.asRelativePath(document.uri, false),
      ...vscode.workspace.asRelativePath(document.uri, false).split(/[\\/]/)
    ]))
      return [];
    const key = document.uri.toString();
    pending.get(key)?.dispose();
    const source = document.getText(), version = document.version;
    let range;
    if (selection) {
      if (selection.isEmpty) return [];
      const lastLine = selection.end.character === 0 ? Math.max(selection.start.line, selection.end.line - 1) : selection.end.line;
      range = {
        start: document.offsetAt(new vscode.Position(selection.start.line, 0)),
        end: document.offsetAt(document.lineAt(lastLine).range.end)
      };
    }
    const timeout = Math.min(
      3e4,
      Math.max(100, config.get("formatTimeout", 5e3))
    );
    let request;
    try {
      request = runFormatter(
        context.asAbsolutePath("extension/formatter.js"),
        source,
        {
          ...readOptions(config, options),
          language: document.languageId,
          eol: document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n"
        },
        range,
        cancellation,
        timeout
      );
      pending.set(key, request);
      const edits = await request.promise;
      if (!configFor(document).get("formatting", true) || configFor(document).get("disableLanguages", []).includes(document.languageId) || document.version !== version || document.isClosed || cancellation.isCancellationRequested)
        return [];
      return edits.map(
        (edit) => vscode.TextEdit.replace(
          new vscode.Range(
            document.positionAt(edit.start),
            document.positionAt(edit.end)
          ),
          edit.text
        )
      );
    } catch (error) {
      output.appendLine(
        `Formatting skipped: ${error.message}. No edits applied.`
      );
      vscode.window.setStatusBarMessage(
        `Pretty Formatter: formatting skipped (${error.message})`,
        5e3
      );
      return [];
    } finally {
      if (pending.get(key) === request) pending.delete(key);
    }
  }
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(languages, {
      provideDocumentFormattingEdits: (document, options, token) => provideEdits(document, options, token)
    }),
    vscode.languages.registerDocumentRangeFormattingEditProvider(languages, {
      provideDocumentRangeFormattingEdits: (document, range, options, token) => provideEdits(document, options, token, range)
    })
  );
}
exports.activate = activate;
