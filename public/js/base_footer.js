x = document.createElement("div");
x.setAttribute("class", "icons");
x.setAttribute("id", "icons");
x.innerHTML = icons.settings;

if (typeof(home) !== 'undefined') {
  x.innerHTML += icons.home;
}

if (typeof(share) !== 'undefined') {
  x.innerHTML += `<span class="share" onclick="window.navigator.clipboard.writeText('${escapeHTML(share)}')">${icons.share}</span>`;
}

document.querySelector("body").append(x);
