username = document.querySelector("body").getAttribute("data-username");
share = location.href;
home = true;
url = `/api/post/user/${username}`;
type = "post";
includeUserLink = false;
includePostLink = true;
function extra(json) {
    ENABLE_USER_BIOS && dom("user-bio").removeAttribute("hidden");
    ENABLE_USER_BIOS && (dom("user-bio").innerHTML = linkifyHtml(escapeHTML(json.bio), {
        formatHref: {
            mention: (href) => "/u" + href,
            hashtag: (href) => "/hashtag/" + href.slice(1)
        }
    }));
    if (json.pinned && json.pinned.content) {
        dom("pinned").innerHTML = getPostHTML(json.pinned, false, false, true, false, false, true) + "<hr>";
    }
    else {
        dom("pinned").innerHTML = "";
    }
    if (!json.can_view) {
        dom("toggle").setAttribute("hidden", "");
    }
    dom("follow").innerText = `${lang.user_page.followers.replaceAll("%s", json.followers)} - ${lang.user_page.following.replaceAll("%s", json.following)}`;
}
if (!logged_in) {
    dom("more-container").innerHTML = lang.generic.see_more.replaceAll("%s", `<a href="/signup">${lang.account.sign_up_title}</a>`);
}
function toggle_follow() {
    let x = dom("toggle").getAttribute("data-followed") === "1";
    fetch(`/api/user/follower`, {
        method: x ? "DELETE" : "POST",
        body: JSON.stringify({
            username: document.querySelector("body").getAttribute("data-username")
        })
    })
        .then((response) => (response.json()))
        .then((json) => {
        dom("toggle").setAttribute("data-followed", x ? "0" : "1");
        dom("toggle").innerText = x ? lang.user_page.follow : lang.user_page.unfollow;
    })
        .catch((err) => {
        showlog(lang.generic.something_went_wrong, 5000);
    });
}
function toggle_block() {
    let x = dom("block").getAttribute("data-blocked") === "1";
    fetch(`/api/user/block`, {
        method: x ? "DELETE" : "POST",
        body: JSON.stringify({
            username: document.querySelector("body").getAttribute("data-username")
        })
    })
        .then((response) => (response.json()))
        .then((json) => {
        dom("block").setAttribute("data-blocked", x ? "0" : "1");
        dom("block").innerText = x ? lang.user_page.block : lang.user_page.unblock;
    })
        .catch((err) => {
        showlog(lang.generic.something_went_wrong, 5000);
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
