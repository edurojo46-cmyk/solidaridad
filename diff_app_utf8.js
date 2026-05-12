diff --git a/app.js b/app.js
index 6bbb9d9..231b149 100644
--- a/app.js
+++ b/app.js
@@ -87,11 +87,85 @@ var app = {
             L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(this.buscarMap);
             L.control.zoom({ position: 'topright' }).addTo(this.buscarMap);
             this._buscarMarkers = [];
+            this._userLocationMarker = null;
+
+            // Detectar ubicaci├│n del usuario autom├íticamente
+            this._detectarUbicacionUsuario(true);
+
+            // Conectar bot├│n de ubicaci├│n
+            var self = this;
+            var locBtn = document.querySelector('.buscar-location-btn');
+            if (locBtn) {
+                locBtn.onclick = function() { self._detectarUbicacionUsuario(true); };
+            }
         } else {
-            this.buscarMap.invalidateSize();
+            setTimeout(() => this.buscarMap.invalidateSize(), 100);
         }
         // Always reload rosaries
         await this._loadBuscarRosaries();
+        // Cargar alertas de personas en calle
+        if (typeof app.cargarAlertasEnMapa === 'function') await app.cargarAlertasEnMapa();
+    },
+
+    _detectarUbicacionUsuario(centrar) {
+        if (!navigator.geolocation) return;
+        var self = this;
+
+        // Mostrar indicador de carga en bot├│n
+        var locBtn = document.querySelector('.buscar-location-btn');
+        if (locBtn) locBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i>';
+
+        navigator.geolocation.getCurrentPosition(
+            function(pos) {
+                var lat = pos.coords.latitude;
+                var lng = pos.coords.longitude;
+
+                // Restaurar bot├│n
+                if (locBtn) locBtn.innerHTML = '<i class="ri-focus-3-fill" style="color:#27ae60"></i>';
+
+                // Eliminar marcador anterior si existe
+                if (self._userLocationMarker) self.buscarMap.removeLayer(self._userLocationMarker);
+
+                // Marcador pulsante "Est├ís aqu├¡"
+                var userIcon = L.divIcon({
+                    className: '',
+                    html: '<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">' +
+                          '<div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(39,174,96,0.2);animation:userLocPulse 2s infinite;"></div>' +
+                          '<div style="width:18px;height:18px;border-radius:50%;background:#27ae60;border:3px solid white;box-shadow:0 2px 8px rgba(39,174,96,0.5);position:relative;z-index:1;"></div>' +
+                          '</div>',
+                    iconSize: [44, 44],
+                    iconAnchor: [22, 22]
+                });
+
+                self._userLocationMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(self.buscarMap);
+                self._userLocationMarker.bindPopup(
+                    '<div style="font-family:Inter,sans-serif;text-align:center;padding:4px 2px;">' +
+                    '<i class="ri-map-pin-user-fill" style="color:#27ae60;font-size:1.3rem"></i>' +
+                    '<p style="font-weight:700;color:#2C1A1A;margin:4px 0 2px;">Est├ís aqu├¡</p>' +
+                    '<p style="font-size:0.75rem;color:#7D5A5A;">' + lat.toFixed(5) + ', ' + lng.toFixed(5) + '</p>' +
+                    '</div>',
+                    { maxWidth: 180 }
+                );
+
+                if (centrar) self.buscarMap.setView([lat, lng], 15);
+
+                // Guardar para reutilizar (ej. en alerta calle)
+                app._lastKnownLocation = { lat: lat, lng: lng };
+            },
+            function(err) {
+                if (locBtn) locBtn.innerHTML = '<i class="ri-focus-3-line" style="color:#e74c3c"></i>';
+                console.warn('[Map] Geolocalizaci├│n denegada o no disponible:', err.message);
+                // Mostrar toast suave si fue error de permiso
+                if (err.code === 1) {
+                    var toast = document.createElement('div');
+                    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#2C1A1A;color:white;padding:10px 20px;border-radius:50px;font-size:0.8rem;z-index:9999;font-family:Inter,sans-serif;white-space:nowrap;';
+                    toast.innerHTML = '<i class="ri-map-pin-line" style="color:#e74c3c"></i> Permiso de ubicaci├│n denegado';
+                    document.body.appendChild(toast);
+                    setTimeout(function() { toast.remove(); }, 3000);
+                }
+            },
+            { timeout: 10000, enableHighAccuracy: true, maximumAge: 30000 }
+        );
     },
 
     async _loadBuscarRosaries() {
@@ -706,93 +780,6 @@ var app = {
         var text = '├Ünete al rosario en ' + rosary.place + ' el ' + this.formatDate(rosary.date) + ' a las ' + rosary.time + ' hs.';
         
         if (navigator.share) {
-            navigator.share({
-                title: 'Red Mar├¡a - Rosario',
-                text: text,
-                url: url
-            }).catch(function(error) {
-                console.log('Error compartiendo', error);
-            });
-        } else {
-            // Fallback to copy clipboard
-            navigator.clipboard.writeText(text + ' ' + url).then(function() {
-                alert("Enlace copiado al portapapeles. ┬íP├®galo donde quieras compartirlo!");
-            }).catch(function(err) {
-                alert("No se pudo copiar: " + url);
-            });
-        }
-    },
-
-    formatDate(s) {
-        if (!s) return '';
-        const d = new Date(s + 'T00:00:00'), t = new Date(); t.setHours(0,0,0,0);
-        if (d.getTime() === t.getTime()) return 'Hoy';
-        if (d.getTime() === t.getTime() + 86400000) return 'Ma├▒ana';
-        return d.getDate() + ' ' + ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()];
-    },
-
-    setupCreateRosaryForm() {
-        const form = document.getElementById('create-rosary-form'); if (!form) return;
-        const di = document.getElementById('rosary-date'); if (di) { const td = new Date().toISOString().split('T')[0]; di.min = td; di.value = td; }
-        form.addEventListener('submit', async (e) => {
-            e.preventDefault();
-            const country = document.getElementById('rosary-country') ? document.getElementById('rosary-country').value : '';
-            const citySelect = document.getElementById('rosary-city') ? document.getElementById('rosary-city').value : '';
-            const ciudadInput = document.getElementById('rosary-ciudad') ? document.getElementById('rosary-ciudad').value.trim() : '';
-            const city = ciudadInput || citySelect;
-            const place = document.getElementById('rosary-place').value.trim();
-            const date = document.getElementById('rosary-date').value;
-            const time = document.getElementById('rosary-time').value;
-            
-            let hasErr = false;
-            [
-                {id:'rosary-country', v:country, m:'Selecciona un pa├¡s'},
-                {id:'rosary-ciudad', v:city, m:'Ingresa una ciudad'},
-                {id:'rosary-place', v:place, m:'Obligatorio'},
-                {id:'rosary-date', v:date, m:'Obligatoria'},
-                {id:'rosary-time', v:time, m:'Obligatoria'}
-            ].forEach(f => {
-                const el = document.getElementById(f.id), g = el?.closest('.auth-field'), er = g?.querySelector('.field-error');
-                if (!f.v) { if (g) g.classList.add('has-error'); if (er) er.textContent = f.m; hasErr = true; }
-                else { if (g) { g.classList.remove('has-error'); g.classList.add('has-success'); } if (er) er.textContent = ''; }
-            });
-            if (!this.pickerLocation) { const le = document.getElementById('rosary-location-error'); if (le) le.textContent = 'Marca una ubicaci├│n'; hasErr = true; }
-            if (hasErr) { form.classList.add('shake'); setTimeout(() => form.classList.remove('shake'), 500); return; }
-            const btn = form.querySelector('.btn-auth-submit'); btn.classList.add('loading'); btn.disabled = true;
-            await new Promise(r => setTimeout(r, 800));
-            const user = auth.getCurrentUser();
-            const address = document.getElementById('rosary-address') ? document.getElementById('rosary-address').value.trim() : '';
-            const countryName = document.getElementById('rosary-country') ? document.getElementById('rosary-country').options[document.getElementById('rosary-country').selectedIndex].text : '';
-            const rosary = { id: Date.now().toString(36)+Math.random().toString(36).substr(2), place: auth.sanitize(place), address: auth.sanitize(address), country: country, countryName: countryName, city: city, date, time, mystery: '', intention: '', lat: this.pickerLocation.lat, lng: this.pickerLocation.lng, creatorId: user?.id||'anon', creatorName: user?.name||'An├│nimo', createdAt: new Date().toISOString(), participants: 1 };
-            this.saveRosary(rosary); this.addRosaryCard(rosary);
-            btn.classList.remove('loading'); btn.disabled = false;
-            form.reset(); this.pickerLocation = null;
-            if (this.pickerMarker && this.pickerMap) { this.pickerMap.removeLayer(this.pickerMarker); this.pickerMarker = null; }
-            const ov = document.getElementById('picker-overlay'); if (ov) ov.style.display = '';
-            const co = document.getElementById('picker-coords'); if (co) { co.textContent = ''; co.classList.remove('visible'); }
-            form.querySelectorAll('.auth-field').forEach(f => { f.classList.remove('has-success','has-error'); const e = f.querySelector('.field-error'); if (e) e.textContent = ''; });
-            this.showRosaryDetail(rosary);
-        });
-    },
-
-    showRosaryDetail(rosary) {
-        const ds = this.formatDate(rosary.date);
-        const user = auth.getCurrentUser();
-        const details = document.getElementById('create-success-details');
-        details.innerHTML = '<div class="success-detail-row"><i class="ri-map-pin-fill"></i> ' + rosary.place + '</div>' +
-            (rosary.city ? '<div class="success-detail-row"><i class="ri-building-fill"></i> ' + rosary.city + ', ' + (rosary.countryName || '') + '</div>' : '') +
-            (rosary.address ? '<div class="success-detail-row"><i class="ri-road-map-fill"></i> ' + rosary.address + '</div>' : '') +
-            '<div class="success-detail-row"><i class="ri-calendar-fill"></i> ' + ds + ' ' + rosary.time + ' hs</div>' +
-            '<div class="success-detail-row"><i class="ri-sparkling-fill"></i> Misterios ' + rosary.mystery + '</div>' +
-            '<div class="success-detail-row"><i class="ri-candle-fill"></i> ' + rosary.intention + '</div>' +
-            '<div class="success-detail-row"><i class="ri-user-fill"></i> Organizado por: ' + (user?.name || 'T├║') + '</div>';
-        document.getElementById('create-rosary-form-wrapper').style.display = 'none';
-        document.getElementById('create-success-banner').style.display = '';
-    },
-
-    resetCreateForm() {
-        document.getElementById('create-success-banner').style.display = 'none';
-        document.getElementById('create-rosary-form-wrapper').style.display = '';
         const form = document.getElementById('create-rosary-form');
         if (form) form.reset();
         const citySelect = document.getElementById('rosary-city');
@@ -935,6 +922,7 @@ var app = {
         }
         if (screenId === 'screen-live') this.renderContinuo();
         if (screenId === 'screen-como-rezar') this.highlightTodayMystery();
+        if (screenId === 'screen-iglesias') setTimeout(function() { if (typeof comedoresMap !== 'undefined' && comedoresMap) comedoresMap.invalidateSize(); }, 400);
         if (screenId === 'screen-cenaculo') setTimeout(function() { if (typeof initCenaculoMap === 'function') initCenaculoMap(); }, 400);
         if (screenId === 'screen-intenciones') { if (typeof loadCommunityIntenciones === 'function') loadCommunityIntenciones(); }
         if (screenId === 'screen-profile' || isDash) this.updateUserUI();
@@ -1642,3 +1630,579 @@ function toggleProfileLike(el) {
         db.updateProfileLikes(u.email, increment).catch(function(e) { console.error('Error syncing likes:', e); });
     }
 }
+
+// ============================================
+// SISTEMA DE ALERTAS - PERSONAS EN CALLE
+// ============================================
+
+var _alertaLocation = null;
+var _alertaMarkers = [];
+var _alertaFotoBase64 = null;
+
+app.abrirModalAlertaCalle = function() {
+    var modal = document.getElementById('modal-alerta-calle');
+    if (!modal) return;
+    modal.style.display = 'flex';
+    modal.classList.add('open');
+
+    // Reset form
+    var desc = document.getElementById('alerta-descripcion');
+    if (desc) desc.value = '';
+    var dir = document.getElementById('alerta-direccion');
+    if (dir) dir.value = '';
+    document.querySelectorAll('.necesidad-chip input').forEach(function(cb) { cb.checked = false; });
+    app.removerFotoAlerta();
+
+    // Get geolocation
+    var row = document.getElementById('alerta-ubicacion-row');
+    _alertaLocation = null;
+
+    if (app._lastKnownLocation) {
+        _alertaLocation = app._lastKnownLocation;
+        if (row) row.innerHTML = '<i class="ri-map-pin-fill" style="color:#27ae60"></i> <strong>Ubicaci├│n detectada</strong> ┬À ' + _alertaLocation.lat.toFixed(4) + ', ' + _alertaLocation.lng.toFixed(4);
+    } else {
+        if (row) row.innerHTML = '<i class="ri-loader-4-line ri-spin" style="color:#e67e22"></i> Obteniendo tu ubicaci├│n...';
+    }
+
+    if (navigator.geolocation) {
+        navigator.geolocation.getCurrentPosition(
+            function(pos) {
+                _alertaLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
+                app._lastKnownLocation = _alertaLocation;
+                if (row) row.innerHTML = '<i class="ri-map-pin-fill" style="color:#27ae60"></i> <strong>Ubicaci├│n obtenida</strong> ┬À ' + _alertaLocation.lat.toFixed(4) + ', ' + _alertaLocation.lng.toFixed(4);
+                if (app.buscarMap) app.buscarMap.setView([_alertaLocation.lat, _alertaLocation.lng], 16);
+            },
+            function() {
+                if (!_alertaLocation && app.buscarMap) {
+                    var c = app.buscarMap.getCenter();
+                    _alertaLocation = { lat: c.lat, lng: c.lng };
+                    if (row) row.innerHTML = '<i class="ri-map-pin-line" style="color:#e74c3c"></i> Usando centro del mapa';
+                }
+            },
+            { timeout: 8000, enableHighAccuracy: true }
+        );
+    }
+};
+
+app.cerrarModalAlertaCalle = function() {
+    var modal = document.getElementById('modal-alerta-calle');
+    if (modal) { modal.style.display = 'none'; modal.classList.remove('open'); }
+};
+
+// ---- FOTO ----
+app.previsualizarFotoAlerta = function(input) {
+    if (!input.files || !input.files[0]) return;
+    var reader = new FileReader();
+    reader.onload = function(e) {
+        var img = new Image();
+        img.onload = function() {
+            var maxSize = 800;
+            var w = img.width, h = img.height;
+            if (w > maxSize || h > maxSize) {
+                if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
+                else { w = Math.round(w * maxSize / h); h = maxSize; }
+            }
+            var canvas = document.createElement('canvas');
+            canvas.width = w; canvas.height = h;
+            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
+            _alertaFotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
+
+            var preview = document.getElementById('alerta-foto-preview');
+            var placeholder = document.getElementById('alerta-foto-placeholder');
+            var removeBtn = document.getElementById('alerta-foto-remove');
+            var area = document.getElementById('alerta-foto-area');
+            if (preview) { preview.src = _alertaFotoBase64; preview.style.display = 'block'; }
+            if (placeholder) placeholder.style.display = 'none';
+            if (removeBtn) removeBtn.style.display = 'flex';
+            if (area) area.classList.add('has-photo');
+        };
+        img.src = e.target.result;
+    };
+    reader.readAsDataURL(input.files[0]);
+};
+
+app.removerFotoAlerta = function() {
+    _alertaFotoBase64 = null;
+    var preview = document.getElementById('alerta-foto-preview');
+    var placeholder = document.getElementById('alerta-foto-placeholder');
+    var removeBtn = document.getElementById('alerta-foto-remove');
+    var area = document.getElementById('alerta-foto-area');
+    var input = document.getElementById('alerta-foto-input');
+    if (preview) { preview.src = ''; preview.style.display = 'none'; }
+    if (placeholder) placeholder.style.display = 'flex';
+    if (removeBtn) removeBtn.style.display = 'none';
+    if (area) area.classList.remove('has-photo');
+    if (input) input.value = '';
+};
+
+// ---- ENV├ìO ----
+app.enviarAlertaCalle = function() {
+    if (!_alertaLocation) {
+        alert('No se pudo obtener la ubicaci├│n. Por favor esper├í un momento.');
+        return;
+    }
+    var necesidades = [];
+    document.querySelectorAll('.necesidad-chip input:checked').forEach(function(cb) { necesidades.push(cb.value); });
+    var descripcion = (document.getElementById('alerta-descripcion').value || '').trim();
+    var direccion = ((document.getElementById('alerta-direccion') || {}).value || '').trim();
+    var user = (typeof auth !== 'undefined' && auth.getCurrentUser) ? auth.getCurrentUser() : null;
+
+    var btn = document.getElementById('btn-enviar-alerta');
+    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Enviando...'; }
+
+    var alerta = {
+        lat: _alertaLocation.lat,
+        lng: _alertaLocation.lng,
+        descripcion: descripcion || 'Persona en situaci├│n de calle',
+        necesidades: necesidades.join(', '),
+        direccion: direccion,
+        reporter_name: user ? (user.name || 'An├│nimo') : 'An├│nimo',
+        user_id: user ? user.id : null,
+        foto_url: _alertaFotoBase64 || null
+    };
+
+    if (typeof db !== 'undefined' && db.crearAlertaCalle) {
+        db.crearAlertaCalle(alerta).then(function() {
+            app.cerrarModalAlertaCalle();
+            app._mostrarAlertaConfirmacion();
+            app.cargarAlertasEnMapa();
+            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ri-send-plane-fill"></i> Avisar a la Red'; }
+        }).catch(function(e) {
+            console.error('[Alertas] Error:', e);
+            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ri-send-plane-fill"></i> Avisar a la Red'; }
+            alert('Error al enviar. Verific├í tu conexi├│n.');
+        });
+    } else {
+        app.cerrarModalAlertaCalle();
+        app._mostrarAlertaConfirmacion();
+    }
+};
+
+app._mostrarAlertaConfirmacion = function() {
+    var toast = document.createElement('div');
+    toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;padding:14px 24px;border-radius:50px;font-size:0.88rem;font-weight:700;z-index:9999;display:flex;align-items:center;gap:8px;box-shadow:0 6px 24px rgba(39,174,96,0.4);font-family:Inter,sans-serif;';
+    toast.innerHTML = '<i class="ri-check-double-fill" style="font-size:1.1rem"></i> ┬íAlerta enviada! La comunidad fue notificada';
+    document.body.appendChild(toast);
+    setTimeout(function() { toast.style.opacity='0'; toast.style.transition='opacity 0.5s'; setTimeout(function(){ toast.remove(); }, 500); }, 3500);
+};
+
+// ---- MAPA ----
+app.cargarAlertasEnMapa = async function() {
+    if (!app.buscarMap) return;
+    _alertaMarkers.forEach(function(m) { app.buscarMap.removeLayer(m); });
+    _alertaMarkers = [];
+
+    var alertas = [];
+    if (typeof db !== 'undefined' && db.getAlertasCalle) {
+        try { alertas = await db.getAlertasCalle(); } catch(e) { console.warn('[Alertas]', e.message); }
+    }
+
+    // Cargar todas las ayudas para contadores
+    var todasAyudas = [];
+    if (typeof db !== 'undefined' && db.getAyudasDeAlerta && alertas.length > 0) {
+        for (var i = 0; i < alertas.length; i++) {
+            try { var ays = await db.getAyudasDeAlerta(alertas[i].id); todasAyudas = todasAyudas.concat(ays); } catch(e) {}
+        }
+    }
+
+    alertas.forEach(function(a) {
+        if (!a.lat || !a.lng) return;
+        var ayudasPorNecesidad = {};
+        todasAyudas.filter(function(ay) { return ay.alerta_id === a.id; }).forEach(function(ay) {
+            if (!ayudasPorNecesidad[ay.necesidad]) ayudasPorNecesidad[ay.necesidad] = [];
+            ayudasPorNecesidad[ay.necesidad].push(ay);
+        });
+        var icon = L.divIcon({
+            className: 'custom-marker-wrapper',
+            html: '<div class="alerta-map-marker"><i class="ri-user-heart-fill" style="font-size:1rem"></i></div>',
+            iconSize: [38, 46], iconAnchor: [19, 46]
+        });
+        var marker = L.marker([a.lat, a.lng], { icon: icon }).addTo(app.buscarMap);
+        // Popup S├ìNCRONO para que Leaflet lo registre correctamente
+        var html = app._buildAlertaPopupSync(a, ayudasPorNecesidad);
+        marker.bindPopup(html, { className: 'rosary-map-popup', maxWidth: 300 });
+        _alertaMarkers.push(marker);
+    });
+
+    app._actualizarPanelAlertas(alertas, todasAyudas);
+};
+
+// ---- PANEL LATERAL ----
+app._actualizarPanelAlertas = function(alertas, todasAyudas) {
+    var panel = document.getElementById('alertas-panel');
+    var list = document.getElementById('alertas-list');
+    var badge = document.getElementById('alertas-count');
+    var statsBanner = document.querySelector('.buscar-stats-banner');
+    if (!panel || !list) return;
+
+    var activas = alertas.filter(function(a) { return a.activa; });
+    console.log('[Alertas] _actualizarPanelAlertas called. Total:', alertas.length, 'Activas:', activas.length);
+
+    if (activas.length === 0) {
+        panel.style.display = 'none';
+        if (statsBanner) statsBanner.style.display = 'none';
+        console.log('[Alertas] Panel hidden (0 active alerts)');
+        return;
+    }
+    panel.style.display = 'flex';
+    if (statsBanner) statsBanner.style.display = 'flex';
+    console.log('[Alertas] Panel shown');
+    
+    if (badge) badge.textContent = activas.length;
+    todasAyudas = todasAyudas || [];
+
+    list.innerHTML = alertas.map(function(a) {
+        var needs = a.necesidades ? a.necesidades.split(', ').filter(Boolean) : [];
+        var fotoHtml = a.foto_url
+            ? '<img src="' + a.foto_url + '" class="alerta-item-foto" alt="Foto">'
+            : '<div class="alerta-item-icon"><i class="ri-user-heart-fill"></i></div>';
+
+        // Tags est├íticos para las necesidades
+        var needsTags = '';
+        if (needs.length > 0) {
+            needsTags = '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">';
+            needs.forEach(function(n) {
+                var meta = (typeof _NEED_META !== 'undefined' && _NEED_META[n]) || { emoji: 'ÔØô', label: n };
+                needsTags += '<span style="background:rgba(230,126,34,0.12);color:#d35400;font-size:0.65rem;padding:2px 6px;border-radius:6px;font-weight:600;">' + meta.emoji + ' ' + meta.label + '</span>';
+            });
+            needsTags += '</div>';
+        }
+
+        // Un solo bot├│n rojo de Ayudar
+        var ayudasDeAlerta = todasAyudas.filter(function(ay) { return ay.alerta_id === a.id; });
+        var uniqueUsers = [];
+        ayudasDeAlerta.forEach(function(ay) {
+            var ident = ay.user_id || ay.helper_name;
+            if (uniqueUsers.indexOf(ident) === -1) uniqueUsers.push(ident);
+        });
+        var count = uniqueUsers.length;
+        var countBadge = count > 0 ? '<span style="background:white;color:#e74c3c;border-radius:8px;font-size:0.65rem;padding:1px 5px;font-weight:800;margin-left:4px;">' + count + '</span>' : '';
+        var btnId = 'coord-btn-' + a.id + '-general';
+        var needsBtns = '<div style="margin-top:8px;display:flex;">' +
+            '<button id="' + btnId + '" onclick="app.toggleCoordPanel(\'' + a.id + '\',\'general\',this)" ' +
+                'style="display:flex;align-items:center;gap:4px;background:linear-gradient(135deg,#e74c3c,#c0392b);border:none;color:white;border-radius:10px;padding:6px 14px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;box-shadow:0 4px 12px rgba(231,76,60,0.25);transition:all 0.2s;">' +
+                '<i class="ri-heart-pulse-fill"></i> Ayudar' + countBadge +
+            '</button>' +
+        '</div>';
+
+        // Panel inline de foro (empieza oculto, se expande al presionar manito)
+        var foroId = 'foro-inline-' + a.id;
+        var foroHtml = '<div id="' + foroId + '" class="foro-inline-container" style="display:none;margin-top:10px;border-top:1px solid rgba(230,126,34,0.2);padding-top:10px;background:rgba(255,255,255,0.8);border-radius:10px;padding:10px;border:1px solid rgba(39,174,96,0.15);">' +
+            '<div id="' + foroId + '-title" style="font-size:0.75rem;font-weight:700;color:#27ae60;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px;display:flex;align-items:center;gap:5px;">' +
+                '­ƒñ▓ <span id="' + foroId + '-need">Coordinando ayuda</span>' +
+            '</div>' +
+            '<div id="' + foroId + '-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px;overflow:visible;">' +
+                '<div style="text-align:center;color:#b0a0a0;font-size:0.78rem;padding:8px 0;"><i class="ri-hand-heart-line"></i> S├® el primero en ofrecer ayuda</div>' +
+            '</div>' +
+            '<div style="display:flex;gap:6px;">' +
+                '<input id="' + foroId + '-input" type="text" placeholder="┬┐Qu├® vas a llevar?" ' +
+                    'style="flex:1;padding:8px 12px;border:1.5px solid rgba(39,174,96,0.3);border-radius:10px;font-size:0.8rem;font-family:Inter,sans-serif;outline:none;color:#2C1A1A;background:white;" ' +
+                    'onkeydown="if(event.key===\'Enter\')app.enviarAyudaInline(\'' + a.id + '\',\'' + foroId + '\')">' +
+                '<button onclick="app.enviarAyudaInline(\'' + a.id + '\',\'' + foroId + '\')" ' +
+                    'style="background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;border:none;border-radius:10px;padding:8px 12px;font-size:0.8rem;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;">' +
+                    '­ƒñ▓ Voy' +
+                '</button>' +
+            '</div>' +
+        '</div>';
+
+        return '<div class="alerta-item" style="flex-direction:column;gap:2px;position:relative;">' +
+            '<div style="display:flex;align-items:flex-start;gap:10px;position:sticky;top:0;background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);z-index:5;padding:5px 0;">' +
+                fotoHtml +
+                '<div class="alerta-item-info" style="flex:1;min-width:0;">' +
+                    '<div class="alerta-item-desc">' + (a.descripcion || 'Persona en situaci├│n de calle') + '</div>' +
+                    (a.direccion ? '<div style="font-size:0.73rem;color:#d35400;font-weight:600;margin-top:1px;"><i class="ri-road-map-line"></i> ' + a.direccion + '</div>' : '') +
+                    needsTags +
+                    '<div class="alerta-item-meta" style="margin-top:4px;">Por: ' + (a.reporter_name || 'An├│nimo') + '</div>' +
+                '</div>' +
+                '<button class="btn-resolver-alerta" onclick="app.resolverAlerta(\'' + a.id + '\')" style="flex-shrink:0;">Ô£ô</button>' +
+            '</div>' +
+            needsBtns +
+            foroHtml +
+        '</div>';
+    }).join('');
+};
+
+// Expande/colapsa el foro inline dentro del card
+app.toggleCoordPanel = async function(alertaId, necesidad, btnEl) {
+    var foroId = 'foro-inline-' + alertaId;
+    var foro = document.getElementById(foroId);
+    if (!foro) return;
+
+    var meta = (typeof _NEED_META !== 'undefined' && _NEED_META[necesidad]) || { emoji: '­ƒñ▓', label: 'Ayuda' };
+    var isOpen = foro.style.display !== 'none';
+
+    // Cerrar todos los foros inline abiertos primero
+    document.querySelectorAll('.foro-inline-container').forEach(function(el) { el.style.display = 'none'; });
+    // Resetear todos los botones activos a rojo
+    document.querySelectorAll('[id^="coord-btn-"]').forEach(function(el) { 
+        el.style.boxShadow = ''; 
+        el.style.background = 'linear-gradient(135deg,#e74c3c,#c0392b)';
+    });
+
+    if (isOpen) return; // Si ya estaba abierto, solo se cierra (y queda rojo)
+
+    // Abrir este foro
+    console.log('[Alertas] Abriendo foro inline:', foroId);
+    foro.style.display = 'block';
+    foro.style.animation = 'fadeInDown 0.2s ease';
+    
+    // Resaltar bot├│n activo poni├®ndolo VERDE
+    if (btnEl) { 
+        btnEl.style.boxShadow = '0 4px 12px rgba(39,174,96,0.3)'; 
+        btnEl.style.background = 'linear-gradient(135deg,#27ae60,#2ecc71)';
+    }
+
+    // Actualizar t├¡tulo con la necesidad
+    var needTitle = document.getElementById(foroId + '-need');
+    if (needTitle) needTitle.textContent = meta.emoji + ' ' + meta.label;
+
+    // Guardar en el foro cu├íl necesidad est├í activa
+    foro.dataset.alertaId = alertaId;
+    foro.dataset.necesidad = necesidad;
+
+    // Cargar helpers
+    await app._cargarHelpersInline(alertaId, necesidad, foroId);
+
+    // Foco en el input
+    var input = document.getElementById(foroId + '-input');
+    if (input) setTimeout(function() { input.focus(); }, 100);
+
+    // Suscribir a tiempo real
+    if (_coordSub) { try { _coordSub.unsubscribe(); } catch(e) {} }
+    if (typeof db !== 'undefined' && db.subscribeToAyudas) {
+        _coordSub = db.subscribeToAyudas(alertaId, function() {
+            app._cargarHelpersInline(alertaId, necesidad, foroId);
+        });
+    }
+};
+
+app._cargarHelpersInline = async function(alertaId, necesidad, foroId) {
+    var listEl = document.getElementById(foroId + '-list');
+    if (!listEl) return;
+
+    var ayudas = [];
+    if (typeof db !== 'undefined' && db.getAyudasDeAlerta) {
+        try { ayudas = await db.getAyudasDeAlerta(alertaId); } catch(e) {}
+    }
+    
+    // Como unificamos todo en un solo bot├│n, mostramos todas las ayudas de la alerta sin filtrar
+    var filtradas = ayudas;
+    
+    console.log('[Alertas] Ayudas cargadas para', alertaId, '-> Total obtenidas:', filtradas.length);
+
+    if (filtradas.length === 0) {
+        listEl.innerHTML = '<div style="text-align:center;color:#b0a0a0;font-size:0.78rem;padding:8px 0;"><i class="ri-hand-heart-line"></i> S├® el primero en ofrecer ayuda</div>';
+        return;
+    }
+    listEl.innerHTML = filtradas.map(function(h) {
+        var initials = (h.helper_name || 'A').charAt(0).toUpperCase();
+        var timeStr = app._timeAgo ? app._timeAgo(h.created_at) : '';
+        return '<div style="display:flex;gap:8px;align-items:flex-start;background:rgba(39,174,96,0.06);border:1px solid rgba(39,174,96,0.15);border-radius:10px;padding:8px 10px;">' +
+            '<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#27ae60,#2ecc71);display:flex;align-items:center;justify-content:center;color:white;font-size:0.78rem;font-weight:700;flex-shrink:0;">' + initials + '</div>' +
+            '<div style="flex:1;min-width:0;">' +
+                '<div style="font-size:0.78rem;font-weight:700;color:#2C1A1A;">' + (h.helper_name || 'An├│nimo') + '</div>' +
+                '<div style="font-size:0.78rem;color:#555;margin-top:1px;line-height:1.3;">' + h.mensaje + '</div>' +
+                (timeStr ? '<div style="font-size:0.68rem;color:#aaa;margin-top:2px;">' + timeStr + '</div>' : '') +
+            '</div>' +
+        '</div>';
+    }).join('');
+    listEl.scrollTop = listEl.scrollHeight;
+};
+
+app.enviarAyudaInline = async function(alertaId, foroId) {
+    var foro = document.getElementById(foroId);
+    var necesidad = foro ? foro.dataset.necesidad : 'general';
+    var input = document.getElementById(foroId + '-input');
+    var msg = input ? input.value.trim() : '';
+    if (!msg) { if (input) input.focus(); return; }
+
+    var user = (typeof auth !== 'undefined' && auth.getCurrentUser) ? auth.getCurrentUser() : null;
+    var sendBtn = foro ? foro.querySelector('button[onclick*="enviarAyudaInline"]') : null;
+    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '...'; }
+
+    if (typeof db !== 'undefined' && db.ofrecerAyuda) {
+        await db.ofrecerAyuda({
+            alerta_id: alertaId,
+            necesidad: necesidad,
+            helper_name: user ? (user.name || 'An├│nimo') : 'An├│nimo',
+            user_id: user ? user.id : null,
+            mensaje: msg
+        });
+    }
+
+    if (input) input.value = '';
+    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '­ƒñ▓ Voy'; }
+    await app._cargarHelpersInline(alertaId, necesidad, foroId);
+
+    // Toast r├ípido
+    var toast = document.createElement('div');
+    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#27ae60;color:white;padding:10px 18px;border-radius:50px;font-size:0.8rem;font-weight:700;z-index:9999;font-family:Inter,sans-serif;pointer-events:none;';
+    toast.textContent = '­ƒñ▓ ┬íRegistrado!';
+    document.body.appendChild(toast);
+    setTimeout(function() { toast.remove(); }, 2000);
+};
+
+app.resolverAlerta = async function(id) {
+    if (typeof db !== 'undefined' && db.resolverAlerta) {
+        await db.resolverAlerta(id);
+    }
+    await app.cargarAlertasEnMapa();
+    if (app.buscarMap) app.buscarMap.closePopup();
+};
+
+// Suscripci├│n en tiempo real
+if (typeof db !== 'undefined' && db.subscribeToAlertas) {
+    db.subscribeToAlertas(function(payload) {
+        console.log('[Alertas] Cambio en tiempo real:', payload.eventType);
+        app.cargarAlertasEnMapa();
+    });
+}
+
+// ============================================
+// SISTEMA DE COORDINACI├ôN DE AYUDA
+// ============================================
+
+var _coordAlertaId = null;
+var _coordNecesidad = null;
+var _coordSub = null;
+
+var _NEED_META = {
+    comida:  { emoji: '­ƒì×', label: 'Comida' },
+    agua:    { emoji: '­ƒÆº', label: 'Agua' },
+    ropa:    { emoji: '­ƒæò', label: 'Ropa' },
+    abrigo:  { emoji: '­ƒºÑ', label: 'Abrigo' },
+    medico:  { emoji: '­ƒÅÑ', label: 'Atenci├│n m├®dica' },
+    oracion: { emoji: '­ƒÖÅ', label: 'Oraci├│n' }
+};
+
+// Genera popup con botones de mano solidaria por necesidad
+// Tambi├®n mantener el alias anterior por compatibilidad
+app._buildAlertaPopupSync = function(a, ayudasPorNecesidad) {
+    var needs = a.necesidades ? a.necesidades.split(', ').filter(Boolean) : [];
+    var needsHtml = '';
+    if (needs.length > 0) {
+        needsHtml = '<p style="font-size:0.72rem;font-weight:700;color:#7D5A5A;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px;">Necesita</p>';
+        needsHtml += '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">';
+        needs.forEach(function(n) {
+            var meta = _NEED_META[n] || { emoji: 'ÔØô', label: n };
+            var count = (ayudasPorNecesidad[n] || []).length;
+            var hasHelpers = count > 0;
+            var countBadge = hasHelpers ? ' ┬À <span class="help-count">' + count + '</span>' : '';
+            needsHtml += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
+                '<span style="font-size:0.82rem;color:#2C1A1A;">' + meta.emoji + ' ' + meta.label + '</span>' +
+                '<button class="need-help-btn ' + (hasHelpers ? 'has-helpers' : '') + '" ' +
+                    'onclick="app.abrirCoordinacion(\'' + a.id + '\',\'' + n + '\')">' +
+                    '­ƒñ▓ ' + (hasHelpers ? 'Ver ayuda' + countBadge : 'Yo ayudo') +
+                '</button>' +
+            '</div>';
+        });
+        needsHtml += '</div>';
+    }
+    var fotoHtml = a.foto_url ? '<img src="' + a.foto_url + '" class="alerta-popup-foto" alt="Foto">' : '';
+    return '<div style="font-family:Inter,sans-serif;min-width:220px;">' +
+        fotoHtml +
+        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="font-size:1.2rem">­ƒÖÅ</span>' +
+        '<strong style="color:#2C1A1A;font-size:0.88rem">Persona en Situaci├│n de Calle</strong></div>' +
+        (a.direccion ? '<p style="font-size:0.8rem;color:#d35400;font-weight:600;margin-bottom:5px;">­ƒôì ' + a.direccion + '</p>' : '') +
+        (a.descripcion ? '<p style="font-size:0.8rem;color:#7D5A5A;margin-bottom:8px;">' + a.descripcion + '</p>' : '') +
+        needsHtml +
+        '<p style="font-size:0.72rem;color:#aaa;margin-bottom:8px;">Por: <strong>' + (a.reporter_name || 'An├│nimo') + '</strong></p>' +
+        '<button onclick="app.resolverAlerta(\'' + a.id + '\')" style="width:100%;background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;border:none;border-radius:10px;padding:8px;font-size:0.8rem;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;">Ô£ô Ya fue ayudada</button>' +
+    '</div>';
+};
+
+// Abre el foro de coordinaci├│n para una necesidad
+app.abrirCoordinacion = async function(alertaId, necesidad) {
+    _coordAlertaId = alertaId;
+    _coordNecesidad = necesidad;
+    var meta = _NEED_META[necesidad] || { emoji: 'ÔØô', label: necesidad };
+    var modal = document.getElementById('modal-coordinacion');
+    if (!modal) return;
+    modal.style.display = 'flex';
+    var el = function(id) { return document.getElementById(id); };
+    if (el('coord-need-title')) el('coord-need-title').textContent = 'Coordinando: ' + meta.label;
+    if (el('coord-need-icon')) el('coord-need-icon').textContent = meta.emoji;
+    if (el('coord-alerta-ref')) el('coord-alerta-ref').textContent = 'Coordinen qu├® lleva cada uno para no duplicar';
+    if (el('coord-mensaje')) { el('coord-mensaje').value = ''; setTimeout(function(){ el('coord-mensaje').focus(); }, 200); }
+    await app._cargarHelpersEnModal(alertaId, necesidad);
+    if (_coordSub) { try { _coordSub.unsubscribe(); } catch(e) {} }
+    if (typeof db !== 'undefined' && db.subscribeToAyudas) {
+        _coordSub = db.subscribeToAyudas(alertaId, function() {
+            app._cargarHelpersEnModal(alertaId, necesidad);
+        });
+    }
+};
+
+app.cerrarCoordinacion = function() {
+    var modal = document.getElementById('modal-coordinacion');
+    if (modal) modal.style.display = 'none';
+    if (_coordSub) { try { _coordSub.unsubscribe(); } catch(e) {} _coordSub = null; }
+    _coordAlertaId = null; _coordNecesidad = null;
+};
+
+app._cargarHelpersEnModal = async function(alertaId, necesidad) {
+    var list = document.getElementById('coord-helpers-list');
+    if (!list) return;
+    var ayudas = [];
+    if (typeof db !== 'undefined' && db.getAyudasDeAlerta) {
+        ayudas = await db.getAyudasDeAlerta(alertaId);
+    }
+    var filtradas = ayudas.filter(function(a) { return a.necesidad === necesidad; });
+    if (filtradas.length === 0) {
+        list.innerHTML = '<div class="coord-empty-state"><i class="ri-hand-heart-line" style="font-size:1.8rem;color:#e0c9b0;"></i><p>S├® el primero en ofrecer ayuda</p></div>';
+        return;
+    }
+    list.innerHTML = filtradas.map(function(h) {
+        var initials = (h.helper_name || 'A').charAt(0).toUpperCase();
+        return '<div class="coord-helper-item">' +
+            '<div class="coord-helper-avatar">' + initials + '</div>' +
+            '<div style="flex:1;min-width:0;">' +
+                '<div class="coord-helper-name">' + (h.helper_name || 'An├│nimo') + '</div>' +
+                '<div class="coord-helper-msg">' + h.mensaje + '</div>' +
+                '<div class="coord-helper-time">' + app._timeAgo(h.created_at) + '</div>' +
+            '</div>' +
+        '</div>';
+    }).join('');
+    list.scrollTop = list.scrollHeight;
+};
+
+app.enviarAyuda = async function() {
+    if (!_coordAlertaId || !_coordNecesidad) return;
+    var msgEl = document.getElementById('coord-mensaje');
+    var msg = (msgEl ? msgEl.value : '').trim();
+    if (!msg) { if (msgEl) msgEl.focus(); return; }
+    var btn = document.getElementById('btn-coord-enviar');
+    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Enviando...'; }
+    var user = (typeof auth !== 'undefined' && auth.getCurrentUser) ? auth.getCurrentUser() : null;
+    if (typeof db !== 'undefined' && db.ofrecerAyuda) {
+        await db.ofrecerAyuda({
+            alerta_id: _coordAlertaId,
+            necesidad: _coordNecesidad,
+            helper_name: user ? (user.name || 'An├│nimo') : 'An├│nimo',
+            user_id: user ? user.id : null,
+            mensaje: msg
+        });
+    }
+    if (msgEl) msgEl.value = '';
+    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ri-hand-heart-fill"></i> Me uno a ayudar'; }
+    await app._cargarHelpersEnModal(_coordAlertaId, _coordNecesidad);
+    var toast = document.createElement('div');
+    toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;padding:12px 20px;border-radius:50px;font-size:0.82rem;font-weight:700;z-index:10001;display:flex;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(39,174,96,0.4);font-family:Inter,sans-serif;';
+    toast.innerHTML = '­ƒñ▓ ┬íGracias! Tu ayuda fue registrada';
+    document.body.appendChild(toast);
+    setTimeout(function(){ toast.style.opacity='0'; toast.style.transition='opacity 0.4s'; setTimeout(function(){ toast.remove(); },400); }, 2800);
+};
+
+app._timeAgo = function(dateStr) {
+    if (!dateStr) return '';
+    var diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
+    if (diff < 60) return 'hace un momento';
+    if (diff < 3600) return 'hace ' + Math.floor(diff/60) + ' min';
+    if (diff < 86400) return 'hace ' + Math.floor(diff/3600) + ' h';
+    return 'hace ' + Math.floor(diff/86400) + ' d';
+};
+
+// Ensure app is available globally for inline onclick handlers
+window.app = app;
+
+
