if [ "$1" != "less" ]; then
  printf "compiling typescript..."
  tsc

  if [ "$1" != "uncompressed" ]; then
    printf " compressing..."
    uglifyjs ./smiggins/static/app.js --output ./smiggins/static/app.js
  fi

  echo " done"
fi

if [ "$1" != "ts" ]; then
  printf "compiling less..."
  lessc ./smiggins/less/base.less ./smiggins/static/base.css

  if [ "$1" != "uncompressed" ]; then
    printf " compressing..."
    uglifycss ./smiggins/static/base.css --output ./smiggins/static/base.css
  fi

  echo " done"
fi
