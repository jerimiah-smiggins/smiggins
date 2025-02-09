let counts: {
  blocking: number,
  following: number,
  followers: number
};

function toggleFollow(): void {
  s_fetch(`/api/user/follow`, {
    method: dom("toggle").getAttribute("data-followed") === "1" ? "DELETE" : "POST",
    body: JSON.stringify({
      username: context.username
    }),
    disable: [dom("toggle")]
  });
}

function toggleBlock(): void {
  s_fetch(`/api/user/block`, {
    method: dom("block").getAttribute("data-blocked") === "1" ? "DELETE" : "POST",
    body: JSON.stringify({
      username: context.username
    }),
    disable: [dom("block")]
  });
}

function createMessage(): void {
  s_fetch("/api/messages/new", {
    method: "POST",
    body: JSON.stringify({
      username: context.username
    }),
    disable: [dom("message")]
  });
}

function loadList(column: "blocking" | "following" | "followers", fromStart: boolean=false): void {
  if (fromStart) {
    counts[column] = 0;
    dom(column).innerHTML = "";
  }

  s_fetch(`/api/user/lists?username=${context.username}&column=${column}&page=${counts[column]}`, {
    disable: [
      dom(`${column}-refresh`),
      dom(`${column}-more`)
    ],
    postFunction: (success: boolean): void => {
      if (success) { counts[column]++; }
    }
  });
}

function userInit(): void {
  share = location.href;
  timelineConfig.url = `/api/post/user/${context.username}`;
  timelineConfig.enableForwards = true;
  type = "post";
  includeUserLink = false;
  includePostLink = true;
  document.body.style.setProperty("--banner", context.banner_color_one);
  document.body.style.setProperty("--banner-two", context.banner_color_two);

  if (!loggedIn) {
    dom("more-container").innerHTML = lang.generic.see_more.replaceAll("%s", `<a data-link href="/signup">${lang.account.sign_up_title}</a>`);
    registerLinks(dom("more-container"));
  }
}

function userListsInit(): void {
  document.body.style.setProperty("--banner", context.banner_color_one);
  document.body.style.setProperty("--banner-two", context.banner_color_two);
  share = location.href;

  if (context.is_.blocked) { return; }

  counts = {
    blocking: 1,
    following: 1,
    followers: 1
  };

  s_fetch(`/api/user/lists?username=${context.username}&column=all`, {
    disable: [
      context.is_.self && dom("blocking-refresh"),
      context.is_.self && dom("blocking-more"),
      dom("following-refresh"),
      dom("following-more"),
      dom("followers-refresh"),
      dom("followers-more")
    ]
  });
}
