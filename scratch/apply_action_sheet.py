import codecs

with codecs.open('app_v309.js', 'r', 'utf-8') as f:
    text = f.read()

start_idx = text.find('function renderChatMsg(m, isSent) {')
end_idx = text.find('async function _addReaction(m, wrapper, emoji) {')

new_code = '''function renderChatMsg(m, isSent) {
    if (!m) return document.createElement('div');
    
    if (m.media_url && m.media_url.indexOf('http') !== 0 && m.media_url.indexOf('data:') !== 0) {
        var path = m.media_url;
        if (path.indexOf('chat_media/') === 0) path = path.substring(11);
        if (path.indexOf('/') === 0) path = path.substring(1);
        m.media_url = 'https://sqimiuwnhecspmugmacu.supabase.co/storage/v1/object/public/chat_media/' + path;
    }
    
    var wrapper = document.createElement('div');
    wrapper.className = 'wa-msg-row ' + (isSent ? 'wa-row-sent' : 'wa-row-recv');
    wrapper.setAttribute('data-msg-id', m.id || '');

    var bubble = document.createElement('div');
    bubble.className = 'wa-bubble ' + (isSent ? 'wa-bubble-sent' : 'wa-bubble-recv');
    if (m.media_url) {
        bubble.style.padding = '4px'; // Menos padding para imágenes
        bubble.style.overflow = 'hidden';
    }

    var timeStr = m.created_at
        ? new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
        : new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

    var contentContainer = document.createElement('div');
    contentContainer.style.position = 'relative';

    if (m.media_url) {
        var mediaWrap = document.createElement('div');
        mediaWrap.className = 'wa-media-wrap';
        mediaWrap.style.cssText = 'position:relative; width:260px; height:260px; border-radius:8px; overflow:hidden; background:#e0e0e0; cursor:pointer;';
        
        if (m.media_type === 'video') {
            var vid = document.createElement('video');
            vid.src = m.media_url;
            vid.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block;';
            mediaWrap.appendChild(vid);
            var playIcon = document.createElement('div');
            playIcon.innerHTML = '<i class="ri-play-circle-fill"></i>';
            playIcon.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:3rem; color:rgba(255,255,255,0.8); pointer-events:none;';
            mediaWrap.appendChild(playIcon);
            mediaWrap.onclick = function(e) { chatOpenViewer('vid', m.media_url); };
        } else {
            var img = document.createElement('img');
            img.src = m.media_url;
            img.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block;';
            mediaWrap.appendChild(img);
            mediaWrap.onclick = function(e) { chatOpenViewer('img', m.media_url); };
        }
        contentContainer.appendChild(mediaWrap);
        
        if (m.text && m.text.trim().length > 0) {
            var caption = document.createElement('div');
            caption.className = 'wa-msg-text wa-msg-caption';
            caption.style.cssText = 'padding:6px 4px 20px 4px; font-size:0.95rem; line-height:1.3; word-wrap:break-word;';
            caption.textContent = m.text;
            contentContainer.appendChild(caption);
        }
    } else {
        var txt = document.createElement('div');
        txt.className = 'wa-msg-text';
        txt.style.cssText = 'font-size:0.95rem; line-height:1.3; word-wrap:break-word; padding-right:20px;';
        txt.textContent = m.text || '';
        contentContainer.appendChild(txt);
    }

    bubble.appendChild(contentContainer);

    var footerHtml = document.createElement('div');
    footerHtml.className = 'wa-bubble-footer';
    footerHtml.style.cssText = 'display:flex; align-items:center; justify-content:flex-end; gap:3px; margin-left:auto; margin-top:4px;';
    
    if (m.media_url) {
        footerHtml.style.cssText = 'display:flex; align-items:center; justify-content:flex-end; gap:3px; position:absolute; bottom:8px; right:12px; z-index:5;';
    }
    
    var timeColor = m.media_url ? 'rgba(255,255,255,0.9)' : '';
    var tickColor = m.media_url ? (isSent && m.read ? '#53bdeb' : 'white') : '';
    
    footerHtml.innerHTML = '<span class="wa-bubble-time" style="color:' + timeColor + '; text-shadow:' + (m.media_url ? '0 1px 2px rgba(0,0,0,0.5)' : 'none') + ';">' + timeStr + '</span>' + 
        (isSent ? (m.read ? '<i class="ri-check-double-line" style="color:' + (m.media_url ? '#53bdeb' : '#53bdeb') + ';font-size:0.85rem;text-shadow:' + (m.media_url ? '0 1px 2px rgba(0,0,0,0.5)' : 'none') + '"></i>' : '<i class="ri-check-line" style="color:' + tickColor + ';font-size:0.85rem;text-shadow:' + (m.media_url ? '0 1px 2px rgba(0,0,0,0.5)' : 'none') + '"></i>') : '');

    if (m.media_url) {
        contentContainer.appendChild(footerHtml);
    } else {
        bubble.appendChild(footerHtml);
    }
    
    wrapper.appendChild(bubble);

    if (m.reactions && Object.keys(m.reactions).length > 0) {
        _renderReactions(m, wrapper);
    }

    // ACTION SHEET TRIGGER
    wrapper.onclick = function(e) {
        if (e.target.closest('.wa-reaction-pill')) return;
        if (e.target.tagName.toLowerCase() === 'img' && m.media_url) return;
        e.stopPropagation();
        openActionSheet(m, wrapper);
    };

    return wrapper;
}

function openActionSheet(m, wrapper) {
    if (document.querySelector('.wa-action-sheet-overlay')) return;
    
    var overlay = document.createElement('div');
    overlay.className = 'wa-action-sheet-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:999999; display:flex; flex-direction:column; justify-content:flex-end; opacity:0; transition:opacity 0.3s;';
    
    var sheet = document.createElement('div');
    sheet.className = 'wa-action-sheet';
    sheet.style.cssText = 'background:white; border-radius:20px 20px 0 0; padding:20px; transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1); padding-bottom:env(safe-area-inset-bottom, 20px);';
    
    var emojiRow = document.createElement('div');
    emojiRow.style.cssText = 'display:flex; justify-content:space-between; padding:10px 0 20px; border-bottom:1px solid #f0f0f0; margin-bottom:10px;';
    
    WA_EMOJIS.forEach(function(emoji) {
        var btn = document.createElement('button');
        btn.textContent = emoji;
        btn.style.cssText = 'font-size:1.8rem; background:none; border:none; cursor:pointer; padding:5px; transition:transform 0.1s;';
        btn.onclick = function(e) {
            e.stopPropagation();
            _addReaction(m, wrapper, emoji);
            closeSheet();
        };
        emojiRow.appendChild(btn);
    });
    
    var fwdRow = document.createElement('div');
    fwdRow.style.cssText = 'display:flex; align-items:center; gap:15px; padding:15px 10px; font-size:1.1rem; color:#333; cursor:pointer; border-radius:10px; transition:background 0.2s;';
    fwdRow.innerHTML = '<i class="ri-share-forward-line" style="font-size:1.5rem; color:#00a884;"></i> Reenviar mensaje';
    fwdRow.onclick = function(e) {
        e.stopPropagation();
        closeSheet();
        setTimeout(function() { _chatForward(m); }, 300);
    };
    
    var cancelRow = document.createElement('div');
    cancelRow.style.cssText = 'display:flex; align-items:center; justify-content:center; padding:15px 10px; margin-top:10px; font-size:1.1rem; color:#ef4444; cursor:pointer; font-weight:600;';
    cancelRow.textContent = 'Cancelar';
    cancelRow.onclick = function(e) {
        e.stopPropagation();
        closeSheet();
    };
    
    sheet.appendChild(emojiRow);
    sheet.appendChild(fwdRow);
    sheet.appendChild(cancelRow);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    
    overlay.onclick = function(e) {
        if (e.target === overlay) closeSheet();
    };
    
    function closeSheet() {
        sheet.style.transform = 'translateY(100%)';
        overlay.style.opacity = '0';
        setTimeout(function() { overlay.remove(); }, 300);
    }
    
    setTimeout(function() {
        overlay.style.opacity = '1';
        sheet.style.transform = 'translateY(0)';
    }, 10);
}

'''

final_text = text[:start_idx] + new_code + text[end_idx:]

with codecs.open('app_v309.js', 'w', 'utf-8') as f:
    f.write(final_text)