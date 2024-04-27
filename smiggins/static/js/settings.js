let inc = 0, req = 0;
let home = true;

let output = "<select id=\"color\">";
for (color of validColors) {
  output += `<option ${((localStorage.getItem("color") == color || (!localStorage.getItem("color") && color == "mauve")) ? "selected" : "")} value="${color}">${color.charAt(0).toUpperCase() + color.slice(1)}</option>`;
}
output += "</select><br><br>";

let currentAccount = document.cookie.match(/token=([a-f0-9]{64})/)[0].split("=")[1];
let accounts = JSON.parse(localStorage.getItem("acc-switcher") || JSON.stringify([[localStorage.getItem("username"), currentAccount]]));
if (!localStorage.getItem("username")) {
  showlog("Username couldn't be loaded! Try reloading the page?", 10_000);
  dom("switcher").setAttribute("hidden", "");
}

let hasCurrent = false;
for (const acc of accounts) {
  if (currentAccount == acc[1]) {
    hasCurrent = true;
  }
}

if (!hasCurrent) {
  accounts.push([
    localStorage.getItem("username"),
    document.cookie.match(/token=([a-f0-9]{64})/)[0].split("=")[1]
  ]);
}

accounts = accounts.sort(
  (a, b) => (a[0].toLowerCase() > b[0].toLowerCase())
);

localStorage.setItem("acc-switcher", JSON.stringify(accounts));

dom("color-selector").innerHTML = output;
dom("post-example").innerHTML = getPostHTML(
  "This is an example post. I am @example.",
  0, "example", "Example",
  Date.now() / 1000 - Math.random() * 86400,
  Math.floor(Math.random() * 100),
  Math.floor(Math.random() * 99) + 1,
  Math.floor(Math.random() * 100), undefined,
  true, false, false, false, false, false, ["administrator"], true
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

let x = new DocumentFragment();
for (const acc of accounts) {
  let y = document.createElement("option");
  y.innerText = acc[0];
  y.value = acc[1] + "-" + acc[0];

  if (currentAccount == acc[1]) {
    y.setAttribute("selected", "");
  }

  x.append(y);
}

dom("accs").append(x);

toggleGradient();
dom("color").addEventListener("change", function() {
  localStorage.setItem('color', dom("color").value);
  document.body.setAttribute('data-color', dom("color").value);
});

dom("theme").addEventListener("change", function() {
  dom("theme").setAttribute("disabled", "");
  fetch("/api/user/settings/theme", {
    method: "PATCH",
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

dom("save").addEventListener("click", function() {
  dom("bio").setAttribute("disabled", "");
  dom("priv").setAttribute("disabled", "");
  dom("save").setAttribute("disabled", "");
  dom("displ-name").setAttribute("disabled", "");
  dom("banner-color").setAttribute("disabled", "");
  dom("banner-color-two").setAttribute("disabled", "");
  dom("banner-is-gradient").setAttribute("disabled", "");

  fetch("/api/user/settings", {
    method: "PATCH",
    body: JSON.stringify({
      bio: dom("bio").value,
      priv: dom("priv").checked,
      color: dom("banner-color").value,
      color_two: dom("banner-color-two").value,
      displ_name: dom("displ-name").value,
      is_gradient: dom("banner-is-gradient").checked
    })
  }).then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        showlog("Success!");
      } else {
        showlog(`Unable to save! Reason: ${json.reason}`);
      }

      throw "ermmm what the flip";
    })
    .catch((err) => {
      dom("bio").removeAttribute("disabled");
      dom("priv").removeAttribute("disabled");
      dom("save").removeAttribute("disabled");
      dom("displ-name").removeAttribute("disabled");
      dom("banner-color").removeAttribute("disabled");
      dom("banner-color-two").removeAttribute("disabled");
      dom("banner-is-gradient").removeAttribute("disabled");
    });
});

dom("banner-color").addEventListener("input", function() {
  document.body.style.setProperty("--banner", this.value);
});

dom("banner-color-two").addEventListener("input", function() {
  document.body.style.setProperty("--banner-two", this.value);
});

dom("banner-is-gradient").addEventListener("input", toggleGradient);

dom("acc-switch").addEventListener("click", function() {
  let val = dom("accs").value.split("-", 2);
  setCookie("token", val[0]);
  localStorage.setItem("username", val[1]);
  window.location.reload();
});

dom("acc-remove").addEventListener("click", function() {
  let removed = dom("accs").value.split("-", 2);
  if (removed[0] == currentAccount) {
    showlog("You can't remove the account you're currently signed into!");
  } else {
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i][1] == removed[0]) {
        accounts.splice(i, 1);
        --i;
      }
    }

    dom("accs").querySelector(`option[value="${dom("accs").value}"]`).remove();
    localStorage.setItem("acc-switcher", JSON.stringify(accounts));
  }
});
