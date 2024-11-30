inc = 0;

dom("toggle-password").addEventListener("click", function(): void {
  if (dom("password").getAttribute("type") == "password") {
    dom("password").setAttribute("type", "text");
    dom("confirm").setAttribute("type", "text");
  } else {
    dom("password").setAttribute("type", "password");
    dom("confirm").setAttribute("type", "password");
  }
});

dom("submit").addEventListener("click", function(): void {
  let username: string = (dom("username") as HTMLInputElement).value;
  let password: string = sha256((dom("password") as HTMLInputElement).value)

  if (password !== sha256((dom("confirm") as HTMLInputElement).value)) {
    toast(lang.account.password_match_failure, false);
    return;
  }

  if (!username || password === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") {
    return;
  }

  let body: {
    [key: string]: string
  } = {
    username: username,
    password: password
  }

  if (ENABLE_NEW_ACCOUNTS == "otp") {
    body.otp = (dom("otp") as HTMLInputElement).value;

    if (body.otp.length !== 32) {
      toast(lang.account.invite_code_invalid, false);
      return;
    }
  }

  s_fetch("/api/user/signup", {
    method: "POST",
    body: JSON.stringify(body),
    disable: [this, dom("username"), dom("password"), dom("confirm"), dom("otp")]
  });
});

dom("username").addEventListener("keydown", function(event: KeyboardEvent): void {
  if (event.key == "Enter" || event.keyCode == 18) {
    dom("password").focus();
  }
});

dom("password").addEventListener("keydown", function(event: KeyboardEvent): void {
  if (event.key == "Enter" || event.keyCode == 18) {
    dom("confirm").focus();
  }
});

dom("confirm").addEventListener("keydown", function(event: KeyboardEvent): void {
  if (event.key == "Enter" || event.keyCode == 18) {
    dom("submit").focus();
    dom("submit").click();
  }
});
