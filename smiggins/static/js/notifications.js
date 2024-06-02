home = true;
disableTimeline = true;
function refreshNotifications() {
    dom("notif-container").innerHTML = "";
    fetch("/api/user/notifications")
        .then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            let x = document.createDocumentFragment();
            let yourMother = false;
            let first = true;
            for (const notif of json.notifications) {
                if (notif.data.can_view) {
                    let y = document.createElement("div");
                    if (!yourMother && notif.read) {
                        if (!first) {
                            y.innerHTML = "<hr>";
                        }
                        yourMother = true;
                    }
                    y.innerHTML += escapeHTML(lang.notifications[notif.event_type].replaceAll("%s", notif.data.creator.display_name)) + "<br>";
                    y.innerHTML += getPostHTML(notif.data, ["comment", "ping_c"].includes(notif.event_type)).replace("\"post\"", yourMother ? "\"post\" data-color='gray'" : "\"post\"");
                    x.append(y);
                    x.append(document.createElement("br"));
                    first = false;
                }
            }
            dom("notif-container").append(x);
        }
        else {
            showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.notifications.error));
        }
    }).catch((err) => {
        showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.notifications.error));
    });
}
dom("read").addEventListener("click", function () {
    fetch("/api/user/notifications", {
        "method": "DELETE"
    }).then(() => {
        refreshNotifications();
        forEach(document.querySelectorAll("[data-add-notification-dot]"), (val, index) => {
            val.classList.remove("dot");
        });
    });
});
dom("refresh").addEventListener("click", refreshNotifications);
refreshNotifications();
