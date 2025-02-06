let profile;
let share;
let type;
let includeUserLink;
let includePostLink;
let inc;
let c;
let onLoad;
let redirectConfirmation;
let killIntervals = [];
let timelineConfig = {
    vars: { offset: null, offsetC: 0 },
    timelines: {},
    url: null,
    disableTimeline: false,
    useOffsetC: false
};
let globalIncrement = 0;
function dom(id) {
    return document.getElementById(id);
}
function s_fetch(url, data) {
    data = data || {};
    data.method = data.method || "GET";
    data.disable = data.disable || [];
    for (const el of data.disable) {
        if (el === false || el === null) {
            continue;
        }
        let element;
        if (typeof el == "string") {
            element = document.querySelector(el);
        }
        else {
            element = el;
        }
        if (element) {
            element.disabled = true;
        }
    }
    let success;
    fetch(url, {
        method: data.method,
        body: data.body
    }).then((response) => (response.json()))
        .then((json) => {
        apiResponse(json, data.extraData);
        success = json.success;
    })
        .catch((err) => {
        toast(lang.generic.something_went_wrong, true);
        console.error(err);
        success = null;
    })
        .finally(() => {
        for (const el of data.disable) {
            if (el === false || el === null) {
                continue;
            }
            let element;
            if (typeof el == "string") {
                element = document.querySelector(el);
            }
            else {
                element = el;
            }
            if (element) {
                element.disabled = false;
            }
        }
        if (typeof data.postFunction == "function") {
            try {
                data.postFunction(success);
            }
            catch (err) {
                console.error("Request post function error", err);
            }
        }
    });
}
function apiResponse(json, extraData) {
    if (json.message) {
        toast(json.message, !json.success);
    }
    else if (!json.success) {
        toast(lang.generic.something_went_wrong, true);
    }
    if (!json.actions) {
        return;
    }
    for (const action of json.actions) {
        if (action.name == "populate_timeline") {
            if (!extraData.forceOffset) {
                timelineConfig.vars.offsetC = 0;
                if (!action.posts.length) {
                    dom("posts").innerHTML = `<i data-no-posts>${escapeHTML(lang.post.no_posts)}</i>`;
                }
            }
            timelineConfig.vars.offsetC++;
            let output = "";
            for (const post of action.posts) {
                output += getPostHTML(post, type == "comment", includeUserLink, includePostLink, false, false, false);
                timelineConfig.vars.offset = post.post_id;
            }
            if (action.extra && action.extra.type == "user") {
                conf.user_bios && dom("user-bio").removeAttribute("hidden");
                conf.user_bios && (dom("user-bio").innerHTML = linkifyHtml(escapeHTML(action.extra.bio), {
                    formatHref: {
                        mention: (href) => "/u/" + href.slice(1),
                        hashtag: (href) => "/hashtag/" + href.slice(1)
                    }
                }));
                if (action.extra.pinned && action.extra.pinned.visible && action.extra.pinned.content) {
                    dom("pinned").innerHTML = getPostHTML(action.extra.pinned, false, false, true, false, false, true) + "<hr>";
                    registerLinks(dom("pinned"));
                }
                else {
                    dom("pinned").innerHTML = "";
                }
                dom("follow").innerText = `${lang.user_page.followers.replaceAll("%s", action.extra.followers)} - ${lang.user_page.following.replaceAll("%s", action.extra.following)}`;
            }
            dom("posts").insertAdjacentHTML("beforeend", output);
            registerLinks(dom("posts"));
            if (dom("more")) {
                if (extraData.forceOffset !== true) {
                    dom("more").removeAttribute("hidden");
                }
                if (action.end) {
                    dom("more").setAttribute("hidden", "");
                }
                else {
                    dom("more").removeAttribute("hidden");
                }
            }
        }
        else if (action.name == "prepend_timeline") {
            if (dom("posts")) {
                dom("posts").insertAdjacentHTML("afterbegin", getPostHTML(action.post, action.comment));
                registerLinks(dom("posts"));
            }
        }
        else if (action.name == "reset_post_html") {
            let post = document.querySelector(`[data-${action.comment ? "comment" : "post"}-id="${action.post_id}"]`);
            let postSettings = JSON.parse(post.querySelector(".post").getAttribute("data-settings"));
            post.innerHTML = getPostHTML(action.post, postSettings.isComment, postSettings.includeUserLink, postSettings.includePostLink, postSettings.fakeMentions, postSettings.pageFocus, postSettings.isPinned, false);
            registerLinks(post);
        }
        else if (action.name == "remove_from_timeline") {
            if (extraData.pageFocus) {
                redirect("/");
            }
            else {
                document.querySelector(`.post-container[data-${action.comment ? "comment" : "post"}-id="${action.post_id}"]`).remove();
            }
        }
        else if (action.name == "refresh_notifications") {
            getNotifications();
        }
        else if (action.name == "refresh_timeline") {
            let rfFunc = action.special == "notifications" ? refreshNotifications : action.special == "pending" ? refreshPendingList : action.special == "message" ? refreshMessages : refresh;
            if (action.url_includes) {
                for (const url of action.url_includes) {
                    if (location.href.includes(url)) {
                        if (action.special == "pending") {
                            rfFunc(true);
                        }
                        else {
                            rfFunc();
                        }
                        break;
                    }
                }
            }
            else {
                if (action.special == "pending") {
                    rfFunc(true);
                }
                else if (action.special == "message") {
                    if (dom("messages-go-here-btw").innerText == "") {
                        rfFunc(true);
                    }
                    else {
                        rfFunc(false, false);
                    }
                }
                else {
                    rfFunc();
                }
            }
        }
        else if (action.name == "user_timeline") {
            let x = document.createDocumentFragment();
            if (action.users.length == 0) {
                let y = document.createElement("i");
                y.innerHTML = lang.generic.none;
                x.append(y);
            }
            for (const user of action.users) {
                let y = document.createElement("div");
                y.innerHTML = `
          <div class="post" ${user.unread === undefined || user.unread ? "" : "data-color=\"gray\""}>
            <div class="upper-content">
              <a data-link href="/u/${user.username}" class="no-underline text">
                <div class="displ-name pre-wrap"
                  ><div style="--color-one: ${user.color_one}; --color-two: ${user[conf.gradient_banners && user.gradient_banner ? "color_two" : "color_one"]}" class="user-badge banner-pfp"></div
                  > ${escapeHTML(user.display_name)} ${user.badges.length && conf.badges ? `<span aria-hidden="true" class="user-badge">${user.badges.map((icon) => (badges[icon])).join("</span> <span aria-hidden=\"true\" class=\"user-badge\">")}</span>` : ""}</div>
                <div class="upper-lower-opacity">
                  <div class="username">@${user.username}</div>
                  ${user.timestamp ? `- <div class="username">${timeSince(user.timestamp)}</div>` : ""}
                </div>
              </a>
            </div>

            <div class="main-content class="pre-wrap">${action.special == "messages" ? `
                <a data-link class="no-underline text" href="/m/${user.username}">
                  ${escapeHTML(user.bio) || `<i>${lang.messages.no_messages}</i>`}
                </a>
              ` : (user.bio ? linkifyHtml(escapeHTML(user.bio), {
                    formatHref: {
                        mention: (href) => "/u/" + href.slice(1),
                        hashtag: (href) => "/hashtag/" + href.slice(1)
                    }
                }) : `<i>${lang.user_page.lists_no_bio}</i>`)}</div>

            ${action.special == "pending" ? `<div class="bottom-content">
                <button onclick="_followAction('${user.username}', 'POST');">${lang.user_page.pending_accept}</button>
                <button onclick="_followAction('${user.username}', 'DELETE');">${lang.user_page.pending_deny}</button>
                <button onclick="block('${user.username}');">${lang.user_page.block}</button>
              </div>` : ""}
          </div>
        `;
                registerLinks(y);
                x.append(y);
            }
            if (action.special == "followers" || action.special == "following" || action.special == "blocking") {
                dom(action.special).append(x);
                if (action.more) {
                    dom(`${action.special}-more`).removeAttribute("hidden");
                }
                else {
                    dom(`${action.special}-more`).setAttribute("hidden", "");
                }
            }
            else {
                dom("user-list").append(x);
                if (action.more) {
                    dom("more").removeAttribute("hidden");
                }
                else {
                    dom("more").setAttribute("hidden", "");
                }
            }
        }
        else if (action.name == "notification_list") {
            let x = document.createDocumentFragment();
            let hasBeenRead = false;
            let first = true;
            for (const notif of action.notifications) {
                if (notif.data.visible) {
                    let y = document.createElement("div");
                    if (!hasBeenRead && notif.read) {
                        if (!first) {
                            y.innerHTML = "<hr data-notif-hr>";
                        }
                        hasBeenRead = true;
                    }
                    y.innerHTML += `<div class='pre-wrap'>${escapeHTML(lang.notifications.event[notif.event_type].replaceAll("%s", notif.data.creator.display_name))}</div>`;
                    y.innerHTML += getPostHTML(notif.data, ["comment", "ping_c"].includes(notif.event_type)).replace("\"post\"", hasBeenRead ? "\"post\" data-color='gray'" : "\"post\" data-notif-unread");
                    registerLinks(y);
                    x.append(y);
                    first = false;
                }
            }
            if (action.notifications.length === 0) {
                let el = document.createElement("i");
                el.innerHTML = lang.generic.none;
                x.append(el);
            }
            dom("notif-container").append(x);
        }
        else if (action.name == "admin_info") {
            dom("data-section").innerHTML = `
        ${lang.admin.modify.current} <a data-link href="/u/${action.username}"><code>@${action.username}</code></a> (${lang.admin.modify.id.replaceAll("%s", action.user_id)})<br>
        <input maxlength="300" id="data-display-name" placeholder="${lang.settings.profile_display_name_placeholder}" value="${escapeHTML(action.displ_name || "")}"><br>
        <textarea maxlength="65536" id="data-bio" placeholder="${lang.settings.profile_bio_placeholder}">${escapeHTML(action.bio || "")}</textarea><br>
        <button id="data-save" data-user-id="${action.user_id}">${lang.admin.modify.save}</button><br>
        ${conf.account_switcher && action.token ? `<button id="data-switcher" data-token="${action.token}" data-username="${action.username}">${lang.admin.modify.switcher}</button>` : ""}
      `;
            registerLinks(dom("data-section"));
            conf.account_switcher && dom("data-switcher").addEventListener("click", function () {
                let username = this.dataset.username;
                let token = this.dataset.token;
                let accounts = JSON.parse(localStorage.getItem("acc-switcher") || "[]");
                if (!accounts.includes([username, token])) {
                    accounts.push([username, token]);
                    localStorage.setItem("acc-switcher", JSON.stringify(accounts));
                }
                toast(lang.generic.success);
            });
            dom("data-save").addEventListener("click", function () {
                s_fetch("/api/admin/info", {
                    method: "PATCH",
                    body: JSON.stringify({
                        id: this.dataset.userId,
                        bio: dom("data-bio").value,
                        displ_name: dom("data-display-name").value
                    }),
                    disable: [this]
                });
            });
        }
        else if (action.name == "admin_log") {
            let output = `<table class="admin-logs bordered">
        <tr>
          <th>${lang.admin.logs.timestamp}</th>
          <th>${lang.admin.logs.action}</th>
          <th>${lang.admin.logs.who}</th>
          <th class="nowrap">${lang.admin.logs.more_info}</th>
        </tr>
      `;
            for (const line of action.content) {
                try {
                    output += `<tr>
            <td class="nowrap">${timeSince(+line.timestamp)}</td>
            <td class="nowrap">${line.type}</td>
            <td>${lang.admin.logs[line.target ? "who_format" : "who_format_single"].replaceAll(" ", "&nbsp;").replaceAll(",&nbsp;", ", ").replaceAll("%1", `<a data-link href="/u/${line.by}">@${line.by}</a>`).replaceAll("%2", `<a data-link href="/u/${line.target}">@${line.target}</a>`)}</td>
            <td>${escapeHTML(line.info)}</td>
          </tr>`;
                }
                catch (err) {
                    console.error(err);
                }
            }
            dom("admin-logs").innerHTML = output + "</table>";
            registerLinks(dom("admin-logs"));
        }
        else if (action.name == "message_list") {
            let x = document.createDocumentFragment();
            for (const message of action.messages) {
                let y = document.createElement("div");
                y.setAttribute("class", `message ${message.from_self ? "send" : "receive"}`);
                y.innerHTML = `<div class="pre-wrap">${linkifyHtml(escapeHTML(message.content), {
                    formatHref: {
                        mention: (href) => "/u/" + href.slice(1),
                        hashtag: (href) => "/hashtag/" + href.slice(1)
                    },
                })}</div><span class="timestamp">${timeSince(message.timestamp)}</span>`;
                x.append(y);
                if (action.forward || extraData.start) {
                    if (message.id < forwardOffset || forwardOffset == 0) {
                        forwardOffset = message.id;
                    }
                }
                if (!action.forward || extraData.start) {
                    if (message.id > reverseOffset || reverseOffset == 0) {
                        reverseOffset = message.id;
                    }
                }
            }
            if (action.forward) {
                if (dom("more")) {
                    dom("more").remove();
                }
                if (action.more) {
                    let y = document.createElement("button");
                    y.innerText = lang.generic.load_more;
                    y.id = "more";
                    y.setAttribute("onclick", "refreshMessages();");
                    x.append(y);
                }
                dom("messages-go-here-btw").append(x);
            }
            else {
                dom("messages-go-here-btw").prepend(x);
            }
        }
        else if (action.name == "set_auth") {
            setCookie("token", action.token);
        }
        else if (action.name == "localstorage") {
            if (action.value === null) {
                localStorage.removeItem(action.key);
            }
            else {
                localStorage.setItem(action.key, action.value);
            }
        }
        else if (action.name == "reload") {
            location.href = location.href;
            break;
        }
        else if (action.name == "redirect") {
            let url = "/";
            if (action.to == "message") {
                url = `/m/${action.extra}`;
            }
            else if (action.to == "home") {
                url = "/";
            }
            else if (action.to == "logout") {
                url = "/logout/";
            }
            redirect(url);
            break;
        }
        else if (action.name == "set_theme") {
            dom("theme-css").innerHTML = action.auto ? getThemeAuto() : getThemeCSS(action.theme);
            if (dom("theme").value == "auto") {
                !autoEnabled && autoInit();
                themeObject = null;
            }
            else {
                autoEnabled && autoCancel();
                themeObject = action.theme;
                if (!oldFavicon) {
                    setGenericFavicon();
                }
            }
        }
        else if (action.name == "update_element") {
            let iter;
            if (action.all) {
                iter = document.querySelectorAll(action.query);
            }
            else {
                iter = [document.querySelector(action.query)];
            }
            for (const el of iter) {
                if (!el) {
                    continue;
                }
                let element = el;
                if (action.inc !== undefined) {
                    element.innerHTML = String(+element.innerHTML + action.inc);
                }
                else if (action.text !== undefined) {
                    element.innerText = action.text;
                }
                else if (action.html !== undefined) {
                    element.innerHTML = action.html;
                }
                if (action.value !== undefined) {
                    element.value = action.value;
                }
                if (action.checked !== undefined) {
                    element.checked = action.checked;
                }
                if (action.disabled !== undefined) {
                    element.disabled = action.disabled;
                }
                if (action.attribute) {
                    for (const attr of action.attribute) {
                        if (attr.value === null) {
                            element.removeAttribute(attr.name);
                        }
                        else {
                            element.setAttribute(attr.name, attr.value);
                        }
                    }
                }
                if (action.set_class) {
                    for (const cls of action.set_class) {
                        if (cls.enable) {
                            element.classList.add(cls.class_name);
                        }
                        else {
                            element.classList.remove(cls.class_name);
                        }
                    }
                }
                if (action.focus !== undefined) {
                    element.focus();
                }
            }
        }
        else if (action.name == "refresh_poll") {
            let poll = document.querySelector(`[data-post-id="${action.post_id}"] [data-poll-json]`);
            poll.innerHTML = getPollHTML(action.poll, +poll.dataset.pollId, +poll.id.split("-")[1], true);
        }
        else {
            console.log(`Unknown API action`, action);
        }
    }
}
function setCookie(name, value) {
    let date = new Date();
    date.setTime(date.getTime() + (356 * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};Path=/;SameSite=Lax;Expires=${date.toUTCString()}`;
}
function eraseCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
function genericKeyboardEvent(e, func) {
    if (e.key == "Enter" || e.key == " ") {
        e.preventDefault();
        func();
    }
}
function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    ;
    let maxWord = Math.pow(2, 32);
    let result = '';
    let words = [];
    let asciiBitLength = ascii["length"] * 8;
    let hash = [];
    let k = [];
    let primeCounter = k["length"];
    let isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (let i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
        }
    }
    ascii += '\x80';
    while (ascii["length"] % 64 - 56)
        ascii += '\x00';
    for (let i = 0; i < ascii["length"]; i++) {
        let j = ascii.charCodeAt(i);
        if (j >> 8)
            return;
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words["length"]] = ((asciiBitLength / maxWord) | 0);
    words[words["length"]] = (asciiBitLength);
    for (let j = 0; j < words["length"];) {
        let w = words.slice(j, j += 16);
        let oldHash = hash;
        hash = hash.slice(0, 8);
        for (let i = 0; i < 64; i++) {
            let w15 = w[i - 15];
            let w2 = w[i - 2];
            let a = hash[0];
            let e = hash[4];
            let temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
            let temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }
        for (let i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }
    for (let i = 0; i < 8; i++) {
        for (let j = 3; j + 1; j--) {
            let b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? 0 : '') + b.toString(16);
        }
    }
    return result;
}
;
function timeSince(date, raw = false) {
    let dateObject = new Date(date * 1000);
    let dateString = `${lang.generic.time.months[dateObject.getMonth()]} ${dateObject.getDate()}, ${dateObject.getFullYear()}, ${String(dateObject.getHours()).padStart(2, "0")}:${String(dateObject.getMinutes()).padStart(2, "0")}:${String(dateObject.getSeconds()).padStart(2, "0")}`;
    let seconds = Math.floor((+(new Date()) / 1000 - date + 1));
    let unit = "second";
    let amount = seconds > 0 ? seconds : 0;
    const timeAmounts = [
        { name: "minute", amount: 60 },
        { name: "hour", amount: 3600 },
        { name: "day", amount: 86400 },
        { name: "month", amount: 2592000 },
        { name: "year", amount: 31536000 }
    ];
    for (const info of timeAmounts) {
        let interval = seconds / info.amount;
        if (interval >= 1) {
            unit = info.name;
            amount = Math.floor(interval);
        }
    }
    return raw ? dateString : `<span data-timestamp="${date}" title="${dateString}">${lang.generic.time.ago.replaceAll("%s", `${Math.floor(amount)} ${lang.generic.time[unit + (Math.floor(amount) == 1 ? "_singular" : "_plural")]}`)}</span>`;
}
function escapeHTML(str) {
    if (str === undefined) {
        return "⚠️";
    }
    return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;").replaceAll("`", "&#96;");
}
function getLinkify(content, isComment, fakeMentions, postID) {
    return linkifyHtml(escapeHTML(content), {
        formatHref: {
            mention: (href) => fakeMentions ? "javascript:void(0);" : "/u/" + href.slice(1),
            hashtag: (href) => "/hashtag/" + href.slice(1)
        }
    }).replaceAll("<a", includePostLink ? "\u2000" : "<a target=\"_blank\"")
        .replaceAll("</a>", includePostLink ? `</a><a data-link aria-hidden="true" href="/${isComment ? "c" : "p"}/${postID}" tabindex="-1" class="text no-underline">` : "</a>")
        .replaceAll("\u2000", "</a><a target=\"_blank\"")
        .replaceAll(`<a data-link aria-hidden="true" href="/${isComment ? "c" : "p"}/${postID}" tabindex="-1" class="text no-underline"></a>`, "")
        .replaceAll("<a target=\"_blank\" href=\"/", "<a data-link href=\"/")
        .replaceAll("<a target=\"_blank\" href=\"javascript:", "<a href=\"javascript:");
}
function getPollHTML(pollJSON, postID, gInc, showResults) {
    if (!pollJSON) {
        return "";
    }
    if (showResults === undefined) {
        showResults = loggedIn && pollJSON.voted;
    }
    let output = "";
    let c = 0;
    if (showResults || !loggedIn) {
        for (const option of pollJSON.content) {
            c++;
            output += `<div class="poll-bar-container">
        <div class="poll-bar ${option.voted ? "voted" : ""}">
          <div style="width: ${option.votes / pollJSON.votes * 100 || 0}%"></div>
        </div>
        <div class="poll-text">${Math.round(option.votes / pollJSON.votes * 1000) / 10 || 0}% - ${escapeHTML(option.value)}</div>
      </div>`;
        }
    }
    else {
        for (const option of pollJSON.content) {
            c++;
            output += `<div data-index="${c}"
                 data-total-votes="${pollJSON.votes}"
                 data-votes="${option.votes}"
                 class="poll-bar-container"
                 role="button"
                 onclick="vote(${c}, ${postID})"
                 onkeydown="genericKeyboardEvent(event, () => (vote(${c}, ${postID})))"
                 tabindex="0">
        <div class="poll-text">${escapeHTML(option.value)}</div>
      </div>`;
        }
    }
    return `${output}<small>
    ${(pollJSON.votes == 1 ? lang.home.poll_total_singular : lang.home.poll_total_plural).replaceAll("%s", pollJSON.votes)}
    ${!showResults ? `- <span class="poll-bottom"
      role="button"
      onclick="showPollResults(${gInc})"
      onkeydown="genericKeyboardEvent(event, () => (showPollResults(${gInc})))"
      tabindex="0">${lang.home.poll_view_results}</span>` : ""}
    ${showResults ? `- <span class="poll-bottom"
      role="button"
      onclick="refreshPoll(${gInc})"
      onkeydown="genericKeyboardEvent(event, () => (refreshPoll(${gInc})))"
      tabindex="0">${lang.generic.refresh}</span>` : ""}
    ${showResults && !pollJSON.voted ? `- <span class="poll-bottom"
      role="button"
      onclick="hidePollResults(${gInc})"
      onkeydown="genericKeyboardEvent(event, () => (hidePollResults(${gInc})))"
      tabindex="0">${lang.home.poll_hide_results}</span>` : ""}
  </small>`;
}
function getPostHTML(postJSON, isComment = false, includeUserLink = true, includePostLink = true, fakeMentions = false, pageFocus = false, isPinned = false, includeContainer = true) {
    if (!postJSON.visible) {
        return "need to do smt here at some point";
    }
    let muted = username !== postJSON.creator.username && checkMuted(postJSON.content) || (postJSON.content_warning && checkMuted(postJSON.content_warning)) || (postJSON.poll && postJSON.poll.content.map((val) => checkMuted(val.value)).reduce((real, val) => real || val));
    let quoteMuted = postJSON.quote !== null && postJSON.quote !== true && postJSON.quote.visible && username !== postJSON.quote.creator.username && (checkMuted(postJSON.quote.content) || (postJSON.quote.content_warning ? checkMuted(postJSON.quote.content_warning) : null));
    if (muted === true) {
        return "";
    }
    return `${includeContainer ? `<div class="post-container" data-${isComment ? "comment" : "post"}-id="${postJSON.post_id}">` : ""}
    <div class="post" data-settings="${escapeHTML(JSON.stringify({
        isComment: isComment,
        includeUserLink: includeUserLink,
        includePostLink: includePostLink,
        fakeMentions: fakeMentions,
        pageFocus: pageFocus,
        isPinned: isPinned
    }))}">
      ${muted ? `<details><summary class="small">${escapeHTML(lang.settings.mute.post_blocked.replaceAll("%u", postJSON.creator.username).replaceAll("%m", muted))}</summary>` : ""}
      <div class="upper-content">
        ${includeUserLink ? `<a data-link href="/u/${postJSON.creator.username}" class="no-underline text">` : "<span>"}
          <div class="main-area">
            <div class="pre-wrap displ-name-container"
              >${postJSON.edited ? `<span class="user-badge" title="${escapeHTML(timeSince(postJSON.edited, true))}">${icons.edit}</span><span class="spacing"></span>` : ""}<span class="displ-name"
              ><span style="--color-one: ${postJSON.creator.color_one}; --color-two: ${postJSON.creator[conf.gradient_banners && postJSON.creator.gradient ? "color_two" : "color_one"]}" class="user-badge banner-pfp"></span
              >${postJSON.private ? ` <span class="user-badge">${icons.lock}</span>` : ""} ${escapeHTML(postJSON.creator.display_name)} ${postJSON.creator.badges.length && conf.badges ? `<span aria-hidden="true" class="user-badge">${postJSON.creator.badges.map((icon) => (badges[icon])).join("</span> <span aria-hidden=\"true\" class=\"user-badge\">")}</span>` : ""}</span>
            </div>
            <div class="upper-lower-opacity">
              <span class="username">@${postJSON.creator.username}</span> -
              ${postJSON.creator.pronouns === null ? "" : `<span class="pronouns">${postJSON.creator.pronouns}</span> -`}
              <span class="timestamp">${timeSince(postJSON.timestamp)}</span>
            </div>
          </div>
        ${includeUserLink ? "</a>" : "</span>"}
      </div>

      <div class="main-area">
        ${postJSON.content_warning ? `<details ${localStorage.getItem("expand-cws") ? "open" : ""} class="c-warning"><summary>
          <div class="pre-wrap c-warning-main">${escapeHTML(postJSON.content_warning)}</div>
          <div class="c-warning-stats">
            (${lang.post[postJSON.content.length == 1 ? "chars_singular" : "chars_plural"].replaceAll("%c", postJSON.content.length)}${postJSON.quote ? `, ${lang.post.quote}` : ""}${postJSON.poll ? `, ${lang.home.poll}` : ""})
          </div>
        </summary>` : ""}
        <div class="main-content">
          ${includePostLink ? `<a data-link aria-hidden="true" href="/${isComment ? "c" : "p"}/${postJSON.post_id}" tabindex="-1" class="text no-underline">` : ""}
            <div class="pre-wrap">${getLinkify(postJSON.content, isComment, fakeMentions, postJSON.post_id)}</div>
          ${includePostLink ? "</a>" : ""}
        </div>

      ${postJSON.poll && typeof postJSON.poll == "object" ? (`<div
            id="gi-${globalIncrement}"
            data-poll-json="${escapeHTML(JSON.stringify(postJSON.poll))}"
            data-poll-id="${postJSON.post_id}"
            data-poll-voted="${postJSON.poll.voted}">
          ${getPollHTML(postJSON.poll, postJSON.post_id, globalIncrement++, postJSON.poll.voted)}
        </div>`) : ""}

      ${postJSON.quote ? `
          <div class="quote-area">
            <div class="post">
              ${quoteMuted === true ? `<i>${lang.settings.mute.quote_hard}</i>` : `
              ${quoteMuted ? `<details><summary class="small">${escapeHTML(lang.settings.mute.post_blocked.replaceAll("%u", postJSON.creator.username).replaceAll("%m", quoteMuted))}</summary>` : ""}
              ${postJSON.quote === true ? lang.home.quote_recursive :
        postJSON.quote.visible === false ? (postJSON.quote.reason == "blocked" ? lang.home.quote_blocked_other :
            postJSON.quote.reason == "blocking" ? lang.home.quote_blocked :
                postJSON.quote.reason == "private" ? lang.home.quote_private :
                    postJSON.quote.reason == "deleted" ? lang.home.quote_deleted : "⚠️") : `
                  <div class="upper-content">
                    <a data-link href="/u/${postJSON.quote.creator.username}" class="no-underline text">
                      <div class="main-area">
                      <div class="pre-wrap displ-name-container"
                        >${postJSON.quote.edited ? `<span class="user-badge" ${escapeHTML(timeSince(postJSON.quote.edited, true))}>${icons.edit}</span><span class="spacing"></span>` : ""}<span class="displ-name"
                        ><span style="--color-one: ${postJSON.quote.creator.color_one}; --color-two: ${postJSON.quote.creator[conf.gradient_banners && postJSON.quote.creator.gradient ? "color_two" : "color_one"]}" class="user-badge banner-pfp"></span
                        >${postJSON.quote.private ? ` <span class="user-badge">${icons.lock}</span>` : ""} ${escapeHTML(postJSON.quote.creator.display_name)} ${postJSON.quote.creator.badges.length && conf.badges ? `<span aria-hidden="true" class="user-badge">${postJSON.quote.creator.badges.map((icon) => (badges[icon])).join("</span> <span aria-hidden=\"true\" class=\"user-badge\">")}</span>` : ""}</span>
                      </div>
                        <div class="upper-lower-opacity">
                          <span class="username">@${postJSON.quote.creator.username}</span> -
                          ${postJSON.quote.creator.pronouns === null ? "" : `<span class="pronouns">${postJSON.quote.creator.pronouns}</span> -`}
                          <span class="timestamp">${timeSince(postJSON.quote.timestamp)}</span>
                        </div>
                      </div>
                    </a>
                  </div>

                  ${postJSON.quote.content_warning ? `<details ${localStorage.getItem("expand-cws") ? "open" : ""} class="c-warning"><summary>
                    <div class="c-warning-main">${escapeHTML(postJSON.quote.content_warning)}</div>
                    <div class="c-warning-stats">
                      (${lang.post[postJSON.quote.content.length == 1 ? "chars_singular" : "chars_plural"].replaceAll("%c", postJSON.quote.content.length)}${postJSON.quote.quote ? `, ${lang.post.quote}` : ""}${postJSON.quote.poll ? `, ${lang.home.poll}` : ""})
                    </div>
                  </summary>` : ""}
                  <div class="main-content">
                    <a data-link aria-hidden="true" href="/${postJSON.quote.comment ? "c" : "p"}/${postJSON.quote.post_id}" class="text no-underline">
                      <div class="pre-wrap">${getLinkify(postJSON.quote.content, postJSON.quote.comment, fakeMentions, postJSON.quote.post_id)}</div>
                      ${postJSON.quote.quote ? `<br><i>${lang.home.quote_recursive}</i>` : ""}
                      ${postJSON.quote.poll ? `<br><i>${lang.home.quote_poll}</i>` : ""}
                    </a>
                  </div>
                  ${postJSON.quote.content_warning ? `</details>` : ""}
                `}
              ${quoteMuted ? `</details>` : ""}
              `}
            </div>
          </div>
        ` : ""}
      ${postJSON.content_warning ? `</details>` : ""}
      </div>

      <div class="bottom-content">
        ${includePostLink ? `<a data-link href="/${isComment ? "c" : "p"}/${postJSON.post_id}" class="text no-underline">` : ""}
          <span class="bottom-content-icon comment-icon">${icons.comment}</span> ${postJSON.interactions.comments}
        ${includePostLink ? "</a>" : ""}
        <span class="bottom-spacing"></span>
        ${conf.quotes ? `<button class="bottom-content-icon" ${fakeMentions ? "" : `onclick="addQuote('${postJSON.post_id}', ${isComment})"`}>
            ${icons.quote}
            <span class="quote-number">${postJSON.interactions.quotes}</span>
          </button>
          <span class="bottom-spacing"></span>` : ''}

        <span class="bottom-content-icon like-secondary">
          ${icons.like}
        </span>

        <button class="bottom-content-icon like" data-liked="${postJSON.interactions.liked}" ${fakeMentions ? "" : `onclick="toggleLike(${postJSON.post_id}, ${isComment ? "'comment'" : "'post'"})"`}>
          <span class="hidden-if-unlike">${icons.like}</span>
          <span class="hidden-if-like">${icons.unlike}</span>
          <span class="like-number">${postJSON.interactions.likes}</span>
        </button>

        ${(postJSON.can.pin && conf.pinned_posts) || (postJSON.can.delete && conf.post_deletion) ? `
          <span class="bottom-spacing"></span>
          <div tabindex="0" class="bottom-content-icon more-button">${icons.more}</div>

          <div class="more-container">${postJSON.can.pin && conf.pinned_posts ? `<button class="bottom-content-icon ${isPinned && postJSON.can.pin ? "red" : ""}" onclick="${isPinned && postJSON.can.pin ? "un" : ""}pinPost(${isPinned && postJSON.can.pin ? "" : postJSON.post_id})">
              ${isPinned && postJSON.can.pin ? icons.unpin : icons.pin}
              ${isPinned && postJSON.can.pin ? lang.post.unpin : lang.post.pin}
            </button>` : ""} ${postJSON.can.delete && conf.post_deletion ? `<button class="bottom-content-icon red" onclick="deletePost(${postJSON.post_id}, ${isComment}, ${pageFocus})">
              ${icons.delete}
              ${lang.post.delete}
            </button>` : ""} ${postJSON.can.edit ? `<button class="bottom-content-icon" onclick="editPost(${postJSON.post_id}, ${isComment}, ${postJSON.private}, \`${escapeHTML(postJSON.content)}\`)">
              ${icons.edit}
              ${lang.post.edit}
            </button>` : ""}</div>` : ""}
      </div>
      <div class="quote-inputs"></div>
      ${muted ? `</details>` : ""}
    </div>
  ${includeContainer ? "</div>" : ""}`;
}
function hasContent(string) {
    const whitespace = [
        "\x09", "\x0a", "\x0b", "\x0c",
        "\x20", "\x85", "\xa0", "\u1680",
        "\u2000", "\u2001", "\u2002", "\u2003",
        "\u2004", "\u2005", "\u2006", "\u2007",
        "\u2008", "\u2009", "\u200a", "\u200b",
        "\u2028", "\u2029", "\u202f", "\u205f",
        "\u2800", "\u3000"
    ];
    for (const char of whitespace) {
        string = string.replaceAll(char, "");
    }
    return string.length !== 0;
}
function getLanguageName(code) {
    return (new Intl.DisplayNames([code, lang.meta.language], { type: "language" })).of(code);
}
function redirect(path, bypassConfirmation = false) {
    if (location.href == path || location.pathname == path) {
        return false;
    }
    if (!bypassConfirmation && redirectConfirmation && !redirectConfirmation(path)) {
        return false;
    }
    loadContext(path);
    return true;
}
function _modalKeyEvent(event) {
    if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
    }
}
function createModal(title, text, buttons = []) {
    let container;
    if (dom("modal-container")) {
        closeModal();
    }
    container = document.createElement("div");
    container.id = "modal-container";
    document.body.append(container);
    for (const el of document.querySelectorAll(":is(button, input, textarea, select):not([disabled], [data-modal-disabled])")) {
        el.setAttribute("data-modal-disabled", "");
        el.setAttribute("disabled", "");
    }
    for (const el of document.querySelectorAll("[tabindex]:not([data-modal-tabindex])")) {
        el.setAttribute("data-modal-tabindex", el.getAttribute("tabindex"));
        el.setAttribute("tabindex", "-1");
    }
    for (const el of document.querySelectorAll("a")) {
        el.setAttribute("data-modal-anchor", el.getAttribute("href"));
        el.setAttribute("href", "javascript:void(0);");
        if (!el.getAttribute("tabindex")) {
            el.setAttribute("tabindex", "-1");
        }
    }
    document.addEventListener("keydown", _modalKeyEvent);
    let buttonHTML = "";
    for (const button of buttons) {
        buttonHTML += `<button class="${button.class}">${button.name}</button>`;
    }
    container.innerHTML = `<div id="modal"><h1>${title}</h1><p>${text}</p><div id="modal-buttons">${buttonHTML}</div></div>`;
    let buttonsQSA = document.querySelectorAll("#modal-buttons > button");
    for (let i = 0; i < buttons.length; i++) {
        buttonsQSA[i].addEventListener("click", buttons[i].onclick);
    }
}
function closeModal() {
    for (const el of document.querySelectorAll("[data-modal-disabled")) {
        el.removeAttribute("disabled");
        el.removeAttribute("data-modal-disabled");
    }
    for (const el of document.querySelectorAll("[data-modal-tabindex")) {
        el.setAttribute("tabindex", el.getAttribute("data-modal-tabindex"));
        el.removeAttribute("data-modal-tabindex");
    }
    for (const el of document.querySelectorAll("a")) {
        el.setAttribute("href", el.getAttribute("data-modal-anchor"));
        el.removeAttribute("data-modal-anchor");
        if (el.getAttribute("tabindex") == "-1") {
            el.removeAttribute("tabindex");
        }
    }
    dom("modal-container").remove();
    document.removeEventListener("keydown", _modalKeyEvent);
}
function toast(message, warning = false, timeout = 3000) {
    let x = document.createElement("div");
    let gInc = globalIncrement;
    globalIncrement++;
    x.classList.add("toast");
    x.innerText = message;
    x.id = `gi-${gInc}`;
    if (warning) {
        x.classList.add("warning");
    }
    dom("toast").append(x);
    setTimeout(() => {
        dom(`gi-${gInc}`).remove();
    }, timeout);
}
function checkMuted(text) {
    if (!muted) {
        return null;
    }
    for (const word of muted) {
        let wordSegments = word[0].slice(1).split("/");
        try {
            let regex;
            if (word[1]) {
                regex = new RegExp(`${wordSegments.slice(0, wordSegments.length - 1).join("/")}`, wordSegments[wordSegments.length - 1]);
            }
            else {
                regex = new RegExp(`\\b${word[0].replaceAll(" ", "\\b.+\\b")}\\b`, "uis");
            }
            if (regex.test(text)) {
                return word[2] || word[0];
            }
        }
        catch (err) {
            console.warn("Unable to parse muted word", word[0], word[1], wordSegments[wordSegments.length - 1]);
        }
    }
    return null;
}
function forEach(iter, callback) {
    let out = [];
    for (let i = 0; i < iter.length; i++) {
        out.push(callback(iter[i], i));
    }
    return out;
}
setInterval(function () {
    forEach(document.querySelectorAll("[data-timestamp]"), (val, index) => {
        val.innerHTML = timeSince(Number(val.dataset.timestamp));
    });
}, 5000);
