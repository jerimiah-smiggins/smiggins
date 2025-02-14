function refreshPendingList(fromStart = false) {
    if (fromStart) {
        timelineConfig.vars.offset = -1;
        dom("user-list").innerHTML = "";
    }
    else {
        timelineConfig.vars.offset++;
        if (!timelineConfig.vars.offset) {
            timelineConfig.vars.offset++;
        }
    }
    s_fetch(`/api/user/pending?offset=${timelineConfig.vars.offset}`, {
        disable: [dom("refresh"), dom("more")]
    });
}
function _followAction(username, method) {
    s_fetch("/api/user/pending", {
        method: method,
        body: JSON.stringify({
            username: username
        })
    });
}
function block(username) {
    s_fetch(`/api/user/block`, {
        method: "POST",
        body: JSON.stringify({
            username: username
        }),
        postFunction: (success) => {
            refreshPendingList(true);
            getNotifications();
        }
    });
}
function pendingInit() {
    timelineConfig.vars.offset = -1;
    refreshPendingList(true);
}
