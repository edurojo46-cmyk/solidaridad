var WA_EMOJIS = ['\u2764\uFE0F','\uD83D\uDC4D','\uD83D\uDE02','\uD83D\uDE2E','\uD83D\uDE22','\uD83D\uDE4F','\uD83D\uDD25'];

function renderChatMsg(m, isSent) {
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
        bubble.style.padding = '4px';
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
        
        var isVid = m.media_type === 'video';
        if (isVid) {
            var vid = document.createElement('video');
            vid.src = m.media_url;
            vid.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block;';
            mediaWrap.appendChild(vid);
            var playIcon = document.createElement('div');
            playIcon.innerHTML = '<i class="ri-play-circle-fill"></i>';
            playIcon.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:3rem; color:rgba(255,255,255,0.8); pointer-events:none;';
            mediaWrap.appendChild(playIcon);
        } else {
            var img = document.createElement('img');
            img.src = m.media_url;
            img.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block;';
            mediaWrap.appendChild(img);
        }
        mediaWrap.onclick = function(e) { chatOpenViewer(isVid ? 'vid' : 'img', m.media_url); };
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
    
    var menuBtnStr = '<button class="wa-msg-menu-btn" style="background:none; border:none; color:' + (m.media_url ? 'white' : '#999') + '; font-size:1.2rem; padding:0 2px; cursor:pointer; margin-left:2px; text-shadow:' + (m.media_url ? '0 1px 2px rgba(0,0,0,0.5)' : 'none') + ';"><i class="ri-arrow-down-s-line"></i></button>';

    footerHtml.innerHTML = '<span class="wa-bubble-time" style="color:' + timeColor + '; text-shadow:' + (m.media_url ? '0 1px 2px rgba(0,0,0,0.5)' : 'none') + ';">' + timeStr + '</span>' + 
        (isSent ? (m.read ? '<i class="ri-check-double-line" style="color:' + (m.media_url ? '#53bdeb' : '#53bdeb') + ';font-size:0.85rem;text-shadow:' + (m.media_url ? '0 1px 2px rgba(0,0,0,0.5)' : 'none') + '"></i>' : '<i class="ri-check-line" style="color:' + tickColor + ';font-size:0.85rem;text-shadow:' + (m.media_url ? '0 1px 2px rgba(0,0,0,0.5)' : 'none') + '"></i>') : '') +
        menuBtnStr;

    if (m.media_url) {
        contentContainer.appendChild(footerHtml);
    } else {
        bubble.appendChild(footerHtml);
    }
    
    wrapper.appendChild(bubble);

    if (m.reactions && Object.keys(m.reactions).length > 0) {
        _renderReactions(m, wrapper);
    }

    setTimeout(function() {
        var btn = wrapper.querySelector('.wa-msg-menu-btn');
        if (btn) {
            btn.onclick = function(e) {
                e.stopPropagation();
                _showWhatsAppDropdown(e, m, wrapper);
            };
        }
    }, 10);

    return wrapper;
}

function _showWhatsAppDropdown(e, m, wrapper) {
    var existing = document.querySelector('.wa-dropdown-menu');
    if (existing) {
        existing.remove();
        if (existing.dataset.msgId === m.id) return;
    }

    var menu = document.createElement('div');
    menu.className = 'wa-dropdown-menu';
    menu.dataset.msgId = m.id || '';
    menu.style.cssText = 'position:fixed; background:white; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.2); padding:5px 0; z-index:10000; min-width:160px;';
    
    var optReact = document.createElement('div');
    optReact.style.cssText = 'padding:12px 15px; font-size:1rem; color:#333; cursor:pointer; display:flex; align-items:center; gap:10px; transition:background 0.2s;';
    optReact.innerHTML = '<i class="ri-emotion-line" style="font-size:1.2rem; color:#555;"></i> Reaccionar';
    optReact.onmouseover = function() { this.style.background = '#f5f5f5'; };
    optReact.onmouseout = function() { this.style.background = 'transparent'; };
    optReact.onclick = function(ev) {
        ev.stopPropagation();
        menu.remove();
        _showEmojiBarPopup(m, wrapper);
    };

    var optFwd = document.createElement('div');
    optFwd.style.cssText = 'padding:12px 15px; font-size:1rem; color:#333; cursor:pointer; display:flex; align-items:center; gap:10px; transition:background 0.2s;';
    optFwd.innerHTML = '<i class="ri-share-forward-line" style="font-size:1.2rem; color:#555;"></i> Reenviar';
    optFwd.onmouseover = function() { this.style.background = '#f5f5f5'; };
    optFwd.onmouseout = function() { this.style.background = 'transparent'; };
    optFwd.onclick = function(ev) {
        ev.stopPropagation();
        menu.remove();
        _chatForward(m);
    };

    menu.appendChild(optReact);
    menu.appendChild(optFwd);

    var rect = e.target.closest('button').getBoundingClientRect();
    var topPos = rect.bottom + 5;
    var leftPos = rect.left - 120;
    
    if (topPos + 100 > window.innerHeight) {
        topPos = rect.top - 100;
    }
    
    if (leftPos < 10) leftPos = 10;

    menu.style.top = topPos + 'px';
    menu.style.left = leftPos + 'px';

    document.body.appendChild(menu);

    setTimeout(function() {
        document.addEventListener('click', function closeMenu(ev) {
            if (!menu.contains(ev.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 10);
}

function _showEmojiBarPopup(m, wrapper) {
    var old = wrapper.querySelector('.wa-emoji-bar-popup');
    if (old) { old.remove(); return; }

    var bar = document.createElement('div');
    bar.className = 'wa-emoji-bar-popup';
    bar.style.cssText = 'position:absolute; display:flex; gap:4px; background:white; padding:6px 10px; border-radius:30px; box-shadow:0 4px 15px rgba(0,0,0,0.15); z-index:100; opacity:0; transition:opacity 0.2s; bottom:100%; right:10px; margin-bottom:5px;';
    
    WA_EMOJIS.forEach(function(emoji) {
        var btn = document.createElement('button');
        btn.textContent = emoji;
        btn.style.cssText = 'font-size:1.5rem; background:none; border:none; cursor:pointer; padding:2px; transition:transform 0.1s;';
        btn.onclick = function(e) {
            e.stopPropagation();
            _addReaction(m, wrapper, emoji);
            bar.remove();
        };
        btn.onmouseover = function() { this.style.transform = 'scale(1.2)'; };
        btn.onmouseout = function() { this.style.transform = 'scale(1)'; };
        bar.appendChild(btn);
    });

    var bubble = wrapper.querySelector('.wa-bubble');
    if (bubble) {
        bubble.style.position = 'relative';
        bubble.appendChild(bar);
        setTimeout(function() { bar.style.opacity = '1'; }, 10);
    }
}