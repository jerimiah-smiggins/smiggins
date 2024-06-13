let end = false;
offset = null;
function showlog(str, time = 3000) {
    inc++;
    dom("error").innerText = str;
    setTimeout(() => {
        --inc;
        if (!inc) {
            dom("error").innerText = "";
        }
    }, time);
}
;
function deletePost(postId, isComment, pageFocus) {
    fetch(`/api/${isComment ? "comment" : "post"}`, {
        method: "DELETE",
        body: JSON.stringify({
            "id": postId
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            if (pageFocus) {
                window.location.href = "/home";
            }
            else {
                document.querySelector(`.post-container[data-${isComment ? "comment" : "post"}-id="${postId}"]`).remove();
            }
        }
    });
}
function pinPost(postID) {
    fetch(`/api/user/pin`, {
        "method": "PATCH",
        "body": JSON.stringify({
            "id": postID
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            if (window.location.href.includes("/u/")) {
                refresh();
            }
            else {
                showlog(lang.generic.success);
            }
        }
        else {
            showlog(lang.generic.something_went_wrong);
        }
    });
}
function unpinPost() {
    fetch(`/api/user/pin`, {
        "method": "DELETE",
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            refresh();
        }
        else {
            showlog(lang.generic.something_went_wrong);
        }
    });
}
function addQuote(postID, isComment) {
    if (typeof logged_in !== "undefined" && !logged_in) {
        return;
    }
    const post = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`).querySelector(".post-after");
    if (post.querySelector("button")) {
        return;
    }
    let c = 0;
    post.innerHTML = `
    <div class="log"></div>
    <textarea class="post-text" maxlength="${MAX_POST_LENGTH}" placeholder="${lang.home.quote_placeholders[Math.floor(Math.random() * lang.home.quote_placeholders.length)]}"></textarea><br>
    <button class="post-button inverted">${lang.generic.post}</button>
    <button class="cancel-button inverted">${lang.generic.cancel}</button>
  `;
    post.querySelector("button.post-button").addEventListener("click", function () {
        if (!post.querySelector("textarea").value.length) {
            return;
        }
        post.querySelector("textarea").setAttribute("disabled", "");
        post.querySelector("button.post-button").setAttribute("disabled", "");
        post.querySelector("button.cancel-button").setAttribute("disabled", "");
        fetch("/api/quote/create", {
            method: "PUT",
            body: JSON.stringify({
                content: post.querySelector("textarea").value,
                quote_id: postID,
                quote_is_comment: isComment
            })
        }).then((response) => (response.json()))
            .then((json) => {
            if (json.success) {
                post.innerHTML = "";
                refresh();
            }
            else {
                post.querySelector(".log").innerText = json.reason;
                c++;
                setTimeout(function () {
                    --c;
                    if (!c) {
                        post.querySelector(".log").innerText = "";
                    }
                });
                throw json.reason;
            }
        }).catch((err) => {
            post.querySelector("textarea").removeAttribute("disabled");
            post.querySelector("button.post-button").removeAttribute("disabled");
            post.querySelector("button.cancel-button").removeAttribute("disabled");
        });
    });
    post.querySelector("textarea").addEventListener("input", postTextInputEvent);
    post.querySelector("button.cancel-button").addEventListener("click", function () {
        post.innerHTML = "";
    });
}
function toggleLike(postId, type) {
    if (typeof logged_in !== "undefined" && !logged_in) {
        return;
    }
    let q = document.querySelector(`div[data-${type}-id="${postId}"] span.like-number`);
    let h = document.querySelector(`div[data-${type}-id="${postId}"] button.like`);
    let x = document.querySelector(`div[data-${type}-id="${postId}"] button.like svg`);
    if (h.dataset["liked"] == "true") {
        fetch(`/api/${type}/like`, {
            "method": "DELETE",
            "body": JSON.stringify({
                id: postId
            })
        });
        h.setAttribute("data-liked", "false");
        x.innerHTML = icons.unlike;
        q.innerHTML = String(+q.innerHTML - 1);
    }
    else {
        fetch(`/api/${type}/like`, {
            "method": "POST",
            "body": JSON.stringify({
                id: postId
            })
        });
        h.setAttribute("data-liked", "true");
        x.innerHTML = icons.like;
        q.innerHTML = String(+q.innerHTML + 1);
    }
}
function vote(option, postID, gInc) {
    fetch("/api/post/vote", {
        "method": "POST",
        "body": JSON.stringify({
            id: postID,
            option: option
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            let v;
            forEach(dom(`gi-${gInc}`).querySelectorAll(".poll-bar-container"), function (val, index) {
                let el = val;
                let isVoted = +el.dataset.index == option;
                v = el;
                val.innerHTML = `<div class="poll-bar ${isVoted ? "voted" : ""}">
            <div style="width:${(+el.dataset.votes + (isVoted ? 1 : 0)) / (+el.dataset.totalVotes + 1) * 100}%">
              🥖
            </div>
          </div>
          <div class="poll-text">
            ${Math.round(((+el.dataset.votes + (isVoted ? 1 : 0))) / (+el.dataset.totalVotes + 1) * 1000) / 10}% - ` + val.innerHTML.replace('<div class="poll-text">', "");
            });
            dom(`gi-${gInc}`).querySelector("small").innerHTML = (+v.dataset.totalVotes ? lang.home.poll_total_plural : lang.home.poll_total_singular).replaceAll("%s", +v.dataset.totalVotes + 1);
        }
    });
}
if (typeof disableTimeline === 'undefined' || !disableTimeline) {
    function refresh(force_offset = false) {
        c++;
        if (force_offset !== true) {
            dom("posts").innerHTML = "";
        }
        fetch(`${url}${force_offset === true && !end ? `${url.includes("?") ? "&" : "?"}offset=${offset}` : ""}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then((response) => (response.json()))
            .then((json) => {
            --c;
            if (c) {
                return;
            }
            end = json.end;
            let output = "";
            for (const post of json.posts) {
                output += getPostHTML(post, type == "comment", includeUserLink, includePostLink, false, false, false);
                offset = post.post_id;
            }
            if (typeof extra !== "undefined") {
                extra(json);
            }
            let x = document.createElement("div");
            x.innerHTML = output;
            dom("posts").append(x);
            if (dom("more")) {
                if (force_offset !== true) {
                    dom("more").removeAttribute("hidden");
                }
                if (json.end) {
                    dom("more").setAttribute("hidden", "");
                }
                else {
                    dom("more").removeAttribute("hidden");
                }
            }
        })
            .catch((err) => {
            --c;
            showlog(lang.generic.something_went_wrong, 5000);
            throw err;
        });
    }
    refresh();
}
