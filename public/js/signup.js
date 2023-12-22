let inc = 0, req = 0;

dom("toggle-password").addEventListener("click", function() {
  if (dom("password").getAttribute("type") == "password") {
    dom("password").setAttribute("type", "text");
  } else {
    dom("password").setAttribute("type", "password");
  }
});

dom("submit").addEventListener("click", function() {
  this.setAttribute("disabled", "");
  username = dom("username").value;
  password = sha256(dom("password").value)
  fetch("/api/account/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "username": username,
      "password": password
    })
  })
    .then((response) => {
      if (response.status == 429) {
        dom("post").removeAttribute("disabled");
        dom("post-text").removeAttribute("disabled");
        inc++;
        dom("error").innerText = "You are being ratelimited! Try again in a few moments...";
        setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
      } else {
        let json = response.json()
        if (json.valid) {
          setCookie("token", json.token);
          window.location.href = "/home";
        } else {
          dom("submit").removeAttribute("disabled")
          inc++;
          dom("error").innerText = `Unable to create account! Reason: ${json.reason}`;
          setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
        }
      }
    })
    .catch((err) => {
      dom("submit").removeAttribute("disabled")
      inc++;
      dom("error").innerText = "Something went wrong! Try again in a few moments...";
      setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
      throw(err);
    });
});