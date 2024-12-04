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

dom("post-text").addEventListener("input", postTextInputEvent);

dom("post").addEventListener("click", function(): void {
  if ((dom("post-text") as HTMLInputElement).value || getPollText().length) {
    s_fetch("/api/post/create", {
      method: "PUT",
      body: JSON.stringify({
        c_warning: ENABLE_CONTENT_WARNINGS ? (dom("c-warning") as HTMLInputElement).value : "",
        content: (dom("post-text") as HTMLInputElement).value,
        poll: getPollText(),
        private: (dom("default-private") as HTMLInputElement).checked
      }),
      disable: [
        this,
        dom("post-text"),
        ENABLE_CONTENT_WARNINGS && dom("c-warning")
      ]
    });
  }
});

timelines = {
  recent: "/api/post/recent",
  following: "/api/post/following"
};

document.querySelector(`#switch > a[data-timeline='${page}']`).removeAttribute("href");

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
    output += `<input data-create-post placeholder="${(i > 2 ? lang.home.poll_optional : lang.home.poll_option).replaceAll("%s", i)}" maxlength="${MAX_POLL_OPTION_LENGTH}"></br>`;
  }

  dom("poll").innerHTML = output;
}
