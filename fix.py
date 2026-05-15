import codecs
with codecs.open('c:/Users/Eduardo/Desktop/solidaridad/index.html', 'r', 'utf-8-sig') as f: text = f.read()
text = text.replace('<script src=\\auth.js?v=450\\></script>', '<script src=" auth.js?v=450\></script>')
text = text.replace('<script src=\\supabase.js?v=450\\></script>', '<script src=\supabase.js?v=450\></script>')
text = text.replace('<script src=\\app.js?v=450\\></script>', '<script src=\app.js?v=450\></script>')
text = text.replace('<script src=\\chat-pro.js?v=450\\></script>', '<script src=\chat-pro.js?v=450\></script>')
with codecs.open('c:/Users/Eduardo/Desktop/solidaridad/index.html', 'w', 'utf-8') as f: f.write(text)