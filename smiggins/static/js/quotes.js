function addQuote(postID, isComment) {
  const post = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`).querySelector(".post-after");
  if (post.querySelector("button")) { return; }

  let c = 0;

  post.innerHTML = `
    <div class="log"></div>
    <textarea class="post-text" maxlength="${MAX_POST_LENGTH}" placeholder="Enter your post here..."></textarea><br>
    <button class="post-button inverted">Post</button>
    <button class="cancel-button inverted">Cancel</button>
  `;

  post.querySelector("button.post-button").addEventListener("click", function() {
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
    }).then((response) => (response.json()))
      .then((json) => {
        if (json.success) {
          post.innerHTML = "";
          refresh();
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
        post.querySelector("button.post-button").removeAttribute("disabled");
        post.querySelector("button.cancel-button").removeAttribute("disabled");
      });
  });

  post.querySelector("button.cancel-button").addEventListener("click", function() {
    post.innerHTML = "";
  });
}
