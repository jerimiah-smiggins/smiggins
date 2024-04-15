let inc = 0, req = 0, end = false;
let offset = null;
let username = document.querySelector("body").getAttribute("data-username");

if (!logged_in) {
  dom("more-container").innerHTML = "<a href=\"/signup\">Sign up</a> to see more!";
}

showlog = (str, time=3000) => {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, time);
};

function refresh(force_offset=false) {
  if (force_offset !== true) { dom("posts").innerHTML = ""; }

  fetch(`/api/post/user/${document.querySelector("body").getAttribute("data-username")}${force_offset === true && !end ? `?offset=${offset}` : ""}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then((response) => (response.json()))
    .then((json) => {
      document.querySelectorAll(".priv").forEach((val, index) => {
        val.innerHTML = icons.lock;
      });

      [...document.querySelectorAll("[data-show-on-priv]")].forEach((val) => {
        if (json.private) {
          val.removeAttribute("hidden");
        } else {
          val.setAttribute("hidden", "")
        }
      });

      [...document.querySelectorAll("[data-show-on-view]")].forEach((val) => {
        if (json.private && json.can_view) {
          val.removeAttribute("hidden");
        } else {
          val.setAttribute("hidden", "")
        }
      });

      dom("follow").innerText = `Followers: ${json.followers} - Following: ${json.following}`;

      let output = "";
      end = json.end;

      for (const post of json.posts) {
        output += getPostHTML(
          post.content,          // content
          post.post_id,          // postID
          post.creator_username, // username
          post.display_name,     // displayName
          post.timestamp,        // timestamp
          post.comments,         // commentCount
          post.likes,            // likeCount
          post.quotes,           // quote
          post.quote,            // quoteInfo
          post.liked,            // isLiked
          json.private,          // isPrivate
          false,                 // isComment
          false,                 // includeUserLink
          true                   // includePostLink
        );
        offset = post.post_id;
      }

      dom("posts").innerHTML += output;

      if (force_offset !== true && logged_in) { dom("more").removeAttribute("hidden"); }
      if (json.end && logged_in) { dom("more").setAttribute("hidden", ""); } else if (logged_in) { dom("more").removeAttribute("hidden"); }
    })
    .catch((err) => {
      showlog("Something went wrong loading the posts! Try again in a few moments...", 5000);
      throw(err);
    });
}

function toggle_follow() {
  let x = dom("toggle").getAttribute("data-followed") === "1";
  fetch(`/api/user/follower`, {
    method: x ? "DELETE" : "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "username": document.querySelector("body").getAttribute("data-username")
    })
  })
    .then((response) => (response.json()))
    .then((json) => {
      dom("toggle").setAttribute("data-followed", x ? "0" : "1");
      dom("toggle").innerText = x ? "Follow" : "Unfollow";
    })
    .catch((err) => {
      showlog("Something went wrong loading the posts! Try again in a few moments...", 5000);
      throw(err);
    });
}

function toggleLike(post_id) {
  let q = document.querySelector(`div[data-post-id="${post_id}"] span.like-number`);
  let h = document.querySelector(`div[data-post-id="${post_id}"] div.like`);
  let x = document.querySelector(`div[data-post-id="${post_id}"] div.like svg`);

  if (h.dataset["liked"] == "true") {
    fetch("/api/post/like", {
      "method": "DELETE",
      "body": JSON.stringify({
        "id": post_id
      })
    });
    h.setAttribute("data-liked", "false");
    x.innerHTML = icons.unlike;
    q.innerHTML = +q.innerHTML - 1;
  } else {
    fetch("/api/post/like", {
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
