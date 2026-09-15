#!/usr/bin/env python3
"""Apply FILENAME_PATTERN from repo spec to all non-ignored files in the repo."""
from __future__ import annotations
import re
import subprocess
import sys
from pathlib import Path

repo = Path("/home/adi/Code/other/skill-high")

IGNORE_DIRS = {".git", ".next", ".vercel", ".data", "node_modules", ".venv", "venv", ".pytest_cache", ".impeccable", ".codex", "__pycache__"}
IGNORE_EXTS = {".pyc", ".pyo", ".lock", ".log", ".bak", ".sql~"}

def should_ignore(path: Path) -> bool:
    parts = path.parts
    if any(p in IGNORE_DIRS for p in parts):
        return True
    if path.suffix in IGNORE_EXTS:
        return True
    return False

def find_spec_path(repo: Path) -> Path | None:
    for name in ["SKILL.md", "AGENTS.md", "CLAUDE.md", "README.md"]:
        p = repo / name
        if p.exists():
            return p
    # fallback: walk for any file containing FILENAME_PATTERN
    for p in repo.rglob("*"):
        if p.is_file() and p.name.endswith((".md", ".txt")):
            try:
                if "FILENAME_PATTERN" in p.read_text(encoding="utf-8", errors="ignore"):
                    return p
            except OSError:
                pass
    return None

spec = find_spec_path(repo)
if spec is None:
    print("No spec file with FILENAME_PATTERN found — nothing to do.", file=sys.stderr)
    sys.exit(0)

text = spec.read_text(encoding="utf-8", errors="ignore")
m = re.search(r"FILENAME_PATTERN\s*[:=]\s*['\"]?(.*?)['\"]?\s*(?:\n|$)", text, re.I | re.M)
pattern_src = m.group(1).strip() if m else None
use_regex = bool(re.search(r"regex\s*[:=]\s*(True|true)\s*", text, re.I))

kwargs: dict[str, object] = {}
if use_regex:
    kwargs["regex"] = True

print(f"Spec: {spec}", file=sys.stderr)
print(f"FILENAME_PATTERN: {pattern_src!r}", file=sys.stderr)
print(f"regex flag: {use_regex}", file=sys.stderr)

if not pattern_src:
    print("No FILENAME_PATTERN defined — nothing to do.", file=sys.stderr)
    sys.exit(0)

try:
    compiled = re.compile(pattern_src) if use_regex else re.compile(re.escape(pattern_src))
except re.error as e:
    print(f"FILENAME_PATTERN regex error: {e}", file=sys.stderr)
    sys.exit(2)

files = sorted(p for p in repo.rglob("*") if p.is_file() and not should_ignore(p))

renames: list[tuple[Path, Path]] = []
for f in files:
    # Apply pattern to full filename
    if not compiled.fullmatch(f.name):
        continue
    # Title extraction: prefer group(1) if present, else stem without extension
    try:
        mm = compiled.fullmatch(f.name)
        if mm and mm.lastindex:
            title = mm.group(1).strip()
        else:
            title = f.stem
    except Exception:
        title = f.stem
    slug = re.sub(r"[^a-z0-9]+", "-", title.strip().lower()).strip("-")
    ext = f.suffix
    new_name = slug + ext
    if new_name != f.name:
        target = f.parent / new_name
        if not target.exists():
            renames.append((f, target))

if not renames:
    print("All matched files already compliant or no matches.", file=sys.stderr)
    sys.exit(0)

for old, new in renames:
    print(f"RENAME {old.relative_to(repo)}  ->  {new.relative_to(repo)}")
    old.rename(new)

print(f"\nTotal renames: {len(renames)}", file=sys.stderr)
subprocess.run(["git", "add", "-A"], cwd=repo, check=False)
print("Staged renamed files.", file=sys.stderr)
