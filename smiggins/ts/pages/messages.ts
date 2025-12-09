function p_messageList(element: D): void {
  let timelineElement: Del = element.querySelector("#timeline-posts");

  if (!timelineElement) { return; }

  hookTimeline(timelineElement, null, {
    message_list: { url: "/api/message/list", disableCaching: true, prependPosts: false, customRender: renderMessageListTimeline, customForward: handleMessageListForward }
  }, "message_list", element);
}

function renderMessageListTimeline(
  groups: MessageList[],
  end: boolean,
  updateCache: boolean,
  moreElementOverride?: el,
  prepend: boolean=false
): void {
  clearTimelineStatuses();

  if (offset.lower === null && groups.length === 0) {
    let none: HTMLElement = document.createElement("i");
    none.classList.add("timeline-status");
    none.innerText = "None";

    tlElement.append(none);

    return;
  }

  let frag: DocumentFragment = document.createDocumentFragment();

  for (const group of groups) {
    let members: string[] = group.members.names.map((a: string): string => (`<b>${a}</b>`))
    let lengthDifference: number = group.members.count - members.length - 1;
    let names: string;

    if (lengthDifference === 0) {
      if (members.length === 1) {
        names = members[0];
      } else if (members.length === 2) {
        names = members.join(" and ");
      } else {
        members[members.length - 1] = "and " + members[members.length - 1];
        names = members.join(", ");
      }
    } else if (lengthDifference === 1) {
      names = members.join(", ") + ", and <b>1 other</b>";
    } else {
      names = members.join(", ") + `, and <b>${lengthDifference} others</b>`;
    }

    let el: D = getSnippet("message-list-item", {
      gid: String(group.group_id),
      timestamp: getTimestamp(group.timestamp),
      content: [group.recent_content ? escapeHTML(group.recent_content) : "<i>No messages</i>", 1],
      names: [names, 1],
    });

    if (!group.unread) {
      el.dataset.notificationRead = "";
    }

    frag.append(el);
  }

  if (prepend) {
    tlElement.prepend(frag);
  } else {
    tlElement.append(frag);

    let more: el = moreElementOverride || document.getElementById("timeline-more");
    if (more) {
      if (end) { more.hidden = true; }
      else { more.hidden = false; }
    }
  }
}

function handleMessageListForward(
  groups: MessageList[],
  end: boolean,
  expectedTlID: string="messages",
  forceEvent: boolean=false
): void {
  tlPollingPendingResponse = false;

  if (expectedTlID !== currentTlID) {
    console.log("timeline switched, discarding request");
    return;
  }

  if (groups.length === 0) { return; }

  if (!end) {
    reloadTimeline(true);
    return;
  }

  renderMessageListTimeline(groups.reverse(), false, false, null, true)
}
