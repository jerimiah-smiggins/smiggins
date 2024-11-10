username = document.querySelector("body").getAttribute("data-username");
share = location.href;
home = true;
url = `/api/post/user/${username}`;
type = "post";
includeUserLink = false;
includePostLink = true;
if (!logged_in) {
    dom("more-container").innerHTML = lang.generic.see_more.replaceAll("%s", `<a href="/signup">${lang.account.sign_up_title}</a>`);
}
function toggle_follow() {
    s_fetch(`/api/user/follow`, {
        method: dom("toggle").getAttribute("data-followed") === "1" ? "DELETE" : "POST",
        body: JSON.stringify({
            username: document.querySelector("body").getAttribute("data-username")
        }),
        disable: [dom("toggle")]
    });
}
function toggle_block() {
    s_fetch(`/api/user/block`, {
        method: dom("block").getAttribute("data-blocked") === "1" ? "DELETE" : "POST",
        body: JSON.stringify({
            username: document.querySelector("body").getAttribute("data-username")
        }),
        disable: [dom("block")]
    });
}
function createMessage() {
    fetch("/api/messages/new", {
        method: "POST",
        body: JSON.stringify({
            username: username
        })
    }).then((response) => response.json())
        .then((json) => {
        if (json.success) {
            location.href = `/m/${username}`;
        }
        else {
            showlog(`${lang.generic.something_went_wrong} ${lang.generic.reason.replaceAll("%s", json.reason)}`);
        }
    });
}
