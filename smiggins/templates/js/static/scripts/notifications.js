function refreshNotifications() {
    dom("notif-container").innerHTML = "";
    s_fetch("/api/user/notifications", {
        disable: [dom("refresh")]
    });
}
function notificationsInit() {
    timelineConfig.disableTimeline = true;
    dom("read").addEventListener("click", function () {
        s_fetch("/api/user/notifications", {
            method: "PATCH",
            disable: [this]
        });
    });
    dom("delete-unread").addEventListener("click", function () {
        s_fetch("/api/user/notifications", {
            method: "DELETE",
            disable: [this]
        });
    });
    dom("refresh").addEventListener("click", refreshNotifications);
    refreshNotifications();
}
