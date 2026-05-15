var app = {
    currentScreen: 'screen-splash',
    screens: ['screen-splash','screen-register','screen-login','screen-forgot-password','screen-reset-password','screen-map','screen-intenciones','screen-create-rosary','screen-rosary-detail','screen-rezo','screen-event','screen-live','screen-como-rezar','screen-profile','screen-porque-rezar','screen-notificaciones','screen-mensajes','screen-apariciones','screen-cenaculo','screen-Comedores','screen-situacion-calle'],
    pickerMap: null, pickerMarker: null, pickerLocation: null,
    detailMap: null,
    buscarMap: null,
    ROSARY_STORAGE_KEY: 'redmaria_rosaries',
    JOINED_ROSARIES_KEY: 'redmaria_joined',
    CONTINUO_KEY: 'redmaria_continuo',
    continuoDate: new Date(),
    // Helper: get YYYY-MM-DD from a Date in LOCAL timezone (not UTC)
    localDateKey: function(d) {
        var y = d.getFullYear();
        var m = (d.getMonth() + 1).toString().padStart(2, '0');
        var day = d.getDate().toString().padStart(2, '0');
        return y + '-' + m + '-' + day;
    },
    recoveryEmail: null,
    recoveryCode: null,

    init() {
        this.generateSplashBeads();
        // Clear stale continuo data on load - Supabase is the source of truth
        try { localStorage.removeItem(this.CONTINUO_KEY); } catch(e) {}
        this.renderContinuo().catch(function(e) { console.warn('[Init] Continuo render failed:', e); });
        this.generateParticipants();
        this.loadRosaryCards();
        authUI.init();
        this.setupCreateRosaryForm();
        this.setupForgotPasswordForm();
        this.setupResetPasswordForm();
        this.setupResetStrengthMeter();
        if (auth.isAuthenticated()) this.updateUserUI();

        this.updateNavVisibility(this.currentScreen);
        document.querySelectorAll('.header-nav a').forEach(a => a.addEventListener('click', e => e.preventDefault()));
    },

    async loadRosaryCards() {
        const list = document.getElementById('rosary-list'); if (!list) return;
        // Load from Supabase first, fallback to localStorage
        var rosaries = this.getActiveRosaries();
        if (typeof db !== 'undefined' && db.getRosaries) {
            try {
                var remote = await db.getRosaries();
                if (remote && remote.length > 0) {
                    // Map Supabase fields to local format
                    rosaries = remote.map(function(r) {
                        return {
                            id: r.id, place: r.place, address: r.address || '', date: r.date, time: r.time,
                            mystery: r.mystery, intention: r.intention, lat: r.lat, lng: r.lng,
                            participants: r.participants || 1, creatorId: r.creator_id,
                            creatorName: r.creator_name || 'Anónimo'
                        };
                    });
                    // Save to localStorage for offline
                    localStorage.setItem('redmaria_rosaries', JSON.stringify(rosaries));
                    console.log('[Rosaries] Loaded', rosaries.length, 'from Supabase');
                }
            } catch(e) {
                console.warn('[Rosaries] Supabase failed, using local:', e.message);
            }
        }
        // Filter active
        rosaries = rosaries.filter(r => !this.isRosaryExpired(r));
        rosaries.forEach(r => this.addRosaryCard(r));
        // Update stats
        var countEl = document.getElementById('buscar-cards-count');
        var emptyEl = document.getElementById('buscar-empty');
        var statRos = document.getElementById('buscar-stat-rosaries');
        if (countEl) countEl.textContent = rosaries.length + ' encontrados';
        if (emptyEl) emptyEl.style.display = rosaries.length === 0 ? '' : 'none';
        if (statRos) statRos.textContent = rosaries.length;
    },

    initPickerMap() {
        if (this.pickerMap) { this.pickerMap.invalidateSize(); return; }
        this.pickerMap = L.map('picker-map', { zoomControl: false, attributionControl: false }).setView([-34.5955,-58.3739], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.pickerMap);
        L.control.zoom({ position: 'topright' }).addTo(this.pickerMap);
        this.pickerMap.on('click', e => this.setPickerLocation(e.latlng.lat, e.latlng.lng));
    },

    async initBuscarMap() {
        if (!this.buscarMap) {
            this.buscarMap = L.map('buscar-map', { zoomControl: false, attributionControl: false }).setView([-34.5955, -58.3739], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.buscarMap);
            L.control.zoom({ position: 'topright' }).addTo(this.buscarMap);
            this._buscarMarkers = [];
        } else {
            this.buscarMap.invalidateSize();
        }
        // Always reload rosaries
        await this._loadBuscarRosaries();
    },

    async _loadBuscarRosaries() {
        // Clear old markers
        if (this._buscarMarkers) {
            this._buscarMarkers.forEach(m => this.buscarMap.removeLayer(m));
            this._buscarMarkers = [];
        }

        // Load from Supabase first
        var activeRosaries = [];
        if (typeof db !== 'undefined' && db.getRosaries) {
            try {
                var remote = await db.getRosaries();
                if (remote && remote.length > 0) {
                    activeRosaries = remote.map(function(r) {
                        return {
                            id: r.id, place: r.place, address: r.address || '', date: r.date, time: r.time,
                            mystery: r.mystery, intention: r.intention, lat: r.lat, lng: r.lng,
                            participants: r.participants || 1, creatorId: r.creator_id,
                            creatorName: r.creator_name || 'Anónimo'
                        };
                    });
                    localStorage.setItem('redmaria_rosaries', JSON.stringify(activeRosaries));
                    console.log('[Map] Loaded', activeRosaries.length, 'rosaries from Supabase');
                }
            } catch(e) { console.warn('[Map] Supabase failed:', e.message); }
        }

        // Fallback to localStorage
        if (activeRosaries.length === 0) {
            activeRosaries = this.getActiveRosaries();
            console.log('[Map] Using', activeRosaries.length, 'rosaries from localStorage');
        }

        // Add markers
        let totalPeople = 0;
        activeRosaries.forEach(r => {
            if (r.lat && r.lng) {
                const pCount = r.participants || 1;
                totalPeople += pCount;
                const icon = L.divIcon({ className: 'custom-marker-wrapper', html: '<div class="custom-map-marker user-marker"><i class="ri-map-pin-fill" style="font-size:1rem;color:white"></i><span class="marker-count">' + pCount + '</span></div>', iconSize: [36, 44], iconAnchor: [18, 44] });
                const marker = L.marker([r.lat, r.lng], { icon }).addTo(this.buscarMap);
                marker.rosaryData = r;
                marker.bindPopup(() => this._buildMapPopup(r.id, r.place, r.time, r.mystery, r.intention, r.participants || 1), { className: 'rosary-map-popup', maxWidth: 260 });
                this._buscarMarkers.push(marker);
            }
        });

        // Update stats
        const statRos = document.getElementById('buscar-stat-rosaries');
        const statPpl = document.getElementById('buscar-stat-people');
        const countEl = document.getElementById('buscar-cards-count');
        const emptyEl = document.getElementById('buscar-empty');
        if (statRos) statRos.textContent = activeRosaries.length;
        if (statPpl) statPpl.textContent = totalPeople;
        if (countEl) countEl.textContent = activeRosaries.length + ' encontrados';
        if (emptyEl) emptyEl.style.display = activeRosaries.length === 0 ? '' : 'none';

        // Render cards
        const list = document.getElementById('rosary-list');
        if (list) list.innerHTML = '';
        activeRosaries.forEach(r => this.addRosaryCard(r));
    },

    _buildMapPopup(id, name, time, mystery, intention, participants) {
        const joined = this.getJoinedRosaries();
        const isJoined = joined.some(j => j.id === id);
        const btnClass = isJoined ? 'popup-btn-leave' : 'popup-btn-join';
        const btnText = isJoined ? '<i class="ri-close-circle-line"></i> Salir' : '<i class="ri-add-circle-line"></i> Unirme';
        const btnAction = isJoined
            ? 'app.leaveRosary(\'' + id + '\')'
            : 'app.joinRosary(\'' + id + '\',\'' + name.replace(/'/g, "\\'") + '\',\'' + time + '\',\'' + mystery + '\',\'' + intention.replace(/'/g, "\\'") + '\',' + participants + ')';
        return '<div class="map-popup-content">' +
            '<h4 class="map-popup-name">' + name + '</h4>' +
            '<div class="map-popup-detail"><i class="ri-time-line"></i> Hoy ' + time + ' hs</div>' +
            '<div class="map-popup-detail"><i class="ri-sparkling-line"></i> Misterios ' + mystery + '</div>' +
            '<div class="map-popup-detail"><i class="ri-candle-line"></i> ' + intention + '</div>' +
            '<div class="map-popup-detail"><i class="ri-group-line"></i> ' + participants + ' participantes</div>' +
            '<button class="map-popup-btn ' + btnClass + '" onclick="' + btnAction + '">' + btnText + '</button>' +
            '</div>';
    },

    getJoinedRosaries() {
        try { return JSON.parse(localStorage.getItem(this.JOINED_ROSARIES_KEY)) || []; } catch { return []; }
    },

    joinRosary(id, name, time, mystery, intention, participants, date) {
        if (!auth.isAuthenticated()) { this.navigate('screen-login'); return; }
        const joined = this.getJoinedRosaries();
        if (joined.some(j => j.id === id)) return;
        // Get date from current rosary data if not passed as argument
        var rosaryDate = date || '';
        if (!rosaryDate && this._currentRosary) rosaryDate = this._currentRosary.date || '';
        joined.push({ id, name, time, mystery, intention, participants, date: rosaryDate, joinedAt: new Date().toISOString() });
        localStorage.setItem(this.JOINED_ROSARIES_KEY, JSON.stringify(joined));
        // Sync with Supabase
        if (typeof db !== 'undefined' && db.joinRosary) {
            const user = auth.getCurrentUser();
            if (user) db.joinRosary(id, user.id).catch(e => console.error('Join sync error:', e));
        }
        // Close and reopen popup to refresh button
        if (this.buscarMap) this.buscarMap.closePopup();
        this.renderProfileJoined();
        this.renderProfileMyRosaries();
    },

    leaveRosary(id) {
        let joined = this.getJoinedRosaries();
        joined = joined.filter(j => j.id !== id);
        localStorage.setItem(this.JOINED_ROSARIES_KEY, JSON.stringify(joined));
        // Sync with Supabase
        if (typeof db !== 'undefined' && db.leaveRosary) {
            const user = auth.getCurrentUser();
            if (user) db.leaveRosary(id, user.id).catch(e => console.error('Leave sync error:', e));
        }
        if (this.buscarMap) this.buscarMap.closePopup();
        this.renderProfileJoined();
        this.renderProfileMyRosaries();
    },

    cancelRosary(id, placeName) {
        // Show confirmation modal
        var modal = document.createElement('div');
        modal.className = 'slot-signup-modal';
        modal.innerHTML = '<div class="slot-signup-card">' +
            '<h3><i class="ri-error-warning-fill" style="color:#e74c3c"></i> Cancelar Rosario</h3>' +
            '<p style="font-size:0.9rem;color:#5A7D9A;margin:12px 0">┬┐Estás seguro de cancelar el rosario <strong>' + (placeName || '') + '</strong>?</p>' +
            '<p style="font-size:0.8rem;color:#e74c3c;margin-bottom:16px">Esta acción no se puede deshacer. Se eliminará para todos los participantes.</p>' +
            '<div class="slot-signup-actions">' +
                '<button class="btn btn-secondary-outline" id="cancel-rosary-no">Volver</button>' +
                '<button class="btn btn-primary" id="cancel-rosary-yes" style="background:linear-gradient(135deg,#e74c3c,#c0392b)"><i class="ri-delete-bin-line"></i> Sá, Cancelar</button>' +
            '</div>' +
        '</div>';
        document.body.appendChild(modal);
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        modal.querySelector('#cancel-rosary-no').onclick = function() { modal.remove(); };
        var self = this;
        modal.querySelector('#cancel-rosary-yes').onclick = function() {
            // Remove from local storage
            var rosaries = self.getRosaries().filter(function(r) { return r.id !== id; });
            localStorage.setItem(self.ROSARY_STORAGE_KEY, JSON.stringify(rosaries));
            // Also remove from joined
            var joined = self.getJoinedRosaries().filter(function(j) { return j.id !== id; });
            localStorage.setItem(self.JOINED_ROSARIES_KEY, JSON.stringify(joined));
            // Sync delete to Supabase
            if (typeof db !== 'undefined' && db.deleteRosary) {
                db.deleteRosary(id).catch(function(e) { console.error('Delete sync error:', e); });
            }
            modal.remove();
            self.renderProfileMyRosaries();
            self.renderProfileJoined();
            if (typeof self.loadRosaryCards === 'function') {
                self.loadRosaryCards();
            }
        };
    },

    confirmLeaveRosary(id, placeName) {
        var modal = document.createElement('div');
        modal.className = 'slot-signup-modal';
        modal.innerHTML = '<div class="slot-signup-card">' +
            '<h3><i class="ri-logout-circle-r-line" style="color:#f0a500"></i> Desunirme</h3>' +
            '<p style="font-size:0.9rem;color:#5A7D9A;margin:12px 0">┬┐Deseas salir del rosario <strong>' + (placeName || '') + '</strong>?</p>' +
            '<div class="slot-signup-actions">' +
                '<button class="btn btn-secondary-outline" id="leave-rosary-no">Volver</button>' +
                '<button class="btn btn-primary" id="leave-rosary-yes" style="background:linear-gradient(135deg,#f0a500,#e09600)"><i class="ri-logout-circle-r-line"></i> Sá, Salir</button>' +
            '</div>' +
        '</div>';
        document.body.appendChild(modal);
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        modal.querySelector('#leave-rosary-no').onclick = function() { modal.remove(); };
        var self = this;
        modal.querySelector('#leave-rosary-yes').onclick = function() {
            self.leaveRosary(id);
            modal.remove();
        };
    },

    // Buscar page: filter cards by search text
    filterBuscarCards(query) {
        const cards = document.querySelectorAll('#rosary-list .rosary-card');
        const q = query.toLowerCase().trim();
        let visible = 0;
        let firstMatchMarker = null;

        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            const show = !q || text.includes(q);
            card.style.display = show ? '' : 'none';
            if (show) visible++;
        });

        if (this._buscarMarkers) {
            this._buscarMarkers.forEach(m => {
                if (!m.rosaryData) return;
                const match = !q || (m.rosaryData.place && m.rosaryData.place.toLowerCase().includes(q)) || (m.rosaryData.intention && m.rosaryData.intention.toLowerCase().includes(q));
                if (match && !firstMatchMarker && q.length > 2) {
                    firstMatchMarker = m;
                }
            });
            if (firstMatchMarker) {
                this.buscarMap.setView(firstMatchMarker.getLatLng(), 14);
                setTimeout(() => firstMatchMarker.openPopup(), 300);
            }
        }

        const countEl = document.getElementById('buscar-cards-count');
        if (countEl) countEl.textContent = visible + ' encontrados';
        const emptyEl = document.getElementById('buscar-empty');
        if (emptyEl) emptyEl.style.display = visible === 0 ? '' : 'none';
    },

    // Buscar page: filter by time chip
    filterByTime(btn, period) {
        document.querySelectorAll('.buscar-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        // For now just show all - future: integrate with date filtering
        this.filterBuscarCards(document.getElementById('buscar-search-input')?.value || '');
    },

    async renderProfileMyRosaries() {
        const container = document.getElementById('profile-my-rosaries'); if (!container) return;
        const user = auth.getCurrentUser(); if (!user) return;

        // Load local rosaries first
        let localRosaries = this.getActiveRosaries();
        let allRosaries = localRosaries.slice(); // copy

        // Merge Supabase rosaries (don't replace local ones)
        if (typeof db !== 'undefined' && db.getRosaries) {
            try {
                var remote = await db.getRosaries();
                if (remote && remote.length > 0) {
                    var localIds = {};
                    localRosaries.forEach(function(r) { localIds[r.id] = true; if (r.supabaseId) localIds[r.supabaseId] = true; });
                    remote.forEach(function(r) {
                        if (!localIds[r.id]) {
                            allRosaries.push({
                                id: r.id, place: r.place, address: r.address || '', date: r.date, time: r.time,
                                mystery: r.mystery, intention: r.intention, lat: r.lat, lng: r.lng,
                                participants: r.participants || 1, creatorId: r.creator_id,
                                creatorName: r.creator_name || 'Anónimo'
                            });
                        }
                    });
                }
            } catch(e) { console.warn('[Profile] Supabase rosaries failed:', e.message); }
        }

        // Get Supabase user UUID for matching (local auth ID is different)
        var supabaseUserId = null;
        var sbSession = localStorage.getItem('sb-spplofkotgvumfkeltsr-auth-token');
        if (sbSession) { try { var p = JSON.parse(sbSession); supabaseUserId = p.user ? p.user.id : null; } catch(e) {} }
        var userName = user.name ? user.name.toLowerCase().trim() : '';

        const myRosaries = allRosaries.filter(function(r) {
            // Match by creator_id (UUID or local)
            if (r.creatorId) {
                if (supabaseUserId && r.creatorId === supabaseUserId) return true;
                if (r.creatorId === user.id) return true;
            }
            // Fallback: ALWAYS check by creator_name (works for local auth without Supabase UUID)
            if (r.creatorName && userName && r.creatorName.toLowerCase().trim() === userName) return true;
            return false;
        });

        if (myRosaries.length === 0) {
            container.innerHTML = '<div class="profile-no-slots glass card"><i class="ri-add-circle-line"></i><p>Aún no creaste ningún rosario</p><button class="btn btn-primary" onclick="app.navigate(\'screen-create-rosary\')"><i class="ri-add-line"></i> Crear Rosario</button></div>';
            return;
        }
        let html = '';
        myRosaries.forEach(r => {
            const ds = this.formatDate(r.date);
            const confirmCount = r.participants || 1;
            var safePlaceName = (r.place||'').replace(/'/g, "\\'");
            html += '<div class="profile-rosary-card glass card">' +
                '<div class="profile-rosary-header">' +
                    '<div class="profile-rosary-icon coord-icon"><i class="ri-shield-star-fill"></i></div>' +
                    '<div class="profile-rosary-info">' +
                        '<h4>' + r.place + '</h4>' +
                        '<p><i class="ri-time-line"></i> ' + ds + ' ' + r.time + ' hs ┬À Misterios ' + r.mystery + '</p>' +
                        '<span class="profile-rosary-intention"><i class="ri-candle-fill"></i> ' + r.intention + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="profile-rosary-footer">' +
                    '<div class="profile-rosary-stats">' +
                        '<span class="profile-rosary-badge coord-badge"><i class="ri-shield-star-fill"></i> Coordinador</span>' +
                        '<span class="profile-rosary-confirmed"><i class="ri-check-double-fill"></i> ' + confirmCount + ' confirmados</span>' +
                    '</div>' +
                    '<div class="profile-rosary-actions">' +
                        '<button class="btn btn-primary profile-rosary-btn" onclick="app._currentRosary = {id:\'' + r.id + '\',place:\'' + safePlaceName + '\',date:\'' + (r.date||'') + '\',time:\'' + (r.time||'') + '\',mystery:\'' + (r.mystery||'') + '\',intention:\'' + (r.intention||'').replace(/'/g, "\\'") + '\',creatorId:\'' + (r.creatorId||'') + '\',creatorName:\'' + (r.creatorName||'').replace(/'/g, "\\'") + '\',participants:' + (r.participants||1) + '}; app.navigate(\'screen-rezo\')"><i class="ri-play-circle-fill"></i> Rezar</button>' +
                        '<button class="btn profile-rosary-cancel-btn" onclick="app.cancelRosary(\'' + r.id + '\',\'' + safePlaceName + '\')" title="Cancelar rosario"><i class="ri-delete-bin-line"></i> Cancelar</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        });
        container.innerHTML = html;
    },

    async renderProfileJoined() {
        const container = document.getElementById('profile-joined-rosaries'); if (!container) return;
        const user = auth.getCurrentUser();
        var joined = this.getActiveJoinedRosaries();

        // Load full rosary data from Supabase to get creatorName and enrich joined data
        var fullRosaries = {};
        if (typeof db !== 'undefined' && db.getRosaries) {
            try {
                var remote = await db.getRosaries();
                if (remote) remote.forEach(function(r) {
                    fullRosaries[r.id] = { creatorId: r.creator_id, creatorName: r.creator_name || 'Anónimo', place: r.place, date: r.date, time: r.time, mystery: r.mystery, intention: r.intention, participants: r.participants || 1 };
                });
            } catch(e) {}
        }
        // Also check local rosaries
        this.getActiveRosaries().forEach(function(r) {
            if (!fullRosaries[r.id]) fullRosaries[r.id] = { creatorId: r.creatorId, creatorName: r.creatorName || 'Anónimo', place: r.place, date: r.date, time: r.time, mystery: r.mystery, intention: r.intention, participants: r.participants || 1 };
        });

        // Enrich joined rosaries with full data (fill missing fields)
        joined = joined.map(function(r) {
            var full = fullRosaries[r.id];
            if (full) {
                return {
                    id: r.id,
                    name: r.name || full.place || 'Rosario',
                    time: r.time || full.time || '',
                    mystery: r.mystery || full.mystery || '',
                    intention: r.intention || full.intention || '',
                    participants: full.participants || r.participants || 1,
                    date: r.date || full.date || '',
                    joinedAt: r.joinedAt
                };
            }
            return r;
        });

        // Filter out rosaries that user created (those go in 'Mis Rosarios')
        var supabaseUserId = null;
        var sbSession = localStorage.getItem('sb-spplofkotgvumfkeltsr-auth-token');
        if (sbSession) { try { var p = JSON.parse(sbSession); supabaseUserId = p.user ? p.user.id : null; } catch(e) {} }
        var userName = user ? (user.name || '').toLowerCase().trim() : '';
        const joinedOnly = joined.filter(function(r) {
            var full = fullRosaries[r.id];
            if (!full) return true;
            // Exclude if user is the creator
            if (full.creatorId && supabaseUserId && full.creatorId === supabaseUserId) return false;
            if (full.creatorId && user && full.creatorId === user.id) return false;
            if (full.creatorName && userName && full.creatorName.toLowerCase().trim() === userName) return false;
            return true;
        });

        if (joinedOnly.length === 0) {
            container.innerHTML = '<div class="profile-no-slots glass card"><i class="ri-map-pin-line"></i><p>Aún no te uniste a ningún rosario</p><button class="btn btn-primary" onclick="app.navigate(\'screen-map\')"><i class="ri-search-line"></i> Buscar Rosario</button></div>';
            return;
        }
        let html = '';
        joinedOnly.forEach(r => {
            var full = fullRosaries[r.id] || {};
            var coordName = full.creatorName || 'Anónimo';
            var coordId = full.creatorId || '';
            html += '<div class="profile-rosary-card glass card">' +
                '<div class="profile-rosary-header">' +
                    '<div class="profile-rosary-icon joined-icon"><i class="ri-map-pin-fill"></i></div>' +
                    '<div class="profile-rosary-info">' +
                        '<h4>' + r.name + '</h4>' +
                        '<p><i class="ri-time-line"></i> Hoy ' + r.time + ' hs ┬À Misterios ' + (r.mystery || '') + '</p>' +
                        '<span class="profile-rosary-intention"><i class="ri-candle-fill"></i> ' + r.intention + '</span>' +
                        '<span style="font-size:0.7rem;color:var(--clr-text-muted)"><i class="ri-shield-star-line"></i> Coordina: ' + coordName + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="profile-rosary-footer">' +
                    '<div class="profile-rosary-stats">' +
                        '<span class="profile-rosary-badge joined-badge"><i class="ri-check-line"></i> Unido</span>' +
                    '</div>' +
                    '<div class="profile-rosary-actions">' +
                        '<button class="btn btn-primary profile-rosary-btn" onclick="app._currentRosary = {id:\'' + r.id + '\',place:\'' + (r.name || '').replace(/'/g, "\\'") + '\',time:\'' + r.time + '\',mystery:\'' + (r.mystery || '') + '\',intention:\'' + (r.intention || '').replace(/'/g, "\\'") + '\',creatorId:\'' + coordId + '\',creatorName:\'' + coordName.replace(/'/g, "\\'") + '\'}; app.navigate(\'screen-rezo\')"><i class="ri-play-circle-fill"></i> Rezar</button>' +
                        '<button class="btn profile-rosary-leave-btn" onclick="app.confirmLeaveRosary(\'' + r.id + '\',\'' + (r.name || '').replace(/'/g, "\\'") + '\')" title="Desunirme"><i class="ri-logout-circle-r-line"></i> Salir</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        });
        container.innerHTML = html;
    },

    setPickerLocation(lat, lng) {
        if (this.pickerMarker) this.pickerMap.removeLayer(this.pickerMarker);
        const icon = L.divIcon({ className: 'custom-marker-wrapper', html: '<div class="custom-map-marker picker-pin"><i class="ri-map-pin-add-fill" style="font-size:1.2rem"></i></div>', iconSize: [48,56], iconAnchor: [24,56] });
        this.pickerMarker = L.marker([lat, lng], { icon }).addTo(this.pickerMap);
        this.pickerLocation = { lat, lng };
        const ov = document.getElementById('picker-overlay'); if (ov) ov.style.display = 'none';
        const co = document.getElementById('picker-coords'); if (co) { co.innerHTML = '<i class="ri-map-pin-fill"></i> ' + lat.toFixed(4) + ', ' + lng.toFixed(4); co.classList.add('visible'); }
        const er = document.getElementById('rosary-location-error'); if (er) er.textContent = '';
    },

    getRosaries() { try { return JSON.parse(localStorage.getItem(this.ROSARY_STORAGE_KEY)) || []; } catch { return []; } },

    // Check if a rosary's date+time has already passed
    isRosaryExpired(rosary) {
        if (!rosary.date) return false;
        const now = new Date();
        const rosaryDate = new Date(rosary.date + 'T' + (rosary.time || '23:59'));
        // Add 2 hours grace period after scheduled time
        rosaryDate.setHours(rosaryDate.getHours() + 2);
        return now > rosaryDate;
    },

    // Get only rosaries whose date hasn't passed yet
    getActiveRosaries() {
        return this.getRosaries().filter(r => !this.isRosaryExpired(r));
    },

    // Get only joined rosaries that haven't expired
    getActiveJoinedRosaries() {
        return this.getJoinedRosaries().filter(r => {
            // Joined rosaries may not have a date field, check via saved rosaries
            if (r.date) return !this.isRosaryExpired(r);
            // Look up the original rosary to check its date
            const original = this.getRosaries().find(o => o.id === r.id);
            if (original) return !this.isRosaryExpired(original);
            return true; // Keep if we can't determine expiry
        });
    },

    // Auto-select the best rosary for the Rezar screen
    async getAutoRosary() {
        var user = auth.isAuthenticated() ? auth.getCurrentUser() : null;
        if (!user) return null;
        
        var userName = (user.name || '').toLowerCase().trim();
        var now = new Date();
        
        // Merge local + Supabase rosaries for full coverage
        var localRosaries = this.getActiveRosaries();
        var allActive = [].concat(localRosaries);
        
        // Fetch from Supabase to include rosaries created on other devices
        if (typeof db !== 'undefined' && db.getRosaries) {
            try {
                var remote = await db.getRosaries();
                if (remote && remote.length > 0) {
                    var localIds = {};
                    allActive.forEach(function(r) { localIds[r.id] = true; });
                    remote.forEach(function(r) {
                        if (!localIds[r.id]) {
                            // Convert Supabase format to local format
                            allActive.push({
                                id: r.id, place: r.place, date: r.date, time: r.time,
                                mystery: r.mystery, intention: r.intention,
                                creatorId: r.creator_id, creatorName: r.creator_name,
                                participants: r.participants || 1, address: r.address,
                                lat: r.lat, lng: r.lng
                            });
                        }
                    });
                }
            } catch(e) { console.warn('[Auto] Supabase fetch failed:', e.message); }
        }
        
        // Helper: calculate time distance from now (in minutes)
        function timeDistance(r) {
            if (!r.date || !r.time) return 999999;
            var dt = new Date(r.date + 'T' + r.time);
            return Math.abs(dt.getTime() - now.getTime()) / 60000;
        }
        
        // 1. Priority: Rosary the user COORDINATES (closest to now)
        var supabaseUserId = null;
        var sbSession = localStorage.getItem('sb-spplofkotgvumfkeltsr-auth-token');
        if (sbSession) { try { var p = JSON.parse(sbSession); supabaseUserId = p.user ? p.user.id : null; } catch(e) {} }
        
        var coordinated = allActive.filter(function(r) {
            if (r.creatorId && supabaseUserId && r.creatorId === supabaseUserId) return true;
            if (r.creatorId && user && r.creatorId === user.id) return true;
            if (r.creatorName && userName && r.creatorName.toLowerCase().trim() === userName) return true;
            return false;
        }).sort(function(a, b) { return timeDistance(a) - timeDistance(b); });
        
        if (coordinated.length > 0) {
            console.log('[Auto] Selected coordinated rosary:', coordinated[0].place);
            return coordinated[0];
        }
        
        // 2. Fallback: Rosary the user JOINED (closest to now)
        var joined = this.getActiveJoinedRosaries().sort(function(a, b) {
            return timeDistance(a) - timeDistance(b);
        });
        
        if (joined.length > 0) {
            var j = joined[0];
            console.log('[Auto] Selected joined rosary:', j.name);
            // Try to enrich with creator info from allActive list
            var enriched = allActive.find(function(r) { return r.id === j.id; });
            var creatorId = (enriched && enriched.creatorId) ? enriched.creatorId : (j.creatorId || null);
            var creatorName = (enriched && enriched.creatorName) ? enriched.creatorName : (j.creatorName || 'Anónimo');
            return { id: j.id, place: j.name, time: j.time, mystery: j.mystery, intention: j.intention, date: j.date, participants: j.participants || 1, creatorId: creatorId, creatorName: creatorName };
        }
        
        // 3. Last fallback: Any active rosary closest to now
        var closest = allActive.sort(function(a, b) { return timeDistance(a) - timeDistance(b); });
        if (closest.length > 0) {
            console.log('[Auto] Selected closest rosary:', closest[0].place);
            return closest[0];
        }
        
        return null;
    },

    saveRosary(r) {
        // Save locally
        const a = this.getRosaries(); a.push(r); localStorage.setItem(this.ROSARY_STORAGE_KEY, JSON.stringify(a));
        // Sync to Supabase
        if (typeof db !== 'undefined' && db.createRosary) {
            // Try to get the Supabase user UUID from the session storage
            var supabaseCreatorId = null;
            var sbSession = localStorage.getItem('sb-spplofkotgvumfkeltsr-auth-token');
            if (sbSession) {
                try {
                    var parsed = JSON.parse(sbSession);
                    supabaseCreatorId = parsed.user ? parsed.user.id : null;
                } catch(e) {}
            }
            console.log('[SaveRosary] Local creatorId:', r.creatorId, '| Supabase UUID:', supabaseCreatorId);
            var payload = {
                place: r.place, address: r.address || '', date: r.date, time: r.time,
                mystery: r.mystery, intention: r.intention, lat: r.lat, lng: r.lng,
                creator_name: r.creatorName || 'Anónimo', participants: r.participants || 1
            };
            // Only include creator_id if we have a valid Supabase UUID (it's a FK to profiles.id)
            if (supabaseCreatorId) {
                payload.creator_id = supabaseCreatorId;
            }
            db.createRosary(payload).then(function(result) {
                console.log('Ô£à Rosario guardado en Supabase, id:', result.id);
                // Update local rosary with Supabase ID for dedup
                if (result.id && result.id !== r.id) {
                    r.supabaseId = result.id;
                    // Update localStorage with the supabaseId
                    try {
                        var stored = JSON.parse(localStorage.getItem('redmaria_rosaries') || '[]');
                        var found = stored.find(function(s) { return s.id === r.id; });
                        if (found) { found.supabaseId = result.id; localStorage.setItem('redmaria_rosaries', JSON.stringify(stored)); }
                    } catch(e) {}
                }
            }).catch(function(e) { console.error('ÔØî Error guardando rosario en Supabase:', e.message || e); });
        }
    },


    addRosaryCard(rosary) {
        const list = document.getElementById('rosary-list'); if (!list) return;
        const ds = this.formatDate(rosary.date);
        const joined = this.getJoinedRosaries();
        const isJoined = joined.some(j => j.id === rosary.id);
        const card = document.createElement('div');
        card.className = 'rosary-card glass card';
        card.onclick = () => { app._currentRosary = rosary; app.navigate('screen-rezo'); };
        var addrHtml = rosary.address ? '<div class="rosary-card-detail"><i class="ri-road-map-fill"></i> ' + rosary.address + '</div>' : '';
        var btnLabel = isJoined ? '<i class="ri-check-line"></i> Unido' : '<i class="ri-add-circle-line"></i> Unirme';
        var btnClass = isJoined ? 'btn btn-secondary-outline btn-join' : 'btn btn-primary btn-join';
        
        var shareBtnHtml = '<button class="btn-share-rosary" title="Compartir Rosario" style="background:none; border:none; color:var(--clr-primary); font-size:1.4rem; padding:4px; cursor:pointer; margin-left:auto;"><i class="ri-share-fill"></i></button>';
        
        var u = (typeof auth !== 'undefined' && auth.isAuthenticated()) ? auth.getCurrentUser() : null;
        var isCreator = u && rosary.creatorId === u.id;
        var cancelBtnHtml = isCreator ? '<button class="btn btn-cancel-rosary" style="margin-top:8px; width:100%; padding:10px; font-size:0.9rem; background:transparent; color:#e74c3c; border:1px solid #e74c3c; border-radius:12px; transition:all 0.2s;"><i class="ri-delete-bin-line"></i> Cancelar Rosario</button>' : '';
        
        card.innerHTML = '<div class="rosary-card-header"><div class="rosary-card-icon"><i class="ri-map-pin-fill"></i></div><div class="rosary-card-info"><h3>' + rosary.place + '</h3><p>' + ds + ' ' + rosary.time + ' hs ┬À Misterios ' + rosary.mystery + '</p></div>' + shareBtnHtml + '</div><div class="rosary-card-details">' + addrHtml + '<div class="rosary-card-detail"><i class="ri-candle-fill"></i> ' + rosary.intention + '</div><div class="rosary-card-detail"><i class="ri-group-fill"></i> ' + (rosary.participants || 1) + ' Participantes</div></div><button class="' + btnClass + '" data-rosary-id="' + rosary.id + '">' + btnLabel + '</button>' + cancelBtnHtml;
        
        // Attach join handler to button (stopPropagation to not trigger card click)
        var btn = card.querySelector('.btn-join');
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!auth || !auth.isAuthenticated()) {
                alert("Debes iniciar sesión para unirte a un rosario.");
                app.navigate('screen-login');
                return;
            }
            app._currentRosary = rosary;
            if (!isJoined) {
                app.joinRosary(rosary.id, rosary.place || 'Rosario', rosary.time || '', rosary.mystery || '', rosary.intention || '', rosary.participants || 1, rosary.date || '');
                btn.innerHTML = '<i class="ri-check-line"></i> Unido';
                btn.className = 'btn btn-secondary-outline btn-join';
            }
            app.navigate('screen-rezo');
        });
        
        // Attach share handler
        var shareBtn = card.querySelector('.btn-share-rosary');
        if (shareBtn) {
            shareBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                app.shareRosary(rosary);
            });
        }
        
        // Attach cancel handler
        var cancelBtn = card.querySelector('.btn-cancel-rosary');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                app.cancelRosary(rosary.id, rosary.place || 'Rosario');
            });
        }
        
        list.appendChild(card);
    },

    shareRosary(rosary) {
        var url = window.location.origin + window.location.pathname + '?rosary=' + rosary.id;
        var text = 'Ánete al rosario en ' + rosary.place + ' el ' + this.formatDate(rosary.date) + ' a las ' + rosary.time + ' hs.';
        
        if (navigator.share) {
            navigator.share({
                title: 'Red Maráa - Rosario',
                text: text,
                url: url
            }).catch(function(error) {
                console.log('Error compartiendo', error);
            });
        } else {
            // Fallback to copy clipboard
            navigator.clipboard.writeText(text + ' ' + url).then(function() {
                alert("Enlace copiado al portapapeles. ┬íPégalo donde quieras compartirlo!");
            }).catch(function(err) {
                alert("No se pudo copiar: " + url);
            });
        }
    },

    formatDate(s) {
        if (!s) return '';
        const d = new Date(s + 'T00:00:00'), t = new Date(); t.setHours(0,0,0,0);
        if (d.getTime() === t.getTime()) return 'Hoy';
        if (d.getTime() === t.getTime() + 86400000) return 'Mañana';
        return d.getDate() + ' ' + ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()];
    },

    setupCreateRosaryForm() {
        const form = document.getElementById('create-rosary-form'); if (!form) return;
        const di = document.getElementById('rosary-date'); if (di) { const td = new Date().toISOString().split('T')[0]; di.min = td; di.value = td; }
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const country = document.getElementById('rosary-country') ? document.getElementById('rosary-country').value : '';
            const citySelect = document.getElementById('rosary-city') ? document.getElementById('rosary-city').value : '';
            const ciudadInput = document.getElementById('rosary-ciudad') ? document.getElementById('rosary-ciudad').value.trim() : '';
            const city = ciudadInput || citySelect;
            const place = document.getElementById('rosary-place').value.trim();
            const date = document.getElementById('rosary-date').value;
            const time = document.getElementById('rosary-time').value;
            
            let hasErr = false;
            [
                {id:'rosary-country', v:country, m:'Selecciona un paás'},
                {id:'rosary-ciudad', v:city, m:'Ingresa una ciudad'},
                {id:'rosary-place', v:place, m:'Obligatorio'},
                {id:'rosary-date', v:date, m:'Obligatoria'},
                {id:'rosary-time', v:time, m:'Obligatoria'}
            ].forEach(f => {
                const el = document.getElementById(f.id), g = el?.closest('.auth-field'), er = g?.querySelector('.field-error');
                if (!f.v) { if (g) g.classList.add('has-error'); if (er) er.textContent = f.m; hasErr = true; }
                else { if (g) { g.classList.remove('has-error'); g.classList.add('has-success'); } if (er) er.textContent = ''; }
            });
            if (!this.pickerLocation) { const le = document.getElementById('rosary-location-error'); if (le) le.textContent = 'Marca una ubicación'; hasErr = true; }
            if (hasErr) { form.classList.add('shake'); setTimeout(() => form.classList.remove('shake'), 500); return; }
            const btn = form.querySelector('.btn-auth-submit'); btn.classList.add('loading'); btn.disabled = true;
            await new Promise(r => setTimeout(r, 800));
            const user = auth.getCurrentUser();
            const address = document.getElementById('rosary-address') ? document.getElementById('rosary-address').value.trim() : '';
            const countryName = document.getElementById('rosary-country') ? document.getElementById('rosary-country').options[document.getElementById('rosary-country').selectedIndex].text : '';
            const rosary = { id: Date.now().toString(36)+Math.random().toString(36).substr(2), place: auth.sanitize(place), address: auth.sanitize(address), country: country, countryName: countryName, city: city, date, time, mystery: '', intention: '', lat: this.pickerLocation.lat, lng: this.pickerLocation.lng, creatorId: user?.id||'anon', creatorName: user?.name||'Anónimo', createdAt: new Date().toISOString(), participants: 1 };
            this.saveRosary(rosary); this.addRosaryCard(rosary);
            btn.classList.remove('loading'); btn.disabled = false;
            form.reset(); this.pickerLocation = null;
            if (this.pickerMarker && this.pickerMap) { this.pickerMap.removeLayer(this.pickerMarker); this.pickerMarker = null; }
            const ov = document.getElementById('picker-overlay'); if (ov) ov.style.display = '';
            const co = document.getElementById('picker-coords'); if (co) { co.textContent = ''; co.classList.remove('visible'); }
            form.querySelectorAll('.auth-field').forEach(f => { f.classList.remove('has-success','has-error'); const e = f.querySelector('.field-error'); if (e) e.textContent = ''; });
            this.showRosaryDetail(rosary);
        });
    },

    showRosaryDetail(rosary) {
        const ds = this.formatDate(rosary.date);
        const user = auth.getCurrentUser();
        const details = document.getElementById('create-success-details');
        details.innerHTML = '<div class="success-detail-row"><i class="ri-map-pin-fill"></i> ' + rosary.place + '</div>' +
            (rosary.city ? '<div class="success-detail-row"><i class="ri-building-fill"></i> ' + rosary.city + ', ' + (rosary.countryName || '') + '</div>' : '') +
            (rosary.address ? '<div class="success-detail-row"><i class="ri-road-map-fill"></i> ' + rosary.address + '</div>' : '') +
            '<div class="success-detail-row"><i class="ri-calendar-fill"></i> ' + ds + ' ' + rosary.time + ' hs</div>' +
            '<div class="success-detail-row"><i class="ri-sparkling-fill"></i> Misterios ' + rosary.mystery + '</div>' +
            '<div class="success-detail-row"><i class="ri-candle-fill"></i> ' + rosary.intention + '</div>' +
            '<div class="success-detail-row"><i class="ri-user-fill"></i> Organizado por: ' + (user?.name || 'Tú') + '</div>';
        document.getElementById('create-rosary-form-wrapper').style.display = 'none';
        document.getElementById('create-success-banner').style.display = '';
    },

    resetCreateForm() {
        document.getElementById('create-success-banner').style.display = 'none';
        document.getElementById('create-rosary-form-wrapper').style.display = '';
        const form = document.getElementById('create-rosary-form');
        if (form) form.reset();
        const citySelect = document.getElementById('rosary-city');
        if (citySelect) { citySelect.innerHTML = '<option value="">Primero selecciona un paás...</option>'; citySelect.disabled = true; }
        this.pickerLocation = null;
        if (this.pickerMarker && this.pickerMap) { this.pickerMap.removeLayer(this.pickerMarker); this.pickerMarker = null; }
        const ov = document.getElementById('picker-overlay'); if (ov) ov.style.display = '';
        const co = document.getElementById('picker-coords'); if (co) { co.textContent = ''; co.classList.remove('visible'); }
    },

    // ---- Forgot / Reset Password ----
    setupForgotPasswordForm() {
        const form = document.getElementById('forgot-password-form'); if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();
            const group = document.getElementById('forgot-email').closest('.auth-field');
            const errEl = group.querySelector('.field-error');
            if (!email || !auth.validators.email(email)) {
                group.classList.add('has-error'); errEl.textContent = 'Ingresa un email válido';
                return;
            }
            group.classList.remove('has-error'); group.classList.add('has-success'); errEl.textContent = '';
            const btn = form.querySelector('.btn-auth-submit'); btn.classList.add('loading'); btn.disabled = true;
            await new Promise(r => setTimeout(r, 1200));
            btn.classList.remove('loading'); btn.disabled = false;
            // Check user exists
            const users = auth.getUsers();
            const user = users.find(u => u.email === email.toLowerCase());
            if (!user) {
                group.classList.add('has-error'); errEl.textContent = 'No existe una cuenta con ese email';
                return;
            }
            // Generate 6-digit code
            this.recoveryEmail = email.toLowerCase();
            this.recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
            // Navigate to reset screen and show code
            this.navigate('screen-reset-password');
            document.getElementById('recovery-code-value').textContent = this.recoveryCode;
        });
    },

    setupResetPasswordForm() {
        const form = document.getElementById('reset-password-form'); if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('reset-code').value.trim();
            const password = document.getElementById('reset-password').value;
            const confirm = document.getElementById('reset-confirm').value;
            let hasErr = false;
            // Validate code
            const codeGroup = document.getElementById('reset-code').closest('.auth-field');
            const codeErr = codeGroup.querySelector('.field-error');
            if (code !== this.recoveryCode) {
                codeGroup.classList.add('has-error'); codeErr.textContent = 'Código incorrecto'; hasErr = true;
            } else { codeGroup.classList.remove('has-error'); codeGroup.classList.add('has-success'); codeErr.textContent = ''; }
            // Validate password
            const pwGroup = document.getElementById('reset-password').closest('.auth-field');
            const pwErr = pwGroup.querySelector('.field-error');
            if (!auth.validators.password(password)) {
                pwGroup.classList.add('has-error'); pwErr.textContent = 'Min 8 chars, mayúscula, minúscula, número y especial'; hasErr = true;
            } else { pwGroup.classList.remove('has-error'); pwGroup.classList.add('has-success'); pwErr.textContent = ''; }
            // Validate confirm
            const cfGroup = document.getElementById('reset-confirm').closest('.auth-field');
            const cfErr = cfGroup.querySelector('.field-error');
            if (password !== confirm) {
                cfGroup.classList.add('has-error'); cfErr.textContent = 'Las contraseñas no coinciden'; hasErr = true;
            } else { cfGroup.classList.remove('has-error'); cfGroup.classList.add('has-success'); cfErr.textContent = ''; }
            if (hasErr) { form.classList.add('shake'); setTimeout(() => form.classList.remove('shake'), 500); return; }
            const btn = form.querySelector('.btn-auth-submit'); btn.classList.add('loading'); btn.disabled = true;
            // Update password
            const result = await auth.resetPassword(this.recoveryEmail, password);
            btn.classList.remove('loading'); btn.disabled = false;
            if (result.success) {
                let sb = form.querySelector('.form-success-banner');
                if (!sb) { sb = document.createElement('div'); sb.className = 'form-success-banner'; form.prepend(sb); }
                sb.innerHTML = '<i class="ri-checkbox-circle-fill"></i> ┬íContraseña actualizada!'; sb.classList.add('visible');
                this.recoveryCode = null; this.recoveryEmail = null;
                setTimeout(() => { sb.classList.remove('visible'); this.navigate('screen-login'); }, 2000);
            } else {
                let eb = form.querySelector('.form-error-banner');
                if (!eb) { eb = document.createElement('div'); eb.className = 'form-error-banner'; form.prepend(eb); }
                eb.innerHTML = '<i class="ri-error-warning-fill"></i> ' + result.error; eb.classList.add('visible');
                setTimeout(() => eb.classList.remove('visible'), 3000);
            }
        });
    },

    setupResetStrengthMeter() {
        const pw = document.getElementById('reset-password'); if (!pw) return;
        pw.addEventListener('input', () => {
            const s = auth.getPasswordStrength(pw.value);
            const meter = document.getElementById('reset-strength-meter');
            const label = document.getElementById('reset-strength-label');
            if (!meter || !label) return;
            const bars = meter.querySelectorAll('.strength-bar');
            bars.forEach((b, i) => { b.className = 'strength-bar'; if (i < s.level) b.classList.add('active', s.level === 1 ? 'weak' : s.level === 2 ? 'medium' : 'strong'); });
            label.textContent = s.label; label.className = 'password-strength-label ' + (s.level === 1 ? 'weak' : s.level === 2 ? 'medium' : 'strong');
        });
    },

    isDesktop() { return window.innerWidth >= 1024; },

    navigate(screenId) {
        if (!this.screens.includes(screenId)) return;
        if (auth.isProtected(screenId) && !auth.isAuthenticated()) screenId = 'screen-login';
        const ac = document.getElementById('app-container');
        const single = ['screen-splash','screen-live','screen-rezo','screen-register','screen-login','screen-forgot-password','screen-reset-password','screen-map','screen-intenciones','screen-create-rosary','screen-rosary-detail','screen-como-rezar','screen-profile','screen-porque-rezar','screen-notificaciones','screen-mensajes','screen-apariciones','screen-cenaculo','screen-Comedores','screen-situacion-calle'];
        const isDash = !single.includes(screenId);
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        if (this.isDesktop() && isDash) {
            ac.classList.add('dashboard-mode');
            ['screen-map','screen-profile'].forEach(s => document.getElementById(s).classList.add('active'));
        } else {
            ac.classList.remove('dashboard-mode');
            document.getElementById(screenId).classList.add('active');
        }
        this.currentScreen = screenId;
        this.updateHeaderNav(screenId); this.updateNavVisibility(screenId);

        if (screenId === 'screen-create-rosary') setTimeout(() => this.initPickerMap(), 400);
        if (screenId === 'screen-map') setTimeout(() => this.initBuscarMap(), 400);
        if (screenId === 'screen-Comedores') { setTimeout(() => { if (typeof initComedoresGlobalMap === 'function') initComedoresGlobalMap(); if (typeof comedoresGlobalMap !== 'undefined' && comedoresGlobalMap) { comedoresGlobalMap.invalidateSize(); setTimeout(() => { comedoresGlobalMap.invalidateSize(); window.dispatchEvent(new Event('resize')); }, 500); setTimeout(() => { comedoresGlobalMap.invalidateSize(); window.dispatchEvent(new Event('resize')); }, 1000); } }, 400); }
        if (screenId === 'screen-rosary-detail' && this.detailMap) setTimeout(() => this.detailMap.invalidateSize(), 350);
        if (screenId === 'screen-rezo') {
            if (!this._counterStarted) { this._counterStarted = true; this.startOnlineCounter(); }
            // Auto-select rosary if none selected (async to check Supabase too)
            var self = this;
            if (!this._currentRosary) {
                this.getAutoRosary().then(function(auto) {
                    self._currentRosary = auto;
                    if (typeof updateRezoPage === 'function') {
                        updateRezoPage(self._currentRosary || null);
                    }
                });
            } else {
                if (typeof updateRezoPage === 'function') {
                    updateRezoPage(this._currentRosary || null);
                }
            }
        }
        if (screenId === 'screen-live') this.renderContinuo();
        if (screenId === 'screen-como-rezar') this.highlightTodayMystery();
        if (screenId === 'screen-situacion-calle') setTimeout(function() { if(typeof scInitMap === 'function') scInitMap(); }, 350);
        if (screenId === 'screen-cenaculo') setTimeout(function() { if (typeof initCenaculoMap === 'function') initCenaculoMap(); }, 400);
        if (screenId === 'screen-intenciones') { if (typeof loadCommunityIntenciones === 'function') loadCommunityIntenciones(); }
        if (screenId === 'screen-profile' || isDash) this.updateUserUI();
    },

    updateHeaderNav(s) {
        // Desktop header (now with dropdown: Inicio, Buscar, Crear, Continuo, [Rezar dropdown trigger + 4 sub], Apariciones, Mensajes, Perfil)
        document.querySelectorAll('.header-nav > a, .header-dropdown-trigger, .header-dropdown-menu a').forEach(a => a.classList.remove('active'));
        const h = document.querySelectorAll('.header-nav > a');
        const dd = document.querySelectorAll('.header-dropdown-menu a');
        const dt = document.querySelector('.header-dropdown-trigger');
        if (s === 'screen-splash') h[0]?.classList.add('active');
        else if (s === 'screen-map') h[1]?.classList.add('active');
        else if (s === 'screen-create-rosary') h[2]?.classList.add('active');
        else if (s === 'screen-live') h[3]?.classList.add('active');
        else if (s === 'screen-rezo') { h[4]?.classList.add('active'); }
        else if (s === 'screen-intenciones') { dd[0]?.classList.add('active'); if(dt) dt.classList.add('active'); }
        else if (s === 'screen-como-rezar') { dd[1]?.classList.add('active'); if(dt) dt.classList.add('active'); }
        else if (s === 'screen-porque-rezar') { dd[2]?.classList.add('active'); if(dt) dt.classList.add('active'); }
        else if (s === 'screen-apariciones') { dd[3]?.classList.add('active'); if(dt) dt.classList.add('active'); }
        else if (s === 'screen-Comedores') h[5]?.classList.add('active');
        else if (s === 'screen-cenaculo') h[6]?.classList.add('active');
        else if (s === 'screen-notificaciones') h[7]?.classList.add('active');
        else if (s === 'screen-profile') h[8]?.classList.add('active');
        // Mobile header
        document.querySelectorAll('.mobile-header-nav a').forEach(a => a.classList.remove('active'));
        const m = document.querySelectorAll('.mobile-header-nav a');
        if (s === 'screen-splash') m[0]?.classList.add('active');
        else if (s === 'screen-map') m[1]?.classList.add('active');
        else if (s === 'screen-create-rosary') m[2]?.classList.add('active');
        else if (s === 'screen-rezo') m[3]?.classList.add('active');
        else if (s === 'screen-como-rezar') m[4]?.classList.add('active');
        else if (s === 'screen-porque-rezar') m[5]?.classList.add('active');
        else if (s === 'screen-apariciones') m[6]?.classList.add('active');
        else if (s === 'screen-Comedores') m[7]?.classList.add('active');
        else if (s === 'screen-cenaculo') m[8]?.classList.add('active');
        else if (s === 'screen-notificaciones') m[9]?.classList.add('active');
        else if (s === 'screen-profile') m[10]?.classList.add('active');
    },

    toggleMobileMenu() {
        const nav = document.getElementById('mobile-nav-links');
        const btn = document.querySelector('#hamburger-btn i');
        nav.classList.toggle('open');
        btn.className = nav.classList.contains('open') ? 'ri-close-line' : 'ri-menu-line';
    },

    mobileNav(screenId) {
        this.navigate(screenId);
        const nav = document.getElementById('mobile-nav-links');
        const btn = document.querySelector('#hamburger-btn i');
        nav.classList.remove('open');
        btn.className = 'ri-menu-line';
    },

    updateNavVisibility(s) {
        const nav = document.getElementById('main-nav');
        const hideScreens = ['screen-register','screen-login','screen-forgot-password','screen-reset-password'];
        if (hideScreens.includes(s)) {
            nav.style.transform='translateY(100%)'; nav.style.opacity='0'; nav.style.pointerEvents='none';
        } else {
            nav.style.transform='translateY(0)'; nav.style.opacity='1'; nav.style.pointerEvents='all';
            // Map screens to nav items
            const navMap = {
                'screen-splash': 0,
                'screen-map': 1,
                'screen-create-rosary': 2,
                'screen-rezo': 3,
                'screen-live': 4,
                'screen-Comedores': 5,
                'screen-cenaculo': 6,
                'screen-notificaciones': 7,
                'screen-profile': 8,
                'screen-rosary-detail': 1,
                'screen-como-rezar': 3,
                'screen-porque-rezar': 3,
                'screen-apariciones': 3,
                'screen-intenciones': 3,
                'screen-event': 1
            };
            const items = document.querySelectorAll('#main-nav .nav-item');
            items.forEach(el => el.classList.remove('active'));
            const idx = navMap[s];
            if (idx !== undefined && items[idx]) items[idx].classList.add('active');
        }
    },

    onAuthSuccess() { this.updateUserUI(); if (typeof loadAvatar === 'function') loadAvatar(); this.navigate('screen-profile'); this.requestGeolocation(); },
    handleLogout() { auth.logoutUser(); if (typeof setAvatarEverywhere === 'function') setAvatarEverywhere(null); this.navigate('screen-splash'); },

    requestGeolocation() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                localStorage.setItem('redmaria_location', JSON.stringify(loc));
                // Reverse geocode to get city name
                fetch('https://nominatim.openstreetmap.org/reverse?lat=' + loc.lat + '&lon=' + loc.lng + '&format=json&accept-language=es')
                    .then(r => r.json())
                    .then(data => {
                        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || '';
                        if (city) {
                            const pc = document.getElementById('profile-user-city');
                            if (pc) pc.textContent = city;
                            localStorage.setItem('redmaria_user_city', city);
                        }
                    }).catch(function(){});
            },
            function(err) {
                console.log('Geolocation denied:', err.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    },

    updateUserUI() {
        const u = auth.getCurrentUser(); if (!u) return;
        const pn = document.getElementById('profile-user-name'), pc = document.getElementById('profile-user-city'), pa = document.getElementById('profile-avatar-placeholder');
        if (pn) pn.textContent = u.name; if (pc) pc.textContent = u.city; if (pa) pa.textContent = u.name.charAt(0).toUpperCase();
        const hn = document.getElementById('header-user-name'); if (hn) hn.textContent = u.name;
        const hm = document.getElementById('header-avatar-mini'); if (hm) hm.textContent = u.name.charAt(0).toUpperCase();
        // Restore saved city from geolocation
        const savedCity = localStorage.getItem('redmaria_user_city');
        if (savedCity && pc) pc.textContent = savedCity;

        // Restore saved bio
        const savedBio = localStorage.getItem('redmaria_user_bio');
        const bioText = document.getElementById('profile-bio-text');
        if (bioText) {
            if (savedBio) {
                bioText.textContent = '"' + savedBio + '"';
                bioText.style.fontStyle = 'normal';
                bioText.style.color = 'var(--clr-text-title)';
            } else {
                bioText.textContent = '"Toca aquá para agregar una frase que te represente..."';
                bioText.style.fontStyle = 'italic';
                bioText.style.color = 'var(--clr-text-muted)';
            }
        }
        if (typeof db !== 'undefined' && db.getProfileByEmail) {
            db.getProfileByEmail(u.email).then(function(p) {
                if (p && p.bio) {
                    localStorage.setItem('redmaria_user_bio', p.bio);
                    if (bioText) {
                        bioText.textContent = '"' + p.bio + '"';
                        bioText.style.fontStyle = 'normal';
                        bioText.style.color = 'var(--clr-text-title)';
                    }
                }
                if (p && p.likes !== undefined) {
                    var countEl = document.querySelector('.profile-like-count');
                    if (countEl) countEl.textContent = p.likes;
                }
                
                // Restore heart icon state from localStorage
                var myLiked = localStorage.getItem('redmaria_my_profile_liked') === 'true';
                var icon = document.querySelector('.profile-like-icon');
                if (icon) {
                    if (myLiked) {
                        icon.classList.add('liked-emoji');
                        icon.textContent = '­ƒÖÅ';
                        icon.style.filter = 'none';
                        icon.style.opacity = '1';
                        icon.style.transform = 'scale(1.1)';
                    } else {
                        icon.classList.remove('liked-emoji');
                        icon.textContent = '­ƒÖÅ';
                        icon.style.filter = 'grayscale(80%)';
                        icon.style.opacity = '0.5';
                        icon.style.transform = 'scale(1)';
                    }
                }
            }).catch(function(e) { console.warn('[Profile] Error loading profile details:', e); });
        }

        // Render each section independently so one error doesn't block the rest
        try { this.renderProfileSlots(); } catch(e) { console.error('[Profile] renderProfileSlots error:', e); }
        try { this.renderProfileJoined(); } catch(e) { console.error('[Profile] renderProfileJoined error:', e); }
        try { this.renderProfileMyRosaries(); } catch(e) { console.error('[Profile] renderProfileMyRosaries error:', e); }
    },

    renderProfileSlots() {
        const container = document.getElementById('profile-my-slots'); if (!container) return;
        const session = auth.isAuthenticated() ? JSON.parse(localStorage.getItem('redmaria_session')) : null;
        if (!session) return;
        const userName = session.name;
        const all = JSON.parse(localStorage.getItem(this.CONTINUO_KEY) || '{}');
        const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const mySlots = [];

        for (const dateKey in all) {
            const slots = all[dateKey];
            for (const h in slots) {
                let people = slots[h];
                if (typeof people === 'string') people = [people];
                if (!Array.isArray(people)) continue; // skip corrupt data
                if (people.includes(userName)) {
                    const d = new Date(dateKey + 'T00:00:00');
                    const today = new Date(); today.setHours(0,0,0,0);
                    const tomorrow = new Date(today.getTime() + 86400000);
                    let dayLabel;
                    if (d.getTime() === today.getTime()) dayLabel = 'Hoy';
                    else if (d.getTime() === tomorrow.getTime()) dayLabel = 'Mañana';
                    else dayLabel = days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()];
                    const hour = parseInt(h);
                    const hourStr = hour.toString().padStart(2, '0') + ':00';
                    const nextHourStr = ((hour + 1) % 24).toString().padStart(2, '0') + ':00';
                    mySlots.push({ dateKey, date: d, dayLabel, hour, hourStr, nextHourStr, count: people.length });
                }
            }
        }

        // Sort by date and hour
        mySlots.sort((a, b) => a.date - b.date || a.hour - b.hour);

        if (mySlots.length === 0) {
            container.innerHTML = '<div class="profile-no-slots glass card"><i class="ri-calendar-line"></i><p>Aún no te anotaste a ningún turno</p><button class="btn btn-primary" onclick="app.navigate(\'screen-live\')"><i class="ri-add-line"></i> Anotarme</button></div>';
            return;
        }

        let html = '';
        mySlots.forEach(s => {
            html += '<div class="profile-slot-card glass card">' +
                '<div class="profile-slot-left">' +
                    '<div class="profile-slot-icon"><i class="ri-time-line"></i></div>' +
                    '<div class="profile-slot-info">' +
                        '<h4>' + s.hourStr + ' - ' + s.nextHourStr + '</h4>' +
                        '<p><i class="ri-calendar-event-fill"></i> ' + s.dayLabel + '</p>' +
                        '<span class="profile-slot-people"><i class="ri-group-fill"></i> ' + s.count + ' persona' + (s.count > 1 ? 's' : '') + '</span>' +
                    '</div>' +
                '</div>' +
                '<button class="profile-slot-cancel" onclick="app.cancelSlot(\'' + s.dateKey + '\',' + s.hour + '); app.renderProfileSlots();" title="Cancelar turno"><i class="ri-close-circle-line"></i></button>' +
            '</div>';
        });
        container.innerHTML = html;
    },

    generateSplashBeads() { const c = document.getElementById('splash-beads'); for (let i=0;i<44;i++) { const a=(i/44)*Math.PI*2; if(a>Math.PI*0.35&&a<Math.PI*0.65)continue; const b=document.createElement('div'); b.className='rosary-bead'; b.style.left=(90+80*Math.cos(a))+'px'; b.style.top=(90+80*Math.sin(a))+'px'; c.appendChild(b); } },
    generateLiveBeads() { const c=document.getElementById('live-beads'); for(let i=0;i<7;i++){const b=document.createElement('div');b.className='live-bead';if(i===3)b.classList.add('active');c.appendChild(b);} },
    generateParticipants() {
        // No fake participants - real data only
    },
    startOnlineCounter() { /* disabled - no fake counter */ },

    // ---- ROSARIO CONTINUO ----
    continuoChangeDay(delta) {
        this.continuoDate.setDate(this.continuoDate.getDate() + delta);
        this.renderContinuo();
    },

    async getContinuoSlots(dateKey) {
        var all = JSON.parse(localStorage.getItem(this.CONTINUO_KEY) || '{}');
        if (!all[dateKey]) all[dateKey] = {};
        
        // Migrate string values to arrays in local
        for (var h in all[dateKey]) {
            if (typeof all[dateKey][h] === 'string') all[dateKey][h] = [all[dateKey][h]];
            if (!Array.isArray(all[dateKey][h])) all[dateKey][h] = [];
        }
        
        // Supabase is the SOURCE OF TRUTH when available
        if (typeof db !== 'undefined' && db.getContinuoSlots) {
            try {
                var remote = await db.getContinuoSlots(dateKey);
                if (remote && typeof remote === 'object') {
                    // Replace local with Supabase data entirely for this date
                    var supabaseSlots = {};
                    for (var rh in remote) {
                        supabaseSlots[rh] = Array.isArray(remote[rh]) ? remote[rh] : [remote[rh]];
                    }
                    // Also include any LOCAL-ONLY entries added in the last 10 seconds
                    // (to handle the gap between local save and Supabase propagation)
                    var localSlots = all[dateKey] || {};
                    var recentKey = '_continuo_recent_' + dateKey;
                    var recentRaw = localStorage.getItem(recentKey);
                    if (recentRaw) {
                        try {
                            var recent = JSON.parse(recentRaw);
                            var now = Date.now();
                            // Add recent local entries not yet in Supabase (within 10s)
                            recent.forEach(function(entry) {
                                if (now - entry.ts < 10000) {
                                    var hr = entry.hour;
                                    if (!supabaseSlots[hr]) supabaseSlots[hr] = [];
                                    if (!supabaseSlots[hr].includes(entry.name)) {
                                        supabaseSlots[hr].push(entry.name);
                                    }
                                }
                            });
                            // Clean old entries
                            var fresh = recent.filter(function(e) { return now - e.ts < 10000; });
                            if (fresh.length > 0) localStorage.setItem(recentKey, JSON.stringify(fresh));
                            else localStorage.removeItem(recentKey);
                        } catch(e) { localStorage.removeItem(recentKey); }
                    }
                    all[dateKey] = supabaseSlots;
                    localStorage.setItem(this.CONTINUO_KEY, JSON.stringify(all));
                    console.log('[Continuo] Using Supabase as source of truth for', dateKey);
                    return supabaseSlots;
                }
            } catch(e) { console.warn('[Continuo] Supabase failed, using local:', e.message); }
        }
        
        // Fallback: use localStorage only (offline mode)
        console.log('[Continuo] Using localStorage fallback for', dateKey);
        return all[dateKey] || {};
    },

    async renderContinuo() {
        const d = this.continuoDate;
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        const isTomorrow = new Date(today.getTime() + 86400000).toDateString() === d.toDateString();
        const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const titleEl = document.getElementById('continuo-date-title');
        const subEl = document.getElementById('continuo-date-sub');
        if (titleEl) titleEl.textContent = isToday ? 'Hoy' : (isTomorrow ? 'Mañana' : days[d.getDay()]);
        if (subEl) subEl.textContent = d.getDate() + ' de ' + months[d.getMonth()] + ', ' + d.getFullYear();

        const dateKey = this.localDateKey(d);
        const slots = await this.getContinuoSlots(dateKey);
        const user = auth.isAuthenticated() ? JSON.parse(localStorage.getItem('redmaria_session')).name : null;
        const grid = document.getElementById('continuo-grid');
        if (!grid) return;
        grid.innerHTML = '';
        let totalPeople = 0;

        for (let h = 0; h < 24; h++) {
            const card = document.createElement('div');
            const hour = h.toString().padStart(2, '0') + ':00';
            const nextHour = ((h + 1) % 24).toString().padStart(2, '0') + ':00';
            let people = slots[h] || [];
            if (typeof people === 'string') people = [people];
            if (!Array.isArray(people)) people = [];
            const count = people.length;
            const isMine = user && people.includes(user);
            totalPeople += count;

            if (count > 0) {
                card.className = 'slot-card ' + (isMine ? 'mine' : 'taken');
                card.innerHTML = '<div class="slot-hour">' + hour + '</div><div class="slot-count">' + count + '</div><div class="slot-status">' + (isMine ? '­ƒÖÅ Tú + ' + (count - 1) : count + ' persona' + (count > 1 ? 's' : '')) + '</div>';
                card.onclick = () => this.showSlotSignup(dateKey, h, hour, nextHour);
            } else {
                card.className = 'slot-card free';
                card.innerHTML = '<div class="slot-hour">' + hour + '</div><div class="slot-count">0</div><div class="slot-status">Libre</div>';
                card.onclick = () => this.showSlotSignup(dateKey, h, hour, nextHour);
            }
            grid.appendChild(card);
        }

        var takenEl = document.getElementById('continuo-taken');
        if (takenEl) takenEl.textContent = totalPeople;

        // Mis Turnos
        const mySection = document.getElementById('continuo-my-slots');
        const myList = document.getElementById('continuo-my-list');
        if (!myList) return;
        myList.innerHTML = '';
        let hasSlots = false;
        for (let h = 0; h < 24; h++) {
            let people = slots[h] || [];
            if (typeof people === 'string') people = [people];
            if (!Array.isArray(people)) people = [];
            if (user && people.includes(user)) {
                hasSlots = true;
                const hour = h.toString().padStart(2, '0') + ':00';
                const nextHour = ((h + 1) % 24).toString().padStart(2, '0') + ':00';
                const item = document.createElement('div');
                item.className = 'my-slot-item';
                item.innerHTML = '<div class="my-slot-info"><div class="my-slot-icon"><i class="ri-time-line"></i></div><div class="my-slot-text"><h4>' + hour + ' - ' + nextHour + '</h4><p>' + (subEl ? subEl.textContent : '') + '</p></div></div><button class="my-slot-cancel" onclick="app.cancelSlot(\'' + dateKey + '\',' + h + ')">Cancelar</button>';
                myList.appendChild(item);
            }
        }
        if (mySection) mySection.style.display = hasSlots ? 'block' : 'none';
    },

    showSlotSignup(dateKey, hour, hourStr, nextHourStr) {
        if (!auth.isAuthenticated()) { this.navigate('screen-login'); return; }
        const user = JSON.parse(localStorage.getItem('redmaria_session')).name;
        // Use the last rendered data (already synced from Supabase) instead of stale localStorage
        const all = JSON.parse(localStorage.getItem(this.CONTINUO_KEY) || '{}');
        const slots = all[dateKey] || {};
        let people = slots[hour] || [];
        if (typeof people === 'string') people = [people];
        if (!Array.isArray(people)) people = [];
        const alreadyIn = people.includes(user);
        // Parse date from dateKey to avoid timezone drift from continuoDate
        const dateParts = dateKey.split('-');
        const modalDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const dateStr = modalDate.getDate() + ' de ' + months[modalDate.getMonth()] + ', ' + modalDate.getFullYear();
        const modal = document.createElement('div');
        modal.className = 'slot-signup-modal';
        if (alreadyIn) {
            modal.innerHTML = '<div class="slot-signup-card"><h3>Cancelar Turno</h3><div class="slot-signup-time">' + hourStr + ' - ' + nextHourStr + '</div><div class="slot-signup-date">' + dateStr + '</div><p style="font-size:0.85rem;color:#5A7D9A;margin-bottom:12px">Ya estás anotado en este horario. ┬┐Deseas cancelar?</p><div class="slot-signup-actions"><button class="btn btn-secondary-outline" onclick="this.closest(\'.slot-signup-modal\').remove()">Volver</button><button class="btn btn-primary" id="confirm-slot-btn" style="background:linear-gradient(135deg,#e74c3c,#c0392b)">Cancelar Turno</button></div></div>';
            document.body.appendChild(modal);
            modal.querySelector('#confirm-slot-btn').onclick = () => { this.cancelSlot(dateKey, hour); modal.remove(); };
        } else {
            modal.innerHTML = '<div class="slot-signup-card"><h3>Anotarse al Rosario</h3><div class="slot-signup-time">' + hourStr + ' - ' + nextHourStr + '</div><div class="slot-signup-date">' + dateStr + '</div>' + (people.length > 0 ? '<p style="font-size:0.85rem;color:#5A7D9A;margin-bottom:12px">' + people.length + ' persona' + (people.length > 1 ? 's' : '') + ' ya anotada' + (people.length > 1 ? 's' : '') + '</p>' : '') + '<div class="slot-signup-actions"><button class="btn btn-secondary-outline" onclick="this.closest(\'.slot-signup-modal\').remove()">Cancelar</button><button class="btn btn-primary" id="confirm-slot-btn">Confirmar</button></div></div>';
            document.body.appendChild(modal);
            modal.querySelector('#confirm-slot-btn').onclick = () => { this.confirmSlot(dateKey, hour); modal.remove(); };
        }
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    },

    async confirmSlot(dateKey, hour) {
        const session = JSON.parse(localStorage.getItem('redmaria_session'));
        if (!session) return;
        // Save locally for immediate feedback
        const all = JSON.parse(localStorage.getItem(this.CONTINUO_KEY) || '{}');
        if (!all[dateKey]) all[dateKey] = {};
        if (!all[dateKey][hour]) all[dateKey][hour] = [];
        if (typeof all[dateKey][hour] === 'string') all[dateKey][hour] = [all[dateKey][hour]];
        if (!all[dateKey][hour].includes(session.name)) all[dateKey][hour].push(session.name);
        localStorage.setItem(this.CONTINUO_KEY, JSON.stringify(all));
        // Track as recent entry (for instant feedback before Supabase propagates)
        var recentKey = '_continuo_recent_' + dateKey;
        var recent = [];
        try { recent = JSON.parse(localStorage.getItem(recentKey) || '[]'); } catch(e) { recent = []; }
        recent.push({ hour: hour, name: session.name, ts: Date.now() });
        localStorage.setItem(recentKey, JSON.stringify(recent));
        // Sync to Supabase (await so renderContinuo reads fresh data)
        if (typeof db !== 'undefined' && db.addContinuoSlot) {
            await db.addContinuoSlot(dateKey, hour, session.name);
        }
        this.renderContinuo();
    },

    async cancelSlot(dateKey, hour) {
        const session = JSON.parse(localStorage.getItem('redmaria_session'));
        if (!session) return;
        // Remove locally
        const all = JSON.parse(localStorage.getItem(this.CONTINUO_KEY) || '{}');
        if (all[dateKey] && all[dateKey][hour]) {
            if (typeof all[dateKey][hour] === 'string') all[dateKey][hour] = [all[dateKey][hour]];
            all[dateKey][hour] = all[dateKey][hour].filter(n => n !== session.name);
            if (all[dateKey][hour].length === 0) delete all[dateKey][hour];
        }
        localStorage.setItem(this.CONTINUO_KEY, JSON.stringify(all));
        // Sync to Supabase
        if (typeof db !== 'undefined' && db.removeContinuoSlot) {
            await db.removeContinuoSlot(dateKey, hour, session.name);
        }
        this.renderContinuo();
    },

    highlightTodayMystery() {
        const el = document.getElementById('rezar-today-highlight');
        if (!el) return;
        const day = new Date().getDay(); // 0=Dom, 1=Lun...
        const dayMap = { 0: 'Gloriosos', 1: 'Gozosos', 2: 'Dolorosos', 3: 'Gloriosos', 4: 'Luminosos', 5: 'Dolorosos', 6: 'Gozosos' };
        const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        const mystery = dayMap[day];
        const colorMap = { 'Gozosos': '#56d992', 'Dolorosos': '#e74c3c', 'Gloriosos': '#f0a500', 'Luminosos': '#3DA3D4' };
        el.innerHTML = '<i class="ri-calendar-check-fill"></i> Hoy es <strong>' + dayNames[day] + '</strong> ÔÇö rezamos los <strong>Misterios ' + mystery + '</strong>';
        el.style.borderLeft = '4px solid ' + (colorMap[mystery] || '#3DA3D4');
    },

    addIntencion() {
        const ta = document.getElementById('intencion-text');
        const text = ta?.value.trim();
        if (!text) { ta?.focus(); return; }
        const user = auth.isAuthenticated() ? auth.getCurrentUser() : null;
        if (!user) { this.navigate('screen-login'); return; }
        const name = user.name || 'Anónimo';
        const initial = name.charAt(0).toUpperCase();
        const colors = ['#A8C4DE','#F4D35E','#B5D6A7','#E8A0BF','#C4B5FD','#8FACC5','#FFB4A2','#89CFF0','#FFC6FF','#CAFFBF'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const color2 = colors[(Math.floor(Math.random() * colors.length) + 3) % colors.length];

        // Build intention object (same format as rezo intenciones for unification)
        var intencion = {
            id: Date.now().toString(36),
            name: name,
            initial: initial,
            text: text,
            color: color,
            color2: color2,
            time: new Date().toISOString()
        };

        // Save to shared localStorage (used by both Rezar and Intenciones screens)
        if (typeof getRezoIntenciones === 'function') {
            var list = getRezoIntenciones();
            list.push(intencion);
            saveRezoIntenciones(list);
        }

        // Update the community intentions list visually (on Intenciones screen)
        const communityList = document.getElementById('community-intentions-list');
        if (communityList) {
            const item = document.createElement('div');
            item.className = 'community-intention glass';
            item.style.animation = 'fadeInUp 0.4s ease-out';
            item.innerHTML = '<div class="ci-avatar" style="background:' + color + '">' + initial + '</div><div class="ci-content"><span class="ci-name">' + auth.sanitize(name) + '</span><p>' + auth.sanitize(text) + '</p></div><div class="ci-heart-area"><button class="ci-heart-btn" onclick="toggleRezoHeart(this,\'' + intencion.id + '\')"><i class="ri-heart-line"></i></button><span class="ci-heart-count">0</span></div>';
            communityList.insertBefore(item, communityList.firstChild);
        }

        // Also update the rezo intenciones list if it exists (on Rezar screen)
        if (typeof renderRezoIntenciones === 'function') {
            renderRezoIntenciones();
        }

        ta.value = '';

        // Sync to Supabase with user name
        if (typeof db !== 'undefined' && db.createIntencion) {
            db.createIntencion({ text: text, user_name: name })
                .then(function(result) { console.log('[Intenciones] Saved to Supabase'); })
                .catch(function(e) { console.error('[Intenciones] Sync error:', e); });
        }
    }
};

// Init app
document.addEventListener('DOMContentLoaded', function() {
    app.init();
    if (typeof loadCommunityIntenciones === 'function') {
        loadCommunityIntenciones();
    }

    // Check for shared rosary in URL
    var urlParams = new URLSearchParams(window.location.search);
    var sharedRosary = urlParams.get('rosary');
    if (sharedRosary) {
        setTimeout(function() {
            app.navigate('screen-map');
            // Remove the param from URL so it doesn't persist on reload
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Optionally, scroll to the specific rosary card or highlight it
            setTimeout(function() {
                var cardBtn = document.querySelector('.btn-join[data-rosary-id="' + sharedRosary + '"]');
                if (cardBtn) {
                    var card = cardBtn.closest('.rosary-card');
                    if (card) {
                        card.scrollIntoView({behavior: 'smooth', block: 'center'});
                        card.style.boxShadow = '0 0 20px rgba(243, 156, 18, 0.8)';
                        setTimeout(function() { card.style.boxShadow = ''; }, 3000);
                    }
                }
            }, 1000);
        }, 300);
    }
});

// Ensure global access for inline onclick handlers
window.app = app;

// Profile Bio functions
function editProfileBio() {
    var textEl = document.getElementById('profile-bio-text');
    var editorEl = document.getElementById('profile-bio-editor');
    if (textEl) textEl.style.display = 'none';
    if (editorEl) editorEl.style.display = 'flex';
    var savedBio = localStorage.getItem('redmaria_user_bio') || '';
    var inputEl = document.getElementById('profile-bio-input');
    if (inputEl) {
        inputEl.value = savedBio;
        inputEl.focus();
    }
}

function cancelEditBio() {
    var textEl = document.getElementById('profile-bio-text');
    var editorEl = document.getElementById('profile-bio-editor');
    if (textEl) textEl.style.display = 'block';
    if (editorEl) editorEl.style.display = 'none';
}

function saveProfileBio() {
    var inputEl = document.getElementById('profile-bio-input');
    if (!inputEl) return;
    var bio = inputEl.value.trim();
    // check word count
    var words = bio.match(/\S+/g);
    var wordCount = words ? words.length : 0;
    if (wordCount > 80) {
        if (typeof showMsgToast === 'function') showMsgToast('La frase no puede tener más de 80 palabras.');
        return;
    }
    
    localStorage.setItem('redmaria_user_bio', bio);
    
    var bioText = document.getElementById('profile-bio-text');
    if (bioText) {
        if (bio) {
            bioText.textContent = '"' + bio + '"';
            bioText.style.fontStyle = 'normal';
            bioText.style.color = 'var(--clr-text-title)';
        } else {
            bioText.textContent = '"Toca aquá para agregar una frase que te represente..."';
            bioText.style.fontStyle = 'italic';
            bioText.style.color = 'var(--clr-text-muted)';
        }
    }
    
    cancelEditBio();
    
    var u = auth.getCurrentUser();
    if (u && typeof db !== 'undefined' && db.updateProfileBio) {
        db.updateProfileBio(u.id, bio).catch(function(e) { console.error('Error saving bio:', e); });
    }
}

// Profile Intention functions (for map broadcasting)
function editProfileIntention() {
    var textEl = document.getElementById('profile-intention-text');
    var editorEl = document.getElementById('profile-intention-editor');
    if (textEl) textEl.style.display = 'none';
    if (editorEl) editorEl.style.display = 'flex';
    var savedIntention = localStorage.getItem('redmaria_user_intention') || '';
    var inputEl = document.getElementById('profile-intention-input');
    if (inputEl) {
        inputEl.value = savedIntention;
        inputEl.focus();
    }
}

function cancelEditIntention() {
    var textEl = document.getElementById('profile-intention-text');
    var editorEl = document.getElementById('profile-intention-editor');
    if (textEl) textEl.style.display = 'block';
    if (editorEl) editorEl.style.display = 'none';
}

function saveProfileIntention() {
    var inputEl = document.getElementById('profile-intention-input');
    if (!inputEl) return;
    var intention = inputEl.value.trim();
    // check word count
    var words = intention.match(/\S+/g);
    var wordCount = words ? words.length : 0;
    if (wordCount > 80) {
        if (typeof showMsgToast === 'function') showMsgToast('La intención no puede tener más de 80 palabras.');
        return;
    }
    
    localStorage.setItem('redmaria_user_intention', intention);
    
    var textEl = document.getElementById('profile-intention-text');
    if (textEl) {
        if (intention) {
            textEl.textContent = '"' + intention + '"';
            textEl.style.fontStyle = 'normal';
            textEl.style.color = 'var(--clr-text-title)';
        } else {
            textEl.textContent = '"Toca aquá para escribir una intención por la cual quieres que la comunidad rece..."';
            textEl.style.fontStyle = 'italic';
            textEl.style.color = 'var(--clr-text-muted)';
        }
    }
    
    // Broadcast instantly if active
    if (typeof _myRezandoId !== 'undefined' && _myRezandoId && typeof broadcastRezando === 'function') {
        var userName = 'Tú';
        try { userName = auth.getCurrentUser().name || 'Tú'; } catch(e){}
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                broadcastRezando(_myRezandoId, userName, pos.coords.latitude, pos.coords.longitude, '', intention);
                if (typeof addMyMarker === 'function') addMyMarker(userName, pos.coords.latitude, pos.coords.longitude, intention);
            }, function(){}, {enableHighAccuracy: true, timeout: 8000});
        }
    }

    cancelEditIntention();
}

function toggleProfileLike(el) {
    var icon = el.querySelector('.profile-like-icon');
    var countEl = el.querySelector('.profile-like-count');
    if (!icon || !countEl) return;
    
    var isLiked = icon.classList.contains('liked-emoji');
    var count = parseInt(countEl.textContent, 10) || 0;
    var increment = 0;
    var u = auth.getCurrentUser();
    
    if (isLiked) {
        // Was liked (filled hand) -> unlike (empty hand), subtract 1
        icon.classList.remove('liked-emoji');
        icon.textContent = '­ƒÖÅ';
        icon.style.filter = 'grayscale(80%)';
        icon.style.opacity = '0.5';
        icon.style.transform = 'scale(1)';
        countEl.textContent = Math.max(0, count - 1);
        increment = -1;
        localStorage.setItem('redmaria_my_profile_liked', 'false');
    } else {
        // Was not liked (empty hand) -> like (filled hand), add 1
        icon.classList.add('liked-emoji');
        icon.textContent = '­ƒÖÅ';
        icon.style.filter = 'none';
        icon.style.opacity = '1';
        icon.style.transform = 'scale(1.3)';
        setTimeout(function(){ icon.style.transform = 'scale(1.1)'; }, 200);
        countEl.textContent = count + 1;
        increment = 1;
        localStorage.setItem('redmaria_my_profile_liked', 'true');
    }

    if (u && typeof db !== 'undefined' && db.updateProfileLikes) {
        db.updateProfileLikes(u.email, increment).catch(function(e) { console.error('Error syncing likes:', e); });
    }
}



// ==================== CHAT JS LOGIC ====================
let chatCurrentPartner = null;
let chatMessagesSubscription = null;

function loadChatContacts() {
    var list = document.getElementById('chat-contacts-list');
    var empty = document.getElementById('chat-empty');
    var loading = document.getElementById('chat-loading');
    if(!list) return;

    if (typeof auth === 'undefined' || !auth.isAuthenticated()) {
        empty.style.display = 'block';
        list.innerHTML = '';
        list.appendChild(empty);
        return;
    }

    loading.style.display = 'block';
    empty.style.display = 'none';
    
    var currentUser = auth.getCurrentUser();
    
    if (typeof db !== 'undefined' && db.getConversations) {
        db.getConversations(currentUser.id).then(function(conversations) {
            loading.style.display = 'none';
            // Also get all users to find names
            db.getAllUsers().then(function(users) {
                window._chatAllContacts = users;
                var usersMap = {};
                users.forEach(function(u) { usersMap[u.id] = u; });
                
                // Clear existing (except empty/loading)
                var toRemove = [];
                for(var i=0; i<list.children.length; i++) {
                    if (list.children[i].id !== 'chat-empty' && list.children[i].id !== 'chat-loading') {
                        toRemove.push(list.children[i]);
                    }
                }
                toRemove.forEach(function(el) { el.remove(); });

                if (conversations.length === 0) {
                    empty.style.display = 'block';
                } else {
                    empty.style.display = 'none';
                    conversations.forEach(function(conv) {
                        var partner = usersMap[conv.partnerId];
                        var name = partner ? partner.name : 'Usuario Desconocido';
                        var avatarLetter = name.charAt(0).toUpperCase();
                        var lastMsg = conv.lastMessage ? conv.lastMessage.text : '';
                        if (lastMsg.length > 30) lastMsg = lastMsg.substring(0,30) + '...';
                        var time = conv.lastMessage ? new Date(conv.lastMessage.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                        
                        var item = document.createElement('div');
                        item.className = 'chat-contact-item';
                        item.setAttribute('data-name', name.toLowerCase());
                        item.onclick = function() { openChat(conv.partnerId, name); };
                        
                        var unreadHtml = conv.unreadCount > 0 ? '<span class="chat-contact-unread" style="display:inline-block">' + conv.unreadCount + '</span>' : '<span class="chat-contact-unread"></span>';
                        
                        item.innerHTML = '<div class="chat-contact-avatar-wrap"><div class="chat-contact-avatar">' + avatarLetter + '</div></div>' +
                            '<div class="chat-contact-info">' +
                                '<div class="chat-contact-header"><h4 class="chat-contact-name">' + name + '</h4><span class="chat-contact-time">' + time + '</span></div>' +
                                '<div class="chat-contact-body"><p class="chat-contact-lastmsg">' + lastMsg + '</p>' + unreadHtml + '</div>' +
                            '</div>';
                        list.appendChild(item);
                    });
                }
            });
        }).catch(function(e) {
            console.error('Error loading contacts', e);
            loading.style.display = 'none';
            empty.style.display = 'block';
        });
    } else {
        loading.style.display = 'none';
        empty.style.display = 'block';
    }
}

function filterChats() {
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
}

function filterChatTab(btn, type) {
    var tabs = document.querySelectorAll('.chat-tab');
    tabs.forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
}

function showNewChatModal() {
    var userName = prompt("Ingresa el nombre del usuario con el que quieres chatear:");
    if (userName && userName.trim() !== '') {
        if (typeof db !== 'undefined' && db.searchUsers) {
            db.searchUsers(userName.trim()).then(function(users) {
                if (users && users.length > 0) {
                    // Pick the first match
                    openChat(users[0].id, users[0].name);
                } else {
                    alert("No se encontró ningún usuario con ese nombre.");
                }
            }).catch(function(e){
                console.error('Search error', e);
            });
        }
    }
}

function openChatWith(id, name) {
    app.navigate('screen-mensajes');
    setTimeout(function() {
        if(typeof openChat === 'function') openChat(id, name);
    }, 100);
}

function openChat(partnerId, partnerName) {
    chatCurrentPartner = partnerId;
    var contactsView = document.getElementById('chat-contacts-view');
    var convView = document.getElementById('chat-conversation-view');
    if(contactsView) contactsView.style.display = 'none';
    if(convView) convView.style.display = 'flex';
    
    var nameEl = document.getElementById('chat-conv-name');
    var avatarEl = document.getElementById('chat-conv-avatar');
    if(nameEl) nameEl.textContent = partnerName;
    if(avatarEl) avatarEl.textContent = partnerName.charAt(0).toUpperCase();
    
    var msgContainer = document.getElementById('chat-messages');
    if(msgContainer) msgContainer.innerHTML = '';

    var currentUser = auth.getCurrentUser();
    if (!currentUser) return;
    
    if (typeof db !== 'undefined' && db.markConversationAsRead) {
        db.markConversationAsRead(currentUser.id, partnerId);
        updateChatBadges();
    }

    if (typeof db !== 'undefined' && db.getConversationMessages) {
        db.getConversationMessages(currentUser.id, partnerId).then(function(msgs) {
            var lastDate = '';
            if(msgContainer) {
                msgs.forEach(function(m) {
                    var dateStr = new Date(m.created_at).toLocaleDateString();
                    if (dateStr !== lastDate) {
                        var dH = document.createElement('div');
                        dH.className = 'chat-date-header';
                        dH.textContent = dateStr === new Date().toLocaleDateString() ? 'Hoy' : dateStr;
                        msgContainer.appendChild(dH);
                        lastDate = dateStr;
                    }
                    
                    var isSent = m.from_id === currentUser.id;
                    var mDiv = renderChatMsg(m, isSent);
                    msgContainer.appendChild(mDiv);
                });
                msgContainer.scrollTop = msgContainer.scrollHeight;
            }
        });
    }

    if (typeof db !== 'undefined' && db.subscribeToMessages) {
        if (chatMessagesSubscription) chatMessagesSubscription.unsubscribe();
        chatMessagesSubscription = db.subscribeToMessages(currentUser.id, function(newMsg, eventType) {
            if (eventType === 'UPDATE') {
                var existingWrapper = document.querySelector('.wa-msg-row[data-msg-id="' + newMsg.id + '"]');
                if (existingWrapper) {
                    if (newMsg.reactions) {
                        _renderReactions(newMsg, existingWrapper);
                    }
                }
                return;
            }
            if (eventType === 'INSERT' && newMsg.from_id === chatCurrentPartner) {
                if(msgContainer) {
                    var mDiv = renderChatMsg(newMsg, false);
                    msgContainer.appendChild(mDiv);
                    msgContainer.scrollTop = msgContainer.scrollHeight;
                }
                db.markConversationAsRead(currentUser.id, chatCurrentPartner);
            } else {
                updateChatBadges();
            }
        });
    }
    if (typeof checkBlockStatus === 'function') checkBlockStatus();
}

function closeChat() {
    chatCurrentPartner = null;
    var convView = document.getElementById('chat-conversation-view');
    var contactsView = document.getElementById('chat-contacts-view');
    if(convView) convView.style.display = 'none';
    if(contactsView) contactsView.style.display = 'flex';
    if (chatMessagesSubscription) {
        chatMessagesSubscription.unsubscribe();
        chatMessagesSubscription = null;
    }
    loadChatContacts();
}

function sendMessage() {
    var input = document.getElementById('chat-input');
    if(!input) return;
    var text = input.value.trim();
    if (!text || !chatCurrentPartner) return;
    
    var currentUser = auth.getCurrentUser();
    if (!currentUser) return;
    
    var msgContainer = document.getElementById('chat-messages');
    var tempMsg = {
        id: null,
        text: text,
        created_at: new Date().toISOString(),
        read: false
    };
    var mDiv = null;
    if(msgContainer) {
        mDiv = renderChatMsg(tempMsg, true);
        msgContainer.appendChild(mDiv);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
    input.value = '';

    if (typeof db !== 'undefined' && db.sendMessage) {
        db.sendMessage(currentUser.id, chatCurrentPartner, text).then(function(msg) {
            if (msg && mDiv && mDiv.parentNode) {
                var realDiv = renderChatMsg(msg, true);
                mDiv.parentNode.replaceChild(realDiv, mDiv);
            }
        });
    }
}

// ══════════════════════════════════════════════════════════════
//  SISTEMA DE MENSAJES ESTILO WHATSAPP
// ══════════════════════════════════════════════════════════════

var _chatCtxMenu = null; // menú contextual activo

// ── Construye la burbuja completa con wrapper y acciones ──
// ── Construye la burbuja completa con wrapper y acciones ──
// ── Construye la burbuja completa con wrapper y acciones ──
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
        // bubble.style.overflow = 'hidden'; removed to fix popup
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
                e.preventDefault();
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
        // Cambiar el menú al selector de emojis
        menu.innerHTML = '';
        menu.style.display = 'flex';
        menu.style.gap = '5px';
        menu.style.padding = '8px 12px';
        menu.style.borderRadius = '30px';
        menu.style.minWidth = 'auto';
        
        WA_EMOJIS.forEach(function(emoji) {
            var btn = document.createElement('button');
            btn.textContent = emoji;
            btn.style.cssText = 'font-size:1.5rem; background:none; border:none; cursor:pointer; padding:2px; transition:transform 0.1s;';
            btn.onclick = function(e) {
                e.stopPropagation();
                _addReaction(m, wrapper, emoji);
                menu.remove();
            };
            btn.onmouseover = function() { this.style.transform = 'scale(1.2)'; };
            btn.onmouseout = function() { this.style.transform = 'scale(1)'; };
            menu.appendChild(btn);
        });
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
    bar.style.cssText = 'position:absolute; display:flex; gap:4px; background:white; padding:6px 10px; border-radius:30px; box-shadow:0 4px 15px rgba(0,0,0,0.15); z-index:100; opacity:0; transition:opacity 0.2s; bottom:100%; right:0; margin-bottom:5px;';
    
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
        bubble.appendChild(bar);
        setTimeout(function() { bar.style.opacity = '1'; }, 10);
    }
}
async function _addReaction(m, wrapper, emoji) {
    var cu = typeof auth !== 'undefined' && auth.getCurrentUser ? auth.getCurrentUser() : null;
    if (!cu || typeof db === 'undefined' || !db.reactToMessage || !m.id) return;
    
    // DB Call
    var newReactions = await db.reactToMessage(m.id, cu.id, emoji);
    if (newReactions) {
        m.reactions = newReactions;
        _renderReactions(m, wrapper);
    }
}

function _renderReactions(m, wrapper) {
    var target = wrapper.querySelector('.wa-media-wrap') || wrapper.querySelector('.wa-bubble');
    var display = wrapper.querySelector('.wa-reactions');
    if (!display) {
        display = document.createElement('div');
        display.className = 'wa-reactions';
        if (wrapper.querySelector('.wa-media-wrap')) {
            display.style.cssText = 'position:absolute; bottom:8px; left:8px; display:flex; gap:4px; z-index:10;';
        } else {
            display.style.cssText = 'display:flex; gap:4px; margin-top:2px;';
        }
        target.appendChild(display);
    }
    display.innerHTML = '';
    var hasReactions = false;
    if (m.reactions) {
        Object.keys(m.reactions).forEach(function(em) {
            // FIX: Filtrar basura de la base de datos para que solo renderice emojis reales
            // if (typeof WA_EMOJIS !== 'undefined' && WA_EMOJIS.indexOf(em) === -1) return;
            
            var arr = m.reactions[em];
            if (arr && arr.length > 0) {
                hasReactions = true;
                var pill = document.createElement('span');
                pill.className = 'wa-reaction-pill';
                pill.style.cssText = 'background:rgba(255,255,255,0.9); border-radius:12px; padding:2px 6px; font-size:0.85rem; box-shadow:0 1px 3px rgba(0,0,0,0.15); display:inline-flex; align-items:center; gap:3px; font-family:"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;';
                pill.innerHTML = em + (arr.length > 0 ? '<span style="color:#333;font-size:0.8rem;font-weight:bold;margin-left:3px;">' + arr.length + '</span>' : '');
                display.appendChild(pill);
            }
        });
    }
    if (!hasReactions) {
        display.remove();
    }
}

// ── Responder mensaje ──
function _chatReply(m) {
    var input = document.getElementById('chat-input');
    var bar = document.getElementById('chat-input-bar') || document.querySelector('.chat-input-bar');
    if (!bar || !input) return;
    var old = document.getElementById('wa-reply-preview');
    if (old) old.remove();
    var preview = document.createElement('div');
    preview.id = 'wa-reply-preview';
    preview.className = 'wa-reply-preview';
    var snippet = m.media_url ? (m.media_type === 'video' ? '\uD83C\uDF9E Video' : '\uD83D\uDCF7 Imagen') : (m.text || '').slice(0, 60);
    preview.innerHTML =
        '<div class="wa-reply-line"></div>' +
        '<div class="wa-reply-text">' + _escapeHtml(snippet) + '</div>' +
        '<button class="wa-reply-close" onclick="document.getElementById(\'wa-reply-preview\').remove()"><i class="ri-close-line"></i></button>';
    bar.insertBefore(preview, bar.firstChild);
    input.focus();
    window._chatReplyTo = m;
}

// ── Reenviar ──
function _chatForward(m) {
    var allUsers = window._chatAllContacts || [];
    var overlay = document.createElement('div');
    overlay.className = 'wa-forward-overlay';
    var snippet = m.media_url ? '\uD83D\uDCF7 Multimedia' : '\u201C' + (m.text||'').slice(0,40) + '\u2026\u201D';
    var listHtml = allUsers.length
        ? allUsers.map(function(u) {
            return '<label class="wa-forward-item"><input type="checkbox" value="' + u.id + '"> ' +
                   '<span class="wa-forward-avatar">' + (u.name||'?').charAt(0).toUpperCase() + '</span>' +
                   '<span>' + _escapeHtml(u.name||u.username||u.email||'Usuario') + '</span></label>';
          }).join('')
        : '<p style="color:#8896a4;padding:20px;text-align:center">No hay contactos disponibles</p>';
    overlay.innerHTML =
        '<div class="wa-forward-card">' +
          '<div class="wa-forward-header"><h4>\uD83D\uDD01 Reenviar mensaje</h4>' +
            '<button onclick="this.closest(\'.wa-forward-overlay\').remove()" class="wa-forward-close"><i class="ri-close-line"></i></button>' +
          '</div>' +
          '<div class="wa-forward-snippet">' + _escapeHtml(snippet) + '</div>' +
          '<div class="wa-forward-list">' + listHtml + '</div>' +
          '<button class="wa-forward-send" onclick="_doForward(this, \'' + (m.text||'') + '\', \'' + (m.media_url||'') + '\', \'' + (m.media_type||'') + '\')">Reenviar</button>' +
        '</div>';
    document.body.appendChild(overlay);
}

function _doForward(btn, text, mediaUrl, mediaType) {
    var checks = btn.closest('.wa-forward-card').querySelectorAll('input[type=checkbox]:checked');
    if (!checks.length) { if(typeof showQuickFeedback==='function') showQuickFeedback('\u26a0\uFE0F Seleccion\xe1 al menos un contacto'); return; }
    var cu = typeof auth!=='undefined' && auth.getCurrentUser ? auth.getCurrentUser() : null;
    if (!cu || typeof db==='undefined') return;
    checks.forEach(function(c) {
        db.sendMessage(cu.id, c.value, (mediaUrl ? (mediaType==='video'?'[video]':'[imagen]') : text) || '');
    });
    btn.closest('.wa-forward-overlay').remove();
    if(typeof showQuickFeedback==='function') showQuickFeedback('\u2705 Reenviado a ' + checks.length + ' contacto(s)');
}

// ── Eliminar ──
function _deleteMsg(m, wrapper) {
    if (!m.id) { wrapper.remove(); return; }
    if (typeof showWaConfirm === 'function') {
        showWaConfirm('Eliminar mensaje', '\xbfEliminarlo para todos?', 'ELIMINAR', true, function() {
            if (typeof db!=='undefined' && db.deleteMessage) {
                db.deleteMessage(m.id).then(function() { wrapper.remove(); });
            } else {
                wrapper.style.opacity = '0.3';
                wrapper.querySelector('.wa-bubble-text') && (wrapper.querySelector('.wa-bubble-text').textContent = 'Mensaje eliminado');
            }
        });
    } else {
        wrapper.remove();
    }
}

// ── Descargar media ──
function _downloadMedia(url) {
    var a = document.createElement('a');
    a.href = url; a.download = 'chat-media-' + Date.now();
    a.target = '_blank'; document.body.appendChild(a); a.click(); a.remove();
}

// ── Compartir ──
function _shareMedia(url, text) {
    if (navigator.share) {
        navigator.share({ title: 'Solidaridad', text: text || '', url: url }).catch(function(){});
    } else {
        navigator.clipboard && navigator.clipboard.writeText(url);
        if(typeof showQuickFeedback==='function') showQuickFeedback('\uD83D\uDD17 Enlace copiado');
    }
}

// ── Visor de foto/video premium ──
function chatOpenViewer(type, src) {
    // _closeChatCtxMenu(); removed
    var ov = document.createElement('div');
    ov.className = 'wa-viewer-overlay';
    ov.innerHTML =
        '<div class="wa-viewer-topbar">' +
          '<button class="wa-viewer-btn" onclick="this.closest(\'.wa-viewer-overlay\').remove()">' +
            '<i class="ri-arrow-left-line"></i>' +
          '</button>' +
          '<span style="color:white;font-weight:600;flex:1;text-align:center">Vista previa</span>' +
          '<button class="wa-viewer-btn" onclick="_shareMedia(\'' + src + '\')"><i class="ri-share-line"></i></button>' +
          '<button class="wa-viewer-btn" onclick="_downloadMedia(\'' + src + '\')"><i class="ri-download-line"></i></button>' +
        '</div>' +
        '<div class="wa-viewer-body">' +
          (type === 'video'
            ? '<video src="' + src + '" controls autoplay playsinline class="wa-viewer-media"></video>'
            : '<img src="' + src + '" class="wa-viewer-media wa-viewer-img" id="wa-viewer-img" alt="">') +
        '</div>' +
        (type !== 'video' ? '<div class="wa-viewer-footer">' +
          '<button class="wa-viewer-action" onclick="waImgZoom(1)"><i class="ri-zoom-in-line"></i></button>' +
          '<button class="wa-viewer-action" onclick="waImgZoom(-1)"><i class="ri-zoom-out-line"></i></button>' +
          '<button class="wa-viewer-action" onclick="_downloadMedia(\'' + src + '\')"><i class="ri-download-2-line"></i></button>' +
          '<button class="wa-viewer-action" onclick="_shareMedia(\'' + src + '\')"><i class="ri-share-forward-line"></i></button>' +
        '</div>' : '');
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
    setTimeout(function(){ ov.classList.add('wa-viewer-in'); }, 10);
}

// Alias para compatibilidad con llamadas previas
function chatZoomImg(src) { chatOpenViewer('img', src); }

var _viewerScale = 1;
function waImgZoom(dir) {
    _viewerScale = Math.min(4, Math.max(0.5, _viewerScale + dir * 0.5));
    var img = document.getElementById('wa-viewer-img');
    if (img) img.style.transform = 'scale(' + _viewerScale + ')';
}


// chatZoomImg → delegado a chatOpenViewer (definido arriba en el sistema WA)


function chatVideoCall() {
    if (!chatCurrentPartner) return;
    var me = (typeof auth !== 'undefined' && auth.getCurrentUser ? (auth.getCurrentUser() || {}).id : '') || 'anon';
    var roomId = 'solidaridad-' + [chatCurrentPartner, me].sort().join('-').slice(0, 24);
    var url = 'https://meet.jit.si/' + roomId;
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = '<div style="background:#1a2535;border-radius:20px;padding:32px 28px;max-width:360px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5)">' +
        '<div style="font-size:3rem;margin-bottom:12px">\uD83D\uDCF9</div>' +
        '<h3 style="color:#fff;margin:0 0 8px;font-size:1.1rem">Videollamada</h3>' +
        '<p style="color:#8896a4;font-size:0.85rem;margin:0 0 20px">Sala privada en Jitsi Meet.<br>Compartí el enlace con tu contacto.</p>' +
        '<a href="' + url + '" target="_blank" style="display:block;background:linear-gradient(135deg,#3DA3D4,#2E8BC0);color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:0.9rem;margin-bottom:12px" onclick="this.closest(\'div\').parentElement.remove()">\uD83C\uDF9E Abrir Videollamada</a>' +
        '<button onclick="this.closest(\'div\').parentElement.remove()" style="background:transparent;border:1px solid #3a4a5c;color:#8896a4;padding:10px 24px;border-radius:12px;cursor:pointer;font-size:0.85rem">Cancelar</button>' +
        '</div>';
    document.body.appendChild(overlay);
}

function toggleChatMenu() {
    var menu = document.getElementById('chat-more-menu');
    if(menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function closeChatMenu() {
    var menu = document.getElementById('chat-more-menu');
    if (menu) menu.style.display = 'none';
}

function blockChatUser() {
    closeChatMenu();
    var currentUser = typeof auth !== 'undefined' && auth.getCurrentUser ? auth.getCurrentUser() : null;
    if (!currentUser || !chatCurrentPartner) return;
    var myId = currentUser.id;
    if (typeof showWaConfirm === 'function') {
        if (typeof db !== 'undefined' && db.isUserBlocked) {
            db.isUserBlocked(myId, chatCurrentPartner).then(function(blocked) {
                showWaConfirm(
                    blocked ? '\xbfDesbloquear?' : '\xbfBloquear contacto?',
                    blocked ? 'Podr\xe1s volver a comunicarte.' : 'No podr\xe1 enviarte mensajes.',
                    blocked ? 'DESBLOQUEAR' : 'BLOQUEAR',
                    !blocked,
                    function() {
                        var fn = blocked ? db.unblockUser : db.blockUser;
                        fn(myId, chatCurrentPartner).then(function() {
                            if (typeof showQuickFeedback === 'function') showQuickFeedback(blocked ? '\u2705 Desbloqueado' : '\uD83D\uDEAB Bloqueado');
                            if (typeof checkBlockStatus === 'function') checkBlockStatus();
                        });
                    }
                );
            });
        }
    }
}


function handleChatFileUpload(input) {
    if (!input.files || input.files.length === 0) return;
    var currentUser = typeof auth !== 'undefined' && auth.getCurrentUser ? auth.getCurrentUser() : null;
    if (!currentUser || !chatCurrentPartner) {
        if (typeof showQuickFeedback === 'function') showQuickFeedback('Inici\xe1 sesi\xf3n para enviar archivos');
        return;
    }
    var msgContainer = document.getElementById('chat-messages');
    Array.from(input.files).forEach(function(file) {
        if (file.size > 20 * 1024 * 1024) {
            if (typeof showQuickFeedback === 'function') showQuickFeedback('\u26a0\uFE0F Archivo muy grande (m\xe1x 20MB)');
            return;
        }
        var isVideo = file.type.startsWith('video/');
        var loadDiv = document.createElement('div');
        loadDiv.className = 'chat-msg chat-msg-sent';
        var thumbHtml = isVideo
            ? '<div style="width:160px;height:90px;background:#1a2535;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:2.2rem">\uD83C\uDF9E</div>'
            : '<img src="' + URL.createObjectURL(file) + '" style="max-width:180px;max-height:180px;border-radius:10px;opacity:0.55;display:block">';
        loadDiv.innerHTML = thumbHtml + '<div class="chat-msg-meta"><span class="chat-msg-time">subiendo...</span><span class="chat-msg-status"><i class="ri-loader-4-line" style="animation:spin 1s linear infinite"></i></span></div>';
        if (msgContainer) { msgContainer.appendChild(loadDiv); msgContainer.scrollTop = msgContainer.scrollHeight; }
        if (typeof db !== 'undefined' && db.uploadChatMedia) {
            db.uploadChatMedia(currentUser.id, chatCurrentPartner, file).then(function(msg) {
                if (msg) {
                    var realDiv = renderChatMsg(msg, true);
                    if (loadDiv.parentNode) loadDiv.parentNode.replaceChild(realDiv, loadDiv);
                } else {
                    var errEl = loadDiv.querySelector('.chat-msg-time');
                    if (errEl) errEl.textContent = 'error al subir';
                    loadDiv.style.opacity = '0.4';
                    if (typeof showQuickFeedback === 'function') showQuickFeedback('\u274C Error al subir. Verific\xe1 el bucket "chat-media" en Supabase.');
                }
                if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
            });
        } else {
            if (loadDiv.parentNode) loadDiv.parentNode.removeChild(loadDiv);
            if (typeof showQuickFeedback === 'function') showQuickFeedback('\u26a0\uFE0F Supabase no disponible');
        }
    });
    input.value = '';
}

function updateChatBadges() {
    if (typeof auth === 'undefined' || !auth.isAuthenticated()) return;
    var currentUser = auth.getCurrentUser();
    if (!currentUser) return;
    
    if (typeof db !== 'undefined' && db.getUnreadCount) {
        db.getUnreadCount(currentUser.id).then(function(count) {
            var badge1 = document.getElementById('sidebar-msg-badge');
            var badge2 = document.getElementById('bottom-msg-badge');
            if (count > 0) {
                if(badge1) { badge1.textContent = count; badge1.style.display = 'inline-block'; }
                if(badge2) { badge2.textContent = count; badge2.style.display = 'inline-block'; }
            } else {
                if(badge1) badge1.style.display = 'none';
                if(badge2) badge2.style.display = 'none';
            }
        });
    }
}

// Hook into navigation or set interval
setInterval(updateChatBadges, 15000);
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateChatBadges, 2000);
    
    // We try to hook into app.navigate if it exists
    if (typeof app !== 'undefined' && app.navigate) {
        var originalNavigate = app.navigate;
        app.navigate = function(screenId) {
            originalNavigate.call(app, screenId);
            if (screenId === 'screen-mensajes') {
                loadChatContacts();
            }
        };
    }
});


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
    for (var k in chatConversations) {
        if (chatConversations[k].otherUser && chatConversations[k].otherUser.id === userObj.id) {
            existingId = k; break;
        }
    }
    
    if (existingId) {
        openChat(existingId, chatConversations[existingId].otherUser.name, chatConversations[existingId].otherUser.color || '#e74c3c');
    } else {
        // Create an optimistic local conversation
        var tempId = 'temp_' + Date.now();
        chatConversations[tempId] = {
            id: tempId,
            otherUser: userObj,
            messages: [],
            unread: 0,
            lastActivity: new Date().toISOString()
        };
        openChat(tempId, userObj.name, userObj.color || '#e74c3c');
    }
    document.getElementById('msg-search-input').value = '';
    filterMsgList('');
};

function _escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}