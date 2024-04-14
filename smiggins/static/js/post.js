dom("timestamp").innerHTML = timeSince(
  Number(dom("timestamp").getAttribute("data-timestamp"))
);

let inc = 0, req = 0, end = false;
let offset = null;
let page = localStorage.getItem("home-page");
if (page !== "following" && page !== "recent") { page = "following"; }

showlog = (str, time=3000) => {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, time);
};

if (!logged_in) {
  dom("more-container").innerHTML = "<a href=\"/signup\">Sign up</a> to see more!";
  dom("post-text").setAttribute("hidden", "");
  dom("post").setAttribute("hidden", "");
  dom("hide-me").setAttribute("hidden", "");
}

dom("post-text").addEventListener("input", function() {
  while (this.value.indexOf("  ") !== -1) { this.value = this.value.replaceAll("  ", " "); }
})

dom("post").addEventListener("click", function() {
  if (dom("post-text").value) {
    this.setAttribute("disabled", "");
    dom("post-text").setAttribute("disabled", "");
    fetch("/api/comment/create", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "content": dom("post-text").value,
        "id": post_id,
        "comment": comment
    })
    })
      .then((response) => {
        if (response.status == 429) {
          dom("post").removeAttribute("disabled");
          dom("post-text").removeAttribute("disabled");
          showlog("You are being ratelimited! Try again in a few moments...");
        } else {
          response.json().then((json) => {
            if (json.success) {
              dom("post-text").value = "";
              refresh();
            } else {
              dom("post").removeAttribute("disabled");
              dom("post-text").removeAttribute("disabled");
              showlog("Something went wrong! Try again in a few moments...");
            }
          })
        }
      })
      .catch((err) => {
        dom("post").removeAttribute("disabled");
        dom("post-text").removeAttribute("disabled");
        showlog("Something went wrong! Try again in a few moments...");
        throw(err);
      });
  }
});

function refresh(force_offset=false) {
  if (force_offset !== true) { dom("posts").innerHTML = ""; }

  fetch(`/api/comments?id=${post_id}&comment=${comment}${force_offset === true && !end ? `&offset=${offset}` : ""}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then((response) => (response.json()))
    .then((json) => {
      end = json.end;
      let output = "";

      for (const post of json.posts) {
        output += getPostHTML(
          post.content,          // content
          post.post_id,          // postID
          post.creator_username, // username
          post.display_name,     // displayName
          post.timestamp,        // timestamp
          post.comments,         // commentCount
          post.likes,            // likeCount
          0,//post.quotes,           // quoteCount
          post.liked,            // isLiked
          post.private_acc,      // isPrivate
          true,                  // isComment
          true,                  // includeUserLink
          true                   // includePostLink
        );
        offset = post.post_id;
      }

      dom("posts").innerHTML += output;

      if (force_offset !== true && logged_in) { dom("more").removeAttribute("hidden"); }
      if (json.end && logged_in) { dom("more").setAttribute("hidden", ""); } else if (logged_in) { dom("more").removeAttribute("hidden"); }

      dom("post").removeAttribute("disabled");
      dom("post-text").removeAttribute("disabled");
    })
    .catch((err) => {
      dom("post").removeAttribute("disabled");
      dom("post-text").removeAttribute("disabled");
      showlog("Something went wrong loading the posts! Try again in a few moments...", 5000);
      throw(err);
    });
}

function toggleLike(post_id) {
  let q = document.querySelector(`div[data-comment-id="${post_id}"] span.like-number`);
  let h = document.querySelector(`div[data-comment-id="${post_id}"] div.like`);
  let x = document.querySelector(`div[data-comment-id="${post_id}"] div.like svg`);

  if (h.dataset["liked"] == "true") {
    fetch("/api/comment/like", {
      "method": "DELETE",
      "body": JSON.stringify({
        "id": post_id
      })
    });
    h.setAttribute("data-liked", "false");
    x.innerHTML = icons.unlike;
    q.innerHTML = +q.innerHTML - 1;
  } else {
    fetch("/api/comment/like", {
      "method": "POST",
      "body": JSON.stringify({
        "id": post_id
      })
    });
    h.setAttribute("data-liked", "true");
    x.innerHTML = icons.like;
    q.innerHTML = +q.innerHTML + 1;
  }
}

refresh();
