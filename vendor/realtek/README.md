# Realtek Diagnostic DLLs

Bundled Realtek cable diagnostics libraries used by `src/rtk-tdr.js`.

## Files
- `RTDiagLibV2.dll`
- `RtlDirectDiagLib64.dll`

## Provenance
Copied from `C:\Users\kukus\AppData\Local\Temp\opencode\rtk_diag\Diagnostic_v2.0.8.3_1_0507\EXE\64\`
(Realtek diagnostic package v2.0.8.3, dated 2026-05-07).

These are loaded by the Python helper `src/rtk_cable_real.py` via ctypes.
If the vendor copies are missing, the tool falls back to the temp directory path.
