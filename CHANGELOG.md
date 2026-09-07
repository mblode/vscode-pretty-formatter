## 0.3.0

- Fix missing activation events, formatter registration leaks and live per-document disable/ignore settings.
- Replace PrettyDiff with the shared Twig formatter and pinned Prettier parsers for code, styles, JSON, XML and Liquid.
- Fix reported TypeScript generic corruption, XML formatting, CSS media queries, tabs and indentation width.
- Preserve template frontmatter, Freemarker includes and interpolation, EEX delimiters, CFScript content and QML colon spacing.
- Add worker cancellation, time/input limits, minimal edits, stale-document checks and packaged VS Code regression tests.
- Document exact supported dialects and deprecate obsolete PrettyDiff options. Unsupported dialects no longer receive guessed formatting.
- Require VS Code 1.85+, bundle runtime dependencies, and declare untrusted/virtual workspace support.

# Change Log

All notable changes to the "pretty-formatter" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release
