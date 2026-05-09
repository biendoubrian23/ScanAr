"""Rend les pages du PDF en PNG pour vérification visuelle."""
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "ScanAR_Bible.pdf"
OUT = ROOT / "scripts" / "_bible_assets" / "preview"
OUT.mkdir(parents=True, exist_ok=True)

doc = fitz.open(PDF)
for i, page in enumerate(doc, start=1):
    pix = page.get_pixmap(dpi=110)
    p = OUT / f"page_{i:02d}.png"
    pix.save(p)
    print(f"page {i:02d}  {pix.width}x{pix.height}  {p}")
doc.close()
