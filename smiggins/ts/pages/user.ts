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
    [tlId]: { url: `/api/timeline/user/${userUsername}`, prependPosts: username === userUsername },
    [tlId + "_all"]: { url: `/api/timeline/user/${userUsername}?include_comments=true`, prependPosts: username === userUsername }
  }, tlId, element);
}

function userSetDNE(): void {
  let tlContainer: HTMLElement | null = document.getElementById("timeline-posts");

  if (tlContainer) {
    tlContainer.innerHTML = `<i class="timeline-status">User '${escapeHTML(getUsernameFromPath())}' does not exist.</i>`;
  }
}

function userUpdateStats(
  displayName: string,
  bio: string,
  colorOne: string,
  colorTwo: string,
  following: boolean | "pending",
  blocking: boolean,
  numFollowing: number,
  numFollowers: number
): void {
  // TODO: pinned posts

  let userUsername: string = getUsernameFromPath();
  let c: userData | undefined = userCache[userUsername];

  if (c) {
    c.display_name  = displayName;
    c.bio           = bio
    c.color_one     = colorOne;
    c.color_two     = colorTwo;
    c.following     = following;
    c.blocking      = blocking;
    c.num_following = numFollowing;
    c.num_followers = numFollowers;
  } else {
    c = {
      display_name: displayName || username,
      bio: bio,
      color_one: colorOne || "var(--background-mid)",
      color_two: colorTwo || "var(--background-mid)",
      following: following || false,
      blocking: blocking || false,
      num_following: numFollowing || 0,
      num_followers: numFollowers || 0
    };

    userCache[userUsername] = c;
  }

  if (username !== userUsername) { // follow/block buttons
    document.getElementById("user-interactions")?.removeAttribute("hidden");

    let followElement: HTMLElement | null = document.getElementById("follow");
    let blockElement: HTMLElement | null = document.getElementById("block");

    if (followElement) {
      if (following === "pending") {
        followElement.innerText = "Pending";
        followElement.dataset.unfollow = "";
      } else if (following) {
        followElement.innerText = "Unfollow";
        followElement.dataset.unfollow = "";
      } else {
        followElement.innerText = "Follow";
        delete followElement.dataset.unfollow;
      }
    }

    if (blockElement) {
      if (blocking) {
        blockElement.innerText = "Unblock";
        blockElement.dataset.unblock = "";
      } else {
        blockElement.innerText = "Block";
        delete blockElement.dataset.unblock;
      }
    }
  }

  let bioElement: HTMLElement | null = document.getElementById("bio");
  if (bioElement) { bioElement.innerHTML = linkify(escapeHTML(bio)); }

  document.title = `${displayName} - ${pageTitle}`;

  let displayNameElement: HTMLElement | null = document.getElementById("display-name");
  if (displayNameElement) {
    displayNameElement.innerText = displayName;
  }

  let bannerElement: HTMLElement | null = document.getElementById("user-banner");
  if (bannerElement) {
    if (colorRegex.test(colorOne)) { bannerElement.style.setProperty("--color-one", colorOne); }
    if (colorRegex.test(colorTwo)) { bannerElement.style.setProperty("--color-two", colorTwo); }
  }

  let followingElement: HTMLElement | null = document.getElementById("following");
  let followersElement: HTMLElement | null = document.getElementById("followers");
  if (followingElement) { followingElement.innerText = floatintToStr(numFollowing); }
  if (followersElement) { followersElement.innerText = floatintToStr(numFollowers); }
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
    body: getUsernameFromPath()
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
    body: getUsernameFromPath()
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .then((): void => { blockButton.disabled = false; })
    .catch((err: any) => {
      blockButton.disabled = false;
      createToast("Something went wrong!", String(err));
      throw err;
    });
}
