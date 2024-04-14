function addQuote(postID, isComment) {
  const post = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`).querySelector(".post-after");
  let c = 0;

  function iWantToDie() {
    if (!post.querySelector("textarea").value.length) { return; }

    post.querySelector("textarea").setAttribute("disabled", "");
    post.querySelector("button").setAttribute("disabled", "");

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
          post.removeEventListener("click", iWantToDie);
        } else {
          post.querySelector("log").innerText = json.reason;
          c++;
          setTimeout(function() {
            --c;
            if (!c) {
              post.querySelector("log").innerText = "";
            }
          });
          throw json.reason;
        }
      }).catch((err) => {
        post.querySelector("textarea").removeAttribute("disabled");
        post.querySelector("button").removeAttribute("disabled");
      });
  }

  post.innerHTML = `
    <div class="log"></div>
    <textarea class="post-text" maxlength="${MAX_POST_LENGTH}" placeholder="Enter your post here..."></textarea><br>
    <button class="post-button inverted">Post</button>
  `;

  post.querySelector("button").addEventListener("click", iWantToDie)
}
