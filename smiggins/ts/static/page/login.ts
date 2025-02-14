function loginInit(): void {
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

    s_fetch("/api/user/login", {
      method: "POST",
      body: JSON.stringify({
        username: username,
        password: password
      }),
      disable: [this, dom("username"), dom("password")]
    });
  });

  dom("username").addEventListener("keydown", function(event: KeyboardEvent): void {
    if (event.key == "Enter") {
      event.preventDefault();
      dom("password").focus();
    }
  });

  dom("password").addEventListener("keydown", function(event: KeyboardEvent): void {
    if (event.key == "Enter") {
      event.preventDefault();
      dom("submit").focus();
      dom("submit").click();
    }
  });
}
