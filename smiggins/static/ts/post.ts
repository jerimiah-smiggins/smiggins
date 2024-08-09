declare const post_id: number;
declare const comment: boolean;

url = `/api/comments?id=${post_id}&comment=${comment}`;
type = "comment";
includeUserLink = true;
includePostLink = true;

try {
  dom("post-text").addEventListener("input", postTextInputEvent);

  dom("post").addEventListener("click", function() {
    if ((dom("post-text") as HTMLButtonElement).value) {
      dom("post").setAttribute("disabled", "");
      dom("post-text").setAttribute("disabled", "");
      ENABLE_CONTENT_WARNINGS && dom("c-warning").setAttribute("disabled", "");

      fetch("/api/comment/create", {
        method: "PUT",
        body: JSON.stringify({
          c_warning: ENABLE_CONTENT_WARNINGS ? (dom("c-warning") as HTMLInputElement).value : "",
          comment: comment,
          content: (dom("post-text") as HTMLInputElement).value,
          id: post_id,
          private: (dom("default-private") as HTMLInputElement).checked
        })
      })
        .then((response: Response) => {
          dom("post").removeAttribute("disabled");
          dom("post-text").removeAttribute("disabled");
          ENABLE_CONTENT_WARNINGS && dom("c-warning").removeAttribute("disabled");

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
          ENABLE_CONTENT_WARNINGS && dom("c-warning").removeAttribute("disabled");

          showlog(lang.generic.something_went_wrong);
        });
    }
  });
} catch (err) {
  console.error(err);
}
