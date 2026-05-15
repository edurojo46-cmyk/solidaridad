
with open("index.html", "r", encoding="utf-8") as f:
    lines = f.read().splitlines()

for i in range(9085, 9105):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}")

