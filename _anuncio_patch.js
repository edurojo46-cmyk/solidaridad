    _renderAnuncioCards(anuncios) {
        const EMOJIS = ['\u2764\ufe0f','\ud83d\udc4f','\ud83d\ude4c','\ud83c\udf1f','\ud83d\udd25'];
        const reactions = JSON.parse(localStorage.getItem('anuncio_reactions') || '{}');
        const list = document.getElementById('anuncios-list');
        if (!list) return;
        list.innerHTML = '';
        if (!anuncios || anuncios.length === 0) {
            const who = this._anuncioActiveCreatorName;
            list.innerHTML = `<div style="text-align:center;padding:48px 20px;">
                <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#fde68a,#f59e0b);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 8px 24px rgba(245,158,11,0.25);">
                    <i class="ri-megaphone-line" style="font-size:2rem;color:white;"></i>
                </div>
                <h4 style="color:#64748b;margin:0 0 8px;font-size:1.1rem;">No hay anuncios${who ? ' de ' + who : ' a\u00fan'}</h4>
                <p style="color:#94a3b8;font-size:0.9rem;margin:0;">${who ? 'Este usuario no ha publicado nada todav\u00eda.' : 'S\u00e9 el primero en publicar una actividad solidaria.'}</p>
            </div>`;
            return;
        }
        anuncios.forEach(anuncio => {
            const id = anuncio.id || anuncio.created_at || Math.random().toString(36);
            if (!reactions[id]) reactions[id] = {};
            const card = document.createElement('div');
            card.style.cssText = 'border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,0.08);margin-bottom:4px;transition:transform 0.2s,box-shadow 0.2s;';
            const creator = anuncio.creator_name || 'Fundaci\u00f3n An\u00f3nima';
            const avatarGrad = this._anuncioAvatarColor(creator);
            const dateStr = anuncio.created_at
                ? new Date(anuncio.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})
                : 'Reciente';
            const desc = (anuncio.description || '').trim();

            // ── FOTO: completa sin recorte, tap para lightbox ──
            let photoHtml = '';
            if (anuncio.photo_url) {
                const safeUrl   = anuncio.photo_url.replace(/'/g, "\\'");
                const safeTit   = (anuncio.title || '').replace(/'/g, "\\'");
                photoHtml = `<div style="position:relative;width:100%;background:#0f172a;cursor:zoom-in;" onclick="app.openAnuncioLightbox('${safeUrl}','${safeTit}')">
                    <img src="${anuncio.photo_url}" alt="${anuncio.title || ''}"
                        style="width:100%;height:auto;display:block;max-height:500px;object-fit:contain;"
                        onerror="this.parentElement.style.display='none'">
                    <div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.55);color:white;font-size:0.68rem;padding:3px 10px;border-radius:16px;pointer-events:none;backdrop-filter:blur(4px);">
                        <i class="ri-zoom-in-line"></i> Tocar para agrandar
                    </div>
                    <div style="position:absolute;top:10px;left:10px;background:#ef4444;color:white;font-size:0.62rem;font-weight:900;padding:3px 9px;border-radius:8px;letter-spacing:1px;text-transform:uppercase;box-shadow:0 2px 8px rgba(239,68,68,0.4);">Novedad</div>
                </div>`;
            }

            // ── BANNER (sin foto) ──
            const bannerHtml = !anuncio.photo_url ? `<div style="padding:28px 20px 20px;background:linear-gradient(135deg,#f97316,#dc2626);position:relative;">
                <div style="position:absolute;top:10px;left:10px;background:rgba(255,255,255,0.22);color:white;font-size:0.62rem;font-weight:900;padding:3px 9px;border-radius:8px;letter-spacing:1px;text-transform:uppercase;">Novedad</div>
                <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;margin-bottom:10px;">
                    <i class="ri-megaphone-fill" style="font-size:1.5rem;color:white;"></i>
                </div>
                <h3 style="margin:0;font-size:1.15rem;font-weight:800;color:white;line-height:1.3;">${anuncio.title || 'Sin T\u00edtulo'}</h3>
            </div>` : '';

            // ── EMOJIS de reacci\u00f3n ──
            const emojiRow = EMOJIS.map(em => {
                const cnt = reactions[id][em] || 0;
                return `<button onclick="app._anuncioReact('${id}','${em}',this)"
                    style="background:${cnt > 0 ? '#fff7ed' : '#f8fafc'};border:1.5px solid ${cnt > 0 ? '#fed7aa' : '#e2e8f0'};border-radius:20px;padding:5px 11px;cursor:pointer;font-size:0.92rem;display:inline-flex;align-items:center;gap:4px;transition:all 0.15s;font-family:inherit;">
                    <span>${em}</span>${cnt > 0 ? `<span style="font-size:0.75rem;font-weight:700;color:#f97316;">${cnt}</span>` : ''}
                </button>`;
            }).join('');

            const creatorEsc = creator.replace(/'/g, "\\'");
            const creatorId  = anuncio.creator_id || '';

            card.innerHTML = `
            ${photoHtml}
            ${bannerHtml}
            <div style="padding:14px 16px 16px;">
                ${anuncio.photo_url ? `<h3 style="margin:0 0 8px;font-size:1.1rem;font-weight:800;color:#1e293b;line-height:1.3;">${anuncio.title || 'Sin T\u00edtulo'}</h3>` : ''}
                ${desc ? `<p style="margin:0 0 14px;color:#475569;line-height:1.65;font-size:0.93rem;">${desc}</p>` : ''}
                <!-- Reacciones con emojis -->
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">${emojiRow}</div>
                <!-- Footer -->
                <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #f1f5f9;">
                    <button onclick="app.filterAnunciosByCreator('${creatorId}','${creatorEsc}',event)"
                        style="display:flex;align-items:center;gap:10px;background:none;border:none;cursor:pointer;padding:0;text-align:left;">
                        <div style="width:36px;height:36px;border-radius:50%;background:${avatarGrad};display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:0.9rem;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
                            ${creator.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-size:0.83rem;font-weight:700;color:#f97316;">${creator}</div>
                            <div style="font-size:0.72rem;color:#94a3b8;"><i class="ri-calendar-2-line"></i> ${dateStr}</div>
                        </div>
                    </button>
                    <button style="width:34px;height:34px;border-radius:50%;background:#fff7ed;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#f97316;font-size:1rem;" title="Compartir">
                        <i class="ri-share-forward-line"></i>
                    </button>
                </div>
            </div>`;
            list.appendChild(card);
        });
    },

    openAnuncioLightbox(url, title) {
        const ex = document.getElementById('anuncio-lightbox');
        if (ex) ex.remove();
        const lb = document.createElement('div');
        lb.id = 'anuncio-lightbox';
        lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.93);z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;';
        lb.innerHTML = `
            <button onclick="document.getElementById('anuncio-lightbox').remove()"
                style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.15);border:none;color:white;width:44px;height:44px;border-radius:50%;font-size:1.4rem;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);">
                <i class="ri-close-line"></i>
            </button>
            <img src="${url}" alt="${title || ''}"
                style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.6);">
            ${title ? `<p style="color:rgba(255,255,255,0.85);margin-top:14px;font-size:0.95rem;font-weight:600;text-align:center;max-width:340px;">${title}</p>` : ''}`;
        lb.onclick = e => { if (e.target === lb) lb.remove(); };
        document.body.appendChild(lb);
    },

    _anuncioReact(anuncioId, emoji, btn) {
        const r = JSON.parse(localStorage.getItem('anuncio_reactions') || '{}');
        if (!r[anuncioId]) r[anuncioId] = {};
        r[anuncioId][emoji] = (r[anuncioId][emoji] || 0) + 1;
        localStorage.setItem('anuncio_reactions', JSON.stringify(r));
        btn.style.transform = 'scale(1.35)';
        setTimeout(() => btn.style.transform = '', 200);
        const cnt = r[anuncioId][emoji];
        btn.style.background = '#fff7ed';
        btn.style.borderColor = '#fed7aa';
        btn.innerHTML = `<span>${emoji}</span><span style="font-size:0.75rem;font-weight:700;color:#f97316;">${cnt}</span>`;
    },

