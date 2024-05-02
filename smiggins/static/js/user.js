let username = document.querySelector("body").getAttribute("data-username");
let share = window.location.href;
let home = true;

const url = `/api/post/user/${username}`;
const type = "post";
const includeUserLink = false;
const includePostLink = true;

function extra(json) {
  dom("user-bio").innerHTML = linkifyHtml(escapeHTML(json.bio), {
    formatHref: { mention: (href) => "/u" + href }
  });

  if (!json.can_view) {
    dom("toggle").setAttribute("hidden", "");
  }

  [...document.querySelectorAll("[data-show-on-priv]")].forEach((val) => {
    if (json.private) {
      val.removeAttribute("hidden");
    } else {
      val.setAttribute("hidden", "")
    }
  });

  [...document.querySelectorAll("[data-show-on-view]")].forEach((val) => {
    if (json.private && json.can_view) {
      val.removeAttribute("hidden");
    } else {
      val.setAttribute("hidden", "")
    }
  });

  dom("follow").innerText = `Followers: ${json.followers} - Following: ${json.following}`;
}

if (!logged_in) {
  dom("more-container").innerHTML = "<a href=\"/signup\">Sign up</a> to see more!";
}

function toggle_follow() {
  let x = dom("toggle").getAttribute("data-followed") === "1";
  fetch(`/api/user/follower`, {
    method: x ? "DELETE" : "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "username": document.querySelector("body").getAttribute("data-username")
    })
  })
    .then((response) => (response.json()))
    .then((json) => {
      dom("toggle").setAttribute("data-followed", x ? "0" : "1");
      dom("toggle").innerText = x ? "Follow" : "Unfollow";
    })
    .catch((err) => {
      showlog("Something went wrong loading the posts! Try again in a few moments...", 5000);
      throw(err);
    });
}

function toggle_block() {
  let x = dom("block").getAttribute("data-blocked") === "1";
  fetch(`/api/user/block`, {
    method: x ? "DELETE" : "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "username": document.querySelector("body").getAttribute("data-username")
    })
  })
    .then((response) => (response.json()))
    .then((json) => {
      dom("block").setAttribute("data-blocked", x ? "0" : "1");
      dom("block").innerText = x ? "Block" : "Unblock";
    })
    .catch((err) => {
      showlog("Something went wrong loading the posts! Try again in a few moments...", 5000);
      throw(err);
    });
}
