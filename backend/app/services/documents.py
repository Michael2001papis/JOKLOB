from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader


def extract_text(path: Path, mime: str, original: str) -> str:
    suf = path.suffix.lower()
    try:
        if suf == ".txt" or mime.startswith("text/"):
            return path.read_text(encoding="utf-8", errors="replace")[:200_000]
        if suf == ".csv":
            return path.read_text(encoding="utf-8", errors="replace")[:200_000]
        if suf == ".pdf":
            reader = PdfReader(str(path))
            parts = []
            for i, page in enumerate(reader.pages[:40]):
                parts.append(f"--- page {i+1} ---\n{page.extract_text() or ''}")
            return "\n".join(parts)[:200_000]
        if suf == ".docx":
            from docx import Document as Docx

            doc = Docx(str(path))
            return "\n".join(p.text for p in doc.paragraphs)[:200_000]
        if suf in {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}:
            return (
                "[Scanned image stored. Optical character recognition is not bundled in this build; "
                "add notes manually or paste transcribed formulas. No text was invented.]"
            )
        return f"[No text extractor for {original}]"
    except Exception as e:
        return f"[Extraction failed: {e}]"
