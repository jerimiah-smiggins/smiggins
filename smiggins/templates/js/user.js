username = document.body.getAttribute("data-username");
share = location.href;
home = true;
timelineConfig.url = `/api/post/user/${username}`;
type = "post";
includeUserLink = false;
includePostLink = true;
if (!logged_in) {
    dom("more-container").innerHTML = lang.generic.see_more.replaceAll("%s", `<a href="/signup">${lang.account.sign_up_title}</a>`);
}
function toggleFollow() {
    s_fetch(`/api/user/follow`, {
        method: dom("toggle").getAttribute("data-followed") === "1" ? "DELETE" : "POST",
        body: JSON.stringify({
            username: document.querySelector("body").getAttribute("data-username")
        }),
        disable: [dom("toggle")]
    });
}
function toggleBlock() {
    s_fetch(`/api/user/block`, {
        method: dom("block").getAttribute("data-blocked") === "1" ? "DELETE" : "POST",
        body: JSON.stringify({
            username: document.querySelector("body").getAttribute("data-username")
        }),
        disable: [dom("block")]
    });
}
function createMessage() {
    s_fetch("/api/messages/new", {
        method: "POST",
        body: JSON.stringify({
            username: username
        }),
        disable: [dom("message")]
    });
}
