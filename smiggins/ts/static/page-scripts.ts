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

function signupInit(): void {
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
    let password: string = (dom("password") as HTMLInputElement).value;

    if (password !== (dom("confirm") as HTMLInputElement).value) {
      toast(lang.account.password_match_failure, false);
      return;
    }

    if (username === "" || password === "") {
      return;
    }

    let body: { username: string, password: string, otp?: string } = {
      username: username,
      password: sha256(password)
    }

    if (conf.new_accounts == "otp") {
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
    if (event.key == "Enter") {
      event.preventDefault();
      dom("password").focus();
    }
  });

  dom("password").addEventListener("keydown", function(event: KeyboardEvent): void {
    if (event.key == "Enter") {
      event.preventDefault();
      dom("confirm").focus();
    }
  });

  dom("confirm").addEventListener("keydown", function(event: KeyboardEvent): void {
    if (event.key == "Enter") {
      event.preventDefault();
      if (dom("otp")) {
        dom("otp").focus();
      } else {
        dom("submit").focus();
        dom("submit").click();
      }
    }
  });

  dom("otp") && dom("otp").addEventListener("keydown", function(event: KeyboardEvent): void {
    if (event.key == "Enter") {
      event.preventDefault();
      dom("submit").focus();
      dom("submit").click();
    }
  })
}

