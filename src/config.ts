import { workspace } from 'vscode';
const prettydiff = require('prettydiff');

/**
 * # PrettyDiff Defaults
 */
export const defaults = prettydiff.defaults;

/**
 * # Editor Configuration
 */
export const editor = workspace.getConfiguration('editor');
const config = workspace.getConfiguration('pretty-format');

/**
 * Default Formatting Rules
 */

let indent_size = editor.tabSize;

if (config.indent_size > 0) {
    indent_size = config.tabSize;
}

export const rules = {
    mode: 'beautify',
    fix: true,
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
    indent_char: config.indent_char,
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

export default {
    editor,
    defaults,
    rules
};
