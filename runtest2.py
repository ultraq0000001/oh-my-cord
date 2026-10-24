import ctypes, os
dll_dir = r"C:\Users\kukus\AppData\Local\Temp\opencode\rtk_diag\Diagnostic_v2.0.8.3_1_0507\EXE\64"
os.chdir(dll_dir)
os.add_dll_directory(dll_dir)
rt = ctypes.CDLL(r"RTDiagLibV2.dll")
buf = ctypes.create_unicode_buffer(4096)
rt.API_GetAdapterList_W_V2.restype = ctypes.c_int
res = rt.API_GetAdapterList_W_V2(buf)
print(res)
print(buf.value)
