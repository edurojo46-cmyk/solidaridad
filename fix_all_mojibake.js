
// Fix all Mojibake in index.html using ADODB (Latin-1 safe read)
var stream = new ActiveXObject("ADODB.Stream");
stream.Type = 2;
stream.Charset = "utf-8";
stream.Open();
stream.LoadFromFile("index.html");
var text = stream.ReadText();
stream.Close();

function rep(t, bad, good) {
    while (t.indexOf(bad) !== -1) t = t.split(bad).join(good);
    return t;
}

// Fix triple-encoded accented characters (a = U+01DF misread)
// These are the Mojibake patterns from triple UTF-8 encoding
text = rep(text, "\u01df?\u01DF\u01DF", "\u00f3");
text = rep(text, "\u01df?\u01DF\u01df", "\u00f3");
text = rep(text, "a\u01df\u01DF", "\u00f3");

// Standard double-encoding fixes (Ã¡ = á, etc.)
text = rep(text, "Ã¡", "á");
text = rep(text, "Ã©", "é");
text = rep(text, "Ã­", "í");
text = rep(text, "Ã³", "ó");
text = rep(text, "Ãº", "ú");
text = rep(text, "Ã±", "ñ");
text = rep(text, "Ã\u0081", "Á");
text = rep(text, "Ã\u0089", "É");
text = rep(text, "Ã\u008d", "Í");
text = rep(text, "Ã\u0093", "Ó");
text = rep(text, "Ã\u009a", "Ú");
text = rep(text, "Ã\u0091", "Ñ");
text = rep(text, "Ã¼", "ü");
text = rep(text, "Ã¶", "ö");
text = rep(text, "Ã¤", "ä");
text = rep(text, "Â¿", "¿");
text = rep(text, "Â¡", "¡");
text = rep(text, "Â·", "·");
text = rep(text, "Âº", "°");
text = rep(text, "Ã", "à");

var out = new ActiveXObject("ADODB.Stream");
out.Type = 2;
out.Charset = "utf-8";
out.Open();
out.WriteText(text);
out.SaveToFile("index.html", 2);
out.Close();
WScript.Echo("Done.");

