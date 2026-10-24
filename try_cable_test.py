import ctypes, os, sys, time
from ctypes import wintypes

dll_dir = r'C:\Users\kukus\AppData\Local\Temp\opencode\rtk_diag\Diagnostic_v2.0.8.3_1_0507\EXE\64'
os.chdir(dll_dir)
os.add_dll_directory(dll_dir)
rt = ctypes.WinDLL(os.path.join(dll_dir, 'RTDiagLibV2.dll'))
drt = ctypes.WinDLL(os.path.join(dll_dir, 'RtlDirectDiagLib64.dll'))

# Get adapter list
buf = ctypes.create_unicode_buffer(4096)
rt.API_GetAdapterList_W_V2.restype = ctypes.c_int
res = rt.API_GetAdapterList_W_V2(buf)
print('adapters:', res)
print(buf.value)

# Try to open - maybe API_Open or Direct_API_Open
# Check what APIs expect
try:
    print('API_Open:', rt.API_Open)
    print('API_Close:', rt.API_Close)
    print('Direct_API_Open:', drt.Direct_API_Open)
    print('API_SetCurrAdaptIdx_V2:', rt.API_SetCurrAdaptIdx_V2)
except Exception as e:
    print(e)
