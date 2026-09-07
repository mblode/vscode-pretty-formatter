const vscode = require("vscode");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
exports.run = async () => {
  const extension = vscode.extensions.getExtension("mblode.pretty-formatter");
  assert(extension);
  const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
  const settings = vscode.workspace.getConfiguration();
  await settings.update(
    "editor.defaultFormatter",
    "mblode.pretty-formatter",
    vscode.ConfigurationTarget.Workspace,
  );
  await settings.update(
    "editor.tabSize",
    2,
    vscode.ConfigurationTarget.Workspace,
  );
  await settings.update(
    "editor.insertSpaces",
    true,
    vscode.ConfigurationTarget.Workspace,
  );
  await settings.update(
    "editor.detectIndentation",
    false,
    vscode.ConfigurationTarget.Workspace,
  );
  const config = vscode.workspace.getConfiguration("pretty-formatter");
  const update = (k, v) =>
    config.update(k, v, vscode.ConfigurationTarget.Workspace);
  let sequence = 0;
  async function open(language, source) {
    const uri = vscode.Uri.file(
      path.join(root, "file-" + language + "-" + sequence++),
    );
    await fs.writeFile(uri.fsPath, source);
    let d = await vscode.workspace.openTextDocument(uri);
    d = await vscode.languages.setTextDocumentLanguage(d, language);
    await vscode.window.showTextDocument(d);
    return d;
  }
  const doc = await open("typescript", "const x: number=1;");
  // Opening a supported language must activate the extension without calling activate explicitly.
  for (let i = 0; i < 30 && !extension.isActive; i++)
    await new Promise((r) => setTimeout(r, 100));
  assert(extension.isActive, "onLanguage activation must work");
  const format = () =>
    vscode.commands.executeCommand("editor.action.formatDocument");
  await format();
  assert.equal(doc.getText(), "const x: number = 1;\n");
  const twig = await open("twig", "<div>\n{{x}}\n</div>");
  await format();
  assert.equal(twig.getText(), "<div>\n  {{ x }}\n</div>\n");
  await update("formatting", false);
  const disabled = await open("javascript", "const x=1;");
  await format();
  assert.equal(disabled.getText(), "const x=1;");
  await update("formatting", true);
  await update("disableLanguages", ["javascript"]);
  await format();
  assert.equal(disabled.getText(), "const x=1;");
  await update("disableLanguages", []);
  await format();
  assert.equal(disabled.getText(), "const x = 1;\n");
  await update("ignore", ["**/file-javascript*"]);
  const ignored = await open("javascript", "const x=2;");
  await format();
  assert.equal(ignored.getText(), "const x=2;");
  await update("ignore", []);
  for (const [language, source, needle] of [
    ["xml", '<root><child a="b"/></root>', '<child a="b"'],
    ["css", "a{color:red}", "color: red;"],
    ["liquid", "<div>\n{{product.title}}\n</div>", "{{ product.title }}"],
    ["ftl", '<div>\n<#include "x.ftl" />\n</div>', '  <#include "x.ftl" />'],
    ["eex", "<div>\n<%= @name %>\n</div>", "  <%= @name %>"],
    ["cfml", "<div>\n<cfoutput>#name#</cfoutput>\n</div>", "  <cfoutput>"],
    ["qml", "Item {\nproperty int x:1\n}", "  property int x:1"],
    [
      "nunjucks",
      "---\nlayout: base\n---\n<div>{{x}}</div>",
      "---\nlayout: base\n---\n<div>{{ x }}</div>",
    ],
  ]) {
    const d = await open(language, source);
    await format();
    assert(d.getText().includes(needle), language + ": " + d.getText());
    const first = d.getText();
    await format();
    assert.equal(d.getText(), first, language + " idempotence");
  }
  const bad = await open("typescript", "const x = {");
  await format();
  assert.equal(bad.getText(), "const x = {");
  await update("indentSize", 3);
  const indent = await open("javascript", "function x(){return 1;}");
  await format();
  assert(indent.getText().includes("\n   return"));
  await update("indentSize", 0);
  await settings.update(
    "editor.insertSpaces",
    false,
    vscode.ConfigurationTarget.Workspace,
  );
  await format();
  assert(indent.getText().includes("\n\treturn"));
  await settings.update(
    "editor.formatOnSave",
    true,
    vscode.ConfigurationTarget.Workspace,
  );
  const save = await open("javascript", "const y=1;");
  const editor = vscode.window.activeTextEditor;
  await editor.edit((e) => e.insert(new vscode.Position(0, 0), " "));
  assert(await save.save());
  assert.equal(await fs.readFile(save.uri.fsPath, "utf8"), "const y = 1;\n");
  const untitled = await vscode.workspace.openTextDocument({
    language: "javascript",
    content: "const virtual=1;",
  });
  await vscode.window.showTextDocument(untitled);
  await format();
  assert.equal(untitled.getText(), "const virtual = 1;\n");
  console.log(
    "Pretty Formatter packaged integration passed: activation, parser loading, document/save, disable, ignore, indent, tabs, idempotence, errors and legacy templates.",
  );
};
