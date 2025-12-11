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
  new api_Notifications().fetch();
}

function resetNotificationIndicators(): void {
  for (const el of document.querySelectorAll("#navbar [data-notif-dot][data-notification]") as NodeListOf<HTMLElement>) {
    delete el.dataset.notification;
  }

  for (const el of document.querySelectorAll("#navbar [data-notif-dot]") as NodeListOf<HTMLElement>) {
    if (
      pendingNotifications.notifications && el.dataset.notifDot?.includes("notifications")
   || pendingNotifications.messages && el.dataset.notifDot?.includes("messages")
   || pendingNotifications.follow_requests && el.dataset.notifDot?.includes("folreq")
    ) {
      el.dataset.notification = "";
    } else {
      delete el.dataset.notification;
    }
  }

  if (pendingNotifications.follow_requests) {
    for (const el of document.querySelectorAll("[data-navbar-folreq-toggle][hidden]")) {
      el.removeAttribute("hidden");
    }
  }

  document.title = getPageTitle(currentPage);
}

if (loggedIn) {
  fetchNotifications();
  setInterval(fetchNotifications, NOTIFICATION_POLLING_INTERVAL);
}
