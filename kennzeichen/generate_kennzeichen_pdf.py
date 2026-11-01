#!/usr/bin/env python3
"""Erzeugt das Versicherungskennzeichen 556 / MEJ als PDF 55×65 mm."""

from pathlib import Path

from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parent / "556-MEJ_55x65mm.pdf"

# Seitenmaß exakt wie gewünscht
WIDTH = 55 * mm
HEIGHT = 65 * mm

# Rahmenstärke (sichtbarer schwarzer Rand)
BORDER = 2.2 * mm

# Schriften (Liberation ≈ Arial, gut für Kennzeichen-Optik)
pdfmetrics.registerFont(
    TTFont("Plate", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf")
)
pdfmetrics.registerFont(
    TTFont(
        "PlateReg",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    )
)


def draw_plate(c: canvas.Canvas) -> None:
    # Weißer Grund
    c.setFillColorRGB(1, 1, 1)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)

    # Schwarzer Rahmen außen
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(BORDER)
    inset = BORDER / 2
    c.rect(inset, inset, WIDTH - BORDER, HEIGHT - BORDER, fill=0, stroke=1)

    # Innenbereich: etwas nach links, rechts Platz für Vertikaltext
    inner_left = BORDER + 1.0 * mm
    inner_right = WIDTH - BORDER - 4.8 * mm
    inner_bottom = BORDER + 6.0 * mm
    inner_top = HEIGHT - BORDER - 2.0 * mm
    center_x = (inner_left + inner_right) / 2

    # Hauptnummern – zwei Zeilen, groß und fett (wie Vorlage)
    c.setFillColorRGB(0, 0, 0)
    main_size = 26  # pt
    c.setFont("Plate", main_size)

    line1 = "556"
    line2 = "MEJ"
    text_area_mid = (inner_bottom + inner_top) / 2 + 0.5 * mm
    gap = 14.5 * mm
    y1 = text_area_mid + gap / 2 - main_size * 0.32
    y2 = text_area_mid - gap / 2 - main_size * 0.32

    c.drawCentredString(center_x, y1, line1)
    c.drawCentredString(center_x, y2, line2)

    # GDV 2024 unten mittig (unter den Buchstaben, vor dem Rahmen)
    c.setFont("PlateReg", 5)
    gdv_x = (inner_left + inner_right) / 2
    c.drawCentredString(gdv_x, BORDER + 1.6 * mm, "GDV 2024")

    # Vertikaler Text rechts: ELEKTROKLEINSTFAHRZEUG (unten → oben)
    vertical = "ELEKTROKLEINSTFAHRZEUG"
    c.saveState()
    c.setFont("PlateReg", 3.8)
    x = WIDTH - BORDER - 1.35 * mm
    y = HEIGHT / 2 + 0.5 * mm
    c.translate(x, y)
    c.rotate(90)
    c.drawCentredString(0, 0, vertical)
    c.restoreState()


def main() -> None:
    c = canvas.Canvas(str(OUT), pagesize=(WIDTH, HEIGHT))
    c.setTitle("Versicherungskennzeichen 556 MEJ")
    c.setAuthor("LANGEN Warenanhänger")
    draw_plate(c)
    c.save()
    print(f"geschrieben: {OUT}")
    print(f"Seitengröße: {WIDTH / mm:.1f} × {HEIGHT / mm:.1f} mm")


if __name__ == "__main__":
    main()
