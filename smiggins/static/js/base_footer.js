if (typeof(logged_in) != "boolean") {
  logged_in = document.cookie.indexOf("token=") != -1;
}

x = document.createElement("div");
x.setAttribute("class", "icons");
x.setAttribute("id", "icons");

document.querySelector("body").setAttribute("data-color", validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color"));

if (logged_in) {
  x.innerHTML = icons.settings;
  if (typeof(home) !== 'undefined') {
    x.innerHTML += icons.home;
  }
}

if (typeof(share) !== 'undefined') {
  x.innerHTML += `<span title="Share" onclick="window.navigator.clipboard.writeText('${escapeHTML(share)}'); showlog('Copied to clipboard!');">${icons.share}</span>`;
}

document.querySelector("body").append(x);

if (logged_in && typeof(profile) === "undefined") {
  if (localStorage.getItem("username") === null) {
    fetch("/api/info/username")
      .then((response) => (response.json()))
      .then((username) => {
        username = username.username;

        if (usernameRegexFull.test(username)) {
          localStorage.setItem("username", username);
          dom("icons").innerHTML += `<a title="Profile" href="/u/${username}">${icons.user}</a>`;
        } else {
          console.log("Username returned from /api/info/username is invalid.");
        }
      });
  } else {
    if (usernameRegexFull.test(localStorage.getItem("username"))) {
      dom("icons").innerHTML += `<a title="Profile" href="/u/${localStorage.getItem("username")}">${icons.user}</a>`;
    } else {
      console.log("Username in localStorage is invalid.");
      localStorage.removeItem("username");
    }
  }
}

[...document.querySelectorAll("[data-add-icon]")].forEach((val) => {
  val.innerHTML = icons[val.dataset.addIcon];
})
