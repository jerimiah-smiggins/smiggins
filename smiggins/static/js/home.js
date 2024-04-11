let inc = 0, req = 0, end = false;
let offset = null;
let page = localStorage.getItem("home-page");
if (page !== "following" && page !== "recent") { page = "recent"; }

showlog = (str, time=3000) => {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, time);
};

dom("switch").innerText = "Switch to " + (page == "recent" ? "following" : "recent") + "...";

dom("post-text").addEventListener("input", function() {
  while (this.value.indexOf("  ") !== -1) { this.value = this.value.replaceAll("  ", " "); }
  if (this.value.length > 280) { this.value = this.value.slice(0, 280); }
})

dom("post").addEventListener("click", function() {
  if (dom("post-text").value) {
    this.setAttribute("disabled", "");
    dom("post-text").setAttribute("disabled", "");
    fetch("/api/post/create", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "content": dom("post-text").value
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

dom("switch").addEventListener("click", function() {
  page = page == "following" ? "recent" : "following"
  localStorage.setItem("home-page", page);
  dom("switch").innerHTML = "Switch to " + (page == "recent" ? "following" : "recent") + "...";
  refresh();
})

function refresh(force_offset=false) {
  if (force_offset !== true) { dom("posts").innerHTML = ""; }

  fetch(`/api/post/${page == "following" ? "following" : "recent"}${force_offset === true && !end ? `?offset=${offset}` : ""}`, {
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
          post.liked,            // isLiked
          post.private_acc,      // isPrivate
          false,                 // isComment
          true,                  // includeUserLink
          true                   // includePostLink
        );
        offset = post.post_id;
      }

      dom("posts").innerHTML += output;

      if (force_offset !== true) { dom("more").removeAttribute("hidden"); }
      if (json.end) { dom("more").setAttribute("hidden", ""); } else { dom("more").removeAttribute("hidden"); }

      dom("post").removeAttribute("disabled")
      dom("post-text").removeAttribute("disabled")
    })
    .catch((err) => {
      dom("post").removeAttribute("disabled")
      dom("post-text").removeAttribute("disabled")
      showlog("Something went wrong loading the posts! Try again in a few moments...", 5000);
      throw(err);
    });
}

function toggleLike(post_id) {
  let q = document.querySelector(`div[data-post-id="${post_id}"] span.like-number`);
  let h = document.querySelector(`div[data-post-id="${post_id}"] div.like`);
  if (h.dataset["liked"] == "true") {
    fetch("/api/post/like", {
      "method": "DELETE",
      "body": JSON.stringify({
        "id": post_id
      })
    });
    h.setAttribute("data-liked", "false");
    h.innerHTML = icons.unlike;
    q.innerHTML = +q.innerHTML - 1;
  } else {
    fetch("/api/post/like", {
      "method": "POST",
      "body": JSON.stringify({
        "id": post_id
      })
    });
    h.setAttribute("data-liked", "true");
    h.innerHTML = icons.like;
    q.innerHTML = +q.innerHTML + 1;
  }
}

refresh();
