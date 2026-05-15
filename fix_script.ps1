
$c = Get-Content index.html -Raw
$scriptStart = $c.IndexOf("var originalNavigate = app.navigate;")
if ($scriptStart -gt 0) {
    Write-Host "Found var originalNavigate at $scriptStart"
    $scriptEnd = $c.IndexOf("</script>", $scriptStart)
    Write-Host "Ends at $scriptEnd"
    
    # We want to replace everything from originalNavigate down to </script> with the CORRECT code
    $badBlock = $c.Substring($scriptStart, $scriptEnd - $scriptStart)
    
    $goodBlock = "var originalNavigate = app.navigate;
app.navigate = function(targetId) {
    originalNavigate.call(app, targetId);
    if (targetId === 'screen-profile') {
        setTimeout(loadSolidaridadProfile, 100);
    }
};

function saveProfileTags() {
    var checkboxes = document.querySelectorAll('#prof-tags-modal .tag-checkbox input:checked');
    var selected = [];
    checkboxes.forEach(function(cb) { selected.push(cb.value); });
    
    localStorage.setItem('solidaridad_user_tags', JSON.stringify(selected));
    if (typeof renderProfileTags === 'function') renderProfileTags();
    if (typeof closeProfileTagsModal === 'function') closeProfileTagsModal();
}

function loadSolidaridadProfile() {
    var user = typeof auth !== 'undefined' ? auth.getCurrentUser() : null;
    if (user) {
        if(document.getElementById('prof-name')) document.getElementById('prof-name').textContent = user.name || 'Usuario';
        if(document.getElementById('prof-email')) document.getElementById('prof-email').textContent = user.email || '';
    }
    if (typeof renderProfileTags === 'function') renderProfileTags();
}

function closeAparicion() {
    var modal = document.getElementById('apar-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Fallback: Guarantee sync every 5 seconds if WebSockets drop UDP packets
setInterval(function() {
    var isRezoActive = document.getElementById('screen-rezo') && document.getElementById('screen-rezo').classList.contains('active');
    var isComunidadActive = document.getElementById('screen-intenciones') && document.getElementById('screen-intenciones').classList.contains('active');
    if (isRezoActive || isComunidadActive) {
        if (typeof loadCommunityIntenciones === 'function') {
            loadCommunityIntenciones();
        }
    }
}, 5000);
"
    
    $c = $c.Remove($scriptStart, $scriptEnd - $scriptStart)
    $c = $c.Insert($scriptStart, $goodBlock)
    
    # Remove any extra duplicate blocks that might exist after this!
    $endOfGood = $scriptStart + $goodBlock.Length + 9
    $remaining = $c.Substring($endOfGood)
    if ($remaining.Contains("var originalNavigate = app.navigate;")) {
         # Delete the rest of the file and just close it out
         $c = $c.Substring(0, $endOfGood) + "`r`n</body>`r`n</html>"
    }
    
    Set-Content index.html $c -Encoding UTF8
    Write-Host "Fixed syntax error at the end!"
}

