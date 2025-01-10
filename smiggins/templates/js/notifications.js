home = true;
timelineConfig.disableTimeline = true;
function refreshNotifications() {
    dom("notif-container").innerHTML = "";
    s_fetch("/api/user/notifications", {
        disable: [dom("refresh")]
    });
}
dom("read").addEventListener("click", function () {
    s_fetch("/api/user/notifications", {
        method: "PATCH",
        disable: [dom("read")]
    });
});
dom("delete-unread").addEventListener("click", function () {
    s_fetch("/api/user/notifications", {
        method: "DELETE",
        disable: [dom("delete-unread")]
    });
});
dom("refresh").addEventListener("click", refreshNotifications);
refreshNotifications();
