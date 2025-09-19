function loginSubmitEvent(e: MouseEvent): void {
  let usernameElement: HTMLElement | null = document.getElementById("username");
  let passwordElement: HTMLElement | null = document.getElementById("password");

  if (!usernameElement || !passwordElement) { return; }

  let username: string = (usernameElement as HTMLInputElement).value;
  let password: string = (passwordElement as HTMLInputElement).value;

  if (!username) { usernameElement.focus(); return; }
  else if (!password) { passwordElement.focus(); return; }

  (e.target as HTMLButtonElement | null)?.setAttribute("disabled", "");

  fetch("/api/user/login", {
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: sha256(password)
    }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .then((): void => (e.target as HTMLButtonElement | null)?.removeAttribute("disabled"))
    .catch((err: any): void => {
      (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function signupSubmitEvent(e: MouseEvent): void {
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
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .then((): void => (e.target as HTMLButtonElement | null)?.removeAttribute("disabled"))
    .catch((err: any): void => {
      (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function p_login(element: HTMLDivElement): void {
  (element.querySelector("#submit") as HTMLButtonElement).addEventListener("click", loginSubmitEvent);
}

function p_signup(element: HTMLDivElement): void {
  (element.querySelector("#submit") as HTMLButtonElement | null)?.addEventListener("click", signupSubmitEvent);
}
