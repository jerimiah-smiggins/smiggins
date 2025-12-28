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

      let register: boolean = loggedIn && Boolean(localStorage.getItem("smiggins-push-notifs")) && await canUseNotifications();

      if (!register) {
        console.log("[SW] not listening");
        return null;
      }

      const response = await fetch("/api/sw/publickey");
      const publicKey: string = await response.text();

      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });
    })
    .then(async (subscription: PushSubscription | null): Promise<void> => {
      let register: boolean = loggedIn && Boolean(localStorage.getItem("smiggins-push-notifs")) && await canUseNotifications();

      if (subscription) {
        fetch(register ? "/api/sw/register" : "/api/sw/unregister", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON())
        });

        if (!register) {
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
      console.log("[SW] failed to init", err);
    });

  console.log("[SW] attempting to init");
  navigator.serviceWorker.ready.then(swRegHandler);
  swSetLanguage();
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

function _swPostMessage(message: string): void {
  navigator.serviceWorker.ready.then((w: ServiceWorkerRegistration): void => {
    (w.active || w.waiting || w.installing)?.postMessage(message);
  });
}

function swSetLanguage(): void {
  _swPostMessage("l" + (localStorage.getItem("smiggins-language") || DEFAULT_LANGUAGE));
}

function swUpdateBadge(count: number): void {
  _swPostMessage("b" + String(count));
}

initServiceWorker();
