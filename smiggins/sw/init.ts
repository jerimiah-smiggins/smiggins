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
  // site name;event;text
  // event: "", "p[pid]", "u[username]", "m[gid]"
  let content: string[] = data?.text().split(";") || ["Notification", "", "No notification content was given."];

  sw_self.registration.showNotification(content[0], {
    body: content.slice(2).join(";"),
    data: content[1]
  });
}

sw_self.addEventListener("push", function(e: PushEvent): void {
  e.waitUntil(handleNotification(e.data))
});

console.log("[SW] init");
