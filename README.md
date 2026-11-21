# Lernzettel Ausdauer (Sport-Theorie)

Interaktiver Lernzettel als Webseite:

- **24 Themen in 6 Kapiteln**: Leistungsfaktoren, Ausdauer vs. fit sein, Wirkungen des Ausdauertrainings, Herz-Kreislauf-System, ATP und die vier Energiegewinnungswege, Laktat-Stufentest, aerobe/anaerobe Schwelle, Anpassungen, Ausdauerfähigkeiten, Dauer- und Intervallmethoden, HIIT, Pulsformeln (mit Pulsrechner), Atmung, Trainingsprogramme, Cooper-Test, Tipps
- **3 Erklärstufen** pro Thema: Einfach · Normal · Genauer
- **KA!-Marken** für den Stoff der Themenliste zur Arbeit
- **Abhaken & Punkte**: Haken bei verstandenen Themen, Schnelltests, Ränge von „Couchsitzer“ bis „Ultraläufer“, Ausdauer-Akku als Fortschrittsanzeige
- **Lernkarten** (103 Karten) mit Karteikasten (neu · nochmal · fast · sitzt), Filter nach Kapitel und „nur KA!“, umgedrehter Modus, Liste zum Drucken
- **Erklärvideos** (YouTube-Links) zu jedem Thema

Der Fortschritt wird nur im eigenen Browser gespeichert (localStorage).

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Lernzettel |
| `lernkarten.html` | Lernkarten zum Abfragen |
| `css/`, `js/` | Design und Logik |

Die Originalunterlagen (PDF-Scan) liegen **nicht** im Repository (`.gitignore` schließt `*.pdf` aus).

## Auf GitHub Pages veröffentlichen

1. Im Repo auf GitHub: **Settings → Pages**.
2. Bei *Source* „Deploy from a branch“, Branch **main**, Ordner **/ (root)** → **Save**.
3. Nach 1–2 Minuten ist die Seite online unter
   `https://dumboojoo.github.io/lermzettel-sport/`

Änderungen hochladen:

```bash
git add .
git commit -m "Lernzettel aktualisiert"
git push
```

## Lokal ansehen

`index.html` doppelklicken. Falls Schriften oder Design fehlen, einen kleinen Server starten:

```bash
python3 -m http.server 8000
```

und `http://localhost:8000` öffnen.

## Hinweis

Selbst erstellte Lernhilfe, zusammengestellt aus Unterrichtsmaterialien (Buchkapitel „Ausdauer“). Ohne Gewähr – bei Widersprüchen gilt das Buch bzw. der Unterricht.
