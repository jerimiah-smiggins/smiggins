let end;
let lostCause;
function deletePost(postID, isComment, pageFocus) {
    s_fetch(`/api/${isComment ? "comment" : "post"}`, {
        method: "DELETE",
        body: JSON.stringify({
            id: postID
        }),
        extraData: {
            pageFocus: pageFocus
        }
    });
}
function pinPost(postID) {
    s_fetch(`/api/user/pin`, {
        method: "PATCH",
        body: JSON.stringify({
            id: postID
        })
    });
}
function unpinPost() {
    s_fetch(`/api/user/pin`, {
        method: "DELETE"
    });
}
function addQuote(postID, isComment) {
    if (typeof loggedIn !== "undefined" && !loggedIn) {
        return;
    }
    const post = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"] .quote-inputs`);
    if (post.querySelector("button")) {
        return;
    }
    let originalPost = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`);
    let originalCWEl = originalPost.querySelector(".c-warning summary .c-warning-main");
    let originalCW = originalCWEl ? originalCWEl.innerHTML : null;
    post.innerHTML = `
    <div class="quote-visibility">
      <label for="default-private-${globalIncrement}">${lang.post.type_followers_only}:</label>
      <input id="default-private-${globalIncrement}" type="checkbox" ${defaultPrivate ? "checked" : ""}><br>
    </div>
    ${conf.content_warnings ? `<input class="c-warning" ${originalCW ? `value="${escapeHTML(originalCW.startsWith("re: ") ? originalCW.slice(0, conf.max_content_warning_length) : "re: " + originalCW.slice(0, conf.max_content_warning_length - 4))}"` : ""} maxlength="${conf.max_content_warning_length}" placeholder="${lang.home.c_warning_placeholder}"><br>` : ""}
    <textarea class="post-text" data-create-post data-create-post-id="quote-post-${globalIncrement}" maxlength="${conf.max_post_length}" placeholder="${lang.home.quote_placeholders[Math.floor(Math.random() * lang.home.quote_placeholders.length)]}"></textarea><br>
    <button id="quote-post-${globalIncrement}" class="post-button">${lang.generic.post}</button>
    <button class="cancel-button">${lang.generic.cancel}</button>
  `;
    let localGI = globalIncrement;
    globalIncrement++;
    post.querySelector("button.post-button").addEventListener("click", function () {
        if (!hasContent(post.querySelector("textarea").value)) {
            return;
        }
        s_fetch("/api/quote/create", {
            method: "PUT",
            body: JSON.stringify({
                c_warning: conf.content_warnings ? post.querySelector("input.c-warning").value : "",
                content: post.querySelector("textarea").value,
                quote_id: postID,
                quote_is_comment: isComment,
                private: dom(`default-private-${localGI}`).checked
            }),
            disable: [
                post.querySelector("textarea"),
                post.querySelector("button.post-button"),
                post.querySelector("button.cancel-button"),
                conf.content_warnings && post.querySelector("input.c-warning")
            ]
        });
    });
    post.querySelector("button.cancel-button").addEventListener("click", function () {
        post.innerHTML = "";
    });
}
function toggleLike(postID, type) {
    if (typeof loggedIn !== "undefined" && !loggedIn) {
        return;
    }
    let likeButton = document.querySelector(`div[data-${type}-id="${postID}"] button.like`);
    s_fetch(`/api/${type}/like`, {
        method: likeButton.dataset["liked"] == "true" ? "DELETE" : "POST",
        body: JSON.stringify({
            id: postID
        }),
        disable: [likeButton]
    });
}
function vote(option, postID) {
    s_fetch(`/api/post/poll`, {
        method: "POST",
        body: JSON.stringify({
            id: postID,
            option: option
        })
    });
}
function showPollResults(gInc) {
    let poll = dom(`gi-${gInc}`);
    poll.innerHTML = getPollHTML(JSON.parse(poll.dataset.pollJson), +poll.dataset.pollId, gInc, true);
}
function hidePollResults(gInc) {
    let poll = dom(`gi-${gInc}`);
    poll.innerHTML = getPollHTML(JSON.parse(poll.dataset.pollJson), +poll.dataset.pollId, gInc, false);
}
function refreshPoll(gInc) {
    let poll = dom(`gi-${gInc}`);
    s_fetch(`/api/post/poll?id=${poll.dataset.pollId}`);
}
function editPost(postID, isComment, private, originalText) {
    let post = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`);
    let contentField = post.querySelectorAll(".main-area")[1];
    if (contentField.hasAttribute("data-editing")) {
        return;
    }
    contentField.setAttribute("data-editing", "");
    let oldContentField = contentField.innerHTML;
    let originalCW = contentField.querySelector("summary") ? contentField.querySelector("summary > .c-warning-main").innerText : "";
    contentField.innerHTML = `
    <label for="default-private-${globalIncrement}">${lang.post.type_followers_only}:</label>
    <input id="default-private-${globalIncrement}" type="checkbox" ${private ? "checked" : ""}><br>
    ${conf.content_warnings ? `<input class="c-warning" ${originalCW ? `value="${originalCW}"` : ""} maxlength="${conf.max_content_warning_length}" placeholder="${lang.home.c_warning_placeholder}"><br>` : ""}
    <textarea class="post-text" maxlength="${conf.max_post_length}" placeholder="${lang.home.post_input_placeholder}">${escapeHTML(atob(originalText))}</textarea><br>
    <button class="post-button">${lang.generic.post}</button>
    <button class="cancel-button">${lang.generic.cancel}</button>`;
    contentField.querySelector("textarea").focus();
    globalIncrement++;
    contentField.querySelector(".cancel-button").addEventListener("click", function () {
        contentField.innerHTML = oldContentField;
        contentField.removeAttribute("data-editing");
    });
    contentField.querySelector(".post-button").addEventListener("click", function () {
        s_fetch(`/api/${isComment ? "comment" : "post"}/edit`, {
            method: "PATCH",
            body: JSON.stringify({
                c_warning: contentField.querySelector(".c-warning").value,
                content: contentField.querySelector("textarea").value,
                private: contentField.querySelector("input[id^='default-private-'").checked,
                id: postID
            }),
            disable: [this]
        });
    });
}
function switchTimeline(event) {
    let storageID = this.dataset.storageId;
    let tl = this.dataset.timeline;
    if (storageID) {
        localStorage.setItem(storageID, tl);
    }
    if (timelineConfig.url == timelineConfig.timelines[tl].url) {
        return;
    }
    for (const el of document.querySelectorAll("#switch > a:not([href])")) {
        el.href = "javascript:void(0);";
    }
    this.removeAttribute("href");
    timelineConfig.url = timelineConfig.timelines[tl].url;
    timelineConfig.enableForwards = timelineConfig.timelines[tl].forwards;
    timelineConfig.usePages = timelineConfig.timelines[tl].pages;
    refresh();
}
function refresh(forceOffset = false) {
    if (forceOffset !== true) {
        dom("posts").innerHTML = "";
        timelineConfig.vars.first = null;
        timelineConfig.vars.forwardOffset = 0;
        lostCause = false;
    }
    s_fetch(`${timelineConfig.url}${forceOffset === true && !end ? `${timelineConfig.url.includes("?") ? "&" : "?"}offset=${timelineConfig.usePages ? timelineConfig.vars.page : timelineConfig.vars.offset}` : ""}`, {
        disable: [...document.querySelectorAll("button[onclick*='refresh(']")],
        extraData: {
            forceOffset: forceOffset
        },
        postFunction: (success) => {
            if (success && dom("up-to-date")) {
                dom("up-to-date").removeAttribute("hidden");
                dom("load-new").setAttribute("hidden", "");
                dom("refresh").setAttribute("hidden", "");
            }
        }
    });
}
function checkForwards() {
    if (!lostCause && !timelineConfig.usePages && timelineConfig.enableForwards && timelineConfig.vars.first) {
        s_fetch(`${timelineConfig.url}${timelineConfig.url.includes("?") ? "&" : "?"}forwards=true&offset=${timelineConfig.vars.first}`);
    }
}
function loadNew() {
    if (timelineConfig.forwardsHandler) {
        timelineConfig.forwardsHandler();
        return;
    }
    apiResponse({
        success: true,
        actions: [
            { name: "populate_timeline", posts: timelineConfig.vars.forwardsCache, end: false, forwards: true }
        ]
    }, {});
    timelineConfig.vars.forwardsCache = [];
    dom("up-to-date").removeAttribute("hidden");
    dom("load-new").setAttribute("hidden", "");
    dom("refresh").setAttribute("hidden", "");
}
function timelineInit() {
    end = false;
    conf.polling.timeline && killIntervals.push(setInterval(checkForwards, conf.polling.timeline));
    for (const el of document.querySelectorAll("#switch > a")) {
        el.addEventListener("click", switchTimeline);
    }
    if (typeof timelineConfig.disableTimeline === "undefined" || !timelineConfig.disableTimeline) {
        refresh();
    }
}
