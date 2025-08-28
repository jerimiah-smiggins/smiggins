const colorRegex = /^#[0-9a-f]{6}$/;

function p_user(element: HTMLDivElement): void {
  let userUsername: string = location.pathname.toLowerCase().split("/").filter(Boolean)[1];
  let tlId: string = `user_${userUsername}`;

  hookTimeline(element.querySelector("[id=\"timeline-posts\"]") as HTMLDivElement, {
    [tlId]: { url: `/api/timeline/user/${userUsername}`, prependPosts: username === userUsername, timelineCallback: userUpdateStats }
  }, tlId);
}

function userUpdateStats(json: api_timeline): void {
  if (!json.success && json.reason === "BAD_USERNAME") {
    let tlContainer = document.getElementById("timeline-posts");

    if (tlContainer) {
      tlContainer.innerHTML = `<i class="timeline-status">User '${escapeHTML(location.pathname.toLowerCase().split("/").filter(Boolean)[1])}' does not exist.</i>`;
    }
  }

  if (!json.success || !json.extraData) { return; }

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
