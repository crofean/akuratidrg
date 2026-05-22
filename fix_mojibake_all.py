import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def char_to_byte(c):
    cp = ord(c)
    try:
        b = c.encode('cp874')
        if len(b) == 1:
            return b[0]
    except Exception:
        pass
    if 0x80 <= cp <= 0xFF:
        return cp
    return None


def fix_mojibake(text):
    """Fix cp874-mojibaked text back to correct Unicode (emoji etc.)"""
    result = []
    i = 0
    chars = list(text)
    while i < len(chars):
        c = chars[i]
        if ord(c) <= 127:
            result.append(c)
            i += 1
            continue
        run_start = i
        raw_bytes = []
        while i < len(chars) and ord(chars[i]) > 127:
            b = char_to_byte(chars[i])
            if b is not None:
                raw_bytes.append(b)
            i += 1
        if raw_bytes:
            try:
                decoded = bytes(raw_bytes).decode('utf-8', errors='replace')
                if '\ufffd' not in decoded:
                    result.append(decoded)
                    continue
            except Exception:
                pass
        # Fallback: keep original chars
        result.append(''.join(chars[run_start:i]))
    return ''.join(result)


# -------------------------------------------------------
# Read the file
# -------------------------------------------------------
with open(r'd:\SAK-iDRG\src\App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

print("Original file length: %d chars" % len(content))

# -------------------------------------------------------
# Apply mojibake fix
# -------------------------------------------------------
fixed_content = fix_mojibake(content)
print("Fixed file length:    %d chars" % len(fixed_content))

# Count how many chars changed
changed = sum(1 for a, b in zip(content, fixed_content) if a != b)
print("Characters changed:   %d" % changed)

# -------------------------------------------------------
# Update version number
# Current: Alpha v1.4.6 (210520261156)
# New:     Alpha v1.4.7 (220520260237)  <- 22/05/2026 02:37 WIB
# -------------------------------------------------------
old_ver_full = 'Alpha v1.4.6 (210520261156)'
new_ver_full = 'Alpha v1.4.7 (220520260237)'
old_ver_short = 'Alpha v1.4.6'
new_ver_short = 'Alpha v1.4.7'

count_full = fixed_content.count(old_ver_full)
count_short = fixed_content.count(old_ver_short)
print("\nVersion occurrences (full):  %d" % count_full)
print("Version occurrences (short): %d" % count_short)

fixed_content = fixed_content.replace(old_ver_full, new_ver_full)
fixed_content = fixed_content.replace(old_ver_short, new_ver_short)

ver_after = fixed_content.count(new_ver_short)
print("Version locations after fix: %d" % ver_after)

# -------------------------------------------------------
# Write back
# -------------------------------------------------------
with open(r'd:\SAK-iDRG\src\App.jsx', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("\nFile written successfully!")

# -------------------------------------------------------
# Verify: check remaining suspicious chars
# -------------------------------------------------------
lines = fixed_content.splitlines()
suspicious_lines = []
for i, line in enumerate(lines):
    for c in line:
        cp = ord(c)
        if (0x0E00 <= cp <= 0x0E7F) or (0x80 <= cp <= 0x9F):
            suspicious_lines.append(i + 1)
            break

if suspicious_lines:
    print("\nLines still with suspicious chars: %s" % suspicious_lines[:20])
    # Show them
    for ln in suspicious_lines[:10]:
        seg = lines[ln - 1]
        non_ascii = [(hex(ord(c)), c) for c in seg if ord(c) > 127]
        print("  L%d: %s" % (ln, str(non_ascii[:8])))
else:
    print("\nAll mojibake fixed! No suspicious Thai/control chars remaining.")

# Show some sample fixed lines for verification
print("\nSample fixes:")
sample_lines = [13, 33, 56, 2532, 2615, 2665, 2705, 2717]
for ln in sample_lines:
    if ln <= len(lines):
        line = lines[ln - 1]
        non_ascii = ''.join(c for c in line if ord(c) > 127)
        if non_ascii:
            print("  L%d: ...%s..." % (ln, non_ascii[:50]))
