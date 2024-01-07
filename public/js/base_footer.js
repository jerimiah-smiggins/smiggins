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
  x.innerHTML += `<span title="Share" onclick="window.navigator.clipboard.writeText('${escapeHTML(share)}'); showlog('Copied to clipboard!');">${icons.share}</span>`;
}

document.querySelector("body").append(x);

if (typeof(profile) === "undefined") {
  if (localStorage.getItem("username") === null) {
    fetch("/api/info/username")
      .then((response) => (response.text()))
      .then((username) => {
        localStorage.setItem("username", username)
        dom("icons").innerHTML += `<a title="Profile" href="/u/${username}">${icons.user}</a>`;
      });
  } else {
    dom("icons").innerHTML += `<a title="Profile" href="/u/${localStorage.getItem("username")}">${icons.user}</a>`;
  }
}
