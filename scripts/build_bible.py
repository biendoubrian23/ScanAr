"""Génère la bible PDF ScanAR — stratégie GTM + pricing + roadmap."""
from __future__ import annotations

import os
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent.parent
OUT_PDF = ROOT / "ScanAR_Bible.pdf"
ASSETS = ROOT / "scripts" / "_bible_assets"
ASSETS.mkdir(parents=True, exist_ok=True)

# ───────── Police Unicode (DejaVu Sans bundled avec matplotlib) ─────────
_FONTS_DIR = Path(matplotlib.__file__).parent / "mpl-data" / "fonts" / "ttf"
pdfmetrics.registerFont(TTFont("DejaVu", str(_FONTS_DIR / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", str(_FONTS_DIR / "DejaVuSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Italic", str(_FONTS_DIR / "DejaVuSans-Oblique.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-BoldItalic", str(_FONTS_DIR / "DejaVuSans-BoldOblique.ttf")))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold",
                   italic="DejaVu-Italic", boldItalic="DejaVu-BoldItalic")
FONT = "DejaVu"
FONT_BOLD = "DejaVu-Bold"
FONT_ITALIC = "DejaVu-Italic"


# ───────── Helpers : markers colorés (remplacent les emojis carrés) ─────────
def dot(color_hex: str) -> str:
    return f'<font color="{color_hex}">●</font>'

def status(level: str, label: str) -> str:
    """level ∈ {ok, warn, mid, danger, kill}. Renvoie une chaîne HTML pour Paragraph."""
    palette = {
        "ok": "#1ABC9C",       # vert — facile
        "mid": "#FFB400",      # jaune — moyen
        "warn": "#FF8C00",     # orange — dur
        "danger": "#FF3B6C",   # rouge — bloquant / tueur
        "kill": "#C0392B",     # rouge foncé
    }
    return f'<font color="{palette[level]}"><b>●</b></font> {label}'

def x_red() -> str:
    return '<font color="#FF3B6C"><b>✗</b></font>'

def check_green() -> str:
    return '<font color="#1ABC9C"><b>✓</b></font>'

# ───────── Palette ─────────
PRIMARY = colors.HexColor("#0F1226")        # nuit profonde
ACCENT = colors.HexColor("#6C5CE7")         # violet AR
ACCENT2 = colors.HexColor("#00D4FF")        # cyan
DANGER = colors.HexColor("#FF3B6C")
OK = colors.HexColor("#1ABC9C")
WARN = colors.HexColor("#FFB400")
GREY = colors.HexColor("#6B7280")
LIGHT = colors.HexColor("#F4F5FB")
INK = colors.HexColor("#1A1A2E")

# ───────── Charts ─────────
plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "axes.edgecolor": "#1A1A2E",
    "axes.labelcolor": "#1A1A2E",
    "xtick.color": "#1A1A2E",
    "ytick.color": "#1A1A2E",
    "axes.titleweight": "bold",
})


def save_chart(fig, name: str) -> Path:
    p = ASSETS / name
    fig.savefig(p, dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return p


def chart_revenue_targets() -> Path:
    """Combien de clients à quel ARPU pour atteindre 5k / 25k / 50k / 100k MRR."""
    arpus = np.array([29, 49, 79, 149, 299])
    targets = [5000, 25000, 50000, 100000]
    labels = ["29 €", "49 €", "79 €", "149 €", "299 €"]

    fig, ax = plt.subplots(figsize=(7.5, 3.4))
    width = 0.18
    x = np.arange(len(arpus))
    palette = ["#6C5CE7", "#00D4FF", "#FFB400", "#FF3B6C"]
    for i, t in enumerate(targets):
        clients = np.ceil(t / arpus).astype(int)
        bars = ax.bar(x + (i - 1.5) * width, clients, width,
                      label=f"{t/1000:.0f} k€/mois",
                      color=palette[i], edgecolor="white", linewidth=0.6)
        for b, v in zip(bars, clients):
            ax.text(b.get_x() + b.get_width() / 2, b.get_height() * 1.02,
                    f"{v}", ha="center", va="bottom", fontsize=7, color="#1A1A2E")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylabel("Nombre de clients payants")
    ax.set_title("Combien de clients pour atteindre chaque palier MRR", fontsize=11)
    ax.legend(frameon=False, fontsize=8, ncol=4, loc="upper center", bbox_to_anchor=(0.5, -0.18))
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="y", alpha=0.25)
    return save_chart(fig, "chart_revenue.png")


def chart_market_size() -> Path:
    """Estimation taille de marché par segment Toulouse + national."""
    segments = ["Restos\nindé.", "Artisans\nbijoutiers", "Fleuristes\nhdg", "Décor.\nintérieur",
                "Antiq./\nVintage", "E-com\nShopify FR", "Tatoueurs"]
    toulouse = [3000, 200, 100, 180, 120, 250, 150]
    france = [175000, 8500, 13500, 9500, 6000, 28000, 6500]

    fig, ax = plt.subplots(figsize=(7.5, 3.2))
    x = np.arange(len(segments))
    ax.bar(x - 0.2, toulouse, 0.4, label="Toulouse / métropole", color="#6C5CE7")
    ax.bar(x + 0.2, [f / 100 for f in france], 0.4, label="France (÷100)", color="#00D4FF")
    ax.set_xticks(x)
    ax.set_xticklabels(segments, fontsize=8)
    ax.set_ylabel("Cibles potentielles")
    ax.set_title("Taille de marché par verticale", fontsize=11)
    ax.legend(frameon=False, fontsize=8, loc="upper right")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="y", alpha=0.25)
    return save_chart(fig, "chart_market.png")


def chart_funnel_90d() -> Path:
    """Funnel attendu sur 90 jours."""
    steps = ["Cibles\ncontactées", "Démos\nfaites", "Essais\ngratuits", "Clients\npayants"]
    values = [600, 90, 45, 18]
    fig, ax = plt.subplots(figsize=(7.5, 2.8))
    bars = ax.barh(steps[::-1], values[::-1],
                   color=["#1ABC9C", "#FFB400", "#00D4FF", "#6C5CE7"])
    for b, v in zip(bars, values[::-1]):
        ax.text(b.get_width() + max(values) * 0.01, b.get_y() + b.get_height() / 2,
                f"{v}", va="center", fontsize=10, color="#1A1A2E", weight="bold")
    ax.set_title("Funnel cible sur 90 jours (réaliste, solo founder)", fontsize=11)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["bottom"].set_visible(False)
    ax.set_xticks([])
    return save_chart(fig, "chart_funnel.png")


def chart_growth_curve() -> Path:
    """Courbe de progression MRR M1→M18 — réaliste et ambitieux."""
    months = np.arange(1, 19)
    realistic = np.array([0.2, 0.6, 1.4, 2.5, 3.8, 5.2, 7.0, 9.0, 11.5, 14, 17, 20, 24, 28, 33, 38, 44, 50])
    ambitious = np.array([0.3, 1.0, 2.5, 4.5, 7.0, 10, 14, 19, 25, 32, 40, 50, 62, 75, 88, 100, 112, 125])
    fig, ax = plt.subplots(figsize=(7.5, 3.2))
    ax.plot(months, realistic, marker="o", color="#6C5CE7", linewidth=2.2, label="Scénario réaliste")
    ax.plot(months, ambitious, marker="s", color="#FF3B6C", linewidth=2.2, label="Scénario ambitieux")
    ax.fill_between(months, realistic, ambitious, alpha=0.08, color="#6C5CE7")
    for y, label in [(5, "5 k€"), (25, "25 k€"), (50, "50 k€"), (100, "100 k€")]:
        ax.axhline(y, color="#6B7280", linestyle="--", linewidth=0.6, alpha=0.6)
        ax.text(18.2, y, label, va="center", fontsize=8, color="#6B7280")
    ax.set_xlabel("Mois")
    ax.set_ylabel("MRR (k€)")
    ax.set_title("Trajectoire MRR — scénarios sur 18 mois", fontsize=11)
    ax.legend(frameon=False, fontsize=9)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="y", alpha=0.25)
    return save_chart(fig, "chart_growth.png")


def chart_cogs() -> Path:
    """Coûts par modèle 3D généré vs prix."""
    items = ["Coût GPU\n(self-host)", "Coût GPU\n(RunPod)", "Stockage\nR2/Supabase", "Bande passante",
             "Prix moyen\nclient (par modèle)"]
    vals = [0.04, 0.18, 0.005, 0.01, 2.50]
    fig, ax = plt.subplots(figsize=(7.5, 2.8))
    palette = ["#1ABC9C", "#FFB400", "#00D4FF", "#6C5CE7", "#FF3B6C"]
    bars = ax.bar(items, vals, color=palette)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, b.get_height() * 1.02,
                f"{v} €", ha="center", va="bottom", fontsize=9, weight="bold")
    ax.set_ylabel("€ / modèle")
    ax.set_title("Économie unitaire par modèle 3D — marge brute > 90%", fontsize=11)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    return save_chart(fig, "chart_cogs.png")


# ───────── Doc ─────────
styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName=FONT_BOLD,
                    fontSize=22, leading=26, textColor=PRIMARY, spaceAfter=4)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName=FONT_BOLD,
                    fontSize=14, leading=18, textColor=ACCENT, spaceBefore=10, spaceAfter=6)
H3 = ParagraphStyle("H3", parent=styles["Heading3"], fontName=FONT_BOLD,
                    fontSize=11, leading=14, textColor=PRIMARY, spaceBefore=6, spaceAfter=2)
BODY = ParagraphStyle("Body", parent=styles["BodyText"], fontName=FONT,
                      fontSize=9.5, leading=13, textColor=INK, alignment=TA_LEFT, spaceAfter=4)
BODY_S = ParagraphStyle("BodyS", parent=BODY, fontSize=8.5, leading=11)
BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=12, bulletIndent=2, spaceAfter=2)
QUOTE = ParagraphStyle("Quote", parent=BODY, fontSize=10.5, leading=14, textColor=PRIMARY,
                       leftIndent=10, rightIndent=10, fontName=FONT_ITALIC,
                       borderPadding=6, backColor=LIGHT, spaceAfter=8)
CHIP_OK = ParagraphStyle("ChipOK", parent=BODY_S, textColor=colors.white, alignment=TA_CENTER,
                         backColor=OK, borderPadding=2)
COVER_TITLE = ParagraphStyle("CT", parent=H1, fontSize=44, leading=50, textColor=colors.white)
COVER_SUB = ParagraphStyle("CS", parent=BODY, fontSize=14, leading=20, textColor=colors.white,
                           alignment=TA_LEFT)
COVER_TAG = ParagraphStyle("CTag", parent=BODY_S, textColor=ACCENT2, fontSize=10)


def draw_page_chrome(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PRIMARY)
    canvas.rect(0, A4[1] - 0.9 * cm, A4[0], 0.9 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont(FONT_BOLD, 9)
    canvas.drawString(1.5 * cm, A4[1] - 0.6 * cm, "ScanAR — La Bible")
    canvas.setFillColor(ACCENT2)
    canvas.setFont(FONT, 8)
    canvas.drawRightString(A4[0] - 1.5 * cm, A4[1] - 0.6 * cm,
                           "Stratégie GTM • Pricing • Roadmap • 2026")
    canvas.setFillColor(GREY)
    canvas.setFont(FONT, 7.5)
    canvas.drawCentredString(A4[0] / 2, 0.7 * cm, f"Page {doc.page} • Confidentiel — usage interne")
    canvas.restoreState()


def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PRIMARY)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    # diagonal accents
    canvas.setFillColor(ACCENT)
    canvas.circle(A4[0] - 2 * cm, A4[1] - 4 * cm, 3.2 * cm, fill=1, stroke=0)
    canvas.setFillColor(ACCENT2)
    canvas.circle(2 * cm, 5 * cm, 2.4 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#1A1F4D"))
    canvas.rect(0, 7 * cm, A4[0], 0.05 * cm, fill=1, stroke=0)
    canvas.restoreState()


# ───────── Layout ─────────
doc = BaseDocTemplate(str(OUT_PDF), pagesize=A4,
                      leftMargin=1.5 * cm, rightMargin=1.5 * cm,
                      topMargin=1.6 * cm, bottomMargin=1.2 * cm,
                      title="ScanAR — La Bible", author="ScanAR")

cover_frame = Frame(1.5 * cm, 1.5 * cm, A4[0] - 3 * cm, A4[1] - 3 * cm, id="cover")
content_frame = Frame(1.5 * cm, 1.2 * cm, A4[0] - 3 * cm, A4[1] - 2.6 * cm, id="content")

doc.addPageTemplates([
    PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover),
    PageTemplate(id="content", frames=[content_frame], onPage=draw_page_chrome),
])

story = []


def chip(text: str, bg=ACCENT, fg=colors.white) -> Table:
    p = Paragraph(f"<b>{text}</b>", ParagraphStyle("c", parent=BODY_S, textColor=fg, alignment=TA_CENTER))
    t = Table([[p]], colWidths=[3.5 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0, bg),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return t


def make_table(data, col_widths, head_color=PRIMARY, zebra=True, font_size=8.5,
               align="LEFT"):
    """Wrap chaque cellule string en Paragraph pour : (a) interpréter <b>/<i>/<br/>,
    (b) word-wrap automatique. Les cellules non-string (Image, Table, etc.) passent tel quel."""
    align_map = {"LEFT": TA_LEFT, "CENTER": TA_CENTER, "JUSTIFY": TA_JUSTIFY}
    head_style = ParagraphStyle(
        "th", fontName=FONT_BOLD, fontSize=font_size,
        leading=font_size + 2.5, textColor=colors.white,
        alignment=align_map.get(align, TA_LEFT))
    body_style = ParagraphStyle(
        "td", fontName=FONT, fontSize=font_size,
        leading=font_size + 2.8, textColor=INK,
        alignment=align_map.get(align, TA_LEFT))
    wrapped = []
    for r, row in enumerate(data):
        new_row = []
        for cell in row:
            if isinstance(cell, str):
                style = head_style if r == 0 else body_style
                new_row.append(Paragraph(cell, style))
            else:
                new_row.append(cell)
        wrapped.append(new_row)

    t = Table(wrapped, colWidths=col_widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), head_color),
        ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
        ("VALIGN", (0, 1), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, colors.white),
        ("BOX", (0, 0), (-1, -1), 0.4, GREY),
        ("LINEAFTER", (0, 0), (-2, -1), 0.2, colors.HexColor("#D5D7E0")),
    ]
    if zebra:
        for r in range(1, len(wrapped)):
            if r % 2 == 0:
                style.append(("BACKGROUND", (0, r), (-1, r), LIGHT))
    t.setStyle(TableStyle(style))
    return t


# ═════════════════════ COVER ═════════════════════
story.append(Spacer(1, 5 * cm))
story.append(Paragraph("Scan<font color='#00D4FF'>AR</font>", COVER_TITLE))
story.append(Spacer(1, 0.3 * cm))
story.append(Paragraph("La Bible.", COVER_SUB))
story.append(Spacer(1, 0.1 * cm))
story.append(Paragraph("De 0 à 100 k€/mois — sans bullshit.", COVER_SUB))
story.append(Spacer(1, 4 * cm))
story.append(Paragraph("Stratégie commerciale • Pricing • Verticales • Roadmap technique<br/>"
                       "Plan 90 jours • Toulouse first → France → Europe", COVER_TAG))
story.append(Spacer(1, 0.4 * cm))
story.append(Paragraph("Mai 2026 • v1.0 • Confidentiel — Brian Biendou", COVER_TAG))

story.append(NextPageTemplate("content"))
story.append(PageBreak())

# ═════════════════════ 1 — REALITY CHECK ═════════════════════
story.append(Paragraph("1. Reality check — où tu en es vraiment", H1))
story.append(Paragraph("Lis ça avant de te lancer. Pas de flatterie.", BODY_S))
story.append(Spacer(1, 4))

story.append(Paragraph("Ce que tu as réellement", H2))
story.append(Paragraph(
    "ScanAR transforme une <b>photo</b> en <b>modèle 3D</b> via Hunyuan3D, génère un <b>QR code</b> "
    "qui ouvre l'objet en <b>réalité augmentée</b> sur n'importe quel smartphone (iOS/Android, "
    "via model-viewer + USDZ). Pipeline GPU + queue Redis + Supabase. <b>Aucun concurrent grand public "
    "français ne fait ça aussi simplement</b>. C'est le bon angle.", BODY))

story.append(Paragraph("Ce qui ne va pas marcher", H2))
data = [
    [f"{x_red()} Mauvais réflexe", "Pourquoi ça va échouer", "Quoi faire à la place"],
    ["Approcher IKEA / Conforama / Maisons du Monde",
     "Cycles d'achat 12–24 mois. Ils ont des équipes 3D internes ou des contrats Threekit/Vectary à 6 chiffres. Tu vas user 9 mois pour un POC qui finit en Excel.",
     "Reviens-y en année 2 quand tu as 50 logos PME."],
    ["Vouloir faire des maisons / appartements en 3D",
     "Marché saturé (Matterport, Realsee, Giraffe360). Hardware spécialisé, ticket élevé. Pas ton terrain.",
     "Reste sur les <b>objets physiques de moins de 2m</b>."],
    ["Construire 6 mois avant de vendre",
     "Tu vas sur-ingénierer un produit que personne ne veut. Tu n'as pas validé le pricing.",
     "Vends manuellement <b>cette semaine</b> aux 5 premiers restos."],
    ["Pricing à l'usage (crédits) en B2B",
     "Les PME détestent ça. Ils veulent un prix fixe prévisible. Crédits = friction commerciale.",
     "Forfait mensuel fixe + dépassement raisonnable."],
]
story.append(make_table(data, [4.5 * cm, 7 * cm, 6.5 * cm]))

story.append(Spacer(1, 6))
story.append(Paragraph("Vérité brute sur les grandes enseignes", H2))
story.append(Paragraph(
    "<b>IKEA</b> a IKEA Place depuis 2017 (ARKit). Aujourd'hui c'est intégré dans IKEA Kreativ — focus "
    "pièces complètes IA. Ils ont 30+ devs 3D internes. <b>N'y va pas.</b><br/>"
    "<b>Conforama / But / Maisons du Monde</b> n'ont pas d'AR généralisé sur fiche produit, mais leur DSI "
    "n'achètera pas un outil isolé — ils veulent une plateforme PIM/DAM intégrée. <b>Pas pour toi année 1.</b><br/>"
    "<b>Leroy Merlin</b> a son propre app AR (mesurer, projeter peinture). <b>Castorama</b> idem côté UK. "
    "<b>Décathlon</b> a un labo 3D. <b>Carrefour</b> : zéro AR produit.<br/>"
    "<b>→ Conclusion crue : oublie les grandes enseignes la première année.</b> Le piège c'est le prestige. "
    "Tu vas brûler 6 mois pour 0 €.", BODY))

story.append(PageBreak())

# ═════════════════════ 2 — VRAIES CIBLES ═════════════════════
story.append(Paragraph("2. Tes vraies cibles — par ordre d'attaque", H1))
story.append(Paragraph("Classement par <b>(facilité de vente × ticket × volume)</b>. Toulouse first.", BODY_S))
story.append(Spacer(1, 6))
story.append(Image(str(chart_market_size()), width=17 * cm, height=7.2 * cm))

data = [
    ["#", "Verticale", "Toulouse", "France", "Ticket /mois", "Difficulté", "Score"],
    ["1", "Restos indépendants — menu AR", "≈ 3 000", "175 000", "49–79 €", status("ok", "Facile"), "9/10"],
    ["2", "Bijoutiers / horlogers / joailliers", "≈ 200", "8 500", "99–199 €", status("ok", "Facile"), "9/10"],
    ["3", "Fleuristes haut de gamme + mariage", "≈ 100", "13 500", "39–69 €", status("ok", "Facile"), "8/10"],
    ["4", "Décorateurs d'intérieur / home stagers", "≈ 180", "9 500", "149–299 €", status("mid", "Moyen"), "8/10"],
    ["5", "E-commerce Shopify FR (PME)", "—", "28 000+", "29–149 €", status("mid", "Moyen"), "10/10"],
    ["6", "Antiquaires / vintage / brocante pro", "≈ 120", "6 000", "49–99 €", status("ok", "Facile"), "7/10"],
    ["7", "Tatoueurs (one-shot par projet)", "≈ 150", "6 500", "199 €/projet", status("ok", "Facile"), "6/10"],
    ["8", "Galeristes / marchands d'art", "≈ 60", "2 800", "199–499 €", status("mid", "Moyen"), "7/10"],
    ["9", "Cuisinistes franchisés (Mobalpa, Schmidt…)", "≈ 25", "1 500", "299–599 €", status("warn", "Dur"), "7/10"],
    ["10", "Vendeurs auto occasion premium", "≈ 80", "5 000", "199–399 €", status("mid", "Moyen"), "6/10"],
    ["11", "Magasins de sport spé. (vélo, skate…)", "≈ 120", "4 500", "79–149 €", status("mid", "Moyen"), "6/10"],
    ["12", "Boulangeries-pâtisseries premium", "≈ 200", "33 000", "29–49 €", status("ok", "Facile"), "5/10"],
]
story.append(Spacer(1, 6))
story.append(make_table(data, [0.7 * cm, 5.4 * cm, 1.8 * cm, 1.8 * cm, 2.2 * cm, 2.0 * cm, 1.4 * cm],
                        align="LEFT"))

story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>Pourquoi le score E-com Shopify est 10/10 :</b> ils sont ONLINE, on les trouve via leurs sites, "
    "scrapping LinkedIn/SimilarWeb légal. Plug-in Shopify = distribution scale. C'est ton cheval de Troie.",
    QUOTE))

story.append(PageBreak())

# ═════════════════════ 3 — VERTICALES DÉTAILLÉES ═════════════════════
story.append(Paragraph("3. Verticales — pitch + prix + features par métier", H1))
story.append(Spacer(1, 6))

# Restos
story.append(Paragraph("Restaurants indépendants — la pioche", H2))
story.append(Paragraph(
    "<b>Pitch en 1 phrase :</b> « Tes clients scannent ton menu, ils voient leurs plats en 3D photoréaliste "
    "sur leur table avant de commander. Effet wow + Insta gratuit + +12% de tickets moyens (data Threekit "
    "secteur food).»", BODY))
data = [
    ["Pricing", "Pack", "Inclus", "Cible"],
    ["49 €/mois", "Starter Resto", "20 plats AR, QR code menu, 1 langue, stats basiques", "Bistrot, brasserie de quartier"],
    ["99 €/mois", "Pro Resto", "50 plats, multi-langue (3), branding personnalisé, stats /plat", "Resto gastro, pizzeria forte affluence"],
    ["199 €/mois", "Chaîne Resto", "5 établissements, 200 plats, dashboard groupe", "Mini-chaîne / franchisé multi-points"],
    ["299 € one-shot", "Création menu", "Déplacement photo 20 plats + génération + setup", "Résistants au SaaS"],
]
story.append(make_table(data, [2.2 * cm, 2.8 * cm, 8 * cm, 5 * cm]))

story.append(Spacer(1, 4))
story.append(Paragraph("<b>Features à dev en priorité :</b> page menu auto-générée (style Linktree mais 3D), "
                       "TVA/allergènes, intégration Sumup/Lightspeed (V2), traduction auto (EN/ES/IT pour touristes Toulouse).",
                       BODY_S))

# Bijoutiers
story.append(Paragraph("Bijoutiers / horlogers / joailliers — le ticket élevé", H2))
story.append(Paragraph(
    "<b>Pitch :</b> « Ta cliente voit la bague sur sa main avant de venir en boutique. Elle vient avec son "
    "mari et achète. Try-on AR = +28% taux de transformation. »", BODY))
data = [
    ["Pricing", "Pack", "Inclus", "Cible"],
    ["99 €/mois", "Starter Bijoux", "30 pièces, AR placement table", "Bijoutier indé local"],
    ["199 €/mois", "Pro Bijoux", "100 pièces, <b>try-on poignet/doigt</b>, comparateur 2 pièces", "Joaillier moyen"],
    ["599 € one-shot", "Pack mariage", "Collection bague mariage + clip vidéo client", "Pic St-Valentin / mariage"],
]
story.append(make_table(data, [2.2 * cm, 2.8 * cm, 8 * cm, 5 * cm]))
story.append(Spacer(1, 4))
story.append(Paragraph("<b><font color='#FFB400'>⚠</font> Feature critique à ajouter :</b> <b>hand-tracking AR</b> (front camera, MediaPipe Hands "
                       "+ WebXR). Sans ça tu perds face à <i>Reactiv</i> et <i>Perfect Corp</i>. Dev: ~3 semaines.",
                       BODY_S))

# Fleuristes
story.append(Paragraph("Fleuristes premium / mariage", H2))
story.append(Paragraph(
    "<b>Pitch :</b> « Devis mariage à 2 500 €. La mariée doute. Tu lui envoies le bouquet en AR sur ton "
    "lien ScanAR. Elle le pose sur sa table, le voit en vrai. Elle signe. »", BODY))
data = [
    ["Pricing", "Pack", "Inclus"],
    ["39 €/mois", "Starter", "15 modèles, QR sur vitrine, mode événementiel"],
    ["79 €/mois", "Pro", "Catalogue saisonnier (St-Valentin, Mères, Toussaint, Mariage), variantes couleurs"],
    ["199 € /événement", "Mariage one-shot", "5 compositions sur mesure + lien WhatsApp client"],
]
story.append(make_table(data, [2.6 * cm, 3 * cm, 12.2 * cm]))

story.append(PageBreak())

# E-com + autres
story.append(Paragraph("E-commerce Shopify / WooCommerce — le scale", H2))
story.append(Paragraph(
    "<b>Pitch :</b> « Branche ScanAR à ta boutique en 3 minutes. Bouton ‹Voir en AR› auto-injecté sur "
    "chaque fiche produit. +71% des shoppers AR achètent (Shopify data 2024). 14 jours d'essai. »",
    BODY))
data = [
    ["Pricing", "Pack", "Inclus"],
    ["29 €/mois", "Indie", "20 produits, badge AR sur fiche, branding ScanAR"],
    ["79 €/mois", "Growth", "100 produits, white-label, API webhook (auto-gen sur nouveau produit)"],
    ["199 €/mois", "Scale", "500 produits, A/B test bouton AR, analytics conversion"],
    ["sur devis", "Enterprise", "+1000 produits, SLA, support dédié, hébergement EU"],
]
story.append(make_table(data, [2.6 * cm, 3 * cm, 12.2 * cm]))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "<b><font color='#FFB400'>⚠</font> Brique à dev en P0 :</b> <b>Plug-in Shopify officiel</b> (App Store) + Theme App Extension. "
    "Coût dev: 4–6 semaines. ROI: distribution organique gratuite via Shopify App Store + reviews. C'est "
    "l'effet de levier #1.", BODY_S))

# Décorateurs
story.append(Paragraph("Décorateurs d'intérieur / home stagers", H2))
story.append(Paragraph(
    "<b>Pitch :</b> « Tu présentes 3 ambiances à ton client. Plutôt qu'un PDF moodboard, il pose les meubles "
    "en AR chez lui, en taille réelle. Tu signes le devis 2x plus vite. »", BODY))
data = [
    ["Pricing", "Pack", "Inclus"],
    ["149 €/mois", "Solo", "50 meubles/mois, mode mesure cm, partage projet client"],
    ["299 €/mois", "Studio", "Multi-projet, 3 collaborateurs, bibliothèque partagée"],
]
story.append(make_table(data, [2.6 * cm, 3 * cm, 12.2 * cm]))

# Antiquaires
story.append(Paragraph("Antiquaires / brocanteurs / vintage", H2))
story.append(Paragraph(
    "<b>Pitch :</b> « Tu vends sur Selency, Le Bon Coin pro, ta vitrine. Ajoute l'AR sur chaque pièce — "
    "l'acheteur vérifie l'échelle dans son salon avant d'acheter. Zéro retour. »", BODY))
data = [
    ["Pricing", "Pack", "Inclus"],
    ["49 €/mois", "Starter", "30 pièces, mode <b>échelle réelle cm</b>, export QR pour annonce"],
]
story.append(make_table(data, [2.6 * cm, 3 * cm, 12.2 * cm]))

# Tatoueurs
story.append(Paragraph("Tatoueurs — modèle one-shot", H2))
story.append(Paragraph(
    "<b>Pitch :</b> « Le client scanne le QR du flash, voit le tattoo en AR sur sa peau via la caméra "
    "frontale. Tu vends ton flash 2× plus cher. »", BODY))
data = [
    ["Pricing", "Pack", "Inclus"],
    ["199 € /projet", "Flash AR", "1 design transformé en sticker AR + page partage"],
    ["49 €/mois", "Studio", "10 flashs/mois, page studio personnalisée"],
]
story.append(make_table(data, [2.6 * cm, 3 * cm, 12.2 * cm]))

story.append(PageBreak())

# ═════════════════════ 4 — PRICING / CA ═════════════════════
story.append(Paragraph("4. Pricing global et trajectoire de CA", H1))
story.append(Paragraph("Modèle SaaS récurrent + tickets one-shot. Mix MRR + cash early.", BODY_S))

story.append(Spacer(1, 6))
story.append(Paragraph("Grille de prix consolidée", H2))
data = [
    ["Plan", "Prix /mois", "Modèles 3D", "AR features", "Cible primaire"],
    ["Free trial 14j", "0 €", "5", "QR code, branding ScanAR", "Tout le monde"],
    ["Starter", "29 €", "20", "QR, dashboard basique", "PME, e-com indie"],
    ["Pro", "79 €", "100", "White-label, multi-langue, analytics", "Resto, e-com Growth"],
    ["Business", "199 €", "500", "API, webhook, comparateur, try-on", "Joaillier, décorateur, chaîne"],
    ["Enterprise", "sur devis", "1000+", "SLA, hosting EU, support dédié", "Mid-market"],
    ["One-shot Pack", "299–1 499 €", "20–200", "Setup pro, déplacement, livraison", "Allergiques au SaaS"],
]
story.append(make_table(data, [2.7 * cm, 2.4 * cm, 2 * cm, 5.4 * cm, 4.5 * cm]))

story.append(Spacer(1, 8))
story.append(Paragraph("Combien de clients pour atteindre tes objectifs", H2))
story.append(Image(str(chart_revenue_targets()), width=17 * cm, height=7.6 * cm))

story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>Lecture rapide :</b> pour <b>5 k€/mois MRR</b>, tu as besoin de ~63 clients à 79 € OU 102 à 49 € OU "
    "17 à 299 €. Pour <b>50 k€</b>, ~633 clients à 79 € — pas atteignable seul, faudra un commercial.<br/>"
    "<b>Mix réaliste à 50 k€/mois :</b> 200 Starter + 250 Pro + 50 Business + 5 Enterprise (à ~3 k€) "
    "= ≈ 56 k€/mois. <b>500 clients payants en 18 mois.</b> C'est dur mais faisable.", BODY))

story.append(PageBreak())

story.append(Paragraph("Trajectoire MRR sur 18 mois", H2))
story.append(Image(str(chart_growth_curve()), width=17 * cm, height=7.5 * cm))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>Scénario réaliste :</b> tu atteins 5 k€/mois en mois 6, 25 k€ en mois 13, 50 k€ en mois 18. "
    "À 5 k€/mois tu peux quitter ton job actuel. À 25 k€ tu recrutes ton 1er commercial. <br/>"
    "<b>Scénario ambitieux :</b> nécessite plug-in Shopify + 1 vidéo TikTok virale (>500k vues) + 1 deal "
    "chaîne franchisée. Probabilité ~25%. Ne pas planifier dessus, mais s'y préparer.", BODY))

story.append(Spacer(1, 8))
story.append(Paragraph("Économie unitaire — pourquoi le modèle scale", H2))
story.append(Image(str(chart_cogs()), width=17 * cm, height=7 * cm))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "<b>Marge brute >90%</b> sur self-host GPU (RTX 4090 ~600€/mois flat). En cloud RunPod, marge ~85%. "
    "Tu peux te permettre d'être agressif sur le prix les 12 premiers mois.", BODY_S))

story.append(PageBreak())

# ═════════════════════ 5 — PLAN 90 JOURS ═════════════════════
story.append(Paragraph("5. Plan d'attaque 90 jours — exécution", H1))
story.append(Paragraph("Ton job pendant 90 jours : <b>vendre, pas coder</b>. Tu codes le strict minimum.", BODY_S))

story.append(Spacer(1, 6))
story.append(Image(str(chart_funnel_90d()), width=17 * cm, height=6.5 * cm))

story.append(Paragraph("Mois 1 — Toulouse, terrain dur", H2))
data = [
    ["Semaine", "Action", "Outils", "KPI cible"],
    ["S1", "Liste 200 restos Toulouse (quartiers Capitole, Carmes, St-Cyprien, St-Aubin) via Google Maps + Pages Jaunes",
     "Google Maps Scraper / PhantomBuster", "200 prospects qualifiés"],
    ["S1", "Génère 5 démos préfaites pour 5 plats classiques (cassoulet, magret, pizza, burger, dessert)",
     "Ton produit", "5 démos prêtes"],
    ["S2", "Démarchage physique 20 restos/jour, lundi-jeudi 14h-17h (creux service)",
     "Tablette + démo, carte de visite", "80 visites, 15 démos faites"],
    ["S2", "Crée landing page conversion (1 vidéo + 3 démos + form Calendly)",
     "Webflow / Framer / ton Next.js", "1 page live"],
    ["S3", "Closing : 5 restos en pack 1er mois gratuit (Trojan horse)",
     "Stripe + Notion CRM", "5 clients pilote"],
    ["S4", "Itération produit selon feedback. Cas d'usage témoignage vidéo.",
     "iPhone, CapCut", "1 vidéo testimonial"],
]
story.append(make_table(data, [1.2 * cm, 8.5 * cm, 4 * cm, 3.3 * cm]))

story.append(Paragraph("Mois 2 — Inbound Toulouse + verticales premium", H2))
data = [
    ["Semaine", "Action", "KPI"],
    ["S5", "TikTok : 3 vidéos/sem (avant/après plat AR, témoignage resto, hot take ‹les restos sans AR sont morts›)",
     "3 vidéos/sem, 10k vues cumulées"],
    ["S5-6", "DM Instagram : 30 bijoutiers + 30 fleuristes Toulouse + Bordeaux + Montpellier",
     "60 DM, 8 démos planifiées"],
    ["S6", "Pack St-Valentin / Fête des Mères pour fleuristes (pricing événementiel)", "5 fleuristes payants"],
    ["S7", "Lance sur ProductHunt (en anglais, viser top 5 du jour)", "300 inscrits trial"],
    ["S8", "Partenariat 1 agence digital Toulouse (Sutsu, Niji, Wax, etc.) — 20% revshare", "1 partenariat signé"],
]
story.append(make_table(data, [1.2 * cm, 11.5 * cm, 4.3 * cm]))

story.append(PageBreak())

story.append(Paragraph("Mois 3 — Distribution scalable", H2))
data = [
    ["Semaine", "Action", "KPI"],
    ["S9-11", "<b>Plug-in Shopify v1</b> (priorité absolue) : Theme App Extension + bouton AR auto",
     "Plug-in soumis App Store"],
    ["S10", "Soumission listing Shopify App Store + Wix App Market", "Listing live"],
    ["S11", "Cold email 500 e-com FR via Apollo.io (filtre Shopify + secteur déco/mode/food)",
     "20 démos planifiées"],
    ["S12", "Bilan : ajustement pricing si <30% conversion trial→paid", "≥ 18 clients payants"],
]
story.append(make_table(data, [1.2 * cm, 11.5 * cm, 4.3 * cm]))

story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>Cible 90 jours :</b> 18 clients payants × ARPU 65 € = <b>1 170 € MRR</b>. Pas glamour mais c'est "
    "la traction qu'un VC ou un client B2B veut voir. À mois 6 tu doubles facilement (effet cumulatif inbound + "
    "App Store + bouche-à-oreille).", QUOTE))

# ═════════════════════ 6 — OUTBOUND / PITCH ═════════════════════
story.append(Paragraph("6. Comment approcher — scripts de vente", H1))

story.append(Paragraph("Démarchage physique resto (le plus efficace)", H2))
story.append(Paragraph(
    "<b>Timing :</b> mardi-jeudi, 14h30-17h (entre services).<br/>"
    "<b>Tenue :</b> propre, pas costume (ils détestent les commerciaux). T-shirt ScanAR + jean.<br/>"
    "<b>Ouverture (15s) :</b> « Bonjour, je suis Brian, je bosse à Toulouse sur une appli qui transforme "
    "tes plats en 3D pour que tes clients les voient en réalité augmentée sur leur table. Tiens regarde "
    "(je sors le téléphone, je scanne mon QR, je pose un cassoulet sur SA table). Ça t'intéresse 5 min ? »<br/>"
    "<b>Closer :</b> « Premier mois gratuit, je crée tes 5 plats stars cette semaine, tu vois si ça "
    "ramène du monde. Si oui, 49€/mois ; sinon tu arrêtes. » <br/>"
    "<b>Pourquoi ça marche :</b> tactile, démo réelle sur SA table, risque zéro pour lui.", BODY))

story.append(Paragraph("DM Instagram bijoutier / fleuriste", H2))
story.append(Paragraph(
    "<i>« Salut [Prénom], super collection [pièce vue dans un post récent]. J'ai créé pour des bijoutiers "
    "un outil qui montre la pièce en AR sur la main de tes clientes via leur tél (regarde la démo : [lien]). "
    "+28% de conversion en moyenne. Je peux t'en faire 3 gratuites pour tester ? »</i><br/>"
    "<b>Taux de réponse attendu :</b> 12–18% si message personnalisé. <b>Taux conversion DM→client :</b> 6–10%.",
    BODY))

story.append(Paragraph("Cold email e-commerce Shopify", H2))
story.append(Paragraph(
    "<b>Sujet :</b> Voir [Marque] en AR — démo 60s<br/>"
    "<b>Corps (5 lignes max) :</b><br/>"
    "« Salut [Prénom],<br/>"
    "J'ai pris ton produit [X] et l'ai mis en AR : [lien démo perso].<br/>"
    "Tes clients pourraient le poser chez eux avant d'acheter. +71% de conversion sur produits AR (Shopify).<br/>"
    "Si t'aimes, on fait pareil sur ton catalogue en 24h. 14j gratuits, sans CB.<br/>"
    "Brian — ScanAR (Toulouse) »<br/>"
    "<b>Trick :</b> tu fais la démo personnalisée AVANT le mail. Ça transforme.", BODY))

story.append(PageBreak())

# ═════════════════════ 7 — TIKTOK / CONTENU ═════════════════════
story.append(Paragraph("7. TikTok / Reels / contenu — le levier gratuit", H1))
story.append(Paragraph("Solo founder + 0 budget pub = TikTok est ton levier #1. Vise <b>1 vidéo virale "
                       "tous les 30 jours</b>, pas plus. Le reste = volume régulier.", BODY_S))

story.append(Paragraph("Format & cadence", H2))
data = [
    ["Format", "Durée", "Cadence", "Plateformes", "Pourquoi"],
    ["Avant/Après image → AR", "15-30 s", "2/semaine", "TikTok, Reels, Shorts", "Wow visuel = scroll-stop"],
    ["Témoignage client en boutique", "30-45 s", "1/semaine", "TikTok, LinkedIn", "Preuve sociale"],
    ["Hot take / opinion crue", "60 s max", "1/semaine", "TikTok, Twitter/X", "Algo TikTok adore le débat"],
    ["Behind the scene (build in public)", "30 s", "1/semaine", "X, LinkedIn, Threads", "Audience tech + investisseurs"],
]
story.append(make_table(data, [4.2 * cm, 1.8 * cm, 2 * cm, 4 * cm, 5 * cm]))

story.append(Paragraph("20 hooks à recycler (1ère seconde de la vidéo)", H2))
hooks = [
    "« Si t'es resto en 2026 et t'as pas ÇA, t'es mort. »",
    "« J'ai testé l'AR sur le menu d'un resto, +35% de plats vendus en 1 semaine. »",
    "« Les bijoutiers qui font ça vendent 2x plus. »",
    "« Cette appli transforme une photo en 3D en 90 secondes. Démo : »",
    "« IKEA a payé 800k€ pour ça. Je le fais à 49€/mois. »",
    "« Comment vendre 2x plus sur Shopify sans changer ton produit. »",
    "« Le seul outil que tous les fleuristes premium devraient avoir. »",
    "« J'ai bâti une boîte AR à Toulouse, voici mon MRR mois par mois (build in public). »",
    "« Ton menu PDF est mort. Voici ce qui le remplace. »",
    "« Avant : photo plate. Après : (clip AR). »",
    "« Ce que les agences te facturent 5 000€, tu peux le faire toi-même en 2 min. »",
    "« Pourquoi 9 e-commerce sur 10 vont passer à l'AR avant 2027. »",
    "« Les antiquaires qui font ça vendent en 3 jours au lieu de 3 mois. »",
    "« Ma petite boîte toulousaine a 1 mois pour battre Threekit. »",
    "« Le pitch que j'ai utilisé pour signer 5 restos en 2 jours. »",
    "« J'envoie mon QR code à 100 e-commerce. Voici la réponse. »",
    "« Le resto qui a doublé son CA en 6 semaines avec ÇA. »",
    "« Pourquoi Apple va tuer l'AR e-commerce d'ici 2 ans (et pourquoi je m'en fous). »",
    "« Mon coût pour générer un modèle 3D : 4 centimes. Mon prix : 2,50€. »",
    "« Le SaaS le plus simple à vendre en France en ce moment. »",
]
for h in hooks:
    story.append(Paragraph(f"• {h}", BULLET))

story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>Stats à viser à 6 mois :</b> 8k followers TikTok, 1 vidéo >300k vues, 50 inscrits trial /mois "
    "via TikTok. <b>Coût :</b> 0€ + 1h/jour (montage CapCut + tournage iPhone).", QUOTE))

story.append(PageBreak())

# ═════════════════════ 8 — FEATURES À DEV ═════════════════════
story.append(Paragraph("8. Roadmap technique alignée business", H1))
story.append(Paragraph("Ne dev <b>QUE</b> ce qui débloque une vente. Tout le reste attend.", BODY_S))

story.append(Spacer(1, 6))
data = [
    ["Priorité", "Feature", "Verticale débloquée", "Effort", "Revenu débloqué (12 mois)"],
    ["P0", "Page menu AR auto-générée (Linktree-like)", "Restos", "1 sem", "+ 200 clients × 49€ = 9.8k€/mois"],
    ["P0", "<b>Plug-in Shopify</b> (Theme App Ext.)", "E-commerce", "4-6 sem", "+ 250 clients × 65€ = 16k€/mois"],
    ["P0", "Mode <b>échelle réelle cm</b> (calibration AR)", "Antiquaires, déco, vintage", "1 sem", "+ 80 clients × 89€ = 7k€/mois"],
    ["P1", "<b>Try-on AR poignet/doigt</b> (MediaPipe + WebXR)", "Bijoutiers, horlogers", "3 sem", "+ 60 clients × 149€ = 9k€/mois"],
    ["P1", "White-label (custom domain + logo)", "E-com Growth, agences", "1 sem", "Upsell Pro→Business +60€"],
    ["P1", "API + webhook (auto-gen sur nouveau produit)", "E-com volume, mid-market", "2 sem", "+ Enterprise tier"],
    ["P1", "Multi-langue auto (DeepL)", "Restos zone touristique", "3 jours", "+ ARPU 49→79€"],
    ["P2", "Comparateur 2 modèles côte à côte", "Bijoutiers, déco", "1 sem", "Réduit churn"],
    ["P2", "Mode AR sur peau (face/body tracker)", "Tatoueurs, cosmétique", "3 sem", "Nouveau marché"],
    ["P2", "Dashboard groupe multi-établissements", "Chaînes, franchisés", "2 sem", "Tier Business"],
    ["P3", "Intégration POS (Lightspeed, Sumup)", "Restos forte conversion", "4 sem", "Upsell + lock-in"],
    ["P3", "Retouche manuelle modèle (3D editor light)", "Power users, agences", "6 sem", "Réduit insatisfactions"],
    ["P3", "Self-serve onboarding < 5 min", "Tous, scale", "2 sem", "Réduit support"],
]
story.append(make_table(data, [1.8 * cm, 4.6 * cm, 4 * cm, 1.6 * cm, 5 * cm]))

story.append(Spacer(1, 8))
story.append(Paragraph("Priorité absolue Q3 2026", H2))
story.append(Paragraph(
    "1. <b>Page menu AR auto-générée</b> — débloque toute la vertical resto. Sans ça, ScanAR = juste un "
    "QR + un objet, pas une vraie offre.<br/>"
    "2. <b>Plug-in Shopify</b> — c'est ton autoroute. Ne pas le faire = rester artisanal.<br/>"
    "3. <b>Mode échelle réelle cm</b> — débloque déco/antiquaires/vintage en mode quick win.<br/><br/>"
    "<b>Tout le reste attend M+4.</b>", BODY))

story.append(PageBreak())

# ═════════════════════ 9 — CONCURRENTS ═════════════════════
story.append(Paragraph("9. Concurrents — qui peut te tuer", H1))
data = [
    ["Concurrent", "Forces", "Faiblesses vs toi", "Niveau de menace"],
    ["<b>Threekit</b>", "Enterprise mid-market US, levée >100M$", "Ticket 30k$+, pas de génération IA, 0 PME", status("mid", "Moyen (segments différents)")],
    ["<b>Vectary</b>", "Création 3D web, plan gratuit, communauté", "Pas génération photo→3D auto, pas AR comme core", status("mid", "Moyen")],
    ["<b>Augment</b>", "Pionnier AR e-com français (Issy)", "En déclin, peu de comm depuis 2023", status("ok", "Faible")],
    ["<b>Shopify AR natif</b>", "Distribution gratuite intégrée", "Nécessite déjà un fichier 3D (ils ne le génèrent pas)", status("ok", "Faible — complémentaire")],
    ["<b>Reactiv (FR)</b>", "Try-on bijoux maîtrisé", "Ne fait QUE bijoux, pas multi-vertical", status("danger", "Direct sur bijoutiers")],
    ["<b>3DLOOK / Perfect Corp</b>", "Try-on mode/cosmétique avancé", "Pas accessible PME (ticket 5k+)", status("mid", "Moyen sur cosmétique")],
    ["<b>Apple Object Capture</b>", "iOS natif, gratuit", "Nécessite iPhone Pro + scan manuel multi-angle", status("danger", "Long terme — peut tout absorber")],
    ["<b>Tencent Hunyuan3D (auto-host)</b>", "C'est ton modèle... ils peuvent shipper un SaaS", "Pas leur priorité business, focus B2B Chine", status("mid", "À surveiller")],
    ["<b>Meshy / Luma / Genie</b>", "Génération IA texte→3D mainstream", "Pas focus AR e-com, pas de QR/menu/dashboard métier", status("mid", "Moyen")],
]
story.append(make_table(data, [3.2 * cm, 4.5 * cm, 6 * cm, 3.3 * cm]))

story.append(Spacer(1, 8))
story.append(Paragraph("Pourquoi tu peux gagner (honnêtement)", H2))
story.append(Paragraph(
    f"{check_green()} <b>Niche FR</b> — les concurrents US ne parlent pas français, ne comprennent pas un resto toulousain. "
    "Avantage culturel + RGPD.<br/>"
    f"{check_green()} <b>Verticalisation</b> — ils sont horizontaux (créer du 3D générique). Toi = solutions packagées par métier.<br/>"
    f"{check_green()} <b>Génération IA intégrée</b> — Threekit/Vectary demandent un fichier 3D existant. Toi : juste une photo.<br/>"
    f"{check_green()} <b>Pricing PME</b> — pas de minimum 500€/mois, accessible dès 29€.<br/><br/>"
    f"{x_red()} <b>Là où tu es vulnérable :</b> qualité 3D Hunyuan3D irrégulière (objets transparents, faces cachées, "
    "petits détails). À mitiger avec : pré-traitement image (P0), retouche manuelle premium (P3).", BODY))

story.append(PageBreak())

# ═════════════════════ 10 — RISQUES ═════════════════════
story.append(Paragraph("10. Risques & angles morts", H1))
data = [
    ["Risque", "Probabilité", "Impact", "Mitigation"],
    ["Apple/Google sortent un AR natif e-com gratuit", "Moyenne (3-5 ans)", status("danger", "Tueur"), "Posséder la couche métier (dashboard resto, plug-in Shopify, etc.) — pas juste l'AR"],
    ["Hunyuan3D devient payant ou disparaît", "Faible (open-source actif)", status("mid", "Sérieux"), "Abstraction modèle : pouvoir switch vers TripoSR / Luma en 1 jour"],
    ["GPU coûts explosent au scale", "Moyenne", status("mid", "Modéré"), "Self-host RTX 4090/5090 dès >300 jobs/jour. Cache modèles populaires."],
    ["Qualité 3D moyenne sur certains objets", "Élevée (existant)", status("danger", "Bloquant ventes"), "Filtrer cas d'usage. Refuser objets transparents/réfléchissants en P0."],
    ["Tu n'arrives pas à vendre seul", "Moyenne", status("danger", "Bloquant"), "Si à M3 tu as <10 clients : revoir produit/cible AVANT de coder plus."],
    ["Burnout solo founder", "Élevée", status("danger", "Tueur"), "1 jour OFF/sem, sport 3x/sem, journal hebdo MRR + win/lose"],
    ["RGPD / propriété images clients", "Faible mais persistante", status("mid", "Modéré"), "CGU claires : client cède droit usage AR, données stockées EU (R2 EU + Supabase EU)"],
    ["Un gros client demande exclusivité gratis", "Forte (chaînes)", status("mid", "Modéré"), "Refuser. Pas d'exclu sous 50k€/an."],
]
story.append(make_table(data, [4.5 * cm, 2.5 * cm, 1.8 * cm, 8.2 * cm]))

story.append(Spacer(1, 8))
story.append(Paragraph("Choses auxquelles tu n'as probablement pas pensé", H2))
points = [
    "<b>Le SEO local Toulouse</b> — fais 1 page par quartier (« AR pour restos quartier Capitole », « bijoutiers Carmes »). 50 pages = 200-500 visites/mois organiques en 6 mois.",
    "<b>Témoignages vidéo &gt; tout le reste</b> — 1 vidéo de 60s d'un patron de resto qui dit « ça a changé ma boîte » convertit 5x mieux qu'une landing avec 10 logos.",
    "<b>Programme d'affiliation 30%</b> — agences digitales + freelances Shopify + photographes pro. 200 affiliés actifs = 30 ventes/mois passives à M+12.",
    "<b>Le QR physique est ton meilleur marketeur</b> — chaque sticker QR sur un menu = 50-200 vues uniques/mois. Sponsorise des stickers neutres (pas trop ScanAR) qui se passent par bouche-à-oreille.",
    "<b>Le marché des CSE</b> — comités d'entreprise cherchent à offrir des « cadeaux digitaux » personnalisés (ex : 3D d'un objet souvenir d'entreprise). Niche bizarre mais bon panier (B2B2E).",
    "<b>Les notaires / commissaires-priseurs</b> — pour inventaires successions et ventes aux enchères. Ticket élevé (200-500€/dossier), ultra peu concurrentiel. Niche oubliée.",
    "<b>Le rachat d'une boîte AR moribonde</b> — certaines startups AR FR (Augment, Smartpixels…) ont des clients et meurent. 3-10 k€ pour racheter le client book peut accélérer 6 mois.",
    "<b>Subventions BPI / Région Occitanie</b> — Toulouse Métropole + Région Occitanie ont des aides startups deep-tech (jusqu'à 60-90k€). C'est gratuit, c'est bête de pas le faire (mais 4 mois de dossier).",
    "<b>L'angle ‘made in Toulouse’</b> — vraiment vendeur localement (Airbus city, fierté). Affiche-le partout. Ça crée préférence vs Threekit US.",
    "<b>Cours / formation en marque blanche</b> — vendre un module « AR pour ton commerce » à des CCI, écoles de commerce TBS, prix 2-5k€/session. Lead-gen + cash.",
]
for p in points:
    story.append(Paragraph(f"• {p}", BULLET))

story.append(PageBreak())

# ═════════════════════ 11 — PARTICULIERS ═════════════════════
story.append(Paragraph("11. Toucher les particuliers — modèle B2C", H1))
story.append(Paragraph("Honnête : le B2C AR pur, c'est un piège. Mais il y a 3 angles intéressants.", BODY_S))

story.append(Paragraph("Pourquoi le B2C pur est risqué (à savoir)", H2))
story.append(Paragraph(
    "CAC particulier = 5-15€, LTV faible (29-49€ une fois), churn énorme. À 0€ marketing organique, OK ; "
    "à 5€ CAC payant, tu coules. <b>Conclusion :</b> ne pas en faire ton focus, mais avoir une offre "
    "B2C pour capter le buzz TikTok et nourrir le funnel.", BODY))

story.append(Paragraph("3 offres B2C qui peuvent marcher", H2))
data = [
    ["Offre", "Prix", "Promesse", "Canal", "Estimation /mois"],
    ["<b>Souvenir 3D</b> (objet → AR partageable famille)", "9,90 € one-shot", "Garde un souvenir d'objet familial (peluche, bijou hérité…)", "TikTok émotionnel", "300 ventes possibles si vidéo virale"],
    ["<b>Pack Mariés</b> — alliance + bouquet + lieu", "39 € / mariage", "Mémoires AR partageables avec invités via QR", "Insta wedding planners", "20-50 /mois en saison"],
    ["<b>Crédits prépayés</b>", "9,90 € = 5 modèles", "Tester sans abonnement", "Self-serve depuis landing", "Volume bas mais zéro friction"],
]
story.append(make_table(data, [4.5 * cm, 2.2 * cm, 4.8 * cm, 3 * cm, 2.5 * cm]))

story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>Recommandation :</b> ne pas pousser le B2C avant que le B2B soit à 25 k€/mois MRR. Le B2C est une "
    "<b>distraction</b> tant que tu n'as pas closé tes 100 premiers clients pros.", QUOTE))

# ═════════════════════ 12 — PITCH ═════════════════════
story.append(Paragraph("12. Le pitch qui te suit partout", H1))

story.append(Paragraph("Elevator pitch — 15 secondes", H2))
story.append(Paragraph(
    "<b>« ScanAR transforme une photo de produit en 3D photoréaliste consultable en réalité augmentée "
    "via un QR code. Restos, bijoutiers, e-commerces : tes clients voient le produit chez eux avant "
    "d'acheter. Génération IA en 2 min, à partir de 29€/mois. »</b>", QUOTE))

story.append(Paragraph("One-liner Twitter / TikTok bio", H2))
story.append(Paragraph(
    "<b>« Toute photo devient une expérience AR. Made in Toulouse. »</b>", QUOTE))

story.append(Paragraph("Pitch investisseur — 60 secondes (pour plus tard)", H2))
story.append(Paragraph(
    "<b>Problème :</b> 71% des shoppers achètent davantage si AR (Shopify), mais créer du 3D coûte 50-300€/modèle et nécessite des compétences. 99% des PME en sont exclues.<br/>"
    "<b>Solution :</b> ScanAR = photo → 3D → QR AR en 2 minutes, à 30x moins cher.<br/>"
    "<b>Traction (à compléter) :</b> X clients payants, Y € MRR, Z% de croissance MoM.<br/>"
    "<b>Marché :</b> 1,2 M de PME e-com + restos en France ; 35 M en Europe. TAM ~12 Md€.<br/>"
    "<b>Why now :</b> Hunyuan3D + WebXR + Apple Vision Pro grand public en 2026. Fenêtre 24 mois.<br/>"
    "<b>Why us :</b> first mover FR vertical-first, marge brute >85%, équipe technique solide.<br/>"
    "<b>Demande :</b> 500k€ pré-amorçage pour recruter 1 sales + 1 dev mobile + 12 mois runway.", BODY))

story.append(Spacer(1, 8))
story.append(Paragraph("Ta routine quotidienne idéale", H2))
data = [
    ["Plage", "Activité", "Output"],
    ["8h-9h", "Sport + planif jour (3 priorités max)", "Énergie + focus"],
    ["9h-12h", "<b>Vente / outbound</b> (cold mails, DM, démos planifiées)", "≥ 3 démos/sem closées"],
    ["12h-13h", "Pause déjeuner (loin de l'écran)", "—"],
    ["13h-16h", "<b>Dev produit</b> (bug critique → P0 → P1 dans cet ordre)", "1 feature/sem livrée"],
    ["16h-17h", "Support clients existants (≤24h réponse)", "0 ticket >24h"],
    ["17h-18h", "<b>Contenu</b> : tournage 1 vidéo TikTok + 1 post LinkedIn", "1 vidéo/jour"],
    ["18h-19h", "Métriques (MRR, trials, churn, NPS) + journal", "Tracking hebdo"],
    ["Vendredi 18h", "Hebdo : qu'est-ce qui a marché / pas marché ?", "Itération"],
    ["Dimanche", "<b>OFF total</b> — pas d'écran. Anti-burnout.", "Recharge"],
]
story.append(make_table(data, [2.2 * cm, 9 * cm, 5.5 * cm]))

story.append(PageBreak())

# ═════════════════════ 13 — CHECKLIST FINALE ═════════════════════
story.append(Paragraph("13. Checklist finale — fais ça cette semaine", H1))

story.append(Paragraph("Dans les 7 jours", H2))
checks = [
    "Liste 200 restos Toulouse via Google Maps (lat/long + email + tel + Insta)",
    "Génère 5 démos AR de plats classiques (cassoulet, magret, pizza, burger, dessert) — prêtes à montrer",
    "Tourne 1 vidéo TikTok ‹avant/après› d'un plat → AR (60s max)",
    "Crée un Calendly pour démos 15 min",
    "Setup Stripe + page pricing 3 plans (Starter 29€, Pro 79€, Business 199€)",
    "Liste 50 bijoutiers et 50 fleuristes Toulouse + Bordeaux + Montpellier (Insta)",
    "Active SEO local : 1 page « AR pour restos Toulouse » en 1500 mots",
    "Liste les 10 agences digitales Toulouse (Sutsu, Niji, Wax…) + appelle-en 3",
    "Demande à 3 amis entrepreneurs un témoignage vidéo de 30s (faux mais sincère pour démarrer)",
]
for c in checks:
    story.append(Paragraph(f"☐ {c}", BULLET))

story.append(Paragraph("Dans les 30 jours", H2))
checks30 = [
    "5 restos clients pilotes (premier mois gratuit)",
    "10 démos planifiées via Calendly",
    "Page menu AR auto-générée livrée (P0 produit)",
    "12 vidéos TikTok publiées (3/sem × 4 sem)",
    "1 témoignage vidéo client en boîte",
    "Page pricing live + onboarding self-serve fonctionnel",
    "Compte LinkedIn build-in-public actif (1 post/jour)",
]
for c in checks30:
    story.append(Paragraph(f"☐ {c}", BULLET))

story.append(Paragraph("Dans les 90 jours", H2))
checks90 = [
    "≥ 18 clients payants (1 170 € MRR minimum)",
    "Plug-in Shopify v1 soumis App Store",
    "Mode échelle réelle cm livré",
    "1 partenariat agence digital signé (revshare 20%)",
    "1 vidéo TikTok &gt; 100k vues",
    "Dossier subvention BPI Région Occitanie déposé",
    "Bilan honnête : si MRR &lt; 800€ à M3 → repivoter cible avant de coder plus.",
]
for c in checks90:
    story.append(Paragraph(f"☐ {c}", BULLET))

story.append(Spacer(1, 12))
story.append(Paragraph(
    "<b>La règle d'or :</b> tu n'as pas un problème de produit. Tu as un problème de vente. Tant que "
    "ce n'est pas l'inverse, ne touche plus le code en dehors des P0 listés.", QUOTE))

story.append(Spacer(1, 8))
story.append(Paragraph(
    "Brian, t'as un produit qui en jette, une stack solide, un timing parfait, et une ville (Toulouse) "
    "où l'écosystème est petit assez pour être visible et grand assez pour signer 50 clients. Le seul "
    "vrai risque, c'est de continuer à coder au lieu de vendre. <b>Sors de ton bureau cette semaine.</b>",
    BODY))

# Build
doc.build(story)
size_kb = OUT_PDF.stat().st_size / 1024
print(f"OK Bible generated: {OUT_PDF} ({size_kb:.0f} KB)".encode("ascii", "replace").decode())
