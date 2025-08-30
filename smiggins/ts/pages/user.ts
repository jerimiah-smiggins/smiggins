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
    [tlId]: { url: `/api/timeline/user/${userUsername}`, prependPosts: username === userUsername, timelineCallback: userUpdateStats }
  }, tlId);
}

function userUpdateStats(json: api_timeline): void {
  if (!json.success && json.reason === "BAD_USERNAME") {
    let tlContainer = document.getElementById("timeline-posts");

    if (tlContainer) {
      tlContainer.innerHTML = `<i class="timeline-status">User '${escapeHTML(getUsernameFromPath())}' does not exist.</i>`;
    }
  }

  if (!json.success || !json.extraData) { return; }

  if (username !== getUsernameFromPath()) {
    document.getElementById("user-interactions")?.removeAttribute("hidden");

    let followElement: HTMLElement | null = document.getElementById("follow");
    let blockElement: HTMLElement | null = document.getElementById("block");

    if (followElement) {
      if (json.extraData.following) {
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
  if (displayNameElement && displayName) { displayNameElement.innerText = displayName; }

  let bannerElement: HTMLElement | null = document.getElementById("user-banner");
  if (bannerElement) {
    let colorOne: string | undefined = json.extraData.color_one;
    let colorTwo: string | undefined = json.extraData.color_two;

    if (colorOne && colorRegex.test(colorOne)) { bannerElement.style.setProperty("--color-one", colorOne); }
    if (colorTwo && colorRegex.test(colorTwo)) { bannerElement.style.setProperty("--color-two", colorTwo); }
  }
}

function toggleFollow(e: Event) {
  let followButton: HTMLButtonElement | null = e.target as HTMLButtonElement | null;
  if (!followButton) { return; }

  let unfollow: boolean = followButton.dataset.unfollow !== undefined;

  followButton.disabled = true;

  fetch("/api/user/follow", {
    method: unfollow ? "DELETE" : "POST",
    body: JSON.stringify({ username: getUsernameFromPath() }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<api_follow_add> => (response.json()))
    .then((json: api_follow_add) => {
      if (json.success) {
        if (unfollow) {
          followButton.innerText = "Follow";
          delete followButton.dataset.unfollow;
        } else if (json.pending) {
          followButton.innerText = "Pending";
          followButton.dataset.unfollow = "";
        } else {
          followButton.innerText = "Unfollow";
          followButton.dataset.unfollow = "";
        }
      } else {
        createToast(...errorCodeStrings(json.reason, "user"));
      }

      followButton.disabled = false;
    })
    .catch((err: any) => {
      followButton.disabled = false;
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function toggleBlock(e: Event) {
  let blockButton: HTMLButtonElement | null = e.target as HTMLButtonElement | null;
  if (!blockButton) { return; }

  let unblock: boolean = blockButton.dataset.unblock !== undefined;

  blockButton.disabled = true;

  fetch("/api/user/block", {
    method: unblock ? "DELETE" : "POST",
    body: JSON.stringify({ username: getUsernameFromPath() }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<GENERIC_API_RESPONSE> => (response.json()))
    .then((json: GENERIC_API_RESPONSE) => {
      if (json.success) {
        console.log(json, unblock, blockButton);
        if (unblock) {
          blockButton.innerText = "Block";
          delete blockButton.dataset.unblock;
        } else {
          blockButton.innerText = "Unblock";
          blockButton.dataset.unblock = "";
        }
      } else {
        createToast(...errorCodeStrings(json.reason, "user"));
      }

      blockButton.disabled = false;
    })
    .catch((err: any) => {
      blockButton.disabled = false;
      createToast("Something went wrong!", String(err));
      throw err;
    });
}
