# Bonobo Engine

### Entwicklungshinweis
Dieses Projekt kombiniert die Weiterentwicklung des Frameworks **jBB** mit moderner KI-Unterstützung. Während die **Bonobo-Engine** auf dem vom Autor vollständig eigenständig entwickelten jBB-Kern basiert, wird für die hochspezialisierte Logik des Compilers (**ApeShift**) gezielt **Gemini Code Assist** eingesetzt. Der erfahrene Hauptentwickler leitet die Architektur und kontrolliert sämtliche Code-Reviews, während die KI als spezialisierter Assistent für die komplexen Grammatik-Transformationen fungiert.

---

## Bonobo: Die Engine

### Was ist Bonobo?
Bonobo ist eine moderne Game Engine für das Web. Sie ist die konsequente Weiterentwicklung des Frameworks **jBB** und verbindet die intuitive Logik klassischer Spieleprogrammierung mit der Leistungsfähigkeit moderner Web-Technologien.

### Was kann Bonobo?
Bonobo bietet eine vollständige Infrastruktur für 2D-Spiele (und experimentell 3D):
*   Grafik: Abstraktion von HTML5 Canvas 2D und WebGL, inklusive Offscreen-Rendering und automatischem Fullscreen-Support.
*   Input: Ein hybrides System, das nahtlos zwischen Tastatur, Maus und Gamepad (mit Deadzones) wechselt.
*   Dateisystem: Ein Virtual File System (VFS), das lokales Speichern und Server-Assets transparent verwaltet.
*   Audio: Eine saubere Integration der Web Audio API für Soundeffekte und Musik.
*   Mathematik: Ein deterministischer Zufallszahlengenerator (PRNG) und Blitz-kompatible Mathe-Utilitys.

### Wie funktioniert Bonobo?
Bonobo basiert auf einer strikt modularen Struktur unter Verwendung von modernen ES-Modulen und Klassen. Das Herzstück ist ein leistungsfähiges Rendering-System, das die Komplexität der Browser-APIs hinter einfachen Befehlen verbirgt. Durch die Nutzung von Async/Await für das Asset-Loading wird ein flüssiger Programmablauf ohne blockierende Ladezeiten garantiert.

### Warum gibt es Bonobo?
Bonobo ist eine Hommage an die Ära von **BlitzBasic**. Diese Sprache hat unzählige Kinder und Jugendliche an das Programmieren herangeführt, weil ihre Einfachheit bestechend war: Ein paar Zeilen Code genügten, um etwas auf den Bildschirm zu zaubern. Bonobo bringt dieses Gefühl zurück in die moderne Zeit und eliminiert den unnötigen "Boilerplate"-Code heutiger Frameworks.

### Für wen ist Bonobo?
Bonobo richtet sich an Entwickler, die eine schlanke Engine für schnelle Prototypen oder Retro-Projekte suchen, sowie an Programmierer, die die volle Kontrolle über ihren Code behalten wollen, ohne sich mit den Details der Browser-APIs auseinanderzusetzen.

---

## ApeShift: Der Compiler

### Was macht ApeShift?
ApeShift ist ein spezialisierter Compiler, der Quellcode in BlitzBasic-Syntax (Blitz2D) analysiert und in hochperformantes JavaScript für die Bonobo-Engine übersetzt. Er dient als Brücke zwischen der klassischen BASIC-Welt und dem modernen Web.

### Was kann ApeShift?
Der Compiler nutzt eine fortschrittliche Multi-Pass-Architektur:
1.  Lexing & Parsing: Erzeugung eines präzisen Abstract Syntax Trees (AST).
2.  Hoisting: Automatisches Verschieben von Typen, Funktionen und Daten an den Programmanfang.
3.  Async-Transformation: Automatisierte Erkennung und Propagation des `async/await`-Status durch den gesamten Aufrufbaum (Lösung des "Function Color"-Problems).
4.  Type-Inference: Ein robustes System zur Erkennung von Datentypen basierend auf Suffixen und Command-Metadaten.
5.  RTL-Integration: Eine dedizierte Runtime Library (`blitz.runtime.js`) emuliert das Verhalten von BlitzBasic (Handles, Global State, Type-Collections) auf der Bonobo-Engine.

### Für wen ist ApeShift?
ApeShift ist für alle, die ihre alten BlitzBasic-Projekte im Browser wiederbeleben wollen oder die die unschlagbar einfache Syntax von BASIC lieben, aber die Reichweite moderner Web-Browser nutzen möchten.

---

## Die Zukunft: Roadmap zu 100% Kompatibilität

Unser erklärtes Ziel ist die **100%ige Kompatibilität zu Blitz2D**. 

**Aktueller Status:**
*   **ApeShift (Syntax & Logik): ~90%** (Kern-Sprachfeatures, Types, Arrays, Async-Handling sind stabil).
*   **Bonobo (Befehlssatz & API): ~80%** (Grafik, Sound und Input decken die meisten Spiele ab).

**Nächste Schritte:**

*   Sprach-Features: Implementierung einer State-Machine-Transformation für `Goto` und `Gosub`, um Sprünge innerhalb von Funktionen zu ermöglichen.
*   Speicher-Management: Vollständige Unterstützung des `Bank`-Systems und binärer Datei-Operationen (`ReadInt`, `WriteInt` etc.) via `DataView`.
*   Grafik-Härtung: Implementierung von Pixel-Manipulation (`ReadPixel`/`WritePixel`) und pixelgenauer Kollisionsabfrage.
*   Type-Collections: Vollständige Emulation der verketteten Listen von Blitz-Types (`First`, `Last`, `After`, `Before`, `Insert`).

---

## Struktur

*   /lib: Der Kern der Bonobo Engine.
*   /modules/bonobo: Die Standard-Module (Grafik, Input, Sound, Bank, FileStream).
*   /cpl: Der ApeShift Compiler inklusive Web-IDE.
*   /cpl/modules/blitz.runtime.js: Die Kompatibilitätsschicht (RTL).
*   /examples: Beispielprojekte für native Bonobo-Entwicklung und ApeShift-Kompilate.

Den interaktiven Playground findest du unter: **https://farbfinsternis.tv/bonobo/cpl/**
```
