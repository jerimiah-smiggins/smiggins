// on notification event on main, update badge
// if closed, update badge every n minutes (15m? 1h?)
// update badge on push notification

const CAN_USE_BADGES: boolean = "clearAppBadge" in navigator && "setAppBadge" in navigator;
const BADGE_INTERVAL: number = 60 * 60 * 1000; // 1h
let badgeIntervalID: number | undefined = undefined;

function fetchBadge(): void {
  if (!CAN_USE_BADGES) { return; }

  fetch("/api/notifications")
    .then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then((ab: ArrayBuffer): Uint8Array => (new Uint8Array(ab)))
    .then((u8arr: Uint8Array): void => {
      if (u8arr[0] === 0x70) {
        updateBadge(u8arr[3]);
      }
    });
}

function updateBadge(count: number): void {
  if (!CAN_USE_BADGES) { return; }

  if (count <= 0) {
    navigator.clearAppBadge();
  } else {
    navigator.setAppBadge(count);
  }
}

function resetBadgeInterval(): void {
  clearInterval(badgeIntervalID);
  badgeIntervalID = setInterval(fetchBadge, BADGE_INTERVAL);
}

resetBadgeInterval();
