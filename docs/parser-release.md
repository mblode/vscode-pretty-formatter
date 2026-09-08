# Shared parser release

Canonical implementation and evaluation: https://github.com/mblode/vscode-twig-language-2/blob/master/docs/plans/lossless-parser.md

## Release status, 8 September 2026

Version 0.3.1 is published on [GitHub](https://github.com/mblode/vscode-pretty-formatter/releases/tag/v0.3.1). [Linux CI](https://github.com/mblode/vscode-pretty-formatter/actions/runs/34177702198) passed. Across the three distributions, 962 unit/regression tests passed with no skips; the native Twig checks passed and all six extracted-package runs passed on VS Code 1.85.2 and stable 1.136.1. Every CI-packaged file matches the locally tested artifact. Local VSIX SHA-256: `c591d4170780902b9b9febf46f53cef875d2b6dcb428520ef075165e099c35ef`.

Marketplace and Open VSX publication of this patch remain pending. Chrome rejected the package picker because file URL access is disabled for its browser extension. No Marketplace upload was submitted. The previous Marketplace/Open VSX release remains live. Bulk issue and review replies remain stopped.
