import sys

with open("index.html", "rb") as f:
    raw = f.read()

# Decode as UTF-8
text = raw.decode("utf-8", errors="replace")

# Fix Mojibake: double-encoded sequences
# These occur when UTF-8 bytes were interpreted as Latin-1 then re-encoded as UTF-8
replacements = [
    ("\u00c3\u00a1", "\u00e1"),  # á
    ("\u00c3\u00a9", "\u00e9"),  # é
    ("\u00c3\u00ad", "\u00ed"),  # í
    ("\u00c3\u00b3", "\u00f3"),  # ó
    ("\u00c3\u00ba", "\u00fa"),  # ú
    ("\u00c3\u00b1", "\u00f1"),  # ñ
    ("\u00c3\u0081", "\u00c1"),  # Á
    ("\u00c3\u0089", "\u00c9"),  # É
    ("\u00c3\u008d", "\u00cd"),  # Í
    ("\u00c3\u0093", "\u00d3"),  # Ó
    ("\u00c3\u009a", "\u00da"),  # Ú
    ("\u00c3\u0091", "\u00d1"),  # Ñ
    ("\u00c2\u00bf", "\u00bf"),  # ¿
    ("\u00c2\u00a1", "\u00a1"),  # ¡
    ("\u00c2\u00b0", "\u00b0"),  # °
    ("\u00c2\u00b7", "\u00b7"),  # ·
    ("\u00c3\u00bc", "\u00fc"),  # ü
    ("\u00c3\u00a0", "\u00e0"),  # à
    ("\u00c3\u00a8", "\u00e8"),  # è
    ("\u00c3\u00ae", "\u00ee"),  # î
    ("\u00c3\u00b4", "\u00f4"),  # ô
    ("\u00c3\u00bb", "\u00fb"),  # û
    ("\u00c3\u00a4", "\u00e4"),  # ä
    ("\u00c3\u00b6", "\u00f6"),  # ö
    ("\u00c3\u009c", "\u00dc"),  # Ü
    ("\u00c3\u0096", "\u00d6"),  # Ö
    ("\u00c3\u0084", "\u00c4"),  # Ä
    ("\u00c3\u0087", "\u00c7"),  # Ç
    ("\u00c3\u00b5", "\u00f5"),  # õ
    ("\u00c3\u00a3", "\u00e3"),  # ã
]

for bad, good in replacements:
    text = text.replace(bad, good)

out = text.encode("utf-8")
with open("index.html", "wb") as f:
    f.write(out)

print(f"Done. File size: {len(out)} bytes")
