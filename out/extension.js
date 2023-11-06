"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = require("vscode");
const editor = vscode_1.workspace.getConfiguration('editor');
const config = vscode_1.workspace.getConfiguration('pretty-formatter');
const prettydiff = require('prettydiff');
let formatterHandler;
let rangeFormatterHandler;
/**
 * Dispose formatters
 */
function disposeHandlers() {
    if (formatterHandler) {
        formatterHandler.dispose();
    }
    if (rangeFormatterHandler) {
        rangeFormatterHandler.dispose();
    }
    formatterHandler = undefined;
    rangeFormatterHandler = undefined;
}
/**
 * Build formatter selectors
 */
const selectors = [
    'vtl',
    'aspx',
    'cfm',
    'dust',
    'eex',
    'ejs',
    'erb',
    'ftl',
    'genshi',
    'handlebars',
    'htl',
    'html',
    'jinja',
    'liquid',
    'mustache',
    'nunjucks',
    'SilverStripe',
    'spacebars',
    'tpl',
    'twig',
    'leaf',
    'vash',
    'volt',
    'xml',
    'xslt',
    'flow',
    'js',
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact',
    'json',
    'jsonc',
    'qml',
    'jsx',
    'alloy-tss',
    'tss',
    'tsx',
    'ts',
    'css',
    'less',
    'scss',
    'sass' //Sass
];
const prettyDiff = (document, range) => {
    const result = [];
    let output = "";
    let options = prettydiff.options;
    let tabSize = editor.tabSize;
    if (config.indentSize > 0) {
        tabSize = config.indentSize;
    }
    options.source = document.getText(range);
    options.mode = 'beautify';
    options.brace_line = config.braceLine;
    options.brace_padding = config.bracePadding;
    options.brace_style = config.braceStyle;
    options.braces = config.braces;
    options.comment_line = config.commentLine;
    options.comments = config.comments;
    options.compressed_css = config.compressedCss;
    options.correct = config.correct;
    options.css_insert_lines = config.cssInsertLines;
    options.else_line = config.elseLine;
    options.end_comma = config.endComma;
    options.force_attribute = config.forceAttribute;
    options.force_indent = config.forceIndent;
    options.format_array = config.formatArray;
    options.format_object = config.formatObject;
    options.function_name = config.functionName;
    options.indent_level = config.indentLevel;
    options.indent_size = tabSize;
    options.method_chain = config.methodChain;
    options.never_flatten = config.neverFlatten;
    options.new_line = config.newLine;
    options.no_case_indent = config.noCaseIndent;
    options.no_lead_zero = config.noLeadZero;
    options.object_sort = config.objectSort;
    options.preserve = config.preserve;
    options.preserve_comment = config.preserveComment;
    options.quote_convert = config.quoteConvert;
    options.space = config.space;
    options.space_close = config.spaceSlose;
    options.styleguide = config.styleguide;
    options.tag_merge = config.tagMerge;
    options.tag_sort = config.tagSort;
    options.ternary_line = config.ternaryLine;
    options.unformatted = config.unformatted;
    options.variable_list = config.variableList;
    options.vertical = config.vertical;
    options.wrap = config.wrap;
    output = prettydiff();
    options.end = 0;
    options.start = 0;
    result.push(vscode_1.TextEdit.replace(range, output));
    return result;
};
function activate(context) {
    const enabledLanguages = selectors.filter(function (el) {
        return config.disableLanguages.indexOf(el) < 0;
    });
    function registerFormatter() {
        disposeHandlers();
        for (let i in enabledLanguages) {
            rangeFormatterHandler = vscode_1.languages.registerDocumentRangeFormattingEditProvider({
                scheme: 'file',
                language: enabledLanguages[i]
            }, {
                provideDocumentRangeFormattingEdits: function (document, range) {
                    let end = range.end;
                    if (end.character === 0) {
                        end = end.translate(-1, Number.MAX_VALUE);
                    }
                    else {
                        end = end.translate(0, Number.MAX_VALUE);
                    }
                    const rng = new vscode_1.Range(new vscode_1.Position(range.start.line, 0), end);
                    return prettyDiff(document, rng);
                }
            });
            formatterHandler = vscode_1.languages.registerDocumentFormattingEditProvider({
                scheme: 'file',
                language: enabledLanguages[i]
            }, {
                provideDocumentFormattingEdits: function (document) {
                    const start = new vscode_1.Position(0, 0);
                    const end = new vscode_1.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
                    const rng = new vscode_1.Range(start, end);
                    return prettyDiff(document, rng);
                }
            });
        }
    }
    if (config.formatting) {
        registerFormatter();
    }
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map