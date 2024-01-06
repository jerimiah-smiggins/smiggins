x = document.createElement("div");
x.setAttribute("class", "icons");
x.setAttribute("id", "icons");

if (typeof(logged_in) !== 'boolean' || logged_in) {
  x.innerHTML = icons.settings;
  if (typeof(home) !== 'undefined') {
    x.innerHTML += icons.home;
  }
}

if (typeof(share) !== 'undefined') {
  x.innerHTML += `<span class="share" title="Share" onclick="window.navigator.clipboard.writeText('${escapeHTML(share)}'); showlog('Copied to clipboard!');">${icons.share}</span>`;
}

document.querySelector("body").append(x);
