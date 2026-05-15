import io
with io.open('c:/Users/Eduardo/Desktop/solidaridad-nuevo/index.html', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('<script src=" auth.js?v=276\></script>', '')
content = content.replace('<script src=\supabase.js?v=276\></script>', '')
content = content.replace('<script src=\app.js?v=276\></script>', '')
with io.open('c:/Users/Eduardo/Desktop/solidaridad/index.html', 'w', encoding='utf-8') as f:
 f.write(content)