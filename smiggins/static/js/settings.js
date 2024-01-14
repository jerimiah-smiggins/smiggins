let inc = 0, req = 0;
let home = true;

for (i in validColors) {
  dom("color-container").innerHTML += `
    <div class="post-container" data-color="${validColors[i]}" onclick="localStorage.setItem('color', '${validColors[i]}'); document.querySelector('body').setAttribute('data-color', validColors.indexOf(localStorage.getItem('color')) == -1 ? validColors[0] : localStorage.getItem('color'));">
      <div class="post">
        <div class="upper-content">
          <div class="displ-name">Example
          <span class="upper-lower-opacity"> -
            <div class="username">@example</div> -
            <div class="timestamp">${Math.floor(Math.random() * 21) + 2} hours ago</div>
          </span>
        </div>
        <div class="main-content">
          This is an example post. I am <a href="#">@example</a>.
        </div>
        <div class="bottom-content">
          <div class="comment">${icons.comment}</div><span class="comment-number">${Math.floor(Math.random() * 100)}</span>
          <div class="bottom-spacing"></div>
          <div class="like" data-liked="true">
            ${icons.like}
          </div>
          <span class="like-number">${Math.floor(Math.random() * 100) + 1}</span>
        </div>
      </div>
    </div>
  `;
}

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

dom("banner-color-save").addEventListener("click", function() {
  dom("banner-color").setAttribute("disabled", "");
  dom("banner-color-save").setAttribute("disabled", "");
  fetch("/api/user/settings/color", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "color": dom("banner-color").value
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
  document.querySelector("body").setAttribute("style", `--banner: ${this.value}`);
});
