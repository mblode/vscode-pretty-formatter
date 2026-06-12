"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = require("vscode");
const path = __importStar(require("path"));
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
/**
 * Convert a single glob pattern into a RegExp.
 *
 * Supports the common .prettierignore / .gitignore style tokens:
 *   **  matches any number of path segments (including none)
 *   *   matches anything except a path separator
 *   ?   matches a single character except a path separator
 *
 * Paths are normalised to forward slashes before matching.
 */
function globToRegExp(glob) {
    let re = '';
    for (let i = 0; i < glob.length; i++) {
        const c = glob[i];
        switch (c) {
            case '*':
                if (glob[i + 1] === '*') {
                    // ** matches across path separators
                    re += '.*';
                    i++;
                    // Consume a trailing slash after ** so "**/foo" also
                    // matches "foo" at the root.
                    if (glob[i + 1] === '/') {
                        i++;
                    }
                }
                else {
                    re += '[^/]*';
                }
                break;
            case '?':
                re += '[^/]';
                break;
            // Escape regex special characters
            case '.':
            case '(':
            case ')':
            case '+':
            case '|':
            case '^':
            case '$':
            case '{':
            case '}':
            case '[':
            case ']':
            case '\\':
                re += '\\' + c;
                break;
            default:
                re += c;
        }
    }
    return new RegExp('^' + re + '$');
}
/**
 * Determine whether a document should be skipped based on the
 * `pretty-formatter.ignore` glob patterns (similar to .prettierignore).
 */
function isIgnored(document) {
    const config = vscode_1.workspace.getConfiguration('pretty-formatter');
    const patterns = config.get('ignore', []);
    if (!Array.isArray(patterns) || patterns.length === 0) {
        return false;
    }
    const absolutePath = document.fileName.replace(/\\/g, '/');
    // Workspace-relative path (forward-slashed, no leading slash) so that
    // patterns like "src/**" or "*.min.js" behave intuitively.
    let relativePath = vscode_1.workspace.asRelativePath(document.uri, false).replace(/\\/g, '/');
    const baseName = path.posix.basename(absolutePath);
    const candidates = new Set([absolutePath, relativePath, baseName]);
    for (const raw of patterns) {
        if (typeof raw !== 'string' || raw.length === 0) {
            continue;
        }
        const pattern = raw.replace(/\\/g, '/');
        const regex = globToRegExp(pattern);
        for (const candidate of candidates) {
            if (regex.test(candidate)) {
                return true;
            }
        }
        // A bare pattern with no glob/slash (e.g. "node_modules") should also
        // match if it appears as any path segment.
        if (!pattern.includes('/') && !pattern.includes('*') && !pattern.includes('?')) {
            if (relativePath.split('/').includes(pattern)) {
                return true;
            }
        }
    }
    return false;
}
const prettyDiff = (document, range) => {
    const result = [];
    let output = "";
    let options = prettydiff.options;
    const editor = vscode_1.workspace.getConfiguration('editor');
    const config = vscode_1.workspace.getConfiguration('pretty-formatter');
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
    function registerFormatter() {
        disposeHandlers();
        const config = vscode_1.workspace.getConfiguration('pretty-formatter');
        const enabledLanguages = selectors.filter(function (el) {
            return config.disableLanguages.indexOf(el) < 0;
        });
        for (let i in enabledLanguages) {
            rangeFormatterHandler = vscode_1.languages.registerDocumentRangeFormattingEditProvider({
                scheme: 'file',
                language: enabledLanguages[i]
            }, {
                provideDocumentRangeFormattingEdits: function (document, range) {
                    if (isIgnored(document)) {
                        return [];
                    }
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
                    if (isIgnored(document)) {
                        return [];
                    }
                    const start = new vscode_1.Position(0, 0);
                    const end = new vscode_1.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
                    const rng = new vscode_1.Range(start, end);
                    return prettyDiff(document, rng);
                }
            });
        }
    }
    function syncFormatter() {
        const config = vscode_1.workspace.getConfiguration('pretty-formatter');
        if (config.formatting) {
            registerFormatter();
        }
        else {
            disposeHandlers();
        }
    }
    // Re-read configuration whenever the user changes a pretty-formatter
    // setting so that `formatting`, `disableLanguages` and `ignore` apply
    // without requiring a window reload.
    context.subscriptions.push(vscode_1.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('pretty-formatter')) {
            syncFormatter();
        }
    }));
    syncFormatter();
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map