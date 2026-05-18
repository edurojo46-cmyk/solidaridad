$ErrorActionPreference = "Stop"

$indexHtmlPath = "index.html"
$content = [System.IO.File]::ReadAllText($indexHtmlPath)

# 1. Mobile Nav
$mobileTarget = "<a href=`"#`" onclick=`"app.mobileNav('screen-Comedores')`"><i class=`"ri-building-4-line`"></i> Comedores</a>"
$mobileReplacement = $mobileTarget + "`n            <a href=`"#`" onclick=`"app.mobileNav('screen-anuncios')`"><i class=`"ri-megaphone-line`"></i> Anuncios</a>"
if (-not $content.Contains("screen-anuncios")) {
    $content = $content.Replace($mobileTarget, $mobileReplacement)
}

# 2. Desktop Nav
$desktopTarget = "<a href=`"#`" onclick=`"app.navigate('screen-Comedores')`">Comedores</a>"
$desktopReplacement = $desktopTarget + "`n            <a href=`"#`" onclick=`"app.navigate('screen-anuncios')`">Anuncios</a>"
if (-not $content.Contains("app.navigate('screen-anuncios')")) {
    $content = $content.Replace($desktopTarget, $desktopReplacement)
}

# 3. Screen Anuncios
$screenTarget = "    <!-- 2.05 MIS INTENCIONES -->"
$screenReplacement = @"
    <!-- 2.01 ANUNCIOS -->
    <section id="screen-anuncios" class="screen gradient-bg">
        <div class="top-bar glass">
            <button class="icon-btn" onclick="app.navigate('screen-splash')"><i class="ri-arrow-left-line"></i></button>
            <h2><i class="ri-megaphone-fill" style="color:var(--clr-primary);margin-right:6px"></i> Anuncios</h2>
            <button class="icon-btn" onclick="app.openAnuncioModal()" title="Publicar Anuncio"><i class="ri-add-circle-fill"></i></button>
        </div>

        <div class="intenciones-scrollarea">
            <div class="intenciones-hero" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6);">
                <div class="intenciones-hero-icon"><i class="ri-megaphone-fill"></i></div>
                <h2>Publicaciones de Fundaciones</h2>
                <p style="color: rgba(255,255,255,0.8); text-align: center; font-size: 0.95rem; max-width: 300px;">Descubre y comparte las últimas actividades solidarias en tu comunidad.</p>
            </div>

            <!-- List of Anuncios -->
            <div class="community-intentions" style="padding-bottom: 80px;">
                <div class="community-intentions-list" id="anuncios-list" style="display:flex; flex-direction:column; gap:16px;">
                    <!-- Cards will be populated here -->
                </div>
            </div>
        </div>

        <!-- FAB for Anuncios -->
        <button class="fab-create-new" onclick="app.openAnuncioModal()" title="Publicar un Anuncio" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
            <i class="ri-add-line"></i>
            <span>Publicar</span>
        </button>
    </section>

    <!-- ANUNCIOS MODAL -->
    <div id="anuncio-modal-overlay" class="custom-dialog-overlay" style="display:none; z-index: 100000; animation: scFadeIn 0.2s ease; opacity: 1;">
        <div class="custom-dialog-box" style="transform: scale(1); opacity: 1; max-width: 500px; max-height: 90vh; overflow-y: auto;">
            <div class="custom-dialog-icon icon-prompt" style="background: #eff6ff; color: #3b82f6;"><i class="ri-megaphone-fill"></i></div>
            <h3 class="custom-dialog-title">Publicar Anuncio</h3>
            <p class="custom-dialog-desc">Completa los datos de la actividad o anuncio de tu fundación.</p>
            
            <form id="form-anuncio" onsubmit="event.preventDefault(); app.submitAnuncio();" style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                <input type="text" id="anuncio-title" class="custom-dialog-input" placeholder="Título del anuncio..." required>
                <textarea id="anuncio-desc" class="custom-dialog-input" placeholder="Descripción detallada de la actividad..." rows="4" required style="resize: vertical; font-family: inherit;"></textarea>
                
                <div style="border: 2px dashed #cbd5e1; padding: 16px; border-radius: 14px; text-align: center; cursor: pointer; transition: all 0.2s; background: #f8fafc;" id="anuncio-photo-container" onclick="document.getElementById('anuncio-photo-input').click()">
                    <i class="ri-image-add-fill" style="font-size: 2rem; color: #94a3b8;"></i>
                    <p style="margin: 8px 0 0; color: #64748b; font-size: 0.9rem;">Toca para subir una foto</p>
                    <input type="file" id="anuncio-photo-input" accept="image/*" style="display: none;" onchange="app.handleAnuncioPhoto(event)">
                    <img id="anuncio-photo-preview" src="" style="display: none; width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-top: 10px;">
                </div>

                <div class="custom-dialog-buttons" style="margin-top: 16px;">
                    <button type="button" class="cd-btn cd-btn-cancel" onclick="app.closeAnuncioModal()">Cancelar</button>
                    <button type="submit" class="cd-btn cd-btn-confirm" id="btn-submit-anuncio" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">Publicar <i class="ri-send-plane-fill"></i></button>
                </div>
            </form>
        </div>
    </div>

    <!-- 2.05 MIS INTENCIONES -->
"@
if (-not $content.Contains("id=`"screen-anuncios`"")) {
    $content = $content.Replace($screenTarget, $screenReplacement)
}

[System.IO.File]::WriteAllText($indexHtmlPath, $content, [System.Text.Encoding]::UTF8)
Write-Output "index.html patched"


# Patch supabase.js
$supabaseJsPath = "supabase.js"
$contentSb = [System.IO.File]::ReadAllText($supabaseJsPath)
$sbTarget = "    // ==================== IGLESIAS COMUNIDAD ===================="
$sbReplacement = @"
    // ==================== ANUNCIOS ====================
    async createAnuncio(anuncio) {
        if (!sbClient) { saveLocal('anuncios', anuncio); return anuncio; }
        let payload = Object.assign({}, anuncio);
        if (payload.id && !/^[0-9a-f]{8}-/.test(payload.id)) delete payload.id;
        const { data, error } = await sbClient.from('anuncios').insert(payload).select().single();
        if (error) {
            console.error('[DB] Error inserting anuncio:', error.message);
            saveLocal('anuncios', anuncio);
            return anuncio;
        }
        return data;
    },

    async getAnuncios() {
        if (!sbClient) return getLocal('anuncios');
        const { data, error } = await sbClient.from('anuncios').select('*').order('created_at', {ascending:false});
        if (error) {
            console.error('[DB] Error fetching anuncios:', error.message);
            return getLocal('anuncios');
        }
        return data || [];
    },

    async uploadAnuncioMedia(file) {
        if (!sbClient) return null;
        const ext = file.name.split('.').pop().toLowerCase();
        const bucket = 'chat-media';
        const path = `anuncios/` + Date.now() + `_` + Math.random().toString(36).slice(2) + `.` + ext;
        const { error: upErr } = await sbClient.storage.from(bucket).upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
        });
        if (upErr) {
            console.error('[Chat] Upload error:', upErr.message);
            return null;
        }
        const { data: urlData } = sbClient.storage.from(bucket).getPublicUrl(path);
        return urlData?.publicUrl || null;
    },

    // ==================== IGLESIAS COMUNIDAD ====================
"@
if (-not $contentSb.Contains("async getAnuncios(")) {
    $contentSb = $contentSb.Replace($sbTarget, $sbReplacement)
    [System.IO.File]::WriteAllText($supabaseJsPath, $contentSb, [System.Text.Encoding]::UTF8)
    Write-Output "supabase.js patched"
}

# Patch app.js
$appJsPath = "app.js"
$contentApp = [System.IO.File]::ReadAllText($appJsPath)

$appTarget = "    // Buscar page: filter cards by search text"
$appReplacement = @"
    // ==================== ANUNCIOS ====================
    anuncioFile: null,
    
    async loadAnuncios() {
        const list = document.getElementById('anuncios-list');
        if (!list) return;
        
        list.innerHTML = '<div style="text-align:center; padding: 40px 0;"><i class="ri-loader-4-line ri-spin" style="font-size:2rem; color:var(--clr-primary)"></i><p style="margin-top:10px; color:var(--clr-text-muted);">Cargando anuncios...</p></div>';
        
        let anuncios = [];
        if (typeof db !== 'undefined' && db.getAnuncios) {
            anuncios = await db.getAnuncios();
        }
        
        list.innerHTML = '';
        if (anuncios.length === 0) {
            list.innerHTML = '<div class="buscar-empty-state" style="text-align:center; padding: 40px 20px;"><i class="ri-megaphone-line" style="font-size:3rem; color:#cbd5e1; margin-bottom:16px; display:block;"></i><h4 style="color:#64748b; margin:0 0 8px;">No hay anuncios aún</h4><p style="color:#94a3b8; font-size:0.9rem; margin:0;">Sé el primero en publicar una actividad solidaria.</p></div>';
            return;
        }
        
        anuncios.forEach(anuncio => {
            const card = document.createElement('div');
            card.className = 'glass card';
            card.style.cssText = 'padding: 0; overflow: hidden; border-radius: 16px; margin-bottom: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); background: #ffffff;';
            
            let photoHtml = '';
            if (anuncio.photo_url) {
                photoHtml = `<img src="` + anuncio.photo_url + `" style="width: 100%; height: 200px; object-fit: cover; display: block;" onerror="this.style.display='none'">`;
            }
            
            const dateStr = anuncio.created_at ? new Date(anuncio.created_at).toLocaleDateString('es-ES', {day:'numeric', month:'short', year:'numeric'}) : 'Reciente';
            const creatorName = anuncio.creator_name || 'Fundación Anónima';
            
            card.innerHTML = `
                ` + photoHtml + `
                <div style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">` + (anuncio.title || 'Sin Título') + `</h3>
                    </div>
                    <p style="margin: 0 0 16px 0; color: #475569; line-height: 1.6; font-size: 0.95rem; white-space: pre-wrap;">` + (anuncio.description || '') + `</p>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.05);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #2563eb); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.8rem;">
                                ` + creatorName.charAt(0).toUpperCase() + `
                            </div>
                            <span style="font-size: 0.85rem; font-weight: 600; color: #334155;">` + creatorName + `</span>
                        </div>
                        <span style="font-size: 0.8rem; color: #94a3b8;"><i class="ri-calendar-line"></i> ` + dateStr + `</span>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    },

    openAnuncioModal() {
        document.getElementById('form-anuncio').reset();
        document.getElementById('anuncio-photo-preview').style.display = 'none';
        document.getElementById('anuncio-photo-preview').src = '';
        this.anuncioFile = null;
        const modal = document.getElementById('anuncio-modal-overlay');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    },

    closeAnuncioModal() {
        const modal = document.getElementById('anuncio-modal-overlay');
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    },

    handleAnuncioPhoto(e) {
        const file = e.target.files[0];
        if (!file) return;
        this.anuncioFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('anuncio-photo-preview');
            img.src = e.target.result;
            img.style.display = 'block';
        };
        reader.readAsDataURL(file);
    },

    async submitAnuncio() {
        const title = document.getElementById('anuncio-title').value.trim();
        const desc = document.getElementById('anuncio-desc').value.trim();
        if (!title || !desc) return;
        
        const btn = document.getElementById('btn-submit-anuncio');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Publicando...';
        btn.disabled = true;
        
        const user = typeof auth !== 'undefined' && auth.isAuthenticated() ? auth.getCurrentUser() : null;
        let photo_url = null;
        
        if (this.anuncioFile && typeof db !== 'undefined' && db.uploadAnuncioMedia) {
            photo_url = await db.uploadAnuncioMedia(this.anuncioFile);
        }
        
        const payload = {
            id: Date.now().toString(36),
            title: title,
            description: desc,
            photo_url: photo_url,
            creator_id: user ? user.id : 'anon',
            creator_name: user ? user.name : 'Anónimo',
            created_at: new Date().toISOString()
        };
        
        if (typeof db !== 'undefined' && db.createAnuncio) {
            await db.createAnuncio(payload);
        }
        
        this.closeAnuncioModal();
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        this.loadAnuncios();
    },

    // Buscar page: filter cards by search text
"@

$navTarget = "        if (screenId === 'screen-map' || screenId === 'screen-Comedores') {"
$navReplacement = @"
        if (screenId === 'screen-anuncios') {
            this.loadAnuncios();
        }
        if (screenId === 'screen-map' || screenId === 'screen-Comedores') {
"@

if (-not $contentApp.Contains("openAnuncioModal()")) {
    $contentApp = $contentApp.Replace($appTarget, $appReplacement)
    $contentApp = $contentApp.Replace($navTarget, $navReplacement)
    [System.IO.File]::WriteAllText($appJsPath, $contentApp, [System.Text.Encoding]::UTF8)
    Write-Output "app.js patched"
}
