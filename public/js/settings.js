let inc = 0, req = 0;
let home = true;

showlog = (str, time=3000) => {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, time);
};

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
  dom("displ-name").setAttribute("disabled", "");
  dom("displ-name-save").setAttribute("disabled", "");
  fetch("/api/user/settings/display-name", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "displ_name": dom("displ-name").value
    })
  })
    .then((response) => (response.json()))
    .then((json) => {
      if (!json.success) {
        showlog("Something went wrong! Try again in a few moments...");
      } else {
        showlog("Success!");
      }
      dom("displ-name").removeAttribute("disabled");
      dom("displ-name-save").removeAttribute("disabled");
    })
    .catch((err) => {
      dom("displ-name").removeAttribute("disabled");
      dom("displ-name-save").removeAttribute("disabled");
      showlog("Something went wrong! Try again in a few moments...");
      throw(err);
    });
});

dom("color-save").addEventListener("click", function() {
  dom("color").setAttribute("disabled", "");
  dom("color-save").setAttribute("disabled", "");
  fetch("/api/user/settings/color", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "color": dom("color").value
    })
  })
    .then((response) => (response.json()))
    .then((json) => {
      if (!json.success) {
        showlog("Something went wrong! Try again in a few moments...");
      } else {
        showlog("Success!");
      }
      dom("color").removeAttribute("disabled");
      dom("color-save").removeAttribute("disabled");
    })
    .catch((err) => {
      dom("color").removeAttribute("disabled");
      dom("color-save").removeAttribute("disabled");
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

dom("color").addEventListener("input", function() {
  document.querySelector("body").setAttribute("style", `--banner: ${this.value}`);
});
