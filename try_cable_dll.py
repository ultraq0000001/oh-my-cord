import ctypes, os, time
from ctypes import wintypes

dll_dir = r'C:\Users\kukus\AppData\Local\Temp\opencode\rtk_diag\Diagnostic_v2.0.8.3_1_0507\EXE\64'
os.chdir(dll_dir)
os.add_dll_directory(dll_dir)
rt = ctypes.CDLL(os.path.join(dll_dir, 'RTDiagLibV2.dll'))
drt = ctypes.CDLL(os.path.join(dll_dir, 'RtlDirectDiagLib64.dll'))

# Get adapter list
buf = ctypes.create_unicode_buffer(4096)
rt.API_GetAdapterList_W_V2.restype = ctypes.c_int
res = rt.API_GetAdapterList_W_V2(buf)
print('adapters:', res)
adapters = buf.value.split('\n')
for i,a in enumerate(adapters):
    if a.strip():
        print(f'{i}: {a}')

# Try to open adapter 0
try:
    rt.API_SetCurrAdaptIdx_V2.restype = ctypes.c_int
    rt.API_SetCurrAdaptIdx_V2.argtypes = [ctypes.c_int]
    r = rt.API_SetCurrAdaptIdx_V2(0)
    print('set idx:', r)
    rt.API_Open.restype = ctypes.c_int
    r = rt.API_Open()
    print('open:', r)
except Exception as e:
    print(e)
    import traceback
    traceback.print_exc()
