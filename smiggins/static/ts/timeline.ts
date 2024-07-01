let end: boolean = false;
offset = null;

// @ts-ignore
function showlog(str: string, time: number = 3000): void {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => {
    --inc;
    if (!inc) {
      dom("error").innerText = "";
    }
  }, time);
};

function deletePost(postId: number, isComment: boolean, pageFocus: boolean): void {
  fetch(`/api/${isComment ? "comment" : "post"}`, {
    method: "DELETE",
    body: JSON.stringify({
      id: postId
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      success: boolean
    }) => {
      if (json.success) {
        if (pageFocus) {
          window.location.href = "/home";
        } else {
          document.querySelector(`.post-container[data-${isComment ? "comment" : "post"}-id="${postId}"]`).remove();
        }
      }
    });
}

function pinPost(postID: number): void {
  fetch(`/api/user/pin`, {
    method: "PATCH",
    body: JSON.stringify({
      id: postID
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      success: boolean
    }) => {
      if (json.success) {
        if (window.location.href.includes("/u/")) {
          refresh();
        } else {
          showlog(lang.generic.success);
        }
      } else {
        showlog(lang.generic.something_went_wrong);
      }
    });
}

function unpinPost(): void {
  fetch(`/api/user/pin`, {
    method: "DELETE",
  }).then((response: Response) => (response.json()))
    .then((json: {
      success: boolean
    }) => {
      if (json.success) {
        refresh();
      } else {
        showlog(lang.generic.something_went_wrong);
      }
    });
}

function addQuote(postID: number, isComment: boolean): void {
  if (typeof logged_in !== "undefined" && !logged_in) { return; }

  const post: Element = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`).querySelector(".post-after");
  if (post.querySelector("button")) { return; }

  let c: number = 0;

  post.innerHTML = `
    <div class="log"></div>
    <textarea class="post-text" maxlength="${MAX_POST_LENGTH}" placeholder="${lang.home.quote_placeholders[Math.floor(Math.random() * lang.home.quote_placeholders.length)]}"></textarea><br>
    <button class="post-button inverted">${lang.generic.post}</button>
    <button class="cancel-button inverted">${lang.generic.cancel}</button>
  `;

  post.querySelector("button.post-button").addEventListener("click", function(): void {
    if (!post.querySelector("textarea").value.length) { return; }

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
    }).then((response: Response) => (response.json()))
      .then((json: {
        post: _postJSON,
        reason?: string,
        success: boolean
      }) => {
        if (json.success) {
          post.innerHTML = "";

          if (
            window.location.pathname.toLowerCase().includes("/home") ||
            window.location.pathname.toLowerCase().includes(`/u/${localStorage.getItem("username") || "LOL IT BROKE LOLLLLLLLLL SO FUNNY"}`)
          ) {
            let x: HTMLDivElement = document.createElement("div");
            x.innerHTML = getPostHTML(json.post);
            dom("posts").prepend(x);
          }
        } else {
          (post.querySelector(".log") as HTMLElement).innerText = json.reason;
          c++;
          setTimeout(function() {
            --c;
            if (!c) {
              (post.querySelector(".log") as HTMLElement).innerText = "";
            }
          });
          throw json.reason;
        }
      }).catch((err: Error) => {
        post.querySelector("textarea").removeAttribute("disabled");
        post.querySelector("button.post-button").removeAttribute("disabled");
        post.querySelector("button.cancel-button").removeAttribute("disabled");
      });
  });

  post.querySelector("textarea").addEventListener("input", postTextInputEvent);

  post.querySelector("button.cancel-button").addEventListener("click", function(): void {
    post.innerHTML = "";
  });
}

function toggleLike(postId: number, type: string): void {
  if (typeof logged_in !== "undefined" && !logged_in) { return; }

  let q: HTMLElement = document.querySelector(`div[data-${type}-id="${postId}"] span.like-number`) as HTMLElement;
  let h: HTMLElement = document.querySelector(`div[data-${type}-id="${postId}"] button.like`) as HTMLElement;
  let x: HTMLElement = document.querySelector(`div[data-${type}-id="${postId}"] button.like svg`) as HTMLElement;

  if (h.dataset["liked"] == "true") {
    fetch(`/api/${type}/like`, {
      method: "DELETE",
      body: JSON.stringify({
        id: postId
      })
    });

    h.setAttribute("data-liked", "false");
    x.innerHTML = icons.unlike;
    q.innerHTML = String(+q.innerHTML - 1);
  } else {
    fetch(`/api/${type}/like`, {
      method: "POST",
      body: JSON.stringify({
        id: postId
      })
    });

    h.setAttribute("data-liked", "true");
    x.innerHTML = icons.like;
    q.innerHTML = String(+q.innerHTML + 1);
  }
}

function vote(option: number, postID: number, gInc: number): void {
  fetch("/api/post/vote", {
    method: "POST",
    body: JSON.stringify({
      id: postID,
      option: option
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      success: boolean
    }) => {
      if (json.success) {
        let v: HTMLElement;
        forEach(dom(`gi-${gInc}`).querySelectorAll(".poll-bar-container"), function(val: Element, index: number) {
          let el: HTMLElement = val as HTMLElement;
          let isVoted: boolean = +el.dataset.index == option;

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
  function refresh(force_offset=false): void {
    c++;
    if (force_offset !== true) { dom("posts").innerHTML = ""; }

    fetch(`${url}${force_offset === true && !end ? `${url.includes("?") ? "&" : "?"}offset=${offset}` : ""}`, {
      method: "GET"
    })
      .then((response: Response) => (response.json()))
      .then((json: {
        bio: string,
        can_view: boolean,
        end: boolean,
        followers: boolean,
        following: boolean,
        pinned: _postJSON,
        posts: _postJSON[]
      }) => {
        --c;
        if (c) {
          return;
        }

        end = json.end;
        let output: string = "";
        for (const post of json.posts) {
          output += getPostHTML(
            post,
            type == "comment",
            includeUserLink,
            includePostLink,
            false, false, false
          );
          offset = post.post_id;
        }

        if (typeof extra !== "undefined") {
          extra(json);
        }

        let x: HTMLElement = document.createElement("div");
        x.innerHTML = output;
        dom("posts").append(x);

        if (dom("more")) {
          if (force_offset !== true) {
            dom("more").removeAttribute("hidden");
          }

          if (json.end) {
            dom("more").setAttribute("hidden", "");
          } else {
            dom("more").removeAttribute("hidden");
          }
        }
      })
      .catch((err: Error) => {
        --c;
        showlog(lang.generic.something_went_wrong, 5000);
        throw err;
      });
  }

  refresh();
}
