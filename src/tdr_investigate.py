import ctypes, os, json, time, sys
dll_dir = r'C:\Users\kukus\AppData\Local\Temp\opencode\rtk_diag\Diagnostic_v2.0.8.3_1_0507\EXE\64'
os.chdir(dll_dir)
os.add_dll_directory(dll_dir)
drt = ctypes.WinDLL(os.path.join(dll_dir, 'RtlDirectDiagLib64.dll'))
rt = ctypes.WinDLL(os.path.join(dll_dir, 'RTDiagLibV2.dll'))

def run_seq(sleep, use_normal, use_steps, noarg):
    out={'sleep':sleep,'use_normal':use_normal,'use_steps':use_steps,'noarg':noarg,'pairs':[]}
    try:
        rt.API_EnableRTKDiag()
        rt.API_PHYDiagStart()
        time.sleep(sleep)
        if use_normal:
            try: drt.API_CableLengthNormal()
            except Exception as e: out['normal_err']=str(e)
        if use_steps:
            for fn in ['API_CableTestStep_1','API_CableTestStep_234','API_CableTestStep_5','API_FinishCableTest']:
                f=getattr(drt,fn,None)
                if f:
                    try: f()
                    except Exception as e: out.setdefault('step_errs',[]).append((fn,str(e)))
        time.sleep(1)
        for i in range(4):
            try:
                s = drt.API_GetCablePairStatus(i)
                if noarg:
                    try: l = drt.API_GetCablePairLength()
                    except Exception as e:
                        l = f'err:{e}'
                else:
                    try: l = drt.API_GetCablePairLength(i)
                    except Exception as e:
                        l = f'err:{e}'
                li = int(l) if not isinstance(l,str) else None
                out['pairs'].append({'pair':i,'status':int(s),'length_raw':li,'unsigned': (li & 0xFFFFFFFF) if li is not None else None})
            except Exception as e:
                out['pairs'].append({'pair':i,'error':str(e)})
        rt.API_PHYDiagEnd()
        rt.API_DisableRTKDiag()
    except Exception as e:
        out['error']=str(e)
    return out

results=[]
for sleep in [5,10]:
    for use_normal in [False,True]:
        for use_steps in [False,True]:
            for noarg in [False,True]:
                r=run_seq(sleep,use_normal,use_steps,noarg)
                results.append(r)
                print(json.dumps(r))
                time.sleep(2)
print('===ALL===')
print(json.dumps(results,indent=2))
PY