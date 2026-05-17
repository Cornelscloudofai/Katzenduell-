# Katzenduell

## Aktueller Stand

Dieses Repository enthält aktuell einen lauffähigen Browser-Spielprototyp mit einer HTML-Einstiegsdatei und schrittweise ausgelagerten Begleitdateien:

- `katzenburg_duell_v132_1x1_mauer_schaeden.html`
- `styles/katzenburg-duell.css`
- `scripts/katzenburg-config.js`
- `scripts/katzenburg-math.js`
- `scripts/katzenburg-terrain.js`
- `scripts/katzenburg-terrain-renderer.js`
- `scripts/katzenburg-weapons.js`
- `scripts/katzenburg-map.js`
- `scripts/katzenburg-input.js`
- `scripts/katzenburg-bindings.js`
- `scripts/katzenburg-ui.js`

Die HTML-Datei bleibt der direkt öffnbare Einstiegspunkt. CSS, Konfigurationsdaten, allgemeine Mathematik-/Matrix-Helfer, Terrain-Helfer, Terrain-Rendering, Minikarten-Rendering, Eingabe-/Kamera-Bindings, allgemeine UI-Bindings, Waffen-/Kamera-Helfer und die statische HUD-/Bedienoberfläche sind inzwischen in externe Dateien ausgelagert. Externe Build-Schritte, Paketverwaltung oder zusätzliche Asset-Dateien sind im aktuellen Repository-Stand nicht erforderlich. Der Code erzeugt eine WebGL-Szene direkt im Browser und zeigt bei fehlender WebGL-Unterstützung eine Fehlermeldung an.

Der Dateiname und der `<title>` sprechen von **„Katzenburg-Duell V132 – 1x1-Mauer-Schäden“**. Innerhalb der sichtbaren HUD-Texte stehen jedoch noch mehrere Verweise auf **V112**. Das deutet darauf hin, dass die Datei funktional weiterentwickelt wurde, die Anzeige-Texte im Spiel aber noch nicht vollständig auf die Dateiversion synchronisiert sind.

## Bedeutung der HTML-Datei

Die HTML-Datei ist der zentrale Spielstand und die aktuelle Arbeitsbasis des Projekts. Sie beschreibt ein lokales Zwei-Spieler-Artillerie-/Burgduell mit Katzenburg-Thema:

- Zwei Parteien treten rundenbasiert gegeneinander an.
- Jede Partei besitzt eine Burg mit Hauptturm, Mauern und baubaren Erweiterungen.
- Spieler können schießen, bauen, reparieren und zwischen Kameraperspektiven wechseln.
- Die komplette Darstellung läuft über ein WebGL-Canvas.
- Eingebaute Base64-/JavaScript-Assets ersetzen externe 3D-Asset-Dateien.
- Allgemeine Vektor-, Zufalls- und Matrixfunktionen liegen in `scripts/katzenburg-math.js`; Terrain-Helfer liegen in `scripts/katzenburg-terrain.js`; Terrain-Rendering liegt in `scripts/katzenburg-terrain-renderer.js`; Minikarten-Rendering liegt in `scripts/katzenburg-map.js`; Eingabe- und Kamera-Bindings liegen in `scripts/katzenburg-input.js`; allgemeine UI-Bindings liegen in `scripts/katzenburg-bindings.js`; Waffen-/Kamera-Helfer liegen in `scripts/katzenburg-weapons.js`; die statische HUD-/Bedienoberfläche liegt in `scripts/katzenburg-ui.js`, damit die HTML-Datei weiter entlastet wird.

Kurz gesagt: Die HTML-Datei ist nicht nur eine Webseite, sondern die komplette Spielimplementierung inklusive UI, Rendering, Spielregeln, Assets und Hauptschleife.

## Wichtige Bestandteile

### Benutzeroberfläche

Die Oberfläche besteht aus mehreren fest eingebauten HUD-Bereichen:

- Haupt-Canvas `#gl` für die WebGL-Ausgabe.
- Obere Statusanzeige mit Spieltitel, Zugstatus, Ressourcen und Burgzustand.
- Kameraleiste für Ziel-, freie, Vogel-, Treffer- und Projektilkamera sowie Reset, Spielerwechsel und Baumodus.
- Baupanel mit auswählbaren Gebäuden und Reparaturfunktion.
- Unteres Bedien-Deck mit Minikarten, Winkelanzeige, Waffenwechsel und Feuerknopf.
- Seitliche Regler und Drawer für Schussstärke, Kamera-Feinsteuerung und Waffen-FX.

### Spielzustand und Regeln

Der Spielzustand wird komplett im JavaScript gehalten. Dazu gehören unter anderem:

- Zwei Spieler mit Startgold, Burg-HP, Waffenstatus, Zielwinkeln und eigenen Blöcken.
- Wirtschaftswerte wie Grundeinkommen, Gebäudeeinkommen und Goldkosten.
- Gebäude- und Blocktypen mit Trefferpunkten, Größen, Kosten, Einkommen, Heilung und Symbolen.
- Waffenlogik für Kanone und Feuerkatapult.
- Feuer-, Rauch-, Einschlag-, Brandschaden- und Reparaturmechaniken.

### Bauen und Reparieren

Der Baumodus ist ein wichtiger Teil des aktuellen Prototyps. Das Baupanel bietet unter anderem:

- 1x1-Mauersegmente für feineres Mauersetzen.
- Waffenturm, Kanone und Katapult.
- Wirtschafts- und Unterstützungsgebäude wie Fischküche, Werkstatt, Kornspeicher, Kaserne und Katzenminze.
- Eine Reparaturaktion, die beschädigte Mauern um 1 HP repariert und Gold kostet.

Die Datei enthält dafür Rasterlogik, Platzierungsprüfung, Mauern-Linienvorschau, Baukamera und Minikarten-Platzierung.

### Kampf und Schäden

Der Kampfteil simuliert Projektilschüsse mit Wind, Flugbahn und Einschlagprüfung. Treffer können Blöcke beschädigen oder zerstören. Bei Feuerwaffen kommen zusätzliche Brandmechaniken dazu:

- entzündbare Blöcke,
- zeitlich begrenzter Brandschaden,
- Bodenfeuer,
- Rauch-/Funken-/Feuerpartikel,
- Rußspuren,
- Belohnungen für zerstörte Mauern.

Der Schwerpunkt der aktuellen Version liegt erkennbar auf **1x1-Mauer-Schäden**: Mauern besitzen eigene Trefferpunkte, können segmentweise beschädigt werden und lassen sich einzeln reparieren.

### Rendering und Assets

Die Datei rendert Terrain, Burgplateaus, Gebäude, Mauern, Waffen, Partikel und Minikarten direkt in WebGL. 3D-Geometrien für unter anderem Katapult-, Mauer- und Gebäudevarianten sind im JavaScript eingebettet. Dadurch kann die HTML-Datei als einzelnes Artefakt geöffnet und weitergegeben werden.

## Aktuelle technische Einordnung

- **Projektform:** WebGL-Prototyp mit HTML-Einstieg und schrittweise ausgelagerten CSS-/JavaScript-Modulen.
- **Startpunkt:** `katzenburg_duell_v132_1x1_mauer_schaeden.html` direkt im Browser öffnen.
- **Build-System:** Nicht vorhanden / derzeit nicht nötig.
- **Laufzeitabhängigkeit:** Moderner Browser mit WebGL-Unterstützung.
- **Persistenz:** Kein dauerhaftes Speichern des Spielstands im Repository erkennbar; der Zustand lebt zur Laufzeit im Browser.
- **Wartungsstatus:** Experimenteller, iterativ gewachsener Prototyp mit vielen Versionskommentaren im Code.

## Hinweise für die weitere Entwicklung

1. **Versionsanzeige vereinheitlichen:** Dateiname und `<title>` nennen V132, während HUD und Status noch V112 anzeigen.
2. **README aktuell halten:** Bei größeren Gameplay-Änderungen sollte diese Datei kurz angepasst werden.
3. **Optional modularisieren:** Wenn der Prototyp weiter wächst, könnten CSS, Rendering, Spielregeln, Assets und UI in getrennte Dateien ausgelagert werden.
4. **Browser-Test dokumentieren:** Für echte Funktionsprüfung sollte die HTML-Datei in einem WebGL-fähigen Browser geöffnet und kurz angespielt werden.
5. **Asset-Strategie klären:** Eingebettete Assets machen die Datei portabel, erhöhen aber Größe und Wartungsaufwand.
