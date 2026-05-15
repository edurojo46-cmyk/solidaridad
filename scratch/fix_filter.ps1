$c = [System.IO.File]::ReadAllText('C:\Users\Eduardo\Desktop\solidaridad\app.js', [System.Text.Encoding]::UTF8)

$start = $c.IndexOf('function filterChats()')
$end = $c.IndexOf('function filterChatTab', $start)
$c = $c.Remove($start, $end - $start)

$newFilter = "function filterChats() {
    var val = document.getElementById('chat-search').value.toLowerCase();
    var items = document.querySelectorAll('.chat-contact-item');
    items.forEach(function(item) {
        var name = item.getAttribute('data-name');
        if (name && name.includes(val)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });

    var listContainer = document.getElementById('chat-contacts-list');
    var globalContainer = document.getElementById('global-search-results-container');
    if (!globalContainer) {
        globalContainer = document.createElement('div');
        globalContainer.id = 'global-search-results-container';
        globalContainer.style.marginTop = '10px';
        globalContainer.style.borderTop = '1px solid #e2e8f0';
        globalContainer.style.paddingTop = '10px';
        if (listContainer) listContainer.appendChild(globalContainer);
    }

    if (!val || val.length < 3) {
        globalContainer.innerHTML = '';
        return;
    }

    globalContainer.innerHTML = '<div style=""text-align:center;padding:10px;color:#94a3b8;font-size:0.8rem;""><i class=""ri-loader-4-line ri-spin""></i> Buscando usuarios globales...</div>';

    clearTimeout(window.chatGlobalSearchTimer);
    window.chatGlobalSearchTimer = setTimeout(async function() {
        if (!window.db || !window.db.searchUsersGlobal) return;
        var results = await window.db.searchUsersGlobal(val);
        
        if (results.length === 0) {
            globalContainer.innerHTML = '<div style=""text-align:center;padding:10px;color:#94a3b8;font-size:0.8rem;"">No se encontraron usuarios nuevos</div>';
            return;
        }
        
        var html = '<div style=""font-size:0.75rem;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:8px;padding-left:16px;"">Descubrir Usuarios</div>';
        results.forEach(function(u) {
            var ini = u.nombre ? u.nombre.substring(0, 2).toUpperCase() : '??';
            var color = u.color || '#3498db';
            var avatarHtml = u.avatar_url 
                ? '<img src=""' + u.avatar_url + '"" style=""width:100%;height:100%;object-fit:cover;border-radius:50%;"">' 
                : '<div style=""width:100%;height:100%;border-radius:50%;background:'+color+';color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;"">'+ini+'</div>';
                
            var uData = { id: u.id, name: u.nombre || 'Sin Nombre', color: color, avatar: u.avatar_url };
            var escapedJson = JSON.stringify(uData).replace(/""/g, '&quot;').replace(/'/g, '\\''');
            
            html += '<div class=""chat-contact-item new-contact"" onclick=""openGlobalChat(' + escapedJson + ')"" style=""background:#f8fafc;border:1px dashed #cbd5e1;"">' +
                        '<div class=""chat-avatar"">' + avatarHtml + '</div>' +
                        '<div class=""chat-info"">' +
                            '<h4>' + (u.nombre || 'Sin Nombre') + ' <span style=""font-size:0.65rem;background:#3b82f6;color:white;padding:2px 6px;border-radius:10px;margin-left:4px;vertical-align:middle;"">Nuevo</span></h4>' +
                            '<p style=""color:#3b82f6;font-size:0.8rem;""><i class=""ri-chat-new-line""></i> Toca para iniciar chat</p>' +
                        '</div>' +
                    '</div>';
        });
        globalContainer.innerHTML = html;
    }, 500);
}

"
$c = $c.Insert($start, $newFilter)

$start2 = $c.IndexOf('window.filterMsgList = function(q) {')
if ($start2 -gt 0) {
    $end2 = $c.IndexOf('};', $start2) + 2
    $c = $c.Remove($start2, $end2 - $start2)
}

[System.IO.File]::WriteAllText('C:\Users\Eduardo\Desktop\solidaridad\app.js', $c, [System.Text.Encoding]::UTF8)
Write-Host 'Done'
