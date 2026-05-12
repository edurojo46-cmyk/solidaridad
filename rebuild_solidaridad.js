// Rebuild clean SOLIDARIDAD index.html from scratch
// Strategy: use original_index_utf8.html as base, apply branding substitutions,
// then inject the new sections (Comedores, Situacion Calle nav, Eventos)

var stream = new ActiveXObject("ADODB.Stream");

// Read the UTF-8 original
stream.Type = 2;
stream.Charset = "utf-8";
stream.Open();
stream.LoadFromFile("original_index_utf8.html");
var text = stream.ReadText();
stream.Close();

function rep(t, bad, good) {
    while (t.indexOf(bad) !== -1) t = t.split(bad).join(good);
    return t;
}

// =====================
// 1. BRANDING: Red Maria → SOLIDARIDAD
// =====================
text = rep(text, "<title>Red Maria</title>", "<title>SOLIDARIDAD</title>");
text = rep(text, ">Red Maria<", ">SOLIDARIDAD<");
text = rep(text, "'Red Maria'", "'SOLIDARIDAD'");
text = rep(text, "\"Red Maria\"", "\"SOLIDARIDAD\"");
text = rep(text, "Red Maria", "SOLIDARIDAD");
// Logo title specific
text = rep(text, "<h1 class=\"logo-title\">SOLIDARIDAD</h1>", "<h1 class=\"logo-title\">SOLIDARIDAD</h1>");
// version bump for cache busting
text = rep(text, "?v=95", "?v=101");
text = rep(text, "?v=96", "?v=101");
text = rep(text, "?v=97", "?v=101");
text = rep(text, "?v=98", "?v=101");
text = rep(text, "?v=99", "?v=101");
text = rep(text, "?v=100", "?v=101");

// =====================
// 2. MOBILE NAV: replace old nav items
// =====================
var oldMobileMap = "<a href=\"#\" onclick=\"app.mobileNav('screen-map')\"><i class=\"ri-map-pin-line\"></i> Buscar</a>";
var newMobileMap = "<a href=\"#\" onclick=\"app.mobileNav('screen-map')\"><i class=\"ri-map-pin-user-line\"></i> Situaci\u00f3n Calle</a>\n            <a href=\"#\" onclick=\"app.mobileNav('screen-eventos')\"><i class=\"ri-calendar-event-line\"></i> Eventos</a>\n            <a href=\"#\" onclick=\"app.mobileNav('screen-create-rosary')\"><i class=\"ri-add-circle-line\"></i> Publicar Evento</a>\n            <a href=\"#\" onclick=\"app.mobileNav('screen-Comedores')\"><i class=\"ri-restaurant-line\"></i> Comedores</a>";
text = rep(text, oldMobileMap, newMobileMap);

// Remove "Crear Rosario" from mobile nav (was replaced by Publicar Evento above)
text = rep(text, "<a href=\"#\" onclick=\"app.mobileNav('screen-create-rosary')\"><i class=\"ri-add-circle-line\"></i> Crear Rosario</a>", "");

// =====================
// 3. DESKTOP NAV: replace
// =====================
var oldDesktopNav = "<a href=\"#\" onclick=\"app.navigate('screen-map')\">Buscar Rosarios</a>";
var newDesktopNav = "<a href=\"#\" onclick=\"app.navigate('screen-map')\">Situaci\u00f3n Calle</a>\n            <a href=\"#\" onclick=\"app.navigate('screen-eventos')\" style=\"font-weight:600;\"><i class=\"ri-calendar-event-line\" style=\"font-size:0.9rem;\"></i> Eventos</a>\n            <a href=\"#\" onclick=\"app.navigate('screen-Comedores')\"><i class=\"ri-restaurant-line\" style=\"color:#27ae60;font-size:0.9rem;\"></i> Comedores</a>";
text = rep(text, oldDesktopNav, newDesktopNav);

var oldCreateRosario = "<a href=\"#\" onclick=\"app.navigate('screen-create-rosary')\">Crear Rosario</a>";
var newPublicarEvento = "<a href=\"#\" onclick=\"app.navigate('screen-create-rosary')\"><i class=\"ri-add-circle-line\"></i> Publicar Evento</a>";
text = rep(text, oldCreateRosario, newPublicarEvento);

// "Buscar" dropdown item
text = rep(text, ">Buscar<", ">Buscar<");

// =====================
// 4. SPLASH SUBTITLE
// =====================
text = rep(text, "\"Unite a la red de oraci\u00f3n de la Virgen al mundo por la fe, la esperanza y el amor..\"",
    "\"Red Solidaria de Comedores, Alertas y Apoyo Comunitario\"");

// =====================
// 5. APP.JS → include comedores_data.js before it
// =====================
text = rep(text, "<script src=\"app.js?v=101\"></script>",
    "<script src=\"comedores_data.js?v=101\"></script>\n    <script src=\"app.js?v=101\"></script>");

// =====================
// 6. ADD COMEDORES SCRIPT INLINE before </body>
// (These JS functions handle the Comedores grid)
// =====================
var comedoresScript = "\n<script>\nasync function loadAndRenderComedores() {\n    var renderData = JSON.parse(JSON.stringify(zonasData)).map(function(z) {\n        if (!z.Comedores) z.Comedores = z.iglesias || [];\n        return z;\n    });\n    if (typeof db !== 'undefined' && db.getComedoresComunidad) {\n        var communityComedores = await db.getComedoresComunidad();\n        var groups = {};\n        communityComedores.forEach(function(ig) {\n            var key = ig.pais + ' - ' + ig.ciudad;\n            if (!groups[key]) groups[key] = [];\n            groups[key].push({ n: ig.nombre, d: ig.direccion, h: ig.horarios });\n        });\n        var idCounter = 1000;\n        for (var k in groups) {\n            var splitK = k.split(' - ');\n            renderData.push({ id: idCounter++, nombre: splitK[1]+', '+splitK[0], sub: 'Agregado por la comunidad', icon: 'ri-building-4-fill', color: '#f39c12', grad: 'linear-gradient(135deg,#f39c12,#d35400)', Comedores: groups[k] });\n        }\n    }\n    window._activeZonasData = renderData;\n    var grid = document.getElementById('Comedores-grid');\n    if (!grid) return;\n    var html = '';\n    renderData.forEach(function(z) {\n        html += '<div class=\"ig-zona-card glass\" onclick=\"openComedoresDetail('+z.id+')\"><div class=\"ig-zona-accent\" style=\"background:'+z.grad+'\"></div><div class=\"ig-zona-body\"><div class=\"ig-zona-icon\" style=\"background:'+z.grad+'\"><i class=\"'+z.icon+'\"></i></div><div class=\"ig-zona-text\"><h4>'+z.nombre+'</h4><span class=\"ig-zona-sub\">'+z.sub+'</span></div><div class=\"ig-zona-badge\">'+z.Comedores.length+'</div></div></div>';\n    });\n    grid.innerHTML = html;\n}\nfunction openComedoresDetail(zoneId) {\n    var dataToUse = window._activeZonasData || zonasData;\n    var zona = dataToUse.find(function(z){ return z.id === zoneId; });\n    if (!zona) return;\n    document.getElementById('Comedores-detail-title').textContent = zona.nombre;\n    document.getElementById('Comedores-detail-count').textContent = zona.Comedores.length + ' Comedores';\n    document.getElementById('Comedores-detail-count').style.background = zona.grad;\n    var list = document.getElementById('Comedores-detail-list');\n    var html = '<div class=\"ig-detail-nota\" style=\"border-left:3px solid '+zona.color+'\"><i class=\"ri-map-pin-fill\" style=\"color:'+zona.color+'\"></i> '+zona.sub+'</div>';\n    zona.Comedores.forEach(function(ig) {\n        html += '<div class=\"ig-detail-item glass\"><div class=\"ig-detail-dot\" style=\"background:'+zona.color+'\"></div><div class=\"ig-detail-info\"><h4>'+ig.n+'</h4><span class=\"ig-detail-dir\"><i class=\"ri-map-pin-fill\"></i> '+ig.d+'</span><span class=\"ig-detail-hora\"><i class=\"ri-time-fill\"></i> '+ig.h+'</span></div></div>';\n    });\n    list.innerHTML = html;\n    document.getElementById('Comedores-main-view').style.display = 'none';\n    var panel = document.getElementById('Comedores-detail-panel');\n    panel.style.display = 'flex';\n    panel.classList.add('active');\n}\nfunction closeComedoresDetail() {\n    var panel = document.getElementById('Comedores-detail-panel');\n    if (panel) { panel.style.display = 'none'; panel.classList.remove('active'); }\n    var main = document.getElementById('Comedores-main-view');\n    if (main) main.style.display = '';\n}\nfunction filterComedoresGrid(query) {\n    var dataToUse = window._activeZonasData || zonasData;\n    var rawQ = query.trim();\n    var grid = document.getElementById('Comedores-grid');\n    var results = document.getElementById('Comedores-search-results');\n    if (!rawQ) { grid.style.display = ''; results.style.display = 'none'; results.innerHTML = ''; return; }\n    grid.style.display = 'none'; results.style.display = '';\n    var norm = function(s){ return (s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase(); };\n    var words = norm(rawQ).split(/\\s+/);\n    var html = ''; var count = 0;\n    dataToUse.forEach(function(z){\n        z.Comedores.forEach(function(ig){\n            var txt = norm(ig.n)+' '+norm(ig.d)+' '+norm(ig.h)+' '+norm(z.nombre)+' '+norm(z.sub);\n            if (words.every(function(w){ return txt.indexOf(w)!==-1; })) {\n                count++;\n                html += '<div class=\"ig-search-result glass\" onclick=\"openComedoresDetail('+z.id+')\"><div class=\"ig-sr-icon\" style=\"background:'+z.grad+'\"><i class=\"ri-restaurant-line\"></i></div><div class=\"ig-sr-info\"><h4>'+ig.n+'</h4><span>'+ig.d+' \u2022 '+ig.h+'</span><span class=\"ig-sr-zona\">'+z.nombre+'</span></div></div>';\n            }\n        });\n    });\n    if (!count) html = '<div class=\"ig-no-results\"><i class=\"ri-search-line\"></i><p>No se encontraron Comedores</p></div>';\n    results.innerHTML = html;\n}\ndocument.addEventListener('DOMContentLoaded', function() { setTimeout(loadAndRenderComedores, 500); });\nif (document.readyState === 'complete') setTimeout(loadAndRenderComedores, 500);\n</script>\n";

text = rep(text, "</body>", comedoresScript + "</body>");

// =====================
// WRITE OUTPUT
// =====================
stream.Open();
stream.Type = 2;
stream.Charset = "utf-8";
stream.WriteText(text);
stream.SaveToFile("index.html", 2);
stream.Close();

WScript.Echo("Done. Rebuilt index.html from original_index_utf8.html");
