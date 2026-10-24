import struct

def get_exports(path):
    data = open(path, 'rb').read()
    pe_off = struct.unpack_from('<I', data, 0x3c)[0]
    num_sec = struct.unpack_from('<H', data, pe_off + 6)[0]
    opt_size = struct.unpack_from('<H', data, pe_off + 20)[0]
    exp_rva, exp_size = struct.unpack_from('<II', data, pe_off + 24 + 112)
    sec_off = pe_off + 24 + opt_size
    sections = []
    for i in range(num_sec):
        s = data[sec_off + i*40 : sec_off + (i+1)*40]
        vsize, va, rsize, rptr = struct.unpack_from('<IIII', s, 8)
        sections.append((va, vsize, rptr, rsize))
    def rva2off(rva):
        for va, vsize, rptr, rsize in sections:
            if va <= rva < va + max(vsize, rsize):
                return rptr + (rva - va)
        return 0
    eoff = rva2off(exp_rva)
    num_funcs, num_names, funcs_rva, names_rva, ords_rva = struct.unpack_from('<IIIII', data, eoff + 20)
    funcs_off = rva2off(funcs_rva)
    names_off = rva2off(names_rva)
    ords_off = rva2off(ords_rva)
    exports = []
    for i in range(num_names):
        nrva = struct.unpack_from('<I', data, names_off + i*4)[0]
        ord_idx = struct.unpack_from('<H', data, ords_off + i*2)[0]
        frva = struct.unpack_from('<I', data, funcs_off + ord_idx*4)[0]
        noff = rva2off(nrva)
        name = data[noff:data.find(b'\x00', noff)].decode('ascii', errors='ignore')
        exports.append(name)
    return exports

drt = get_exports(r'C:\Users\kukus\AppData\Local\Temp\opencode\rtk_diag\Diagnostic_v2.0.8.3_1_0507\EXE\64\RtlDirectDiagLib64.dll')
for k in drt:
    if 'Cable' in k or 'PHYDiag' in k or 'CableTest' in k or 'CablePair' in k:
        print(k)
rt = get_exports(r'C:\Users\kukus\AppData\Local\Temp\opencode\rtk_diag\Diagnostic_v2.0.8.3_1_0507\EXE\64\RTDiagLibV2.dll')
for k in rt:
    if 'Cable' in k or 'CableTest' in k or 'CablePair' in k or 'PHYDiag' in k:
        print('RT:', k)
