# Scaffold

    graph/graph.json                  source of truth: nodes, edges, scopes
    CLAUDE.md                         constraints Claude Code reads automatically
    scripts/validate_graph.py         acyclicity, transitive reduction, frontmatter consistency
    scripts/test_c.py                 compiles and runs every C block in every article
    content/<node-id>/index.md        one article per node
    content/<node-id>/figures/*.svg   diagrams

Checks:

    python3 scripts/validate_graph.py
    python3 scripts/test_c.py

Both exit non-zero on failure. Wire them into CI and into a pre-commit hook.