"use strict";
const vscode = require("vscode");
const path = require("node:path");
const { runFormatter } = require("./formatter/service");
const { matchesIgnore } = require("./formatter/settings");
const { readOptions, languages } = require("./options");

function activate(context) {
  const pending = new Map();
  const output = vscode.window.createOutputChannel("Pretty Formatter");
  context.subscriptions.push(output, {
    dispose() {
      for (const request of pending.values()) request.dispose();
      pending.clear();
    },
  });
  const configFor = (document) =>
    vscode.workspace.getConfiguration("pretty-formatter", {
      uri: document.uri,
      languageId: document.languageId,
    });

  async function provideEdits(document, options, cancellation, selection) {
    const config = configFor(document);
    if (
      !config.get("formatting", true) ||
      config.get("disableLanguages", []).includes(document.languageId) ||
      cancellation.isCancellationRequested
    )
      return [];
    const filename =
      document.uri.scheme === "file"
        ? document.uri.fsPath
        : document.uri.path || document.uri.fsPath;
    if (
      matchesIgnore(config.get("ignore", []), [
        filename,
        path.basename(filename),
        vscode.workspace.asRelativePath(document.uri, false),
        ...vscode.workspace.asRelativePath(document.uri, false).split(/[\\/]/),
      ])
    )
      return [];
    const key = document.uri.toString();
    pending.get(key)?.dispose();
    const source = document.getText(),
      version = document.version;
    let range;
    if (selection) {
      if (selection.isEmpty) return [];
      const lastLine =
        selection.end.character === 0
          ? Math.max(selection.start.line, selection.end.line - 1)
          : selection.end.line;
      range = {
        start: document.offsetAt(new vscode.Position(selection.start.line, 0)),
        end: document.offsetAt(document.lineAt(lastLine).range.end),
      };
    }
    const timeout = Math.min(
      30000,
      Math.max(100, config.get("formatTimeout", 5000)),
    );
    let request;
    try {
      request = runFormatter(
        context.asAbsolutePath("extension/formatter.js"),
        source,
        {
          ...readOptions(config, options),
          language: document.languageId,
          eol: document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n",
        },
        range,
        cancellation,
        timeout,
      );
      pending.set(key, request);
      const edits = await request.promise;
      if (
        !configFor(document).get("formatting", true) ||
        configFor(document)
          .get("disableLanguages", [])
          .includes(document.languageId) ||
        document.version !== version ||
        document.isClosed ||
        cancellation.isCancellationRequested
      )
        return [];
      return edits.map((edit) =>
        vscode.TextEdit.replace(
          new vscode.Range(
            document.positionAt(edit.start),
            document.positionAt(edit.end),
          ),
          edit.text,
        ),
      );
    } catch (error) {
      output.appendLine(
        `Formatting skipped: ${error.message}. No edits applied.`,
      );
      vscode.window.setStatusBarMessage(
        `Pretty Formatter: formatting skipped (${error.message})`,
        5000,
      );
      return [];
    } finally {
      if (pending.get(key) === request) pending.delete(key);
    }
  }

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(languages, {
      provideDocumentFormattingEdits: (document, options, token) =>
        provideEdits(document, options, token),
    }),
    vscode.languages.registerDocumentRangeFormattingEditProvider(languages, {
      provideDocumentRangeFormattingEdits: (document, range, options, token) =>
        provideEdits(document, options, token, range),
    }),
  );
}
exports.activate = activate;
