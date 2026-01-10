const sw_self = self as unknown as ServiceWorkerGlobalScope;

sw_self.addEventListener("push", function(e: PushEvent): void {
  e.waitUntil(handleNotification(e.data));
});

sw_self.addEventListener("message", function(e: ExtendableMessageEvent): void {
  console.log("message", e.data);

  if (typeof e.data === "string") {
    switch (e.data[0]) {
      case "l": { // set language
        L = LANGS[e.data.slice(1) as languages | null || DEFAULT_LANGUAGE];
        if (!L) { L = LANGS[DEFAULT_LANGUAGE]; }
        break;
      }
      case "b": { // set badge number
        resetBadgeInterval();
        updateBadge(Number(e.data.slice(1)));
        break;
      }
      case "c": { // clear notifications
        clearAllNotifications();
        break;
      }
    }
  }
});

console.log("[SW] init");
