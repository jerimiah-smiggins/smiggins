if (typeof(logged_in) != "boolean") {
  logged_in = document.cookie.indexOf("token=") != -1;
}

let titleNotificationIndicator = false;

x = document.createElement("div");
x.setAttribute("class", "icons");
x.setAttribute("id", "icons");

document.querySelector("body").setAttribute(
  "data-color",
  validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color")
);

if (logged_in) {
  x.innerHTML = `<a title="Settings" href="/settings">${icons.settings}</a>`;

  if (typeof(home) !== 'undefined') {
    x.innerHTML += `<a title="Home" href="/home">${icons.home}</a>`;
  }

  x.innerHTML += `<div data-add-notification-dot><a title="Notifications" href="/notifications">${icons.bell}</a></div>`;
  if (ENABLE_PRIVATE_MESSAGES) {
    x.innerHTML += `<div data-add-message-dot><a title="Messages" href="/messages">${icons.message}</a></div>`;
  }
}

if (typeof(share) !== 'undefined') {
  x.innerHTML += `<span title="Share" onclick="window.navigator.clipboard.writeText('${escapeHTML(share)}'); showlog('Copied to clipboard!');">${icons.share}</span>`;
}

document.querySelector("body").append(x);

function getNotifications() {
  fetch("/api/info/notifications")
    .then((response) => (response.json()))
    .then((json) => {
      [...document.querySelectorAll("[data-add-notification-dot]")].forEach((val, index) => {
        if (json.success && json.notifications) {
          val.classList.add("dot");
        } else {
          val.classList.remove("dot");
        }
      });

      ENABLE_PRIVATE_MESSAGES && [...document.querySelectorAll("[data-add-message-dot]")].forEach((val, index) => {
        if (json.success && json.messages) {
          val.classList.add("dot");
        } else {
          val.classList.remove("dot");
        }
      });

      if ((json.messages && ENABLE_PRIVATE_MESSAGES) || json.notifications) {
        if (!titleNotificationIndicator) {
          titleNotificationIndicator = true;
          document.title = "[ ! ] " + document.title;
        }
      } else {
        if (titleNotificationIndicator) {
          titleNotificationIndicator = false;
          document.title = document.title.slice(6);
        }
      }
    });
}

if (logged_in) {
  getNotifications();
  setInterval(getNotifications, 2 * 60 * 1000);

  if (typeof(profile) === "undefined") {
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
}

[...document.querySelectorAll("[data-add-icon]")].forEach((val) => {
  val.innerHTML = icons[val.dataset.addIcon];
});

[...document.querySelectorAll("[data-add-badge]")].forEach((val) => {
  val.innerHTML = badges[val.dataset.addBadge];
});
