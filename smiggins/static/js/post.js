let share = window.location.href;
let home = true;

const url = `/api/comments?id=${post_id}&comment=${comment}`;
const type = "comment";
const includeUserLink = true;
const includePostLink = true;

if (!logged_in) {
  dom("more-container").innerHTML = "<a href=\"/signup\">Sign up</a> to see more!";
  dom("post-text").setAttribute("hidden", "");
  dom("post").setAttribute("hidden", "");
  dom("hide-me").setAttribute("hidden", "");
}

dom("post-text").addEventListener("input", postTextInputEvent);

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
        dom("post").removeAttribute("disabled");
        dom("post-text").removeAttribute("disabled");
        if (response.status == 429) {
          showlog("You are being ratelimited! Try again in a few moments...");
        } else {
          response.json().then((json) => {
            if (json.success) {
              dom("post-text").value = "";
              refresh();
            } else {
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
