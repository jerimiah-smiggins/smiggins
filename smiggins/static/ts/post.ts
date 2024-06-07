declare const post_id: number;
declare const comment: boolean;

url = `/api/comments?id=${post_id}&comment=${comment}`;
type = "comment";
includeUserLink = true;
includePostLink = true;

if (!logged_in) {
  dom("more-container").innerHTML = lang.generic.see_more.replaceAll("%s", `<a href="/signup">${lang.account.sign_up_title}</a>`);
  dom("post-text").setAttribute("hidden", "");
  dom("post").setAttribute("hidden", "");
  dom("hide-me").setAttribute("hidden", "");
}

dom("post-text").addEventListener("input", postTextInputEvent);

dom("post").addEventListener("click", function() {
  if ((dom("post-text") as HTMLButtonElement).value) {
    this.setAttribute("disabled", "");
    dom("post-text").setAttribute("disabled", "");

    fetch("/api/comment/create", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "content": (dom("post-text") as HTMLButtonElement).value,
        "id": post_id,
        "comment": comment
    })
    })
      .then((response: Response) => {
        dom("post").removeAttribute("disabled");
        dom("post-text").removeAttribute("disabled");
        if (response.status == 429) {
          showlog(lang.generic.ratelimit_verbose);
        } else {
          response.json().then((json: {
            success: boolean
          }) => {
            if (json.success) {
              (dom("post-text") as HTMLButtonElement).value = "";
              refresh();
            } else {
              showlog(lang.generic.something_went_wrong);
            }
          })
        }
      })
      .catch((err: Error) => {
        dom("post").removeAttribute("disabled");
        dom("post-text").removeAttribute("disabled");
        showlog(lang.generic.something_went_wrong);
      });
  }
});
