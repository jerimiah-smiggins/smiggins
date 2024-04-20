let inc = 0, req = 0;
let home = true;
let output = "<select id=\"color\">";


for (color of validColors) {
  output += `<option ${((localStorage.getItem("color") == color) ? "selected" : "")} value="${color}">${color}</option>`;
}
output += "</select><br><br>"
dom("color-selector").innerHTML = output;
dom("post-example").innerHTML = getPostHTML(
  "This is an example post. I am @example.",
  0, "example", "Example",
  Date.now() / 1000 - Math.random() * 86400,
  Math.floor(Math.random() * 100),
  Math.floor(Math.random() * 99) + 1,
  Math.floor(Math.random() * 100), undefined,
  true, false, false, false, false, false, true
);

dom("bio").addEventListener("input", postTextInputEvent);

showlog = (str, time=3000) => {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, time);
};

function toggleGradient() {
  if (dom("banner-is-gradient").checked) {
    dom("banner-color-two").removeAttribute("hidden");
    dom("banner").classList.add("gradient");
  } else {
    dom("banner-color-two").setAttribute("hidden", "");
    dom("banner").classList.remove("gradient");
  }
}

toggleGradient();

dom("color").addEventListener("change", function() {
  localStorage.setItem('color', dom("color").value);
  document.body.setAttribute('data-color', dom("color").value);
  dom("post-example").innerHTML = getPostHTML(
    "This is an example post. I am @example.",
    0, "example", "Example",
    Date.now() / 1000 - Math.random() * 86400,
    Math.floor(Math.random() * 100),
    Math.floor(Math.random() * 99) + 1,
    Math.floor(Math.random() * 100), undefined,
    true, false, false, false, false, false, true
  );
});

dom("theme").addEventListener("change", function() {
  dom("theme").setAttribute("disabled", "");
  fetch("/api/user/settings/theme", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "theme": dom("theme").value
    })
  })
    .then((response) => (response.json()))
    .then((json) => {
      if (!json.success) {
        showlog("Something went wrong! Try again in a few moments...");
      }
      dom("theme").removeAttribute("disabled");
      document.querySelector("body").setAttribute("data-theme", dom("theme").value);
    })
    .catch((err) => {
      dom("theme").removeAttribute("disabled");
      showlog("Something went wrong! Try again in a few moments...");
      throw(err);
    });
});

dom("displ-name-save").addEventListener("click", function() {
  dom("bio").setAttribute("disabled", "");
  dom("displ-name").setAttribute("disabled", "");
  dom("displ-name-save").setAttribute("disabled", "");
  fetch("/api/user/settings/text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "displ_name": dom("displ-name").value,
      "bio": dom("bio").value
    })
  })
    .then((response) => (response.json()))
    .then((json) => {
      if (!json.success) {
        showlog("Something went wrong! Try again in a few moments...");
      } else {
        showlog("Success!");
      }
      dom("bio").removeAttribute("disabled");
      dom("displ-name").removeAttribute("disabled");
      dom("displ-name-save").removeAttribute("disabled");
    })
    .catch((err) => {
      dom("bio").removeAttribute("disabled");
      dom("displ-name").removeAttribute("disabled");
      dom("displ-name-save").removeAttribute("disabled");
      showlog("Something went wrong! Try again in a few moments...");
      throw(err);
    });
});

dom("banner-color-save").addEventListener("click", function() {
  dom("banner-color").setAttribute("disabled", "");
  dom("banner-color-save").setAttribute("disabled", "");
  fetch("/api/user/settings/color", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      color: dom("banner-color").value,
      color_two: dom("banner-color-two").value,
      is_gradient: dom("banner-is-gradient").checked
    })
  })
    .then((response) => (response.json()))
    .then((json) => {
      if (!json.success) {
        showlog("Something went wrong! Try again in a few moments...");
      } else {
        showlog("Success!");
      }
      dom("banner-color").removeAttribute("disabled");
      dom("banner-color-save").removeAttribute("disabled");
    })
    .catch((err) => {
      dom("banner-color").removeAttribute("disabled");
      dom("banner-color-save").removeAttribute("disabled");
      showlog("Something went wrong! Try again in a few moments...");
      throw(err);
    });
});

dom("priv-save").addEventListener("click", function() {
  dom("priv").setAttribute("disabled", "");
  dom("priv-save").setAttribute("disabled", "");
  fetch("/api/user/settings/priv", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "priv": dom("priv").checked
    })
  })
    .then((response) => (response.json()))
    .then((json) => {
      if (!json.success) {
        showlog("Something went wrong! Try again in a few moments...");
      } else {
        showlog("Success!");
      }
      dom("priv").removeAttribute("disabled");
      dom("priv-save").removeAttribute("disabled");
    })
    .catch((err) => {
      dom("priv").removeAttribute("disabled");
      dom("priv-save").removeAttribute("disabled");
      showlog("Something went wrong! Try again in a few moments...");
      throw(err);
    });
});

dom("banner-color").addEventListener("input", function() {
  document.body.style.setProperty("--banner", this.value);
});

dom("banner-color-two").addEventListener("input", function() {
  document.body.style.setProperty("--banner-two", this.value);
});

dom("banner-is-gradient").addEventListener("input", toggleGradient);
