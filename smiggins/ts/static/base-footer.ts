const usernameRegexFull: RegExp = /^[a-z0-9_\-]+$/g;
let titleNotificationIndicator: boolean = false;
let pendingFollowersIconEnabled: boolean = false;

let iconsElement: HTMLElement = document.createElement("div");
iconsElement.setAttribute("class", "icons");
iconsElement.setAttribute("id", "icons");

function getNotifications(): void {
  fetch("/api/info/notifications")
    .then((response: Response) => (response.json()))
    .then((json: {
      success: boolean,
      notifications: number,
      messages: number,
      followers: number
    }) => {
      forEach(document.querySelectorAll("[data-add-notification-dot]"), (val: HTMLElement, index: number): void => {
        if (json.success && json.notifications) {
          val.classList.add("dot");
          val.dataset.value = String(json.notifications);
        } else {
          val.classList.remove("dot");
        }
      });

      conf.private_messages && forEach(document.querySelectorAll("[data-add-message-dot]"), (val: HTMLElement, index: number): void => {
        if (json.success && json.messages) {
          val.classList.add("dot");
          val.dataset.value = String(json.messages);
        } else {
          val.classList.remove("dot");
        }
      });

      if (!pendingFollowersIconEnabled && json.followers) {
        pendingFollowersIconEnabled = true;
        dom("icons").innerHTML += `<div class="dot" data-value="${json.followers}" id="pending-followers-icon" title="${lang.user_page.pending_title}"><a data-link href="/pending/">${icons.follower}</a></div>`;
      } else if (pendingFollowersIconEnabled && !json.followers) {
        pendingFollowersIconEnabled = false;
        dom("pending-followers-icon").remove();
      }

      if ((json.messages && conf.private_messages) || json.notifications || json.followers || json.followers) {
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

function updateIconBar(): void {
  if (!loggedIn) { return; }

  if (share) {
    iconsElement.querySelector("[data-icon='share']").removeAttribute("hidden");
  } else {
    iconsElement.querySelector("[data-icon='share']").setAttribute("hidden", "");
  }
}

if (localStorage.getItem("compact")) {
  document.body.setAttribute("data-compact", "");
}

if (loggedIn) {
  setCookie("token", document.cookie.split(/\btoken=/)[1].split(";")[0]);
}

document.body.setAttribute(
  "data-color",
  validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color")
);

document.body.setAttribute(
  "data-bar-pos",
  (["ur", "lr", "ul", "ll"]).indexOf(localStorage.getItem("bar-pos")) == -1 ? "ul" : localStorage.getItem("bar-pos")
);

document.body.setAttribute(
  "data-bar-dir",
  (["h", "r"]).indexOf(localStorage.getItem("bar-dir")) == -1 ? "v" : localStorage.getItem("bar-dir")
);

if (localStorage.getItem("checkboxes")) {
  document.body.setAttribute("data-disable-checkboxes", "");
}

if (loggedIn) {
  iconsElement.innerHTML = `<div data-icon="settings"><a data-link title="${lang.settings.title}" href="/settings/">${icons.settings}</a></div>`;
  iconsElement.innerHTML += `<div data-icon="home"><a data-link title="${lang.home.title}" href="/">${icons.home}</a></div>`;
  iconsElement.innerHTML += `<div data-icon="notifications" data-add-notification-dot><a data-link title="${lang.notifications.title}" href="/notifications/">${icons.bell}</a></div>`;

  if (conf.private_messages) {
    iconsElement.innerHTML += `<div data-icon="message" data-add-message-dot><a data-link title="${lang.messages.list_title}" href="/messages/">${icons.message}</a></div>`;
  }

  iconsElement.innerHTML += `<div ${share ? "" : "hidden"} data-icon="share"><span title="${lang.generic.share}" role="button" onkeydown="genericKeyboardEvent(event, () => { navigator.clipboard.writeText(share); showlog(lang.generic.copied); })" tabindex="0" onclick="navigator.clipboard.writeText(share); showlog(lang.generic.copied);">${icons.share}</span></div>`;
  iconsElement.innerHTML += `<div data-icon="user"><a data-link title="${lang.settings.profile_title}" href="/u/${username}/">${icons.user}</a></div>`;

  document.body.prepend(iconsElement);
  registerLinks(iconsElement);

  getNotifications();
  setInterval(getNotifications, 2 * 60 * 1000);
}

forEach(document.querySelectorAll("[data-add-icon]"), (val: HTMLElement, index: number): void => {
  val.innerHTML = icons[val.dataset.addIcon];
});

if (conf.badges) {
  forEach(document.querySelectorAll("[data-add-badge]"), (val: HTMLElement, index: number): void => {
    val.innerHTML = badges[val.dataset.addBadge];
  });
}

if (typeof onLoad === "function") {
  onLoad();
}
