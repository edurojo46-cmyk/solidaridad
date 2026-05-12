// Fix Mojibake by reading as Latin-1, replacing, then saving as UTF-8 (no BOM)
// This is the CORRECT approach for files with double-encoded UTF-8

var fso = new ActiveXObject("Scripting.FileSystemObject");

// Read as Latin-1 (binary-safe) using ADODB
var stream = new ActiveXObject("ADODB.Stream");
stream.Type = 2;        // adTypeText
stream.Charset = "iso-8859-1";  // Latin-1 = 1 byte per char, no re-encoding
stream.Open();
stream.LoadFromFile("index.html");
var text = stream.ReadText();
stream.Close();

function rep(t, bad, good) {
    while (t.indexOf(bad) !== -1) t = t.split(bad).join(good);
    return t;
}

// These are the exact Latin-1 strings for double-encoded UTF-8 chars
text = rep(text, "\u00c3\u00a9", "\u00e9");  // Ã© → é
text = rep(text, "\u00c3\u00a1", "\u00e1");  // Ã¡ → á
text = rep(text, "\u00c3\u00ad", "\u00ed");  // Ã­ → í
text = rep(text, "\u00c3\u00b3", "\u00f3");  // Ã³ → ó
text = rep(text, "\u00c3\u00ba", "\u00fa");  // Ãº → ú
text = rep(text, "\u00c3\u00b1", "\u00f1");  // Ã± → ñ
text = rep(text, "\u00c3\u0089", "\u00c9");  // Ã‰ → É
text = rep(text, "\u00c3\u0093", "\u00d3");  // Ã" → Ó
text = rep(text, "\u00c3\u009a", "\u00da");  // Ãš → Ú
text = rep(text, "\u00c3\u0091", "\u00d1");  // Ã' → Ñ
text = rep(text, "\u00c3\u0081", "\u00c1");  // Ã\u0081 → Á
text = rep(text, "\u00c2\u00bf", "\u00bf");  // Â¿ → ¿
text = rep(text, "\u00c2\u00a1", "\u00a1");  // Â¡ → ¡
text = rep(text, "\u00c2\u00b0", "\u00b0");  // Â° → °
text = rep(text, "\u00c2\u00b7", "\u00b7");  // Â· → ·
text = rep(text, "\u00c3\u00bc", "\u00fc");  // Ã¼ → ü
text = rep(text, "\u00c3\u00b6", "\u00f6");  // Ã¶ → ö
text = rep(text, "\u00c3\u00a4", "\u00e4");  // Ã¤ → ä
text = rep(text, "\u00c3\u00b5", "\u00f5");  // Ã µ → õ
text = rep(text, "\u00c3\u00a3", "\u00e3");  // Ãã → ã
text = rep(text, "\u00c3\u00a7", "\u00e7");  // Ã§ → ç

// Save back as UTF-8 (no BOM)
var streamOut = new ActiveXObject("ADODB.Stream");
streamOut.Type = 2;
streamOut.Charset = "utf-8";
streamOut.Open();
streamOut.WriteText(text);
// Remove BOM that ADODB adds (first 3 bytes: EF BB BF)
streamOut.Position = 0;
streamOut.Type = 1;  // switch to binary
streamOut.Position = 3;  // skip BOM
var streamFinal = new ActiveXObject("ADODB.Stream");
streamFinal.Type = 1;
streamFinal.Open();
streamOut.CopyTo(streamFinal);
streamOut.Close();
streamFinal.SaveToFile("index.html", 2);
streamFinal.Close();

WScript.Echo("Done. Encoding fixed.");
