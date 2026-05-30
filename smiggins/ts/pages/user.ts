const colorRegex = /^#[0-9a-f]{6}$/;
let followingTimelineOffset: Offset = null;

function getUsernameFromPath(path?: string): string {
  return (path || location.pathname).toLowerCase().split("/").filter(Boolean)[1];
}

function p_user(element: D): void {
  let userUsername: string = getUsernameFromPath();
  let tlId: string = `user_${userUsername}`;

  element.querySelector("#follow")?.addEventListener("click", toggleFollow);
  element.querySelector("#block")?.addEventListener("click", toggleBlock);
  element.querySelector("#mute")?.addEventListener("click", toggleMute);
  element.querySelector("#user-relationship-help")?.addEventListener("click", createRelationshipHelpModal);
  element.querySelector("#following-popup")?.addEventListener("click", (): void => (createFollowingModal("following", userUsername)));
  element.querySelector("#followers-popup")?.addEventListener("click", (): void => (createFollowingModal("followers", userUsername)));

  hookTimeline(element.querySelector("[id=\"timeline-posts\"]") as D, element.querySelector("#timeline-carousel") as Del, {
    [tlId]: { api: api_TimelineUser, args: [userUsername], prependPosts: username === userUsername },
    [tlId + "+all"]: { api: api_TimelineUser, args: [userUsername, true], prependPosts: username === userUsername }
  }, tlId, element);
}

function userSetDNE(): void {
  let tlContainer: el = document.getElementById("timeline-posts");

  if (tlContainer) {
    tlContainer.innerHTML = `<i class="timeline-status">${lr(L.errors.user_dne, { u: escapeHTML(getUsernameFromPath()), })}</i>`;
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
  muting: boolean,
  numFollowing: number,
  numFollowers: number,
  numPosts: number,
  pinned: number | null
): void {
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
    c.muting        = muting;
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
      muting: muting || false,
      num_following: numFollowing || 0,
      num_followers: numFollowers || 0,
      num_posts: numPosts || 0,
      pinned: pinned
    };

    userCache[userUsername] = c;
  }

  if (username !== userUsername) { // follow/block/mute buttons
    document.getElementById("user-interactions")?.removeAttribute("hidden");

    let followElement: el = document.getElementById("follow");
    let blockElement: el = document.getElementById("block");
    let muteElement: el = document.getElementById("mute");

    if (followElement) {
      if (c.following === "pending") {
        followElement.innerText = L.user.pending;
        followElement.dataset.unfollow = "";
      } else if (c.following) {
        followElement.innerText = L.user.unfollow;
        followElement.dataset.unfollow = "";
      } else {
        followElement.innerText = L.user.follow;
        delete followElement.dataset.unfollow;
      }
    }

    if (blockElement) {
      if (c.blocking) {
        blockElement.innerText = L.user.unblock;
        blockElement.dataset.unblock = "";
      } else {
        blockElement.innerText = L.user.block;
        delete blockElement.dataset.unblock;
      }
    }

    if (muteElement) {
      if (c.muting) {
        muteElement.innerText = L.user.unmute;
        muteElement.dataset.unmute = "";
      } else {
        muteElement.innerText = L.user.mute;
        delete muteElement.dataset.unmute;
      }
    }
  }

  let bioElement: el = document.getElementById("bio");
  if (bioElement) { bioElement.innerHTML = linkify(escapeHTML(bio)); generateInternalLinks(bioElement); }

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
            pinElement.innerHTML = icons.unpin + " " + L.post.unpin;
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
  if (followingElement) { followingElement.innerText = lr(L.user.following_count, { n: c && floatintToStr(numFollowing) || "0" }); }
  if (followersElement) { followersElement.innerText = lr(L.user.followed_by_count, { n: c && floatintToStr(numFollowers) || "0" }); }
  if (postsElement) { postsElement.innerText = lr(n(L.user.post_count, floatintToNum(numPosts)), { n: c && floatintToStr(numPosts) || "0" }); }
}

function updateFollowButton(followed: false): void;
function updateFollowButton(followed: true, pending: boolean): void;
function updateFollowButton(followed: boolean, pending?: boolean): void {
  let followButton: el = document.getElementById("follow");
  if (!followButton) { return; }

  let c: UserData | undefined = userCache[username];

  if (!followed) {
    followButton.innerText = L.user.follow;
    delete followButton.dataset.unfollow;
    if (c) { c.following = false; }
  } else if (pending) {
    followButton.innerText = L.user.pending;
    followButton.dataset.unfollow = "";
    if (c) { c.following = "pending"; }
  } else {
    followButton.innerText = L.user.unfollow;
    followButton.dataset.unfollow = "";
    if (c) { c.following = true; }
  }
}

function updateBlockButton(blocked: boolean): void {
  let blockButton: el = document.getElementById("block");
  if (!blockButton) { return; }

  if (blocked) {
    blockButton.innerText = L.user.unblock;
    blockButton.dataset.unblock = "";

    let followButton: el = document.getElementById("follow");
    if (followButton && followButton.dataset.unfollow !== undefined) {
      delete followButton.dataset.unfollow;
      followButton.innerText = L.user.follow;
    }
  } else {
    blockButton.innerText = L.user.block;
    delete blockButton.dataset.unblock;
  }
}

function updateMuteButton(muted: boolean): void {
  let muteButton: el = document.getElementById("mute");
  if (!muteButton) { return; }

  if (muted) {
    muteButton.innerText = L.user.unmute;
    muteButton.dataset.unmute = "";
  } else {
    muteButton.innerText = L.user.mute;
    delete muteButton.dataset.unmute;
  }
}

function toggleFollow(e: Event): void {
  let followButton: Bel = e.target as Bel;
  if (!followButton) { return; }

  let unfollow: boolean = followButton.dataset.unfollow !== undefined;

  new (unfollow ? api_Unfollow : api_Follow)(getUsernameFromPath(), followButton).fetch()
}

function toggleBlock(e: Event): void {
  let blockButton: Bel = e.target as Bel;
  if (!blockButton) { return; }

  let unblock: boolean = blockButton.dataset.unblock !== undefined;

  blockUser(
    getUsernameFromPath(),
    !unblock,
    blockButton
  );
}

function blockUser(username: string, toBlock: boolean, disable?: B): void {
  new (toBlock ? api_Block : api_Unblock)(username, disable).fetch()
}

function toggleMute(e: Event): void {
  let muteButton: Bel = e.target as Bel;
  if (!muteButton) { return; }

  let unmute: boolean = muteButton.dataset.unmute !== undefined;

  new (unmute ? api_Unmute : api_Mute)(getUsernameFromPath(), muteButton).fetch()
}

function hookFollowingTimeline(type: "following" | "followers", username: string): void {
  let tlElement: el = document.getElementById("modal-following-timeline");
  if (!tlElement) { return; }

  followingTimelineOffset = null;
  loadFollowingTimeline(type, username);

  document.getElementById("modal-timeline-more")?.addEventListener("click", (): void => (loadFollowingTimeline(type, username)));
}

function loadFollowingTimeline(type: "following" | "followers", username: string): void {
  document.getElementById("modal-timeline-more")?.setAttribute("hidden", "");
  document.getElementById("modal-following-timeline")?.insertAdjacentHTML("beforeend", `<i class="timeline-status">${L.generic.loading}</i>`);

  new (type === "following" ? api_TimelineUserFollowing : api_TimelineUserFollowers)(followingTimelineOffset, username).fetch();
}

function renderFollowingTimeline(users: FollowRequestUserData[], end: boolean): void {
  let el: el = document.getElementById("modal-following-timeline");
  if (!el) { return; }

  let frag: DocumentFragment = document.createDocumentFragment();

  clearTimelineStatuses(el);

  if (followingTimelineOffset === null && users.length === 0) {
    if (el) { el.innerHTML = `<i class="timeline-status">${L.generic.none}</i>`; }
  }

  for (const u of users) {
    let el: D = getSnippet("folreq-user", {
      username: u.username,
      banner_one: u.color_one,
      banner_two: u.color_two,
      hidden_if_no_pronouns: u.pronouns ? "" : "hidden",
      bio: [u.bio ? linkify(escapeHTML(u.bio), u.username) : `<i>${L.user.no_bio}</i>`, 1],
      pronouns: [escapeHTML(u.pronouns || ""), 1],
      display_name: [escapeHTML(u.display_name), 1]
    });

    el.querySelector(".folreq-interactions")?.remove();

    frag.append(el);

    if (followingTimelineOffset === null || u.id < followingTimelineOffset[1]) {
      followingTimelineOffset = [0, u.id]; // timestamp doesn't matter for following/followers
    }
  }

  el?.append(frag);

  if (end) {
    document.getElementById("modal-timeline-more")?.setAttribute("hidden", "");
  } else {
    document.getElementById("modal-timeline-more")?.removeAttribute("hidden");
  }
}
