// =========== JS GLOBAL SEARCH ===========
var chatGlobalSearchTimer = null;
window.filterMsgList = function(q) {
    q = (q || '').trim().toLowerCase();
    
    // 1. Filter existing local chats
    var listContainer = document.getElementById('msg-list-container');
    if (listContainer) {
        var items = listContainer.querySelectorAll('.msg-item:not(#global-search-results-container)');
        items.forEach(function(item) {
            var name = (item.querySelector('h4') ? item.querySelector('h4').textContent : '').toLowerCase();
            if (!q || name.indexOf(q) > -1) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // 2. Global search
    var globalContainer = document.getElementById('global-search-results-container');
    if (!globalContainer) {
        globalContainer = document.createElement('div');
        globalContainer.id = 'global-search-results-container';
        globalContainer.style.marginTop = '10px';
        globalContainer.style.borderTop = '1px solid #e2e8f0';
        globalContainer.style.paddingTop = '10px';
        if (listContainer) listContainer.appendChild(globalContainer);
    }
    
    if (!q || q.length < 3) {
        globalContainer.innerHTML = '';
        return;
    }
    
    globalContainer.innerHTML = '<div style="text-align:center;padding:10px;color:#94a3b8;font-size:0.8rem;"><i class="ri-loader-4-line ri-spin"></i> Buscando usuarios globales...</div>';
    
    clearTimeout(chatGlobalSearchTimer);
    chatGlobalSearchTimer = setTimeout(async function() {
        if (!window.db || !window.db.searchUsersGlobal) return;
        var results = await window.db.searchUsersGlobal(q);
        
        if (results.length === 0) {
            globalContainer.innerHTML = '<div style="text-align:center;padding:10px;color:#94a3b8;font-size:0.8rem;">No se encontraron usuarios nuevos</div>';
            return;
        }
        
        var html = '<div style="font-size:0.75rem;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:8px;padding-left:16px;">Descubrir Usuarios</div>';
        results.forEach(function(u) {
            var ini = u.nombre ? u.nombre.substring(0, 2).toUpperCase() : '??';
            var color = u.color || '#3498db';
            var avatarHtml = u.avatar_url 
                ? '<img src="' + u.avatar_url + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">' 
                : '<div style="width:100%;height:100%;border-radius:50%;background:'+color+';color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;">'+ini+'</div>';
                
            var uData = { id: u.id, name: u.nombre || 'Sin Nombre', color: color, avatar: u.avatar_url };
            
            html += '<div class="msg-item new-contact" onclick=\'openGlobalChat('+JSON.stringify(uData)+')\' style="background:#f8fafc;border:1px dashed #cbd5e1;">' +
                        '<div class="msg-avatar">' + avatarHtml + '</div>' +
                        '<div class="msg-content">' +
                            '<h4>' + (u.nombre || 'Sin Nombre') + ' <span style="font-size:0.65rem;background:#3b82f6;color:white;padding:2px 6px;border-radius:10px;margin-left:4px;vertical-align:middle;">Nuevo</span></h4>' +
                            '<p style="color:#3b82f6;font-size:0.8rem;"><i class="ri-chat-new-line"></i> Toca para iniciar chat</p>' +
                        '</div>' +
                    '</div>';
        });
        globalContainer.innerHTML = html;
    }, 500);
};

window.openGlobalChat = function(userObj) {
    // 1. Check if chat exists locally
    var existingId = null;
    for (var k in msgConversations) {
        if (msgConversations[k].otherUser && msgConversations[k].otherUser.id === userObj.id) {
            existingId = k; break;
        }
    }
    
    if (existingId) {
        openChatView(existingId, msgConversations[existingId].otherUser);
    } else {
        // Create an optimistic local conversation
        var tempId = 'temp_' + Date.now();
        msgConversations[tempId] = {
            id: tempId,
            otherUser: userObj,
            messages: [],
            unread: 0,
            lastActivity: new Date().toISOString()
        };
        openChatView(tempId, userObj);
    }
    document.getElementById('msg-search-input').value = '';
    filterMsgList('');
};
