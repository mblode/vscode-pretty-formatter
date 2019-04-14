// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
    languages,
    ExtensionContext,
    workspace,
    commands,
    window,
    Position,
    Range,
    DocumentFilter,
    DocumentSelector,
    Disposable,
    TextEdit
} from 'vscode';
const config = workspace.getConfiguration('pretty-format');
const prettydiff = require('prettydiff');
import pattern from './pattern';

const replace = (range, output) => [TextEdit.replace(range, output)];

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

const blocks = (code, open, name, source, close) => {
    if (name == 'html') {
        let config = Object.assign({}, defaults, rules[name], { source });
        let pretty = prettydiff.mode(config);
        return pattern.ignore(`${open.trim()}\n${pretty.trim()}\n${close.trim()}`);
    } else if (pattern.enforce.includes(name) && open[0] === '{') {
        let config = Object.assign({}, defaults, rules[name], { source });
        let pretty = prettydiff.mode(config);
        return pattern.ignore(`${open.trim()}\n\n${pretty.trim()}\n\n${close.trim()}`);
    }
    return pattern.ignore(`${code}`);
};

function applyFormat(document, range) {
    let contents = document.getText(range);
    let source = contents.replace(pattern.matches(), blocks);
    let assign = Object.assign({}, defaults, rules.html, {
        source
    });

    let output = prettydiff.mode(assign);
    output = output.replace(pattern.ignored, '');

    return `${output.trim()}`;
}

export function activate(context: ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "pretty-format" is now active!');

    interface Selectors {
        rangeLanguageSelector: DocumentSelector;
        languageSelector: DocumentSelector;
    }

    function registerFormatter() {
        disposeHandlers();
        const { languageSelector, rangeLanguageSelector } = selectors();
        rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider(rangeLanguageSelector, {
            provideDocumentRangeFormattingEdits: function(document, range) {
                let end = range.end;
                if (end.character === 0) {
                    end = end.translate(-1, Number.MAX_VALUE);
                } else {
                    end = end.translate(0, Number.MAX_VALUE);
                }
                const rng = new Range(new Position(range.start.line, 0), end);
                let output = applyFormat(document, rng);
                return replace(rng, output);
            }
        });
        formatterHandler = languages.registerDocumentFormattingEditProvider(languageSelector, {
            provideDocumentFormattingEdits: function(document) {
                const start = new Position(0, 0);
                const end = new Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);

                const rng = new Range(start, end);
                let output = applyFormat(document, rng);
                return replace(rng, output);
            }
        });
    }

    registerFormatter();
    context.subscriptions.push(
        workspace.onDidChangeWorkspaceFolders(registerFormatter),
        {
            dispose: disposeHandlers
        },
        setupErrorHandler(),
        configFileListener(),
        ...registerDisposables()
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
