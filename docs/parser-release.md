# Shared parser release

Canonical implementation and evaluation: https://github.com/mblode/vscode-twig-language-2/blob/master/docs/plans/lossless-parser.md

## Release status, 8 September 2026

Version 0.3.1 is published on [GitHub](https://github.com/mblode/vscode-pretty-formatter/releases/tag/v0.3.1). [Linux CI](https://github.com/mblode/vscode-pretty-formatter/actions/runs/34177702198) passed. Across the three distributions, 962 unit/regression tests passed with no skips; the native Twig checks passed and all six extracted-package runs passed on VS Code 1.85.2 and stable 1.136.1. Every CI-packaged file matches the locally tested artifact. Local VSIX SHA-256: `c591d4170780902b9b9febf46f53cef875d2b6dcb428520ef075165e099c35ef`.

Published on [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter) and [Open VSX](https://open-vsx.org/extension/mblode/pretty-formatter) on 8 September 2026. Both registries list this patch as the current version. Public VSIX downloads from Marketplace, Open VSX and GitHub match the tested local package byte for byte (SHA-256 above). Bulk issue and review replies remain stopped.
