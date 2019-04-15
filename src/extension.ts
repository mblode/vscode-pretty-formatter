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

const editor = workspace.getConfiguration('editor');
const config = workspace.getConfiguration('pretty-format');
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
    'c',
    'cpp',
    'csharp',
    'css',
    'go',
    'handlebars',
    'html',
    'jade',
    'java',
    'javascript',
    'javascriptreact',
    'json',
    'jsonc',
    'jsx',
    'less',
    'perl',
    'perl6',
    'python',
    'r',
    'ruby',
    'rust',
    'scss',
    'swift',
    'typescript',
    'typescriptreact',
    'xml',
    'xsl',
    'yaml'
];

const prettyDiff = (document: TextDocument, range: Range) => {
    const result = [];
    const source = document.getText(range);
    let output = "";
    const defaults = prettydiff.defaults;

    let tabSize = editor.tabSize;

    if (config.indentSize > 0) {
        tabSize = config.indentSize;
    }

    const rules = {
        mode: 'beautify',
        formatting: config.formatting,
        brace_line: config.braceLine,
        brace_padding: config.bracePadding,
        brace_style: config.braceStyle,
        braces: config.braces,
        comment_line: config.commentLine,
        comments: config.comments,
        compressed_css: config.compressedCss,
        correct: config.correct,
        cssInsertLines: config.cssInsertLines,
        else_line: config.elseLine,
        end_comma: config.endComma,
        force_attribute: config.forceAttribute,
        force_indent: config.forceIndent,
        format_array: config.formatArray,
        format_object: config.formatObject,
        function_name: config.functionName,
        indent_level: config.indentLevel,
        indentSize: tabSize,
        method_chain: config.methodChain,
        never_flatten: config.neverFlatten,
        new_line: config.newLine,
        no_case_indent: config.noCaseIndent,
        no_lead_zero: config.noLeadZero,
        object_sort: config.objectSort,
        preserve: config.preserve,
        preserve_comment: config.preserveComment,
        quote_convert: config.quoteConvert,
        space: config.space,
        space_close: config.spaceSlose,
        styleguide: config.styleguide,
        tag_merge: config.tagMerge,
        tag_sort: config.tagSort,
        ternary_line: config.ternaryLine,
        unformatted: config.unformatted,
        variable_list: config.variableList,
        vertical: config.vertical,
        wrap: config.wrap
    };

    let settings = Object.assign({}, defaults, rules, { source });
    output = prettydiff.mode(settings);
    settings.end = 0;
    settings.start = 0;
    result.push(TextEdit.replace(range, output));
    return result;
};

export function activate(context: ExtensionContext) {
    interface Selectors {
        rangeLanguageSelector: DocumentSelector;
        languageSelector: DocumentSelector;
    }

    const enabledLanguages = selectors.filter(function (el) {
        return config.disableLanguages.indexOf(el) < 0;
    });

    function registerFormatter() {
        disposeHandlers();

        for (let i in enabledLanguages) {
            rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider(
                { scheme: 'file', language: enabledLanguages[i] },
                {
                    provideDocumentRangeFormattingEdits: function (document: TextDocument, range: Range) {
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

            formatterHandler = languages.registerDocumentFormattingEditProvider(
                { scheme: 'file', language: enabledLanguages[i] },
                {
                    provideDocumentFormattingEdits: function (document: TextDocument) {
                        const start = new Position(0, 0);

                        const end = new Position(
                            document.lineCount - 1,
                            document.lineAt(document.lineCount - 1).text.length
                        );
                        const rng = new Range(start, end);
                        return prettyDiff(document, rng);
                    }
                });
        }
    }

    if (config.formatting) {
        registerFormatter();
    }
}

// this method is called when your extension is deactivated
export function deactivate() { }
