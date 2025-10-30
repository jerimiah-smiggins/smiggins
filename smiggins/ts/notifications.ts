let pendingNotifications: {
  notifications: boolean,
  messages: boolean,
  follow_requests: boolean
} = {
  notifications: false,
  messages: false,
  follow_requests: false
};

function fetchNotifications(): void {
  fetch("/api/notifications")
    .then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err) => {
      console.log("timeline polling error", err);
    });
}

function resetNotificationIndicators(): void {
  let notif: HTMLElement | null = document.querySelector("#navbar a[data-internal-link=\"notifications\"]");
  let msg: HTMLElement | null = document.querySelector("#navbar a[data-internal-link=\"messages\"]");
  let folreq: HTMLElement | null = document.querySelector("#navbar a[data-internal-link=\"follow-requests\"]");

  if (notif) {
    if (pendingNotifications.notifications) {
      notif.dataset.notification = "";
    } else {
      delete notif.dataset.notification;
    }
  }

  if (msg) {
    if (pendingNotifications.messages) {
      msg.dataset.notification = "";
    } else {
      delete msg.dataset.notification;
    }
  }

  if (folreq) {
    if (pendingNotifications.follow_requests) {
      folreq.dataset.notification = "";
      folreq.removeAttribute("hidden");
    } else {
      delete folreq.dataset.notification;
    }
  }

  document.title = getPageTitle(currentPage);
}

if (loggedIn) {
  fetchNotifications();
  setInterval(fetchNotifications, 60_000);
}
