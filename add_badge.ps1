$content = Get-Content index.html -Raw -Encoding UTF8

# 1. Update the Mensajes Nav Item
$oldNav = 'id="nav-msg-item"><i class="ri-chat-3-line"></i><span>Mensajes</span></a>'
$newNav = 'id="nav-msg-item" style="position:relative;"><i class="ri-chat-3-line"></i><span>Mensajes</span><span class="nav-msg-badge" id="bottom-real-msg-badge" style="display:none">0</span></a>'
$content = $content.Replace($oldNav, $newNav)

# 2. Add the function call inside _initNotifications
# We'll replace the existing _initNotifications declaration
$oldInit = 'function _initNotifications() {'
$newInit = "function _initNotifications() {`n    _startUnreadMessagesPoll();"
$content = $content.Replace($oldInit, $newInit)

# 3. Append the polling Javascript at the end of the script before </body>
$js = @"
<script>
var _unreadMsgsPoll = null;
function _startUnreadMessagesPoll() {
    if (_unreadMsgsPoll) clearInterval(_unreadMsgsPoll);
    _checkUnreadMessages();
    _unreadMsgsPoll = setInterval(_checkUnreadMessages, 10000);
}

async function _checkUnreadMessages() {
    var u = typeof auth !== 'undefined' ? auth.getCurrentUser() : null;
    if (!u || typeof sbClient === 'undefined' || !sbClient) return;
    var userId = u.id || u.uid;
    try {
        var { data, error } = await sbClient.from('messages')
            .select('from_id')
            .eq('to_id', userId)
            .eq('read', false);
            
        if (data && !error) {
            var uniqueSenders = new Set(data.map(function(m){ return m.from_id; })).size;
            var badge = document.getElementById('bottom-real-msg-badge');
            var icon = document.querySelector('#nav-msg-item i');
            if (uniqueSenders > 0) {
                if(badge) { badge.textContent = uniqueSenders > 99 ? '99+' : uniqueSenders; badge.style.display = 'flex'; }
                if(icon) { icon.style.color = '#e74c3c'; icon.className = 'ri-chat-3-fill'; }
            } else {
                if(badge) badge.style.display = 'none';
                if(icon) { icon.style.color = ''; icon.className = 'ri-chat-3-line'; }
            }
        }
    } catch(e) { console.warn("Error checking unread messages:", e); }
}
</script>
</body>
"@

$content = $content.Replace("</body>", $js)
$content = $content -replace "v=292", "v=293"

$content | Out-File index.html -Encoding UTF8

$swContent = Get-Content sw.js -Raw -Encoding UTF8
$swContent = $swContent -replace "v45", "v46"
$swContent | Out-File sw.js -Encoding UTF8
