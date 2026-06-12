// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
    languages,
    ExtensionContext,
    workspace,
    TextDocument,
    Position,
    Range,
    DocumentSelector,
    Disposable,
    TextEdit
} from 'vscode';
import * as path from 'path';

const prettydiff = require('prettydiff');

let formatterHandler: undefined | Disposable;
let rangeFormatterHandler: undefined | Disposable;

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
    'vtl', //Apache Velocity
    'aspx', //ASP Inline Expression
    'cfm', //CFML (ColdFusion Markup Language)
    'dust', //Dust.js
    'eex', //EEX Elixir Templates
    'ejs', //EJS (Embedded JavaScript) Templates
    'erb', //ERB (Embedded Ruby)
    'ftl', //FreeMarker
    'genshi', //Genshi
    'handlebars', //Handlebars
    'htl', //HTL (HTML Templating Language)
    'html', //HTML
    'jinja', //Jinja
    'liquid', //Liquid
    'mustache', //Mustache
    'nunjucks', //Nunjucks
    'SilverStripe', //SilverStripe
    'spacebars', //Spacebars templates
    'tpl', //Underscore Templates (TPL)
    'twig', //Twig
    'leaf', //Vapor Leaf
    'vash', //Vash
    'volt', //Volt
    'xml', //XML
    'xslt', //XSLT
    'flow', //Flow
    'js', //JavaScript
    'javascript', //JavaScript
    'javascriptreact', //JavaScript React
    'typescript', //Typescript
    'typescriptreact', //Typescript React
    'json', //JSON
    'jsonc', //JSONC
    'qml', //QML
    'jsx', //React JSX
    'alloy-tss', //TSS (Titanium Style Sheets)
    'tss', //TSS (Titanium Style Sheets)
    'tsx', //TSX
    'ts', //TypeScript
    'css', //CSS
    'less', //LESS
    'scss', //SCSS
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
function globToRegExp(glob: string): RegExp {
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
                } else {
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
function isIgnored(document: TextDocument): boolean {
    const config = workspace.getConfiguration('pretty-formatter');
    const patterns: string[] = config.get('ignore', []);

    if (!Array.isArray(patterns) || patterns.length === 0) {
        return false;
    }

    const absolutePath = document.fileName.replace(/\\/g, '/');

    // Workspace-relative path (forward-slashed, no leading slash) so that
    // patterns like "src/**" or "*.min.js" behave intuitively.
    let relativePath = workspace.asRelativePath(document.uri, false).replace(/\\/g, '/');
    const baseName = path.posix.basename(absolutePath);

    const candidates = new Set<string>([absolutePath, relativePath, baseName]);

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

const prettyDiff = (document: TextDocument, range: Range) => {
    const result = [];
    let output = "";
    let options = prettydiff.options;

    const editor = workspace.getConfiguration('editor');
    const config = workspace.getConfiguration('pretty-formatter');

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

    result.push(TextEdit.replace(range, output));
    return result;
};

export function activate(context: ExtensionContext) {
    interface Selectors {
        rangeLanguageSelector: DocumentSelector;
        languageSelector: DocumentSelector;
    }

    function registerFormatter() {
        disposeHandlers();

        const config = workspace.getConfiguration('pretty-formatter');

        const enabledLanguages = selectors.filter(function (el) {
            return config.disableLanguages.indexOf(el) < 0;
        });

        for (let i in enabledLanguages) {
            rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider({
                scheme: 'file',
                language: enabledLanguages[i]
            }, {
                provideDocumentRangeFormattingEdits: function (document: TextDocument, range: Range) {
                    if (isIgnored(document)) {
                        return [];
                    }

                    let end = range.end;

                    if (end.character === 0) {
                        end = end.translate(-1, Number.MAX_VALUE);
                    } else {
                        end = end.translate(0, Number.MAX_VALUE);
                    }

                    const rng = new Range(new Position(range.start.line, 0), end);
                    return prettyDiff(document, rng);
                }
            });

            formatterHandler = languages.registerDocumentFormattingEditProvider({
                scheme: 'file',
                language: enabledLanguages[i]
            }, {
                provideDocumentFormattingEdits: function (document: TextDocument) {
                    if (isIgnored(document)) {
                        return [];
                    }

                    const start = new Position(0, 0);

                    const end = new Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
                    const rng = new Range(start, end);
                    return prettyDiff(document, rng);
                }
            });
        }
    }

    function syncFormatter() {
        const config = workspace.getConfiguration('pretty-formatter');

        if (config.formatting) {
            registerFormatter();
        } else {
            disposeHandlers();
        }
    }

    // Re-read configuration whenever the user changes a pretty-formatter
    // setting so that `formatting`, `disableLanguages` and `ignore` apply
    // without requiring a window reload.
    context.subscriptions.push(
        workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('pretty-formatter')) {
                syncFormatter();
            }
        })
    );

    syncFormatter();
}

// this method is called when your extension is deactivated
export function deactivate() { }
