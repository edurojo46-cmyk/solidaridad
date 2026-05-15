$c = [System.IO.File]::ReadAllText('C:\Users\Eduardo\Desktop\solidaridad\app.js')

$c = $c.Replace('function loadChatContacts()', 'async function getChatUserId() { if(app._chatUserIdCache) return app._chatUserIdCache; var u = auth.getCurrentUser(); if(!u) return null; if(typeof db==="undefined"||!db.getProfileByEmail) return null; try { var p = await db.getProfileByEmail(u.email); if(p) { app._chatUserIdCache = p.id; return p.id; } } catch(e){} return null; }
async function loadChatContacts()')

$c = $c.Replace('var currentUser = auth.getCurrentUser();', 'var currentUser = auth.getCurrentUser();
    var mySbId = await getChatUserId();
    if (!mySbId) { if(empty) empty.style.display="block"; if(loading) loading.style.display="none"; return; }')

$c = $c.Replace('db.getConversations(currentUser.id)', 'db.getConversations(mySbId)')

$c = $c.Replace('function openChat(partnerId, partnerName)', 'async function openChat(partnerId, partnerName)')

$c = $c.Replace('db.markConversationAsRead(currentUser.id, partnerId)', 'var mySbId = await getChatUserId(); db.markConversationAsRead(mySbId, partnerId)')

$c = $c.Replace('db.getConversationMessages(currentUser.id, partnerId)', 'db.getConversationMessages(mySbId, partnerId)')

$c = $c.Replace('m.from_id === currentUser.id', 'm.from_id === mySbId')

$c = $c.Replace('db.subscribeToMessages(currentUser.id,', 'db.subscribeToMessages(mySbId,')

$c = $c.Replace('db.markConversationAsRead(currentUser.id, chatCurrentPartner)', 'db.markConversationAsRead(mySbId, chatCurrentPartner)')

$c = $c.Replace('function sendChatMessage()', 'async function sendChatMessage()')

$c = $c.Replace('db.sendMessage(currentUser.id, chatCurrentPartner, text)', 'var mySbId = await getChatUserId(); db.sendMessage(mySbId, chatCurrentPartner, text)')

$c = $c.Replace('function updateChatBadges()', 'async function updateChatBadges()')

$c = $c.Replace('db.getUnreadCount(currentUser.id)', 'var mySbId = await getChatUserId(); if(!mySbId) return; db.getUnreadCount(mySbId)')

[System.IO.File]::WriteAllText('C:\Users\Eduardo\Desktop\solidaridad\app.js', $c, [System.Text.Encoding]::UTF8)
Write-Host 'Done'
