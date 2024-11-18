let end = false;
offset = null;
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
    if (typeof logged_in !== "undefined" && !logged_in) {
        return;
    }
    const post = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"] .post-after`);
    if (post.querySelector("button")) {
        return;
    }
    let c = 0;
    let originalPost = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`);
    let originalCWEl = originalPost.querySelector(".c-warning summary .c-warning-main");
    let originalCW = originalCWEl ? originalCWEl.innerHTML : null;
    post.innerHTML = `
    <div class="log"></div>
    <div class="quote-visibility">
      <label for="default-private-${globalIncrement}">${lang.post.type_followers_only}:</label>
      <input id="default-private-${globalIncrement}" type="checkbox" ${defaultPrivate ? "checked" : ""}><br>
    </div>
    ${ENABLE_CONTENT_WARNINGS ? `<label><input class="c-warning" ${originalCW ? `value="re: ${escapeHTML(originalCW.slice(0, MAX_CONTENT_WARNING_LENGTH - 4))}"` : ""} maxlength="${MAX_CONTENT_WARNING_LENGTH}" placeholder="${lang.home.c_warning_placeholder}"></label><br>` : ""}
    <label><textarea class="post-text" maxlength="${MAX_POST_LENGTH}" placeholder="${lang.home.quote_placeholders[Math.floor(Math.random() * lang.home.quote_placeholders.length)]}"></textarea></label><br>
    <button class="post-button inverted">${lang.generic.post}</button>
    <button class="cancel-button inverted">${lang.generic.cancel}</button>
  `;
    let localGI = globalIncrement;
    globalIncrement++;
    post.querySelector("button.post-button").addEventListener("click", function () {
        if (!post.querySelector("textarea").value.length) {
            return;
        }
        s_fetch("/api/quote/create", {
            method: "PUT",
            body: JSON.stringify({
                c_warning: ENABLE_CONTENT_WARNINGS ? post.querySelector("input.c-warning").value : "",
                content: post.querySelector("textarea").value,
                quote_id: postID,
                quote_is_comment: isComment,
                private: dom(`default-private-${localGI}`).checked
            }),
            disable: [
                post.querySelector("textarea"),
                post.querySelector("button.post-button"),
                post.querySelector("button.cancel-button"),
                ENABLE_CONTENT_WARNINGS && post.querySelector("input.c-warning")
            ]
        });
    });
    post.querySelector("textarea").addEventListener("input", postTextInputEvent);
    post.querySelector("button.cancel-button").addEventListener("click", function () {
        post.innerHTML = "";
    });
}
function toggleLike(postID, type) {
    if (typeof logged_in !== "undefined" && !logged_in) {
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
    s_fetch("/api/post/poll", {
        method: "POST",
        body: JSON.stringify({
            id: postID,
            option: option
        })
    });
}
function showPollResults(gInc) {
    let poll = dom(`gi-${gInc}`);
    poll.innerHTML = getPollHTML(JSON.parse(poll.dataset.pollJson), +poll.dataset.pollId, gInc, true, poll.dataset.pollLoggedIn == "true");
}
function hidePollResults(gInc) {
    let poll = dom(`gi-${gInc}`);
    poll.innerHTML = getPollHTML(JSON.parse(poll.dataset.pollJson), +poll.dataset.pollId, gInc, false, poll.dataset.pollLoggedIn == "true");
}
function refreshPoll(gInc) {
    let poll = dom(`gi-${gInc}`);
    fetch(`/api/post/poll?id=${poll.dataset.pollId}`)
        .then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            let pollJSON = JSON.parse(poll.dataset.pollJson);
            let sum = 0;
            for (let i = 0; i < json.votes.length; i++) {
                pollJSON.content[i].votes = json.votes[i];
                sum += json.votes[i];
            }
            pollJSON.votes = sum;
            poll.dataset.pollJson = JSON.stringify(pollJSON);
            poll.innerHTML = getPollHTML(pollJSON, +poll.dataset.pollId, gInc, true, poll.dataset.pollLoggedIn == "true");
        }
        else {
            showlog(lang.generic.something_went_wrong);
        }
    })
        .catch((err) => {
        showlog(lang.generic.something_went_wrong);
    });
}
function editPost(postID, isComment, private, originalText) {
    let post = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`);
    let contentField = post.querySelectorAll(".main-area")[1];
    let oldContentField = contentField.innerHTML;
    let originalCW = contentField.querySelector("summary") ? contentField.querySelector("summary > .c-warning-main").innerText : "";
    contentField.innerHTML = `
    <div class="log"></div>
    <div class="quote-visibility">
      <label for="default-private-${globalIncrement}">${lang.post.type_followers_only}:</label>
      <input id="default-private-${globalIncrement}" type="checkbox" ${private ? "checked" : ""}><br>
    </div>
    ${ENABLE_CONTENT_WARNINGS ? `<label><input class="c-warning" ${originalCW ? `value="${originalCW}"` : ""} maxlength="${MAX_CONTENT_WARNING_LENGTH}" placeholder="${lang.home.c_warning_placeholder}"></label><br>` : ""}
    <label><textarea class="post-text" maxlength="${MAX_POST_LENGTH}" placeholder="${lang.home.post_input_placeholder}">${escapeHTML(originalText)}</textarea></label><br>
    <button class="post-button inverted">${lang.generic.post}</button>
    <button class="cancel-button inverted">${lang.generic.cancel}</button>`;
    contentField.querySelector("textarea").focus();
    globalIncrement++;
    contentField.querySelector(".cancel-button").addEventListener("click", function () {
        contentField.innerHTML = oldContentField;
    });
    contentField.querySelector(".post-button").addEventListener("click", function () {
        s_fetch(`/api/${isComment ? "comment" : "post"}/edit`, {
            method: "PATCH",
            body: JSON.stringify({
                c_warning: contentField.querySelector(".c-warning").value,
                content: contentField.querySelector("textarea").value,
                private: contentField.querySelector(".quote-visibility input").checked,
                id: postID
            }),
            disable: [this]
        });
    });
}
if (typeof disableTimeline === "undefined" || !disableTimeline) {
    function refresh(forceOffset = false) {
        if (forceOffset !== true) {
            dom("posts").innerHTML = "";
        }
        s_fetch(`${url}${forceOffset === true && !end ? `${url.includes("?") ? "&" : "?"}offset=${offset}` : ""}`, {
            disable: [...document.querySelectorAll("button[onclick*='refresh(']")],
            extraData: {
                forceOffset: forceOffset
            }
        });
    }
    refresh();
}
