let inc = 0, req = 0;
let home = true;

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
        dom("error").innerText = "Something went wrong! Try again in a few moments...";
        inc++;
        setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
      }
      dom("theme").removeAttribute("disabled");
      document.querySelector("body").setAttribute("data-theme", dom("theme").value);
    })
    .catch((err) => {
      dom("theme").removeAttribute("disabled");
      inc++;
      dom("error").innerText = "Something went wrong! Try again in a few moments...";
      setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
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
        dom("error").innerText = "Something went wrong! Try again in a few moments...";
      } else {
        dom("error").innerText = "Success!";
      }
      inc++;
      setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
      dom("displ-name").removeAttribute("disabled");
      dom("displ-name-save").removeAttribute("disabled");
    })
    .catch((err) => {
      dom("displ-name").removeAttribute("disabled");
      dom("displ-name-save").removeAttribute("disabled");
      inc++;
      dom("error").innerText = "Something went wrong! Try again in a few moments...";
      setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
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
        dom("error").innerText = "Something went wrong! Try again in a few moments...";
      } else {
        dom("error").innerText = "Success!";
      }
      inc++;
      setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
      dom("color").removeAttribute("disabled");
      dom("color-save").removeAttribute("disabled");
    })
    .catch((err) => {
      dom("color").removeAttribute("disabled");
      dom("color-save").removeAttribute("disabled");
      inc++;
      dom("error").innerText = "Something went wrong! Try again in a few moments...";
      setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
      throw(err);
    });
});

dom("color").addEventListener("input", function() {
  document.querySelector("body").setAttribute("style", `--banner: ${this.value}`);
})
