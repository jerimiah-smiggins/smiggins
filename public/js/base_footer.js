x = document.createElement("div");
x.setAttribute("class", "icons");
x.setAttribute("id", "icons");
x.innerHTML = icons.settings;

if (typeof(home) !== 'undefined') {
  x.innerHTML += icons.home;
}

document.querySelector("body").append(x);
