const colorRegex = /^#[0-9a-f]{6}$/;

function getUsernameFromPath(path?: string): string {
  return (path || location.pathname).toLowerCase().split("/").filter(Boolean)[1];
}

function p_user(element: HTMLDivElement): void {
  let userUsername: string = getUsernameFromPath();
  let tlId: string = `user_${userUsername}`;

  element.querySelector("#follow")?.addEventListener("click", toggleFollow);
  element.querySelector("#block")?.addEventListener("click", toggleBlock);

  hookTimeline(element.querySelector("[id=\"timeline-posts\"]") as HTMLDivElement, {
    [tlId]: { url: `/api/timeline/user/${userUsername}`, prependPosts: username === userUsername, timelineCallback: userUpdateStats },
    [tlId + "_all"]: { url: `/api/timeline/user/${userUsername}?include_comments=true`, prependPosts: username === userUsername, timelineCallback: userUpdateStats }
  }, tlId, element);
}

function userUpdateStats(json: api_timeline): void {
  let userUsername: string = getUsernameFromPath();
  let c: userData | undefined = userCache[userUsername];

  if (!json.success && json.reason === "BAD_USERNAME") {
    let tlContainer: HTMLElement | null = document.getElementById("timeline-posts");

    if (tlContainer) {
      tlContainer.innerHTML = `<i class="timeline-status">User '${escapeHTML(userUsername)}' does not exist.</i>`;
    }
  }

  if (!json.success || !json.extraData) { return; }

  if (c) {
    // there's probably a more elegant way to do this
    c.display_name  = json.extraData.display_name  || c.display_name;
    c.color_one     = json.extraData.color_one     || c.color_one;
    c.color_two     = json.extraData.color_two     || c.color_two;
    c.following     = json.extraData.following     || c.following;
    c.blocking      = json.extraData.blocking      || c.blocking;
    c.num_following = json.extraData.num_following || c.num_following;
    c.num_followers = json.extraData.num_followers || c.num_followers;
  } else {
    c = {
      display_name: json.extraData.display_name || username,
      bio: "", // TODO: bios
      color_one: json.extraData.color_one || "var(--background-mid)",
      color_two: json.extraData.color_two || "var(--background-mid)",
      following: json.extraData.following || false,
      blocking: json.extraData.blocking || false,
      num_following: json.extraData.num_following || 0,
      num_followers: json.extraData.num_followers || 0
    };

    userCache[userUsername] = c;
  }

  if (username !== userUsername) { // follow/block buttons
    document.getElementById("user-interactions")?.removeAttribute("hidden");

    let followElement: HTMLElement | null = document.getElementById("follow");
    let blockElement: HTMLElement | null = document.getElementById("block");

    if (followElement) {
      if (json.extraData.following === "pending") {
        followElement.innerText = "Pending";
        followElement.dataset.unfollow = "";
      } else if (json.extraData.following) {
        followElement.innerText = "Unfollow";
        followElement.dataset.unfollow = "";
      } else {
        followElement.innerText = "Follow";
        delete followElement.dataset.unfollow;
      }
    }

    if (blockElement) {
      if (json.extraData.blocking) {
        blockElement.innerText = "Unblock";
        blockElement.dataset.unblock = "";
      } else {
        blockElement.innerText = "Block";
        delete blockElement.dataset.unblock;
      }
    }
  }

  let displayNameElement: HTMLElement | null = document.getElementById("display-name");
  let displayName: string | undefined = json.extraData.display_name;
  if (displayName) {
    document.title = `${displayName} - ${pageTitle}`;

    if (displayNameElement) {
      displayNameElement.innerText = displayName;
    }
  }

  let bannerElement: HTMLElement | null = document.getElementById("user-banner");
  if (bannerElement) {
    let colorOne: string | undefined = json.extraData.color_one;
    let colorTwo: string | undefined = json.extraData.color_two;

    if (colorOne && colorRegex.test(colorOne)) { bannerElement.style.setProperty("--color-one", colorOne); }
    if (colorTwo && colorRegex.test(colorTwo)) { bannerElement.style.setProperty("--color-two", colorTwo); }
  }

  let followingElement: HTMLElement | null = document.getElementById("following");
  let followersElement: HTMLElement | null = document.getElementById("followers");
  if (followingElement && json.extraData.num_following) { followingElement.innerText = json.extraData.num_following };
  if (followersElement && json.extraData.num_followers) { followersElement.innerText = json.extraData.num_followers };
}

function updateFollowButton(followed: false): void;
function updateFollowButton(followed: true, pending: boolean): void;
function updateFollowButton(followed: boolean, pending?: boolean): void {
  let followButton: HTMLElement | null = document.getElementById("follow");
  if (!followButton) { return; }

  let c: userData | undefined = userCache[username];

  if (!followed) {
    followButton.innerText = "Follow";
    delete followButton.dataset.unfollow;
    if (c) { c.following = false; }
  } else if (pending) {
    followButton.innerText = "Pending";
    followButton.dataset.unfollow = "";
    if (c) { c.following = "pending"; }
  } else {
    followButton.innerText = "Unfollow";
    followButton.dataset.unfollow = "";
    if (c) { c.following = true; }
  }
}

function updateBlockButton(blocked: boolean): void {
  let blockButton: HTMLElement | null = document.getElementById("block");
  if (!blockButton) { return; }

  if (blocked) {
    blockButton.innerText = "Unblock";
    blockButton.dataset.unblock = "";

    let followButton: HTMLElement | null = document.getElementById("follow");
    if (followButton && followButton.dataset.unfollow !== undefined) {
      delete followButton.dataset.unfollow;
      followButton.innerText = "Follow";
    }
  } else {
    blockButton.innerText = "Block";
    delete blockButton.dataset.unblock;
  }
}

function toggleFollow(e: Event): void {
  let followButton: HTMLButtonElement | null = e.target as HTMLButtonElement | null;
  if (!followButton) { return; }

  let unfollow: boolean = followButton.dataset.unfollow !== undefined;
  followButton.disabled = true;

  fetch("/api/user/follow", {
    method: unfollow ? "DELETE" : "POST",
    body: JSON.stringify({ username: getUsernameFromPath() }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .then((): void => { followButton.disabled = false; })
    .catch((err: any) => {
      followButton.disabled = false;
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function toggleBlock(e: Event): void {
  let blockButton: HTMLButtonElement | null = e.target as HTMLButtonElement | null;
  if (!blockButton) { return; }

  let unblock: boolean = blockButton.dataset.unblock !== undefined;
  blockButton.disabled = true;

  fetch("/api/user/block", {
    method: unblock ? "DELETE" : "POST",
    body: JSON.stringify({ username: getUsernameFromPath() }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .then((): void => { blockButton.disabled = false; })
    .catch((err: any) => {
      blockButton.disabled = false;
      createToast("Something went wrong!", String(err));
      throw err;
    });
}
