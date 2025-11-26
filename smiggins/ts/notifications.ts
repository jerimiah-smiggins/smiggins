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
  let notif: NodeListOf<HTMLElement> = document.querySelectorAll("#navbar [data-notif-dot=\"notifications\"]");
  let folreq: NodeListOf<HTMLElement> = document.querySelectorAll("#navbar [data-notif-dot=\"folreq\"]");

  if (notif) {
    if (pendingNotifications.notifications) {
      for (const n of notif) {
        n.dataset.notification = "";
      }
    } else {
      for (const n of notif) {
        delete n.dataset.notification;
      }
    }
  }

  if (folreq) {
    if (pendingNotifications.follow_requests) {
      for (const fr of folreq) {
        fr.dataset.notification = "";
      }

      for (const el of document.querySelectorAll("[data-navbar-folreq-toggle][hidden]")) {
        el.removeAttribute("hidden");
      }
    } else {
      for (const fr of folreq) {
        delete fr.dataset.notification;
      }
    }
  }

  document.title = getPageTitle(currentPage);
}

if (loggedIn) {
  fetchNotifications();
  setInterval(fetchNotifications, NOTIFICATION_POLLING_INTERVAL);
}
