function signupSubmitEvent(e: MouseEvent) {
  let usernameElement: HTMLElement | null = document.getElementById("username");
  let passwordElement: HTMLElement | null = document.getElementById("password");
  let confirmElement: HTMLElement | null = document.getElementById("confirm");
  let otpElement: HTMLElement | null = document.getElementById("otp");

  if (!usernameElement || !passwordElement || !confirmElement) { return; }

  let username: string = (usernameElement as HTMLInputElement).value;
  let password: string = (passwordElement as HTMLInputElement).value;
  let confirm: string = (confirmElement as HTMLInputElement).value;

  let otp: string | null = null;
  if (otpElement) { otp = (otpElement as HTMLInputElement).value }

  if (otpElement && !otp) { otpElement.focus(); return; }
  else if (!username) { usernameElement.focus(); return; }
  else if (!password) { passwordElement.focus(); return; }
  else if (password !== confirm) {
    confirmElement.focus();
    createToast("Passwords don't match.");
    return;
  }

  (e.target as HTMLButtonElement | null)?.setAttribute("disabled", "");

  fetch("/api/user/signup", {
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: sha256(password),
      otp: otp
    }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<api_token> => (response.json()))
    .then((json: api_token): void => {
      if (json.success) {
        setTokenCookie(json.token);
        location.href = "/";
      } else {
        (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
        createToast(...errorCodeStrings(json.reason, "signup"));
      }
    })
    .catch((err: any): void => {
      (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function p_signup(element: HTMLDivElement): void {
  (element.querySelector("#submit") as HTMLButtonElement | null)?.addEventListener("click", signupSubmitEvent);
}
