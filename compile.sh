if [ "$1" != "" ] && [ "$1" != "lang" ] && [ "$1" != "less" ] && [ "$1" != "ts" ] && [ "$1" != "uncompressed" ]; then
  echo "unknown format $1";
  exit 1;
fi

if [ "$1" == "lang" ] || [ "$1" == "" ] || [ "$1" == "uncompressed" ]; then
  printf "collecting languages..."
  python3 ./smiggins/langs/generator.py
  echo " done"
fi

if [ "$1" == "ts" ] || [ "$1" == "" ] || [ "$1" == "uncompressed" ]; then
  printf "compiling typescript..."
  tsc

  if [ "$1" != "uncompressed" ] && [ "$2" != "uncompressed" ]; then
    printf " compressing..."
    uglifyjs ./smiggins/static/app.js -c templates=false -m --output ./smiggins/static/app.js
  fi

  echo " done"
fi

if [ "$1" == "less" ] || [ "$1" == "" ] || [ "$1" == "uncompressed" ]; then
  printf "compiling less..."
  lessc ./smiggins/less/base.less ./smiggins/static/base.css

  if [ "$1" != "uncompressed" ] && [ "$2" != "uncompressed" ]; then
    printf " compressing..."
    uglifycss ./smiggins/static/base.css --output ./smiggins/static/base.css
  fi

  echo " done"
fi
