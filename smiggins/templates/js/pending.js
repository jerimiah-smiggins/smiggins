home = true;
offset = -1;
function refreshPendingList(fromStart = false) {
    if (fromStart) {
        offset = -1;
        dom("user-list").innerHTML = "";
    }
    else {
        offset++;
        if (!offset) {
            offset++;
        }
    }
    s_fetch(`/api/user/pending?offset=${offset}`, {
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
        }
    });
}
refreshPendingList(true);
