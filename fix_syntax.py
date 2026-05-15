import codecs
with codecs.open('c:/Users/Eduardo/Desktop/solidaridad/index.html', 'r', 'utf-8-sig') as f: lines = f.readlines()
del lines[9215:9297]
lines[9214] = lines[9214].replace('\n', '') + '
};\n'
with codecs.open('c:/Users/Eduardo/Desktop/solidaridad/index.html', 'w', 'utf-8') as f: f.writelines(lines)