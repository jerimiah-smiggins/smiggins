const colorRegex = /^#[0-9a-f]{6}$/;

function getUsernameFromPath(path?: string): string {
  return (path || location.pathname).toLowerCase().split("/").filter(Boolean)[1];
}

function p_user(element: D): void {
  let userUsername: string = getUsernameFromPath();
  let tlId: string = `user_${userUsername}`;

  element.querySelector("#follow")?.addEventListener("click", toggleFollow);
  element.querySelector("#block")?.addEventListener("click", toggleBlock);

  hookTimeline(element.querySelector("[id=\"timeline-posts\"]") as D, element.querySelector("#timeline-carousel") as Del, {
    [tlId]: { url: `/api/timeline/user/${userUsername}`, prependPosts: username === userUsername },
    [tlId + "+all"]: { url: `/api/timeline/user/${userUsername}?include_comments=true`, prependPosts: username === userUsername }
  }, tlId, element);
}

function userSetDNE(): void {
  let tlContainer: el = document.getElementById("timeline-posts");

  if (tlContainer) {
    tlContainer.innerHTML = `<i class="timeline-status">User '${escapeHTML(getUsernameFromPath())}' does not exist.</i>`;
  }
}

function userUpdateStats(
  displayName: string,
  pronouns: string,
  bio: string,
  colorOne: string,
  colorTwo: string,
  following: boolean | "pending",
  blocking: boolean,
  numFollowing: number,
  numFollowers: number,
  numPosts: number,
  pinned: number | null
): void {
  // TODO: pinned posts

  let userUsername: string = getUsernameFromPath();
  let c: UserData | undefined = userCache[userUsername];

  if (c) {
    c.display_name  = displayName;
    c.pronouns      = pronouns || null;
    c.bio           = bio;
    c.color_one     = colorOne;
    c.color_two     = colorTwo;
    c.following     = following;
    c.blocking      = blocking;
    c.num_following = numFollowing;
    c.num_followers = numFollowers;
    c.num_posts     = numPosts;
    c.pinned        = pinned;
  } else {
    c = {
      display_name: displayName || username,
      pronouns: pronouns || null,
      bio: bio,
      color_one: colorOne || "var(--background-mid)",
      color_two: colorTwo || "var(--background-mid)",
      following: following || false,
      blocking: blocking || false,
      num_following: numFollowing || 0,
      num_followers: numFollowers || 0,
      num_posts: numPosts || 0,
      pinned: pinned
    };

    userCache[userUsername] = c;
  }

  if (username !== userUsername) { // follow/block buttons
    document.getElementById("user-interactions")?.removeAttribute("hidden");

    let followElement: el = document.getElementById("follow");
    let blockElement: el = document.getElementById("block");

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

  let bioElement: el = document.getElementById("bio");
  if (bioElement) { bioElement.innerHTML = linkify(escapeHTML(bio)); }

  let notificationString: String = "";

  if (Object.values(pendingNotifications).some(Boolean)) {
    notificationString = "\u2022 ";
  }

  document.title = `${notificationString}${displayName} - ${pageTitle}`;

  let displayNameElement: el = document.getElementById("display-name");
  if (displayNameElement) {
    displayNameElement.innerText = displayName;
  }

  let usernameElement: el = document.getElementById("username");
  if (usernameElement) {
    usernameElement.innerText = "@" + userUsername + (pronouns && " - ") + pronouns
  }

  let bannerElement: el = document.getElementById("user-banner");
  if (bannerElement) {
    if (colorRegex.test(colorOne)) { bannerElement.style.setProperty("--color-one", colorOne); }
    if (colorRegex.test(colorTwo)) { bannerElement.style.setProperty("--color-two", colorTwo); }
  }

  let pinnedContainer: el = document.getElementById("user-pinned-container");
  if (pinnedContainer) {
    if (pinned) {
      pinnedContainer.removeAttribute("hidden");
      let pinnedElement: el = document.getElementById("user-pinned");
      if (pinnedElement && !pinnedElement.querySelector(`[data-post-id="${pinned}"]`)) {
        let postElement: D = getPost(pinned, false);

        if (userUsername === username) {
          let pinElement: el = postElement.querySelector("[data-interaction-pin]");

          if (pinElement) {
            delete pinElement.dataset.interactionPin;
            pinElement.dataset.interactionUnpin = String(pinned);
            pinElement.innerHTML = Icons.unpin + " Unpin";
          }
        }

        pinnedElement.replaceChildren(postElement);
      }
    } else {
      pinnedContainer.setAttribute("hidden", "");
    }
  }

  let followingElement: el = document.getElementById("following");
  let followersElement: el = document.getElementById("followers");
  let postsElement: el = document.getElementById("post-count");
  if (followingElement) { followingElement.innerText = floatintToStr(numFollowing); }
  if (followersElement) { followersElement.innerText = floatintToStr(numFollowers); }
  if (postsElement) { postsElement.innerText = floatintToStr(numPosts); }
}

function updateFollowButton(followed: false): void;
function updateFollowButton(followed: true, pending: boolean): void;
function updateFollowButton(followed: boolean, pending?: boolean): void {
  let followButton: el = document.getElementById("follow");
  if (!followButton) { return; }

  let c: UserData | undefined = userCache[username];

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
  let blockButton: el = document.getElementById("block");
  if (!blockButton) { return; }

  if (blocked) {
    blockButton.innerText = "Unblock";
    blockButton.dataset.unblock = "";

    let followButton: el = document.getElementById("follow");
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
  let followButton: Bel = e.target as Bel;
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
  let blockButton: Bel = e.target as Bel;
  if (!blockButton) { return; }

  let unblock: boolean = blockButton.dataset.unblock !== undefined;
  blockButton.disabled = true;

  blockUser(
    getUsernameFromPath(),
    !unblock,
    blockButton
  );
}

function blockUser(username: string, toBlock: boolean, disable?: B): void {
  fetch("/api/user/block", {
    method: toBlock ? "POST" : "DELETE",
    body: username
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .then((): void => { if (disable) { disable.disabled = false; }})
    .catch((err: any): void => {
      if (disable) { disable.disabled = false; }
      createToast("Something went wrong!", String(err));
      throw err;
    });
}
