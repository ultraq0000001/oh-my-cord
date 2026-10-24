import ctypes, os, json, time, sys
dll_dir = r'C:\Users\kukus\AppData\Local\Temp\opencode\rtk_diag\Diagnostic_v2.0.8.3_1_0507\EXE\64'
os.chdir(dll_dir)
os.add_dll_directory(dll_dir)
drt = ctypes.WinDLL(os.path.join(dll_dir, 'RtlDirectDiagLib64.dll'))
rt = ctypes.WinDLL(os.path.join(dll_dir, 'RTDiagLibV2.dll'))

result = {'pairs': [], 'raw': {}}
try:
    rt.API_EnableRTKDiag()
    rt.API_PHYDiagStart()
    time.sleep(3)
    try:
        drt.API_CableLengthNormal()
    except Exception:
        pass
    time.sleep(2)
    for i in range(4):
        try:
            s = drt.API_GetCablePairStatus(i)
            l = drt.API_GetCablePairLength(i)
            s_int = int(s)
            l_int = int(l)
            # Interpret status - common values: 0=OK, 1=Open, 2=Short
            status_map = {0: 'OK/Normal', 1: 'Open', 2: 'Short', 3: 'Cross/Impedance', 4: 'Unknown'}
            result['pairs'].append({
                'pair': i, 
                'status': s_int, 
                'status_text': status_map.get(s_int, f'Unknown({s_int})'), 
                'length_raw': l_int,
                'length_unsigned': l_int & 0xFFFFFFFF,
                'length_status': 'measured' if l_int > 0 else 'error_code',
            })
            result['raw'][f'pair{i}_status'] = s_int
            result['raw'][f'pair{i}_length'] = l_int
        except Exception as e:
            result['pairs'].append({'pair': i, 'error': str(e)})
    rt.API_PHYDiagEnd()
    rt.API_DisableRTKDiag()
    # NOTE: length_raw is a large negative value for all pairs; interpreted as
    # error codes, not lengths. length requires Realtek driver install or Linux ethtool.
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
    import traceback
    traceback.print_exc(file=sys.stderr)
