home = true;
offset = -1;
function refreshPendingList(fromStart = false) {
    dom("refresh").setAttribute("disabled", "");
    dom("more").setAttribute("disabled", "");
    if (fromStart) {
        offset = -1;
        dom("pending-list").innerHTML = "";
    }
    else {
        offset++;
        if (!offset) {
            offset++;
        }
    }
    fetch(`/api/user/pending?offset=${offset}`)
        .then((response) => response.json())
        .then((json) => {
        if (json.success) {
            let x = document.createDocumentFragment();
            if (json.pending.length == 0) {
                let y = document.createElement("i");
                y.innerHTML = lang.generic.none;
                x.append(y);
            }
            for (const user of json.pending) {
                let y = document.createElement("div");
                y.innerHTML = `
            <div class="post">
              <div class="upper-content">
                <a href="/u/${user.username}" class="no-underline text">
                  <div class="displ-name">
                    <div style="--color-one: ${user.color_one}; --color-two: ${user[ENABLE_GRADIENT_BANNERS && user.gradient_banner ? "color_two" : "color_one"]}" class="user-badge banner-pfp"></div>
                    ${escapeHTML(user.display_name)}
                    ${user.badges.length ? `<span aria-hidden="true" class="user-badge">${user.badges.map((icon) => (badges[icon])).join("</span> <span aria-hidden=\"true\" class=\"user-badge\">")}</span>` : ""}<br>
                    <span class="upper-lower-opacity">
                      <div class="username">@${user.username}</div>
                    </span>
                  </div>
                </a>
              </div>

              <div class="main-content">
                ${user.bio ? linkifyHtml(escapeHTML(user.bio), {
                    formatHref: {
                        mention: (href) => "/u/" + href.slice(1),
                        hashtag: (href) => "/hashtag/" + href.slice(1)
                    }
                }) : `<i>${lang.user_page.lists_no_bio}</i>`}
              </div>

              <div class="bottom-content">
                <button onclick="_followAction('${user.username}', 'POST');">${lang.user_page.pending_accept}</button>
                <button onclick="_followAction('${user.username}', 'DELETE');">${lang.user_page.pending_deny}</button>
                <button onclick="block('${user.username}');">${lang.user_page.block}</button>
              </div>
            </div>
          `;
                x.append(y);
            }
            dom("pending-list").append(x);
            dom("refresh").removeAttribute("disabled");
            dom("more").removeAttribute("disabled");
            if (json.more) {
                dom("more").removeAttribute("hidden");
            }
            else {
                dom("more").setAttribute("hidden", "");
            }
        }
    })
        .catch((err) => {
        showlog(lang.generic.something_went_wrong);
        dom("refresh").removeAttribute("disabled");
        dom("more").removeAttribute("disabled");
    });
}
function _followAction(username, method) {
    fetch("/api/user/pending", {
        method: method,
        body: JSON.stringify({
            username: username
        })
    }).then((response) => response.json())
        .then((json) => {
        if (json.success) {
            refreshPendingList(true);
        }
        else {
            showlog(lang.generic.something_went_wrong);
        }
    }).catch((err) => {
        showlog(lang.generic.something_went_wrong);
        throw err;
    });
}
function block(username) {
    fetch(`/api/user/block`, {
        method: "POST",
        body: JSON.stringify({
            username: username
        })
    }).then((response) => response.json())
        .then((json) => {
        if (json.success) {
            refreshPendingList(true);
        }
        else {
            showlog(lang.generic.something_went_wrong);
        }
    }).catch((err) => {
        showlog(lang.generic.something_went_wrong);
        throw err;
    });
}
refreshPendingList(true);
