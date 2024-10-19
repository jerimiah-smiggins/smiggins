inc = 0

dom("toggle-password").addEventListener("click", function(): void {
  if (dom("password").getAttribute("type") == "password") {
    dom("password").setAttribute("type", "text");
  } else {
    dom("password").setAttribute("type", "password");
  }
});

dom("submit").addEventListener("click", function(): void {
  this.setAttribute("disabled", "");
  let username: string = (dom("username") as HTMLInputElement).value;
  let password: string = sha256((dom("password") as HTMLInputElement).value);
0
  fetch("/api/user/login", {
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: password
    })
  })
    .then((response: Response) => {
      if (response.status == 429) {
        dom("post").removeAttribute("disabled");
        dom("post-text").removeAttribute("disabled");
        showlog(lang.generic.ratelimit_verbose);
      } else {
        response.json().then((json: {
          valid: boolean,
          token?: string,
          reason?: string
        }) => {
          if (json.valid) {
            setCookie("token", json.token);
            location.href = "/home";
          } else {
            dom("submit").removeAttribute("disabled")
            showlog(lang.account.log_in_failure.replaceAll("%s", json.reason));
          }
        })
      }
    })
    .catch((err: Error) => {
      dom("submit").removeAttribute("disabled")
      showlog(lang.generic.something_went_wrong);
    });
});

dom("username").addEventListener("keydown", function(event: KeyboardEvent): void {
  if (event.key == "Enter" || event.keyCode == 18) {
    dom("password").focus();
  }
});

dom("password").addEventListener("keydown", function(event: KeyboardEvent): void {
  if (event.key == "Enter" || event.keyCode == 18) {
    dom("submit").focus();
    dom("submit").click();
  }
});
