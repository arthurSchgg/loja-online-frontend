#!/usr/bin/env python3
"""Static repository guard; does not claim tests of features not yet imported."""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
required = [".github/CODEOWNERS", ".github/workflows/ci.yml",
            "docs/GIT-FLOW.md", "docs/SECURITY-PERMISSIONS.md",
            ".github/PULL_REQUEST_TEMPLATE.md"]
for name in required:
    if not (root / name).is_file():
        raise SystemExit(f"Missing governance file: {name}")
if (root / ".env").exists():
    raise SystemExit("Do not commit local .env files")
if (root / "dist").exists():
    raise SystemExit("Do not version generated dist/ assets")
for path in root.rglob("*"):
    if path.is_file() and ".git" not in path.parts:
        if path.suffix.lower() in {".pem", ".p12", ".key"}:
            raise SystemExit(f"Private credential material forbidden: {path.relative_to(root)}")
print("Repository governance and secret file policy: PASS")
