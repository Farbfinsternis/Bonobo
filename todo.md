# Roadmap zur 100% Blitz2D Kompatibilität

## Prio 1: Kern-Sprache & Architektur (Kritisch)
- [ ] **Goto/Gosub Transformation:** Implementierung einer State-Machine Transformation für Labels, um Sprünge innerhalb von Funktionen zu ermöglichen (erfordert AST-Restrukturierung).
- [ ] **Optionale Parameter:** Implementierung von Default-Werten im CodeGenerator für Befehle, die in der `command_map.js` optionale Argumente definieren.
- [ ] **Strict Separation:** Fortlaufende Prüfung, dass keine Compiler-Hacks in den Bonobo-Core gelangen.

## Prio 2: Grafik & Kollision (Gameplay)
- [ ] **Pixel-Manipulation:** Implementierung von `ReadPixel`, `WritePixel` und `LockBuffer`. Erfordert Synchronisation zwischen Canvas und internem `Uint8ClampedArray`.
- [ ] **Pixel-Perfect Collision:** Upgrade von `ImagesCollide` auf echte Alpha-Daten-Prüfung.
- [ ] **Masking:** Implementierung von `MaskImage` (Color Keying) in der RTL.
- [ ] **Image Handling Refinement:** Hinzufügen der fehlenden Getter (`ImageWidth`, `ImageHeight`, etc.) in der RTL.

## Prio 3: System & Sound
- [ ] **Timer-Emulation:** Implementierung von `CreateTimer` und `WaitTimer` via `performance.now()` und asynchronen Delays.
- [ ] **Sound-Attribute:** Korrekte Abbildung von `SoundVolume`, `SoundPan` und `SoundPitch` auf die Bonobo-Audio-Nodes.
- [ ] **Input-Härtung:** Implementierung von `MoveMouse` (Workaround via Pointer Lock) und Vervollständigung der Joystick-Achsen.

## Prio 4: Tooling & Härtung
- [ ] **Semantischer Analyse-Pass:** Einführung eines dedizierten Passes nach dem Hoisting, um ungebundene Variablen vor der Generierung zu finden.
- [ ] **Standalone Export:** Entwicklung eines Bundlers für generierten JS-Code inkl. RTL und Bonobo-Kern.

---

### Erledigte Meilensteine (Archiv)
- [x] **Multi-Pass Architektur:** Trennung von Lexing, Parsing, Hoisting und Async-Analyse.
- [x] **Async-Propagation:** Automatisierte `async/await` Erkennung durch den gesamten Aufrufbaum.
- [x] **RTL Integration:** `blitz.runtime.js` als stabile Brücke zwischen Blitz-Syntax und Bonobo-Engine.
- [x] **Handle-Management:** Vollständige Emulation von Integer-Handles für Images, Sounds, Fonts, Files und Banks.
- [x] **Binäre I/O:** Implementierung von `ReadInt`, `WriteInt`, `FileStream` und `Bank`-System.
- [x] **Type-Collection Management:** Unterstützung für `First`, `Last`, `After`, `Before` und `Insert` für Blitz-Types.
- [x] **Deterministischer Zufall:** Seedbarer PRNG in `math.js` inkl. `SeedRnd` und `RndSeed`.
- [x] **Hoisting:** Zuverlässiges Verschieben von `Data`, `Types` und `Functions` an den Anfang.
- [x] **Buffer Management:** `SetBuffer`, `BackBuffer` und `ImageBuffer` sind implementiert.