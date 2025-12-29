const sw_self = self as unknown as ServiceWorkerGlobalScope;

async function canUseNotifications(): Promise<boolean> {
  const perms: PermissionStatus = await navigator.permissions.query({
    name: "notifications"
  });
  return (perms.state === "granted");
}

async function handleNotification(data: PushMessageData | null): Promise<void> {
  if (!canUseNotifications()) {
    console.log("[SW] recieved message but can't show notif");
  }

  resetBadgeInterval();
  fetchBadge();

  // expected format:
  // site_name;type;click_event;data
  // type: follow, follow-request, comment, quote, ping, message
  // event: "", "p[pid]", "u[username]", "m[gid]"
  let content: string[] = data?.text().split(";") || [L.notifications.no_content_title, "none", "", L.notifications.no_content_body];

  let siteName: string = content[0];
  let type: NotificationEventType = content[1] as NotificationEventType;
  let event: string = content[2];
  let additionalData: {
    display_name: string,
    username: string,
    content: string,
    users: number
  } = JSON.parse(content.slice(3).join(";"));

  let body: string = String(additionalData);

  switch (type) {
    case "comment":
    case "quote":
    case "ping": {
      body = lr(L.notifications[type], {
        n: additionalData.display_name,
        u: additionalData.username,
        c: additionalData.content.replaceAll("\n", "")
      });
      break;
    }

    case "follow": {
      body = lr(L.notifications.followed, {
        n: additionalData.display_name,
        u: additionalData.username
      });
      break;
    }

    case "follow_request": {
      body = lr(L.notifications.folreq, {
        n: additionalData.display_name,
        u: additionalData.username
      });
      break;
    }

    case "message": {
      body = lr(n(L.notifications.message, additionalData.users - 2), {
        n: additionalData.display_name,
        u: additionalData.username,
        c: String(additionalData.users - 2)
      });
      break;
    }

    default: {
      console.log("[SW] unknown notification type", type);
      body = L.notifications.no_content_body;
      break;
    }
  }

  sw_self.registration.showNotification(siteName, {
    body: body,
    data: event,
    icon: location.origin + "/favicon.ico"
  });
}

sw_self.addEventListener("push", function(e: PushEvent): void {
  e.waitUntil(handleNotification(e.data))
});

sw_self.addEventListener("message", function(e: ExtendableMessageEvent): void {
  console.log("message", e.data);

  if (typeof e.data === "string") {
    switch (e.data[0]) {
      case "l": {
        L = LANGS[e.data.slice(1) as languages | null || DEFAULT_LANGUAGE];
        if (!L) { L = LANGS[DEFAULT_LANGUAGE]; }
        break;
      }
      case "b": {
        resetBadgeInterval();
        updateBadge(Number(e.data.slice(1)));
        break;
      }
    }
  }
});

sw_self.addEventListener("notificationclick", function(e: NotificationEvent): void {
  if (typeof e.notification.data === "string") {
    switch (e.notification.data[0]) {
      case "p": {
        sw_self.clients.openWindow(`/p/${e.notification.data.slice(1)}/`);
        break;
      }
      case "u": {
        sw_self.clients.openWindow(`/u/${e.notification.data.slice(1)}/`);
        break;
      }
      case "m": {
        sw_self.clients.openWindow(`/message/${e.notification.data.slice(1)}/`);
        break;
      }
    }
  }
});

console.log("[SW] init");
