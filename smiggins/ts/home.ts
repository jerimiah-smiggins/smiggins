let page: string = localStorage.getItem("home-page");
if (page !== "following" && page !== "recent") { page = "recent"; }

url = `/api/post/${page}`;
type = "post";
includeUserLink = true;
includePostLink = true;

function getPollText(): string[] {
  if (dom("poll").hasAttribute("hidden")) {
    return [];
  }

  let out: string[] = [];

  forEach(document.querySelectorAll("#poll input"), function(val: Element, index: number): void {
    if ((val as HTMLInputElement).value) {
      out.push((val as HTMLInputElement).value);
    }
  });

  return out;
}

dom("switch").innerText = page == "recent" ? lang.home.switch_following : lang.home.switch_recent
dom("post-text").addEventListener("input", postTextInputEvent);

dom("post").addEventListener("click", function(): void {
  if ((dom("post-text") as HTMLInputElement).value || getPollText().length) {
    this.setAttribute("disabled", "");
    dom("post-text").setAttribute("disabled", "");
    ENABLE_CONTENT_WARNINGS && dom("c-warning").setAttribute("disabled", "");

    fetch("/api/post/create", {
      method: "PUT",
      body: JSON.stringify({
        c_warning: ENABLE_CONTENT_WARNINGS ? (dom("c-warning") as HTMLInputElement).value : "",
        content: (dom("post-text") as HTMLInputElement).value,
        poll: getPollText(),
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
              (dom("post-text") as HTMLInputElement).value = "";
              (dom("c-warning") as HTMLInputElement).value = "";

              forEach(document.querySelectorAll("#poll input"), function(val: Element, index: number): void {
                (val as HTMLInputElement).value = "";
              });

              refresh();
            } else {
              showlog(lang.generic.something_went_wrong);
            }
          });
        }
      })
      .catch((err: Error) => {
        dom("post").removeAttribute("disabled");
        dom("post-text").removeAttribute("disabled");
        ENABLE_CONTENT_WARNINGS && dom("c-warning").removeAttribute("disabled");
        showlog(lang.generic.something_went_wrong);
        throw(err);
      });
  }
});

dom("switch").addEventListener("click", function(): void {
  page = page == "following" ? "recent" : "following"
  localStorage.setItem("home-page", page);
  dom("switch").innerHTML = page == "recent" ? lang.home.switch_following : lang.home.switch_recent
  url = `/api/post/${page}`;
  refresh();
});

if (ENABLE_POLLS) {
  dom("toggle-poll").addEventListener("click", function(): void {
    if (dom("poll").hasAttribute("hidden")) {
      dom("poll").removeAttribute("hidden");
    } else {
      dom("poll").setAttribute("hidden", "");
    }
  })

  output = "";
  for (let i: number = 1; i <= MAX_POLL_OPTIONS; i++) {
    output += `<label><input placeholder="${(i > 2 ? lang.home.poll_optional : lang.home.poll_option).replaceAll("%s", i)}" maxlength="${MAX_POLL_OPTION_LENGTH}"></label></br>`;
  }

  dom("poll").innerHTML = output;
}
