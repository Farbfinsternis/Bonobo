# Entwicklertagebuch

## Session: Compiler & Engine Integration

### Infrastruktur
- **Preprocessor:** `Preprocessor`-Klasse für rekursive `Include`-Befehle implementiert.
- **Async Compilation:** `Compiler` auf asynchrone Verarbeitung umgestellt (für Datei-Laden).
- **UI:** `index.html` auf Split-View umgebaut (Source | JS | Preview).

### Parser & Code Generator
- **Kontrollfluss:** Unterstützung für `Select ... Case` und `Exit` (Schleifenabbruch) hinzugefügt.
- **Daten:** `Data`, `Read` und `Restore` Befehle implementiert.
- **Variablen:** `Const` und `Dim` (Arrays) hinzugefügt. Global/Local Scope-Logik verbessert.
- **Syntax:** Parsing von Typ-Suffixen (`obj.Type`) und Funktionsaufrufen vs. Array-Zugriff korrigiert.
- **Literale:** Unterstützung für `True`, `False`, `Pi`.

### Engine Integration (Bonobo)
- **Input Mapping:** `keycodes.js` erstellt, um Blitz2D Key/Mouse-Codes auf JS-Events zu mappen.
- **Grafik:** Argument-Mapping für `Rect`/`Oval` (Int zu Bool) und `Text`-Parameter korrigiert.
- **Initialisierung:** Automatische Registrierung von Input-Modulen und Übergabe der Canvas-Größe.
- **UI:** Redesign der `index.html` (Dark Theme, VS Code Style).
- **Rebranding:** Umbenennung des Projekts in "ApeShift".
- **Logo:** Erstellung eines SVG-Logos (freundlicher Bonobo) und Integration in die UI.
- **Logo Update:** Redesign auf einfarbiges, geometrisches Orange-Logo (Harte Kanten).
- **Branding:** Anpassung des Schriftzugs "ApeShift" (Ape normal, Shift fett, kein Leerzeichen).