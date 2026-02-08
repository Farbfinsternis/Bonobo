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

### Compiler Refactoring & Runtime Library
- **Command Map:** `commands.js` entfernt. Der Lexer lädt gültige Befehle nun dynamisch aus der `command_map.js`.
- **Mapping Updates:** Umfangreiche Ergänzung der `command_map.js` um fehlende Blitz2D-Befehle (Grafik, Sound, Input, File, Math, String).
- **Kompatibilitäts-Check:** Abgleich aller Module mit Blitz2D-Signaturen. Inkompatibilitäten und fehlende Methoden wurden als TODOs markiert.

### Strategie & Roadmap
- **Roadmap:** Erstellung einer `todo.md` für die 100%ige Blitz2D-Kompatibilität.
- **Strategie:** Festlegung auf "Compiler-First" Ansatz. Bonobo bleibt modern, Kompatibilität wird durch eine Runtime Library (RTL) erzeugt.
- **Runtime Library:** Initiale Erstellung der `blitz.runtime.js` (`cpl/modules/blitz.runtime.js`) als Zwischenschicht für Handle-Management und State-Kapselung.
- **RTL Completion:** Vollständige Implementierung der Wrapper-Methoden in `blitz.runtime.js` für alle Kern-Module. Umstellung der `command_map.js` auf RTL-Ziele.
- **Playground Issue:** Identifizierung eines Problems mit dem Fokusverlust im Editor durch sofortige Neu-Kompilierung bei Tastendruck. Planung eines "Run"-Buttons.

## Session: Stabilität, Error-Handling & Projekt-Portabilität

### Compiler & Parser Härtung
- **Error Handling:** Implementierung eines strukturierten Error-Reportings mit `line` und `column`. Der Parser nutzt nun einen Synchronisations-Mechanismus, um nach Fehlern stabil weiterzuarbeiten.
- **Verschachtelung:** Massive Härtung der Block-Parsing-Logik (`block()`). Einführung von "Panic Breaks", die verhindern, dass Terminatorsymbole äußerer Scopes (`Next`, `Wend`) bei Syntaxfehlern in inneren Blöcken verschluckt werden.
- **Keywords:** Unterstützung für getrennte Schreibweisen (`End If`, `Else If`, `End Function`) und konsequente Case-Insensitivity über alle Keyword-Prüfungen hinweg.
- **Typ-System:** Erweiterung der Typ-Inferenz. Der Parser erkennt nun Rückgabetypen von Funktionen anhand von Suffixen (`#`, `%`, `$`) und Symboltabellen-Einträgen.
- **Portabilität:** Einführung von `importRoot` im `CodeGenerator`, um den generierten Code unabhängig von der physischen Ordnerstruktur des Playgrounds zu machen.

### Runtime Library (RTL) & Engine
- **Buffer Management:** Implementierung von `SetBuffer`, `BackBuffer` und `ImageBuffer`. Bilder können nun als vollwertige Zeichenziele (Offscreen-Canvas) genutzt werden.
- **Performance:** Optimierung des `Flip()`-Verhaltens. Durch Entfernen des künstlichen `requestAnimationFrame` innerhalb der RTL wurde der "Double-VSync" behoben, was zu flüssigen 60 FPS führt.
- **Async-Loop:** Anpassung der `Bonobo.gameLoop`, um auf asynchrone Benutzer-Loops zu warten. Dies ermöglicht die Nutzung von blockierenden Befehlen wie `Delay` oder `WaitKey`.
- **Strict Separation:** Vollständige Entfernung von Playground-spezifischen Leaks (wie `postMessage`) aus der RTL. Die Runtime ist nun 100% UI-agnostisch.
- **Math & Grafik:** Ergänzung fehlender Standardbefehle wie `Max`, `Min` und zentrierte Textausgabe.

### Playground UI & UX
- **Redesign:** Umstellung auf ein modernes Side-by-Side Layout (Source | JS | Preview) mit Blueprint-Hintergrund für das Canvas.
- **Konsole:** Integration einer dedizierten Fehler-Konsole, die Compiler-Probleme präzise lokalisiert und darstellt.
- **ZIP-Support:** Implementierung eines Projekt-Imports via JSZip. Assets werden automatisch in Blob-URLs umgewandelt und über eine `ASSET_MAP` in das Iframe injiziert.
- **Branding:** Integration der ikonischen Blitz-Rakete im RUN-Button und als visueller Hinweis im leeren Preview-Bereich.
- **Robustheit:** Automatisches Bereinigen von HTML-Entities (`&lt;`, `&gt;`) beim Kompilieren, um Copy-Paste-Fehler aus Web-Quellen zu minimieren.

### Status Quo
- Der Compiler ist nun in der Lage, komplexe, verschachtelte Blitz2D-Strukturen (Entity-Systeme, Scrolling-Engines) stabil in performanten JavaScript-Code zu übersetzen.
- Die Trennung zwischen Engine (Bonobo), Compiler (ApeShift) und UI (Playground) ist architektonisch sauber abgeschlossen.