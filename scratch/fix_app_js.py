import os
import re

file_path = r'c:\Users\Eduardo\Desktop\solidaridad\app.js'

# Read with error handling for encoding
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    with open(file_path, 'r', encoding='latin-1') as f:
        content = f.read()

new_func = """async function checkBlockStatus() {
    if (!chatCurrentPartner) return;
    var mySbId = await getChatUserId();
    if (!mySbId) return;

    var isBlocked = await db.isUserBlocked(mySbId, chatCurrentPartner);
    var btn = document.getElementById("chat-block-btn");
    var input = document.getElementById("chat-input");
    var sendBtn = document.querySelector(".chat-send-btn");
    var msgContainer = document.getElementById("chat-messages");
    
    var oldBanner = document.getElementById("chat-block-banner");
    if (oldBanner) oldBanner.remove();

    if (isBlocked) {
        var banner = document.createElement("div");
        banner.id = "chat-block-banner";
        banner.style.cssText = "background:#fff3f3;color:#d32f2f;padding:12px;text-align:center;font-size:0.88rem;border-bottom:1px solid #ffcdd2;display:flex;flex-direction:column;align-items:center;gap:8px;";
        banner.innerHTML = "<span>Has bloqueado a este contacto.</span>" +
                           "<button onclick=\\"blockChatUser()\\" style=\\"background:#d32f2f;color:white;border:none;padding:6px 16px;border-radius:20px;font-weight:bold;cursor:pointer;\\">Desbloquear</button>";
        if (msgContainer) msgContainer.prepend(banner);
    }

    if (btn) {
        btn.innerHTML = isBlocked ? '<i class="ri-checkbox-circle-line"></i> Desbloquear' : '<i class="ri-forbid-line"></i> Bloquear';
        btn.style.color = isBlocked ? "#00a884" : "#ef4444";
    }

    if (input) {
        input.disabled = isBlocked;
        input.placeholder = isBlocked ? "Usuario bloqueado" : "Escribe un mensaje...";
        if (sendBtn) sendBtn.style.opacity = isBlocked ? "0.5" : "1";
    }
}"""

# Replace the old function with the new one
content = re.sub(r'async function checkBlockStatus\(\) \{.*?\}', new_func, content, flags=re.DOTALL)

# Write back in clean UTF-8
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ app.js updated successfully with Block Banner logic.")
