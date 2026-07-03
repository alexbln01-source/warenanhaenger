# PAUS Lieferung – QR-Code-Vorgabe für IT

Stand: Juli 2026  
App: `paus_mobile` (Warenanhänger / GitHub Pages)

---

## 1. Zweck

Beim Scannen eines **QR-Codes** sollen in der App **PAUS Lieferung** automatisch ausgefüllt werden:

| Feld in der App | Quelle im QR-Code |
|-----------------|-------------------|
| **Kommissionsnummer** (Bestell-Nr.) | Erster Teil |
| **Lieferdatum** | Zweiter Teil → Anzeige/Etikett nur **TT.MM** |

**Keine Artikelnummer mehr** im QR-Code.

---

## 2. QR-Code-Typ

- **Symbologie:** QR Code (QR-Code / QR-Model 2)
- **Empfohlene Größe:** mindestens **25 × 25 mm**, besser **30 × 30 mm**
- **Druck:** immer **100 % / Originalgröße**
- **Fehlerkorrektur:** Level M oder Q (empfohlen)

---

## 3. Pflicht-Format (Hauptformat mit Stern)

```
[BESTELLNR]*[DATUM]
```

| Segment | Regel | Beispiele |
|---------|--------|-----------|
| **Bestell-Nr.** | Ziffern, beliebig lang | `2154808`, `12345` |
| **Trennzeichen** | Stern `*` (empfohlen) | `*` |
| **Datum** | **TT.MM.JJJJ** (empfohlen) oder TTMMJJJJ / TT.MM / TTMM | `24.06.2026` → Etikett **24.06** |

### Beispiele (vollständiger QR-Inhalt)

```
2154808*24.06.2026
2154808*2406
12345*01.07.2026
2154808*24062026
```

### Ergebnis in der App (Beispiel 1)

| Scan (roh) | Kommission | Lieferdatum |
|------------|------------|-------------|
| `2154808*24.06.2026` | `2154808` | `24.06` |

---

## 4. Alternative Trennzeichen (QR)

Im QR-Code sind auch diese Trennzeichen erlaubt (Scanner/IT):

| Trenner | Beispiel |
|---------|----------|
| `*` Stern | `2154808*24.06.2026` |
| `;` Semikolon | `2154808;24.06.2026` |
| `\|` Pipe | `2154808\|24.06.2026` |
| `,` Komma | `2154808,24.06.2026` |
| `--` Doppelstrich | `2154808--24.06.2026` |
| `D` Buchstabe | `2154808D2406` |

---

## 5. Zebra TC / DataWedge

### Scanner-Verhalten

- QR-Code in DataWedge aktivieren (Decoders → QR Code **an**)
- Scanner als **Tastatur (Keyboard Wedge)**
- Nach dem Scan: **Enter/Return** senden (Standard)
- App erkennt Ende über **Enter/Tab** und kurze Pause

### Test auf dem Gerät

1. App über `start.html?bereich=paus` öffnen
2. Feld **Kommissionsnummer** fokussieren
3. QR-Code scannen, z. B. `2154808*24.06.2026`
4. Erwartet:
   - Kommission: `2154808`
   - Lieferdatum: `24.06`

---

## 6. Checkliste IT

- [ ] **QR Code** (nicht mehr Code 128 als Standard)
- [ ] Format: `Bestellnr*Datum` (nur 2 Teile)
- [ ] Bestell-Nr.: nur Ziffern, variable Länge
- [ ] Datum: **TT.MM.JJJJ** empfohlen (z. B. `24.06.2026`)
- [ ] Kein Leerzeichen im QR-Inhalt
- [ ] QR groß genug drucken (min. 25 mm)
- [ ] Scanner: Enter nach Scan aktiv
- [ ] DataWedge: QR-Decoder aktiv

---

## 7. Technische Implementierung (App)

Datei: `paus_mobile/paus_mobile.js`

Erkennungsreihenfolge:

1. Zwei-Teiler mit Trennzeichen (`*`, `;`, `|`, `,`, `--`)
2. Format mit `D` (z. B. `2154808D2406`)
3. Nur Ziffern ohne Trenner (Bestellnr + Datum)
4. Einzelwert nur Bestellnr oder nur Datum

**Hinweis:** Alte 3-teilige Barcodes (`Artikel*Bestell*Datum`) werden weiterhin gelesen – Artikel wird ignoriert.

App starten:

```
start.html?bereich=paus
```

---

## 8. Kurztext zum Weiterleiten (Copy & Paste)

> **PAUS QR-Code – Vorgabe Langen CNC**  
> Inhalt: `[Bestellnummer]*[TT.MM.JJJJ]`  
> Beispiel: `2154808*24.06.2026`  
> Nur 2 Teile: Bestell-Nr. + Datum. Keine Artikelnummer.  
> QR-Code, min. 25 mm, 100 %. Scanner: Enter nach Scan.

---

## 9. Ansprechpartner App

Bei Änderungswünschen am Format: Abstimmung mit Verantwortlichem Warenanhänger-Projekt, danach Anpassung in `paus_mobile.js`.
