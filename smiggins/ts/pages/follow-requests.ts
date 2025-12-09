function p_folreq(element: D): void {
  let timelineElement: Del = element.querySelector("#timeline-posts");

  if (!timelineElement) { return; }

  hookTimeline(timelineElement, null, {
    "follow-requests": { url: "/api/timeline/follow-requests", disableCaching: true, disablePolling: true, prependPosts: false, customRender: renderFolreqTimeline }
  }, "follow-requests", element);
}

function renderFolreqTimeline(
  users: FollowRequestUserData[],
  end: boolean,
  updateCache: boolean,
  moreElementOverride?: el
): void {
  clearTimelineStatuses();

  if (offset.lower === null && users.length === 0) {
    let none: HTMLElement = document.createElement("i");
    none.classList.add("timeline-status");
    none.innerText = "None";

    tlElement.append(none);

    return;
  }

  let frag: DocumentFragment = document.createDocumentFragment();
  let more: el = moreElementOverride || document.getElementById("timeline-more");

  if (more) {
    if (end) { more.hidden = true; }
    else { more.hidden = false; }
  }

  for (const user of users) {
    let el: D = getSnippet("folreq-user", {
      username: user.username,
      bio: [linkify(escapeHTML(user.bio)), 1],
      display_name: [linkify(escapeHTML(user.display_name)), 1]
    });

    el.querySelector("[data-folreq-interaction-accept]")?.addEventListener("click", folreqInteraction);
    el.querySelector("[data-folreq-interaction-deny]")?.addEventListener("click", folreqInteraction);
    el.querySelector("[data-folreq-interaction-block]")?.addEventListener("click", folreqInteraction);

    el.dataset.folreqRemove = user.username;

    frag.append(el);
  }

  tlElement.append(frag);
}

function folreqInteraction(e: Event): void {
  let el: el = e.currentTarget as el;
  if (!el) { return; }

  if (el.dataset.folreqInteractionAccept || el.dataset.folreqInteractionDeny) {
    let username: string = el.dataset.folreqInteractionAccept || el.dataset.folreqInteractionDeny || "";
    document.querySelector(`[data-folreq-remove="${username}"]`)?.remove();

    fetch("/api/user/follow-request", {
      method: el.dataset.folreqInteractionAccept ? "POST" : "DELETE",
      body: username
    }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
      .then(parseResponse)
      .catch((err: any): void => {
        createToast("Something went wrong!", String(err));
        throw err;
      });
  } else if (el.dataset.folreqInteractionBlock) {
    document.querySelector(`[data-folreq-remove="${el.dataset.folreqInteractionBlock}"]`)?.remove();
    blockUser(el.dataset.folreqInteractionBlock, true);
  }
}
