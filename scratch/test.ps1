$src = "C:\Users\Eduardo\Desktop\solidaridad-nuevo\index.html"
Select-String 'id="screen-' $src | Select-Object -First 10
