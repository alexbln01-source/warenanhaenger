# PAUS Lieferung – Barcode-Vorgabe für IT

Stand: Juli 2026  
App: `paus_mobile` (Warenanhänger / GitHub Pages)

---

## 1. Zweck

Beim Scannen eines Code-128-Barcodes sollen in der App **PAUS Lieferung** automatisch ausgefüllt werden:

| Feld in der App | Quelle im Barcode |
|-----------------|-------------------|
| **Kommissionsnummer** | Mittlerer Teil (nur Ziffern, variable Länge) |
| **Lieferdatum** | Letzter Teil → Anzeige **TT.MM.JJJJ** (oder TT.MM) |
| *(Artikelnummer)* | *Erster Teil – wird von der App **nicht** angezeigt und **ignoriert*** |

---

## 2. Barcode-Typ

- **Symbologie:** Code 128 (Code128)
- **Empfohlene Druckgröße:** **40 mm breit × 10 mm hoch**
- **Druck:** immer **100 % / Originalgröße** (nicht „an Seite anpassen“)

---

## 3. Pflicht-Format (Hauptformat mit Stern)

```
[ARTIKELNUMMER]*[KOMMISSION]*[DATUM]
```

| Segment | Regel | Beispiele |
|---------|--------|-----------|
| **Artikelnummer** | Beliebig lang, Ziffern; Bindestriche im Artikel erlaubt | `70233514`, `12569`, `1258764899`, `31-027-1940-502` |
| **Trennzeichen** | Stern `*` (ASCII 42) | `*` |
| **Kommission** | Nur Ziffern, beliebig lang | `2154808`, `12345` |
| **Trennzeichen** | Stern `*` | `*` |
| **Datum** | Genau **4 Ziffern** TTMM | `2406` → Anzeige **24.06.** |

### Beispiele (vollständiger Barcode-Inhalt)

```
70233514*2154808*2406
12569*12345*2406
1258764899*2154808*2406
31-027-1940-502*2154808*2406
```

### Ergebnis in der App (Beispiel 1)

| Scanfeld (roh) | Kommission | Lieferdatum |
|----------------|------------|-------------|
| `70233514*2154808*2406` | `2154808` | `24.06` |

---

## 4. Alternative Formate (Fallback)

Falls der Zebra-Scanner den Stern `*` **nicht** überträgt, unterstützt die App zusätzlich:

### Variante A – Buchstaben K und D

```
[ARTIKELNUMMER]K[KOMMISSION]D[DATUM]
```

Beispiel: `70233514K2154808D2406`

### Variante B – Doppel-Bindestrich

```
[ARTIKELNUMMER]--[KOMMISSION]--[DATUM]
```

Beispiel: `70233514--2154808--2406`  
*(Einfache Bindestriche im Artikel sind erlaubt; Trennung nur mit `--`)*

### Nicht verwenden

Diese Zeichen werden von vielen Zebra-Scannern **nicht** zuverlässig übertragen:

- `;` Semikolon  
- `|` Pipe  
- `#` Raute  

---

## 5. Zebra TC / DataWedge

### Scanner-Verhalten

- Der Scanner arbeitet als **Tastatur (Keyboard Wedge)**.
- Nach dem Scan soll **Return/Enter** gesendet werden (Standard).
- Die App erkennt das Ende des Scans über **Enter/Tab** und über eine kurze Pause nach der Eingabe.

### Stern `*` kommt nicht an?

Wenn im Scanfeld **kein** Stern sichtbar ist (nur Ziffern und Bindestriche):

1. In **DataWedge** prüfen, ob Sonderzeichen herausgefiltert werden.
2. Profil für den Browser / die PAUS-URL anpassen.
3. Oder Barcodes mit **K/D-Format** erzeugen (siehe Abschnitt 4).

### Test auf dem Gerät

Nach dem Scan sollte im Feld **Kommissionsnummer** z. B. stehen:

`70233514*2154808*2406`

Danach füllt die App automatisch:

- Kommission: `2154808`
- Lieferdatum: `24.06`

---

## 6. Regeln für die Barcode-Erzeugung (Checkliste IT)

- [ ] Code 128 verwenden  
- [ ] Format: `Artikel*Kommission*Datum` (Stern als Trenner)  
- [ ] Artikelnummer: variable Länge, Ziffern (Bindestriche optional)  
- [ ] Kommission: nur Ziffern, variable Länge  
- [ ] Datum: immer 4 Ziffern TTMM (z. B. `2406` für 24. Juni)  
- [ ] Kein Leerzeichen im Barcode-Inhalt  
- [ ] Druckgröße: 40 mm × 10 mm bei 100 %  
- [ ] Scanner: Enter/Return nach Scan aktiv  

---

## 7. Technische Implementierung (App)

Datei: `paus_mobile/paus_mobile.js`

Erkennungsreihenfolge:

1. Stern-Format `*`
2. K/D-Format
3. Doppel-Bindestrich `--`
4. Einzelscan nur Kommission oder nur Datum (manuell / zweiter Scan)

Die App lädt am besten über:

```
start.html?bereich=paus
```

(Cache-Buster – immer aktuelle Version)

---

## 8. Kurztext zum Weiterleiten (Copy & Paste)

> **PAUS Barcode Code128 – Vorgabe Langen CNC**  
> Inhalt: `[Artikelnummer]*[Kommissionsnummer]*[TTMM]`  
> Beispiel: `70233514*2154808*2406`  
> Artikel beliebig lang (wird in der App ignoriert), Kommission nur Ziffern, Datum 4 Ziffern.  
> Druck: 40 × 10 mm, 100 %. Scanner: Enter nach Scan.  
> Fallback ohne Stern: `70233514K2154808D2406`

---

## 9. Ansprechpartner App

Bei Änderungswünschen am Format: Abstimmung mit Verantwortlichem Warenanhänger-Projekt, danach Anpassung in `paus_mobile.js`.
