# ApeShift & Bonobo Development Diary

## Project Principles
- **Bonobo:** Modern, independent Game Engine. Must remain usable without the compiler.
- **ApeShift:** Blitz2D to JavaScript Compiler.
- **Strict Separation:** No compiler-specific hacks in the engine core.
- **UI Policy:** NO ZIP UPLOAD BUTTON. The playground is for single-file live coding.

## Session: 2024-05-22 - Environment Discrepancy & UI Cleanup

### Current Status
- **Local Environment:** Works perfectly using `npx vite`.
- **Production Environment (all-inkl):** Currently broken.
  - Issue 1: HTTP 403 Forbidden errors. Likely due to case-sensitivity (Linux) or security rules regarding directory traversal (`../../`).
  - Issue 2: "Critical Error: Compiler failed to return a valid result object." This suggests the `Compiler` class or its dependencies are not loading correctly on the server.

### Regressions Fixed
- **ZIP Upload Button:** Permanently removed from `index.html` (HTML and JS).
- **Compiler Robustness:** Added `try-catch` to `compiler.js` and improved result validation in `index.html`.
- **Version Output:** Restored `static VERSION = "0.4.0"` in `Compiler`.

### Next Steps
- Investigate Apache `.htaccess` for all-inkl to allow module imports.
- Ensure all file imports use consistent lower-case naming to avoid Linux case-sensitivity issues.