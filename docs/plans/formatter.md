# Pretty Formatter repair

Authoritative plan, 8 September 2026. Baseline d3919a8, clean repository. Outcome: activation works; settings update per document; supported parser output preserves code; failures never replace source with partial output.

Use the canonical Twig Language 2 core and bundled Prettier with explicit parser IDs. Keep legacy template expression spans opaque and format only surrounding HTML. QML receives indentation only. Remove inaccurate unsupported-language claims instead of guessing those languages. Preserve original extension ID and configuration namespace. Deprecate unused PrettyDiff options visibly.

Evidence: all 26 issues, 4 PRs, 32 conversation comments and 13 Marketplace reviews were read in the three-repository audit. Regressions in test/multiformat.test.js cover the specific source failures and integration controls. The shared Twig corpus and official PHP oracle remain required. test/extension/suite.cjs tests the actual packaged bundle, including activation without an explicit activate call, language parsers, live disable/ignore, tabs and format on save.

Verification: npm ci; composer install --working-dir=test/php; npm test; npm run test:oracle; npm run package; packaged minimum and stable VS Code tests; npm audit; GitHub CI; public Marketplace artifact readback. Never run workspace code/plugins. Existing versions remain available for rollback. Publish a new corrective version instead of rewriting release history.

Limits: missing source snippets cannot be reproduced exactly; unsupported dialects need parser work before restoration. See README for each language's actual guarantee. Do not claim every possible bug is fixed.
