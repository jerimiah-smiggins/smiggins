const usernameRegexFull: RegExp = /^[a-z0-9_\-]+$/g;

if (typeof(logged_in) != "boolean") {
  logged_in = document.cookie.split(/\btoken=/).length != 1;
}

if (logged_in) {
  setCookie("token", document.cookie.split(/\btoken=/)[1].split(";")[0]);
}

let titleNotificationIndicator: boolean = false;
let pendingFollowersIconEnabled: boolean = false;

let iconsElement: HTMLElement = document.createElement("div");
iconsElement.setAttribute("class", "icons");
iconsElement.setAttribute("id", "icons");

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

if (logged_in) {
  iconsElement.innerHTML = `<div><a title="${lang.settings.title}" href="/settings">${icons.settings}</a></div>`;

  if (typeof(home) !== 'undefined') {
    iconsElement.innerHTML += `<div><a title="${lang.home.title}" href="/home">${icons.home}</a></div>`;
  }

  iconsElement.innerHTML += `<div data-add-notification-dot><a title="${lang.notifications.title}" href="/notifications">${icons.bell}</a></div>`;
  if (ENABLE_PRIVATE_MESSAGES) {
    iconsElement.innerHTML += `<div data-add-message-dot><a title="${lang.messages.list_title}" href="/messages">${icons.message}</a></div>`;
  }
}

if (typeof(share) !== 'undefined') {
  iconsElement.innerHTML += `<div><span title="${lang.generic.share}" role="button" onkeydown="genericKeyboardEvent(event, () => { navigator.clipboard.writeText('${escapeHTML(share)}'); showlog('${lang.generic.copied}'); })" tabindex="0" onclick="navigator.clipboard.writeText('${escapeHTML(share)}'); showlog('${lang.generic.copied}');">${icons.share}</span></div>`;
}

document.body.prepend(iconsElement);

function getNotifications(): void {
  fetch("/api/info/notifications")
    .then((response: Response) => (response.json()))
    .then((json: {
      success: boolean,
      notifications: boolean,
      messages: boolean,
      followers: boolean
    }) => {
      forEach(document.querySelectorAll("[data-add-notification-dot]"), (val: HTMLElement, index: number): void => {
        if (json.success && json.notifications) {
          val.classList.add("dot");
        } else {
          val.classList.remove("dot");
        }
      });

      ENABLE_PRIVATE_MESSAGES && forEach(document.querySelectorAll("[data-add-message-dot]"), (val: HTMLElement, index: number): void => {
        if (json.success && json.messages) {
          val.classList.add("dot");
        } else {
          val.classList.remove("dot");
        }
      });

      if (!pendingFollowersIconEnabled && json.followers) {
        pendingFollowersIconEnabled = true;
        dom("icons").innerHTML += `<div class="dot" id="pending-followers-icon" title="${lang.user_page.pending_title}"><a href="/pending/">${icons.follower}</a></div>`;
      } else if (pendingFollowersIconEnabled && !json.followers) {
        pendingFollowersIconEnabled = false;
        dom("pending-followers-icon").remove();
      }

      if ((json.messages && ENABLE_PRIVATE_MESSAGES) || json.notifications || json.followers || json.followers) {
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
  dom("icons").innerHTML += `<a title="${lang.settings.profile_title}" href="/u/${localStorage.getItem("username")}">${icons.user}</a>`;
}

forEach(document.querySelectorAll("[data-add-icon]"), (val: HTMLElement, index: number): void => {
  val.innerHTML = icons[val.dataset.addIcon];
});

forEach(document.querySelectorAll("[data-add-badge]"), (val: HTMLElement, index: number): void => {
  val.innerHTML = badges[val.dataset.addBadge];
});

if (typeof onLoad === "function") {
  onLoad();
}
