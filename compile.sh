if [ "$1" != "less" ]; then
  tsc
fi

if [ "$1" != "ts" ]; then
  lessc ./smiggins/less/base.less ./smiggins/static/base.css
fi

cd ./smiggins/static;

if [ "$1" != "uncompressed" ]; then
  uglifycss base.css --output base.css
  uglifyjs app.js --output app.js
fi
