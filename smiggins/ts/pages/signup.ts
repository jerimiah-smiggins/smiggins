function signupSubmitEvent(e: MouseEvent) {
  let usernameElement: HTMLElement | null = document.getElementById("username");
  let passwordElement: HTMLElement | null = document.getElementById("password");
  let confirmElement: HTMLElement | null = document.getElementById("confirm");
  let otpElement: HTMLElement | null = document.getElementById("otp");

  if (!usernameElement || !passwordElement || !confirmElement || !otpElement) { return; }

  let username: string = (usernameElement as HTMLInputElement).value;
  let password: string = (passwordElement as HTMLInputElement).value;
  let confirm: string = (confirmElement as HTMLInputElement).value;

  let otp: string | null = null;
  if (!otpElement.hidden) {
    otp = (otpElement as HTMLInputElement).value
  }

  if (!otpElement.hidden && !otp) { otpElement.focus(); return; }
  else if (!username) { usernameElement.focus(); return; }
  else if (!password) { passwordElement.focus(); return; }
  else if (password !== confirm) {
    confirmElement.focus();
    createToast("Passwords don't match.");
    return;
  }

  fetch("/api/user/signup", {
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: sha256(password),
      otp: otp
    }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<api_login> => (response.json()))
    .then((json: api_login): void => {
      if (json.success) {
        document.cookie = `token=${json.token};Path=/;SameSite=Lax;Expires=${new Date(new Date().getTime() + (356 * 24 * 60 * 60 * 1000)).toUTCString()}`;
        location.href = "/";
      } else {
        switch (json.reason) {
          case "USERNAME_USED": createToast("Username in use.", `User '${escapeHTML(username)}' already exists.`); usernameElement.focus(); break;
          case "BAD_PASSWORD": createToast("Invalid password."); passwordElement.focus(); break;
          case "INVALID_OTP": createToast("Invalid invite code.", "Make sure your invite code is valid and try again."); otpElement.focus(); break;
          case "RATELIMIT": createToast("Ratelimited.", "Try again in a few seconds."); break;
          default: createToast("Something went wrong!");
        }
      }
    })
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function p_signup(element: HTMLDivElement): void {
  (element.querySelector("#submit") as HTMLButtonElement).addEventListener("click", signupSubmitEvent);
}
