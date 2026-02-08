# Roadmap zur 100% Blitz2D Kompatibilität

## 0. Strategie: Compiler-First & Runtime Library (Neu)
**Grundsatz:** Bonobo bleibt eine reine, moderne JS-Engine. Die Kompatibilität wird vollständig durch den Compiler und eine dedizierte Runtime-Schicht (`blitz.runtime.js`) hergestellt.
- [x] **Runtime Library (RTL):** Erstellung einer `blitz.runtime.js`. Diese Bibliothek kapselt Bonobo-Aufrufe und bildet das Verhalten von BlitzBasic (Global State, Handles, Sync-Simulation) nach.
    - *Beispiel:* `Color 255,0,0` -> `RTL.setColor(255,0,0)` (speichert State) -> `bonobo.draw.rect(...)` nutzt diesen State.
- [x] **Handle-Management in RTL:** Die RTL verwaltet Maps (`Int -> Object`) für Images, Sounds und Fonts. Der generierte Code nutzt nur IDs, die RTL löst diese für Bonobo auf.
- [ ] **Strict Separation:** Keine `if (isBlitzBasic)` Hacks in den Bonobo-Core-Modulen.
- [ ] **Polyfills:** Funktionen, die Bonobo nicht nativ anbietet (z.B. `Bank`-System, `ReadByte`), werden in der RTL implementiert, ohne den Core zu belasten.

## 1. Architektur & Compiler (Priorität: Hoch)
- [ ] **Async/Await Transformation:** Der CodeGenerator muss Befehle wie `LoadImage`, `LoadSound` und `WaitKey` erkennen und den generierten JS-Code in `async` Funktionen verpacken, damit der Programmfluss wie in Blitz2D "blockiert" (wartet).
- [ ] **Handle-System:** Entscheidung treffen, ob wir Integer-Handles emulieren (Map<Int, Object>) oder den Compiler so anpassen, dass er Variablen, die Handles halten, als Objekte behandelt.
- [ ] **Main Loop:** Emulation von `Flip`. In Blitz steuert `Flip` das Timing. In JS steuert `requestAnimationFrame` den Loop. Der Compiler muss den Code zwischen zwei `Flip`-Aufrufen in einen Frame-Step kapseln.

## 2. Grafik & Display
- [ ] **Buffer Management:** Implementierung von `SetBuffer`, `BackBuffer`, `FrontBuffer`, `ImageBuffer`.
    - *Lösung:* Offscreen-Canvas für jeden Buffer/Image erstellen.
- [ ] **Pixel-Manipulation:** `ReadPixel`, `WritePixel`, `LockBuffer`, `UnlockBuffer`.
    - *Lösung:* Zugriff auf `ImageData` des Canvas Contexts.
- [ ] **Masking:** Implementierung von `MaskImage` (Color Keying).
- [ ] **Gamma/Display:** `GammaRed`, `GammaGreen`, `GammaBlue` (evtl. via CSS Filter oder WebGL Shader, niedrige Prio).

## 3. Input
- [ ] **Input() Befehl:** Implementierung eines HTML-Overlays oder einer Canvas-basierten Texteingabe, die den Programmfluss blockiert bis Enter gedrückt wird.
- [ ] **Maus-Steuerung:** `MoveMouse` (Position setzen) ist im Browser aus Sicherheitsgründen nur via Pointer Lock API (Delta-Bewegung) möglich. Hier ist ein Workaround nötig.
- [ ] **Cursor:** `ChangeCursor` (Custom Cursor Bilder).

## 4. Sound & Musik
- [ ] **Signatur-Anpassung:** `PlayMusic` in Blitz nimmt einen Pfad (String), Bonobo aktuell ein Objekt. Wrapper schreiben: `PlayMusic(file) -> sound.loadMusic(file).then(m => m.play())`.
- [ ] **Sound-Attribute:** `SoundVolume`, `SoundPan`, `SoundPitch` (Global für das Sound-Objekt, nicht den Channel).
- [ ] **Looping:** `LoopSound` Implementierung.

## 5. Dateisystem & Daten
- [ ] **Binäre I/O:** Implementierung von `ReadByte`, `WriteByte`, `ReadInt`, `WriteInt`, `ReadFloat`, `WriteFloat`, `ReadString`, `WriteString`.
    - *Tech:* Nutzung von `DataView` und `ArrayBuffer` im VFS.
- [ ] **Banks:** Implementierung des `Bank`-Systems (`CreateBank`, `PeekByte`, `PokeByte`).

## 6. Blitz-Types (Structs)
- [ ] **Collection Management:** Blitz-Types sind automatisch Listen.
    - Implementierung von `New`, `Delete`, `First`, `Last`, `After`, `Before`, `Insert`.
    - Der Compiler muss für jeden `Type` im Hintergrund eine Liste verwalten.

## 7. Mathematik & Strings
- [ ] **SeedRnd:** Deterministischer Zufallsgenerator (nicht `Math.random()`, sondern ein Seedable PRNG implementieren).
- [ ] **String-Padding:** `LSet`, `RSet`.
- [ ] **Konvertierung:** `Str$`, `Val` (explizite Typumwandlung, auch für Hex/Bin Strings).

## 8. Kollision (2D)
- [ ] **Pixel-Genau:** `ImagesCollide` und `ImageRectCollide` mit Frame-Support und Pixel-Check (via Canvas Pixel-Daten).
- [ ] **Layer-System:** (Optional) Blitz2D hatte Kollisionstypen für 3D, aber `ImagesCollide` war direkt. Prüfen ob `RectsOverlap` ausreicht oder ob wir ein Quadtree-System brauchen.

## 9. GUI / System
- [ ] **System:** `CurrentDate`, `CurrentTime`, `SystemProperty`.
- [ ] **Timer:** `CreateTimer`, `WaitTimer` (Wichtig für Framerate-Unabhängigkeit in alter Logik).

## 10. Code Generator Updates
- [ ] **Parameter-Mapping:** Die in `command_map.js` definierten `mapArgs` müssen im CodeGenerator angewendet werden (z.B. Bool-Konvertierung).
- [ ] **Optionale Parameter:** Default-Werte für fehlende Argumente im generierten JS setzen.

## 11. Playground UI
- [ ] **Fokus-Fix:** Deaktivierung der sofortigen Übersetzung bei Tastendruck ("Live-Compile"), da dies den Fokus vom Editor stiehlt.
- [ ] **Run-Button:** Hinzufügen eines expliziten "Run" oder "Compile"-Buttons.