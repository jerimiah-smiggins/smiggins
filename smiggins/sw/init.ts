const sw_self = self as unknown as ServiceWorkerGlobalScope;

async function canUseNotifications(): Promise<boolean> {
  const perms: PermissionStatus = await navigator.permissions.query({
    name: "notifications"
  });
  return (perms.state === "granted");
}

async function handleNotification(data: PushMessageData | null): Promise<void> {
  if (!canUseNotifications()) {
    console.log("[SW] recieved message but can't show notif")
  }

  sw_self.registration.showNotification("Notification", {
    body: data?.text() || "No notification content was given.",
  });
}

sw_self.addEventListener("push", function(e: PushEvent): void {
  e.waitUntil(handleNotification(e.data))
});

console.log("[SW] init");
