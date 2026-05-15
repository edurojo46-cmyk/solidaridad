
var fso = new ActiveXObject("Scripting.FileSystemObject");
// OpenTextFile(filename, iomode, create, format)
// format: -1 = Unicode (UTF-16), 0 = ASCII
var stream = new ActiveXObject("ADODB.Stream");
stream.Type = 2; // adTypeText
stream.Charset = "utf-8";
stream.Open();
stream.LoadFromFile("clean_index.html");
var text = stream.ReadText();
stream.Close();

function rep(t, bad, good) {
    while (t.indexOf(bad) !== -1) t = t.split(bad).join(good);
    return t;
}

text = rep(text, "a'N?T", "í");
text = rep(text, "a?s'", "ó");
text = rep(text, "a'?'", "á");
text = rep(text, "a??s.?o", "ñ");
text = rep(text, "a''", "é");
text = rep(text, "a?''", "ú");
text = rep(text, "a'??s.?o", "Á");
text = rep(text, "a'N?S", "Í");

var out = new ActiveXObject("ADODB.Stream");
out.Type = 2;
out.Charset = "utf-8";
out.Open();
out.WriteText(text);
out.SaveToFile("final_index.html", 2);
out.Close();

