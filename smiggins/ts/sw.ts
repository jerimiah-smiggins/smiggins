async function canUseNotifications(): Promise<boolean> {
  const perms: PermissionStatus = await navigator.permissions.query({
    name: "notifications"
  });
  return (perms.state === "granted");
}

function swRegHandler(registration: ServiceWorkerRegistration): void {
  registration.pushManager.getSubscription()
    .then(async (subscription: PushSubscription | null): Promise<PushSubscription> => {
      if (subscription) {
        console.log("[SW] subscription exists");
        return subscription;
      }

      const response = await fetch("/api/sw/publickey");
      const publicKey: string = await response.text();
      const convertedKey: Uint8Array<ArrayBuffer> = new TextEncoder().encode(atob(publicKey.replaceAll("-", "+").replaceAll("_", "/")));

      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    })
    .then((subscription: PushSubscription): void => {
      fetch("/api/sw/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    });
}

function initServiceWorker(): void {
  if (!navigator.serviceWorker) {
    console.log("[SW] can't init: not supported");
    return;
  }

  navigator.serviceWorker.register(SW_URL)
    .catch((err: any): void => {
      console.log("[SW] failed to init", err)
    });

  navigator.serviceWorker.ready.then(swRegHandler);
}

async function askNotificationPermission(initSW: boolean=true, persist: boolean=true): Promise<void> {
  if (window.Notification && !await canUseNotifications()) {
    let status: NotificationPermission = await Notification.requestPermission();
    if (status === "granted") {
      if (initSW) {
        initServiceWorker();
      }

      if (persist) {
        localStorage.setItem("smiggins-push-notifs", "1");
      }
    }
  }
}

if (localStorage.getItem("smiggins-push-notifs")) {
  canUseNotifications().then((notifs: boolean): void => {
    if (notifs) {
      initServiceWorker();
    }
  });
}
