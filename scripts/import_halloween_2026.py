#!/usr/bin/env python3
"""Safely install the owner-approved Halloween website ZIP into this repo."""
from pathlib import Path, PurePosixPath
import sys, zipfile

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_FILES = {"halloween.html", "halloween.css", "halloween.js",
    "og/lil-gwapz-halloween-2026.jpg"}
ALLOWED_DOWNLOADS = {
    "downloads/Lil_Gwapz_Halloween_2026_Telegram_20.zip",
    "downloads/Lil_Gwapz_Halloween_2026_Exclusive_HQ_20.zip",
}

def accepted(name):
    p = PurePosixPath(name)
    if p.is_absolute() or ".." in p.parts or str(p) != name:
        return False
    return (name in ALLOWED_FILES or name in ALLOWED_DOWNLOADS
            or name.startswith("assets/halloween-2026/"))

def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python scripts/import_halloween_2026.py /path/to/Lil_Gwapz_Halloween_2026_Website_Deploy_Kit.zip")
    archive = Path(sys.argv[1]).expanduser().resolve()
    if not archive.is_file():
        sys.exit(f"Missing kit: {archive}")
    with zipfile.ZipFile(archive) as z:
        if z.testzip() is not None:
            sys.exit("ERROR: corrupted website ZIP")
        sources = [entry for entry in z.infolist()
                   if not entry.is_dir() and accepted(entry.filename)]
        if not sources or not any(x.filename == "halloween.html" for x in sources):
            sys.exit("ERROR: not a valid Lil Gwapz Halloween website kit")
        for info in z.infolist():
            if info.is_dir() or info.filename in ("DEPLOY_README.md", "HOME_PAGE_LINK_SNIPPET.html"):
                continue
            if not accepted(info.filename):
                sys.exit(f"ERROR: unexpected/unsafe path in ZIP: {info.filename}")
            if (info.external_attr >> 16) & 0o170000 == 0o120000:
                sys.exit("ERROR: symlinks forbidden")
        for entry in sources:
            dest = ROOT / entry.filename
            dest.parent.mkdir(parents=True, exist_ok=True)
            # Import only new seasonal assets. Never overwrite existing files.
            if dest.exists():
                sys.exit(f"ERROR: already exists (will not overwrite): {entry.filename}")
            with z.open(entry) as source, dest.open("wb") as out:
                import shutil
                shutil.copyfileobj(source, out)
    print(f"Imported {len(sources)} seasonal files. Next: python scripts/verify_halloween_assets.py")
if __name__ == "__main__":
    main()
