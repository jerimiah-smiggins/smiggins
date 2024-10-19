eraseCookie("token");

if (location.search == "?from=token") {
  let accounts: string[][] = JSON.parse(localStorage.getItem("acc-switcher"));
  let set: boolean = false;

  if (document.cookie.split(/\btoken=/).length != 1) {
    for (let i: number = 0; i < accounts.length; i++) {
      if (accounts[i][0] == localStorage.getItem("username")) {
        accounts.splice(i, 1);
        --i;
      }
    }
    localStorage.setItem("acc-switcher", JSON.stringify(accounts));
  } else {
    for (const account of accounts) {
      if (!set && account[0] == localStorage.getItem("username")) {
        setCookie("token", account[1]);
        set = true;
      }
    }
  }

  if (accounts.length || set) {
    if (!set) {
      localStorage.setItem("username", accounts[0][0]);
      setCookie("token", accounts[0][1]);
    }

    location.href = "/home/";

    throw "some error that stops execution";
  }
}

localStorage.removeItem("username");

if (location.search == "?from=switcher") {
  location.href = "/login";
} else {
  localStorage.removeItem("home-page");
  localStorage.removeItem("color")
  localStorage.removeItem("acc-switcher");
  localStorage.removeItem("bar-pos");
  localStorage.removeItem("bar-dir");
  location.href = "/";
}
