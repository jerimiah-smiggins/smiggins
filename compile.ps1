if (($args[0] -ne "") -and ($args[0] -ne "lang") -and ($args[0] -ne "less") -and ($args[0] -ne "ts") -and ($args[0] -ne "sw") -and ($args[0] -ne "uncompressed")) {
  Write-Host "unknown format $args[0]";
  exit 1;
}

if (($args[0] -eq "lang") -or ($args[0] -eq "") -or ($args[0] -eq "uncompressed")) {
  Write-Host -NoNewline "collecting languages..."
  py ./smiggins/langs/generator.py silent
  Write-Host " done"
}

if (($args[0] -eq "ts") -or ($args[0] -eq "") -or ($args[0] -eq "uncompressed")) {
  Write-Host -NoNewline "compiling typescript..."
  tsc

  if (($args[0] -ne "uncompressed") -and ($args[1] -ne "uncompressed")) {
    Write-Host -NoNewline " compressing..."
    uglifyjs ./smiggins/static/app.js -c templates=false -m --output ./smiggins/static/app.js
  }

  Write-Host " done"
}

if (($args[0] -eq "sw") -or ($args[0] -eq "") -or ($args[0] -eq "uncompressed")) {
  Write-Host -NoNewline "compiling typescript..."
  cd smiggins/sw
  tsc
  cd ../..

  if (($args[0] -ne "uncompressed") -and ($args[1] -ne "uncompressed")) {
    Write-Host -NoNewline " compressing..."
    uglifyjs ./smiggins/static/sw.js -c templates=false -m --output ./smiggins/static/sw.js
  }

  Write-Host " done"
}

if (($args[0] -eq "less") -or ($args[0] -eq "") -or ($args[0] -eq "uncompressed")) {
  Write-Host -NoNewline "compiling less..."
  lessc ./smiggins/less/base.less ./smiggins/static/base.css

  if (($args[0] -ne "uncompressed") -and ($args[1] -ne "uncompressed")) {
    Write-Host -NoNewline " compressing..."
    uglifycss ./smiggins/static/base.css --output ./smiggins/static/base.css
  }

  Write-Host " done"
}
