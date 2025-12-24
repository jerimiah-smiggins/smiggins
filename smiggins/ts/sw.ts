async function canUseNotifications(): Promise<boolean> {
  const perms: PermissionStatus = await navigator.permissions.query({
    name: "notifications"
  });
  return (perms.state === "granted");
}

function swRegHandler(registration: ServiceWorkerRegistration): void {
  registration.pushManager.getSubscription()
    .then(async (subscription: PushSubscription | null): Promise<PushSubscription | null> => {
      if (subscription) {
        console.log("[SW] subscription exists");
        return subscription;
      }

      if (!loggedIn) {
        console.log("[SW] not listening due to not logged in");
        return null;
      }

      const response = await fetch("/api/sw/publickey");
      const publicKey: string = await response.text();

      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });
    })
    .then((subscription: PushSubscription | null): void => {
      if (subscription) {
        fetch(loggedIn ? "/api/sw/register" : "/api/sw/unregister", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON())
        });

        if (!loggedIn) {
          subscription.unsubscribe();
        }
      }
    });
}

function initServiceWorker(): void {
  if (!navigator.serviceWorker) {
    console.log("[SW] can't init: not supported");
    return;
  }

  navigator.serviceWorker.register(SW_URL, {
    scope: "/"
  }).catch((err: any): void => {
      console.log("[SW] failed to init", err)
    });

  console.log("[SW] attempting to init");
  navigator.serviceWorker.ready.then(swRegHandler);
}

function killServiceWorker(): void {
  if (!navigator.serviceWorker) {
    console.log("[SW] can't kill: not supported");
    return;
  }

  navigator.serviceWorker.getRegistrations()
    .then((regs: readonly ServiceWorkerRegistration[]): void => {
      for (const i of regs) {
        i.unregister();
      }
    });
}

async function askNotificationPermission(): Promise<NotificationPermission | void> {
  if (window.Notification && !await canUseNotifications()) {
    return await Notification.requestPermission();
  }
}

if (localStorage.getItem("smiggins-push-notifs")) {
  canUseNotifications().then((notifs: boolean): void => {
    if (notifs) {
      initServiceWorker();
    }
  });
}
