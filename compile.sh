if [ "$1" != "less" ]; then
  tsc
fi

if [ "$1" != "ts" ]; then
  lessc ./smiggins/less/base.less ./smiggins/static/base.css --cleancss || lessc ./smiggins/less/base.less ./smiggins/static/base.css
fi
