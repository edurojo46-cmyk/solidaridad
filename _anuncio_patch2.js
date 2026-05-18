    _anuncioReactionsChannel: null,
    _anuncioRemoteReactions: {},   // { [anuncioId]: { [emoji]: count } }

    // Carga reacciones desde Supabase y arranca suscripción Realtime
    async _initAnuncioReactions(anuncioIds) {
        // Cancelar suscripción anterior
        if (this._anuncioReactionsChannel && typeof sbClient !== 'undefined' && sbClient) {
            try { sbClient.removeChannel(this._anuncioReactionsChannel); } catch(e) {}
        }
        // Fetch inicial
        if (typeof db !== 'undefined' && db.getAnuncioReactions) {
            this._anuncioRemoteReactions = await db.getAnuncioReactions(anuncioIds) || {};
        }
        // Actualizar UI con los conteos iniciales
        this._applyRemoteReactionsToUI();
        // Suscripción Realtime
        if (typeof db !== 'undefined' && db.subscribeAnuncioReactions) {
            this._anuncioReactionsChannel = db.subscribeAnuncioReactions(row => {
                if (!this._anuncioRemoteReactions[row.anuncio_id]) this._anuncioRemoteReactions[row.anuncio_id] = {};
                this._anuncioRemoteReactions[row.anuncio_id][row.emoji] = row.count;
                this._updateEmojiBtn(row.anuncio_id, row.emoji, row.count);
            });
        }
    },

    _applyRemoteReactionsToUI() {
        Object.entries(this._anuncioRemoteReactions).forEach(([anuncioId, emojis]) => {
            Object.entries(emojis).forEach(([emoji, count]) => {
                this._updateEmojiBtn(anuncioId, emoji, count);
            });
        });
    },

    _updateEmojiBtn(anuncioId, emoji, count) {
        const row = document.getElementById('emoji-row-' + anuncioId);
        if (!row) return;
        const btns = row.querySelectorAll('button[data-emoji]');
        btns.forEach(btn => {
            if (btn.dataset.emoji === emoji) {
                btn.style.background   = count > 0 ? '#fff7ed' : '#f8fafc';
                btn.style.borderColor  = count > 0 ? '#fed7aa' : '#e2e8f0';
                btn.innerHTML = `<span>${emoji}</span>${count > 0 ? `<span style="font-size:0.75rem;font-weight:700;color:#f97316;">${count}</span>` : ''}`;
            }
        });
    },

    async _anuncioReact(anuncioId, emoji, btn) {
        // Animación inmediata
        btn.style.transform = 'scale(1.4)';
        setTimeout(() => btn.style.transform = '', 220);
        btn.disabled = true;
        setTimeout(() => btn.disabled = false, 1500);

        // Optimistic UI local
        if (!this._anuncioRemoteReactions[anuncioId]) this._anuncioRemoteReactions[anuncioId] = {};
        const optimistic = (this._anuncioRemoteReactions[anuncioId][emoji] || 0) + 1;
        this._anuncioRemoteReactions[anuncioId][emoji] = optimistic;
        this._updateEmojiBtn(anuncioId, emoji, optimistic);

        // Persistir en Supabase (Realtime enviará la actualización a todos los usuarios)
        if (typeof db !== 'undefined' && db.reactAnuncio) {
            const realCount = await db.reactAnuncio(anuncioId, emoji);
            if (realCount !== null && realCount !== undefined) {
                this._anuncioRemoteReactions[anuncioId][emoji] = realCount;
                this._updateEmojiBtn(anuncioId, emoji, realCount);
            }
        }
    },

    async shareAnuncio(anuncioId, title, description, photoUrl) {
        const pageUrl = window.location.href.split('?')[0];
        const shareData = {
            title: title || 'Anuncio Solidaridad',
            text: (description || '').substring(0, 120) + (description && description.length > 120 ? '...' : ''),
            url: pageUrl
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (e) {
                if (e.name === 'AbortError') return; // usuario canceló
            }
        }
        // Fallback: copiar al portapapeles
        const text = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        try {
            await navigator.clipboard.writeText(text);
            this._showShareToast('Enlace copiado al portapapeles \uD83D\uDCCB');
        } catch(e) {
            this._showShareToast('Compartí este anuncio: ' + pageUrl);
        }
    },

    _showShareToast(msg) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;padding:10px 20px;border-radius:20px;font-size:0.88rem;font-weight:600;z-index:999999;box-shadow:0 4px 16px rgba(0,0,0,0.25);white-space:nowrap;animation:scFadeIn 0.2s ease;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2800);
    },

