import ctypes, os, sys

dll_dir = r'C:\Users\kukus\AppData\Local\Temp\opencode\rtk_diag\Diagnostic_v2.0.8.3_1_0507\EXE\64'
os.add_dll_directory(dll_dir)
drt = ctypes.WinDLL(os.path.join(dll_dir, 'RtlDirectDiagLib64.dll'))
rt = ctypes.WinDLL(os.path.join(dll_dir, 'RTDiagLibV2.dll'))

# Try to find adapter info
# API_GetAdapterList_W_V2
buf = ctypes.create_unicode_buffer(4096)
try:
    rt.API_GetAdapterList_W_V2.argtypes = [ctypes.c_wchar_p]
    rt.API_GetAdapterList_W_V2.restype = ctypes.c_int
    res = rt.API_GetAdapterList_W_V2(buf)
    print('W_V2:', res)
    print(buf.value)
except Exception as e:
    print(e)
