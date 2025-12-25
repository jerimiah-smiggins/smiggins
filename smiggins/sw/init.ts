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

  // expected format:
  // site_name;type;click_event;data
  // type: follow, follow-request, comment, quote, ping, message
  // event: "", "p[pid]", "u[username]", "m[gid]"
  let content: string[] = data?.text().split(";") || [L.notifications.no_content_title, "none", "", L.notifications.no_content_body];

  let siteName: string = content[0];
  let type: NotificationEventType = content[1] as NotificationEventType;
  let event: string = content[2];
  let additionalData: any = JSON.parse(content.slice(3).join(";"));

  let body: string = String(additionalData);

  switch (type) {
    case "comment":
    case "quote":
    case "ping": {
      body = lr(L.notifications[type], {
        n: additionalData.display_name,
        u: additionalData.username,
        c: additionalData.content
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
  }

  sw_self.registration.showNotification(siteName, {
    body: body,
    data: event,
    icon: location.origin + "/favicon.ico"
  });

  // TODO: notification on click event
}

sw_self.addEventListener("push", function(e: PushEvent): void {
  e.waitUntil(handleNotification(e.data))
});

console.log("[SW] init");
