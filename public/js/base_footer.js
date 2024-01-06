x = document.createElement("div");
x.setAttribute("class", "icons");
x.setAttribute("id", "icons");

document.querySelector("body").setAttribute("data-color", validColors.indexOf(localStorage.getItem("color")) == -1 ? validColors[0] : localStorage.getItem("color"));

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
