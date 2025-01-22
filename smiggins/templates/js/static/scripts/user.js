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
            username: context.username
        }),
        disable: [dom("message")]
    });
}
function userInit() {
    share = location.href;
    timelineConfig.url = `/api/post/user/${context.username}`;
    type = "post";
    includeUserLink = false;
    includePostLink = true;
    document.body.style.setProperty("--banner", context.banner_color_one);
    document.body.style.setProperty("--banner-two", context.banner_color_two);
    if (!loggedIn) {
        dom("more-container").innerHTML = lang.generic.see_more.replaceAll("%s", `<a data-link href="/signup">${lang.account.sign_up_title}</a>`);
        registerLinks(dom("more-container"));
    }
}
