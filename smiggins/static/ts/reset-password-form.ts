declare let formURL: string;

// @ts-ignore
function showlog(str: string, time: number = 3000): void {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => {
    --inc;
    if (!inc) {
      dom("error").innerText = "";
    }
  }, time);
};

dom("save").addEventListener("click", function() {
  if (!(dom("confirm") as HTMLInputElement).value || !(dom("password") as HTMLInputElement).value) {
    return;
  }

  if ((dom("password") as HTMLInputElement).value !== (dom("confirm") as HTMLInputElement).value) {
    showlog(lang.account.password_match_failure);
    return;
  }

  fetch(formURL, {
    body: JSON.stringify({
      passhash: sha256((dom("password") as HTMLInputElement).value)
    }),
    method: "POST"
  }).then((response) => (response.json()))
    .then((json: {
      valid: boolean,
      token?: string,
      reason?: string
    }): void => {
      if (json.valid) {
        setCookie("token", json.token);
        location.href = "/home/";
      } else {
        showlog(json.reason);
      }
    }).catch((err) => {
      showlog(lang.generic.something_went_wrong);
      throw err;
    })
});

dom("toggle-password").addEventListener("click", function(): void {
  let newType: string = dom("password").getAttribute("type") === "password" ? "text" : "password";

  dom("password").setAttribute("type", newType);
  dom("confirm").setAttribute("type", newType);
});
