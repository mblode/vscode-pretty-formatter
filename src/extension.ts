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
    "c", "cpp", "csharp", "css", "go", "handlebars", "jade", "java", "javascript", "javascriptreact", "json", "jsonc", "jsx", "less", "log", "perl", "perl6", "php", "python", "r", "ruby", "rust", "scss", "shellscript", "sql", "swift", "tss", "typescript", "typescriptreact", "vb", "xml", "xsl", "yaml"
];

const prettyDiff = (document: TextDocument, range: Range) => {
    const result = [];
    const source = document.getText(range);
    let output = "";
    const defaults = prettydiff.defaults;

    let indent_size = editor.tabSize;

    if (config.indent_size > 0) {
        indent_size = config.indent_size;
    }

    const rules = {
        mode: 'beautify',
        formatting: config.formatting,
        brace_line: config.brace_line,
        brace_padding: config.brace_padding,
        brace_style: config.brace_style,
        braces: config.braces,
        comment_line: config.comment_line,
        comments: config.comments,
        compressed_css: config.compressed_css,
        correct: config.correct,
        cssInsertLines: config.cssInsertLines,
        else_line: config.else_line,
        end_comma: config.end_comma,
        force_attribute: config.force_attribute,
        force_indent: config.force_indent,
        format_array: config.format_array,
        format_object: config.format_object,
        function_name: config.function_name,
        indent_level: config.indent_level,
        indent_size: indent_size,
        method_chain: config.method_chain,
        never_flatten: config.never_flatten,
        new_line: config.new_line,
        no_case_indent: config.no_case_indent,
        no_lead_zero: config.no_lead_zero,
        object_sort: config.object_sort,
        preserve: config.preserve,
        preserve_comment: config.preserve_comment,
        quote_convert: config.quote_convert,
        space: config.space,
        space_close: config.space_close,
        styleguide: config.styleguide,
        tag_merge: config.tag_merge,
        tag_sort: config.tag_sort,
        ternary_line: config.ternary_line,
        unformatted: config.unformatted,
        variable_list: config.variable_list,
        vertical: config.vertical,
        wrap: config.wrap
    };

    let settings = Object.assign({}, defaults, rules, { source });
    output = prettydiff.mode(settings);
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

        rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider(selectors, {
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

        formatterHandler = languages.registerDocumentFormattingEditProvider(selectors, {
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

    registerFormatter();
}

// this method is called when your extension is deactivated
export function deactivate() { }
