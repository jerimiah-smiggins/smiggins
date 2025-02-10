function notificationsForwardHandler() {
    apiResponse({
        success: true,
        actions: [
            { name: "notification_list", notifications: timelineConfig.vars.forwardsCache, end: false, forwards: true }
        ]
    }, {});
    timelineConfig.vars.forwardsCache = [];
    dom("load-new").setAttribute("hidden", "");
    dom("refresh").removeAttribute("hidden");
}
function notificationsInit() {
    timelineConfig.url = "/api/user/notifications";
    timelineConfig.enableForwards = true;
    timelineConfig.forwardsHandler = notificationsForwardHandler;
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
}
