path = r'C:\Users\kukus\AppData\Local\Temp\opencode\rtk_diag\Diagnostic_v2.0.8.3_1_0507\EXE\64\8169DiagV2.exe'
data = open(path, 'rb').read()
# ascii strings
res = []
i = 0
while i < len(data):
    if 32 <= data[i] < 127:
        j = i
        while j < len(data) and 32 <= data[j] < 127:
            j += 1
        s = data[i:j]
        if len(s) >= 4:
            res.append(s)
        i = j
    else:
        i += 1
for s in res:
    try:
        st = s.decode()
        if 'Cable' in st or 'TDR' in st or 'Pair' in st or 'Open' in st or 'Short' in st:
            print(st)
    except:
        pass
