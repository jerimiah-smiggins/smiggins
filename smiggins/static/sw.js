"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const CAN_USE_BADGES = "clearAppBadge" in navigator && "setAppBadge" in navigator;
const BADGE_INTERVAL = 15 * 60 * 1000;
let badgeIntervalID = undefined;
function fetchBadge() {
    if (!CAN_USE_BADGES) {
        return;
    }
    fetch("/api/notifications")
        .then((response) => (response.arrayBuffer()))
        .then((ab) => (new Uint8Array(ab)))
        .then((u8arr) => {
        if (u8arr[0] === 0x70) {
            updateBadge(u8arr[3]);
        }
    });
}
function updateBadge(count) {
    console.log(count);
    if (!CAN_USE_BADGES) {
        return;
    }
    if (count <= 0) {
        navigator.clearAppBadge();
    }
    else {
        navigator.setAppBadge(count);
    }
}
function resetBadgeInterval() {
    clearInterval(badgeIntervalID);
    badgeIntervalID = setInterval(fetchBadge, BADGE_INTERVAL);
}
resetBadgeInterval();
const sw_self = self;
sw_self.addEventListener("push", function (e) {
    e.waitUntil(handleNotification(e.data));
});
sw_self.addEventListener("message", function (e) {
    console.log("message", e.data);
    if (typeof e.data === "string") {
        switch (e.data[0]) {
            case "l": {
                L = LANGS[e.data.slice(1) || DEFAULT_LANGUAGE];
                if (!L) {
                    L = LANGS[DEFAULT_LANGUAGE];
                }
                break;
            }
            case "b": {
                resetBadgeInterval();
                updateBadge(Number(e.data.slice(1)));
                break;
            }
            case "c": {
                clearAllNotifications();
                break;
            }
        }
    }
});
console.log("[SW] init");
const LANGS = {
    "en": { "meta": { "id": "en", "name": "English", "fallbacks": [], "maintainers": [["trinkey", "trinkey"]], "past_maintainers": [] }, "notifications": { "followed": "%n (@%u) started following you.", "folreq": "%n (@%u) wants to follow you.", "comment": "%n (@%u): %c", "quote": "%n (@%u): %c", "ping": "%n (@%u): %c", "message": { "0": "%n (@%u) messaged you", "1": "%n (@%u) messaged you and %c other", "*": "%n (@%u) messaged you and %c others" }, "no_content_title": "Notification", "no_content_body": "No notification context was given." } },
    "en_GB": { "meta": { "id": "en_GB", "name": "English (United Kingdom)", "fallbacks": ["en"], "maintainers": [["trinkey", "trinkey"]], "past_maintainers": [] }, "notifications": { "followed": "%n (@%u) started following you.", "folreq": "%n (@%u) wants to follow you.", "comment": "%n (@%u): %c", "quote": "%n (@%u): %c", "ping": "%n (@%u): %c", "message": { "0": "%n (@%u) messaged you", "1": "%n (@%u) messaged you and %c other", "*": "%n (@%u) messaged you and %c others" }, "no_content_title": "Notification", "no_content_body": "No notification context was given." } },
    "es": { "meta": { "id": "es", "name": "Español", "fallbacks": ["en"], "maintainers": [["pq-on-tempe2", "pquirrel"]], "past_maintainers": [] }, "notifications": { "followed": "%n (@%u) ahora te sigue.", "folreq": "%n (@%u) te quiere seguir.", "comment": "%n (@%u): %c", "quote": "%n (@%u): %c", "ping": "%n (@%u): %c", "message": { "0": "%n (@%u) te envió un mensaje.", "1": "%n (@%u) les envió un mensaje a ti y %c otro.", "*": "%n (@%u) les envió un mensaje a ti y %c otros." }, "no_content_title": "Notificación", "no_content_body": "No hay contexto para esta notificación." } },
};
const DEFAULT_LANGUAGE = "en";
let L;
L = LANGS[DEFAULT_LANGUAGE];
function canUseNotifications() {
    return __awaiter(this, void 0, void 0, function* () {
        const perms = yield navigator.permissions.query({
            name: "notifications"
        });
        return (perms.state === "granted");
    });
}
function handleNotification(data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!canUseNotifications()) {
            console.log("[SW] recieved message but can't show notif");
        }
        let content = (data === null || data === void 0 ? void 0 : data.text().split(";")) || [L.notifications.no_content_title, "none", "", L.notifications.no_content_body];
        let siteName = content[0];
        let badges = Number(content[1]);
        let type = content[2];
        let event = content[3];
        let additionalData = JSON.parse(content.slice(4).join(";"));
        let body = String(additionalData);
        resetBadgeInterval();
        updateBadge(badges);
        if (type === "none") {
            return;
        }
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
    });
}
function clearAllNotifications() {
    return __awaiter(this, void 0, void 0, function* () {
        let notifs = yield sw_self.registration.getNotifications();
        console.log("[SW] clearing notifications");
        for (const notif of notifs) {
            notif.close();
        }
    });
}
sw_self.addEventListener("notificationclick", function (e) {
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
function lr(str, replacements) {
    let values = {};
    for (const [key, _] of Object.entries(replacements)) {
        values[key] = `TEMP_${Math.random()}`;
        str = str.replaceAll("%" + key, values[key]);
    }
    for (const [key, val] of Object.entries(replacements)) {
        str = str.replaceAll(values[key], val);
    }
    return str;
}
function n(data, num) {
    if (data[num]) {
        return data[num];
    }
    return data["*"];
}
