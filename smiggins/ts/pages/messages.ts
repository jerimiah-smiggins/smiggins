const MESSAGE_SEPARATION_TIMESTAMP_THRESHOLD: number = 600; // 10 minutes
let messageListTLCache: {
  offset: { lower: number | null, upper: number | null },
  items: MessageList[],
  end: boolean
} = {
  offset: {
    lower: null,
    upper: null
  },
  items: [],
  end: false
};

function getMessageGroupIDFromPath(path?: string): number {
  return +(path || location.pathname).split("/").filter(Boolean)[1];
}

function p_messageList(element: D): void {
  let timelineElement: Del = element.querySelector("#timeline-posts");

  if (!timelineElement) { return; }

  hookTimeline(timelineElement, null, {
    message_list: { url: "/api/message/list", disableCaching: true, prependPosts: false, customRender: renderMessageListTimeline, customForward: handleMessageListForward }
  }, "message_list", element);

  if (messageListTLCache.items.length) {
    offset = { ...messageListTLCache.offset };
    renderMessageListTimeline(messageListTLCache.items, messageListTLCache.end, false);
  }
}

function p_message(element: D): void {
  let timelineElement: Del = element.querySelector("#timeline-posts");

  if (!timelineElement) { return; }

  hookTimeline(timelineElement, null, {
    message: { url: `/api/messages/${getMessageGroupIDFromPath()}`, disableCaching: true, prependPosts: false, customRender: renderMessageTimeline, customForward: handleMessageForward }
  }, "message", element);
}

function renderMessageListTimeline(
  groups: MessageList[],
  end: boolean,
  _: boolean,
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
    if (!offset.lower || group.timestamp < offset.lower) { offset.lower = group.timestamp; }
    if (!offset.upper || group.timestamp > offset.upper) { offset.upper = group.timestamp; }

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

    let existing: el = document.querySelector(`[data-message-group-id="${group.group_id}"]`);
    if (prepend) {
      existing?.remove();
    } else if (!existing) {
      el.dataset.messageGroupId = String(group.group_id);
      frag.append(el);
    }
  }

  messageListTLCache.offset = { ...offset };

  if (prepend) {
    tlElement.prepend(frag);
    messageListTLCache.items = groups.concat(messageListTLCache.items);
  } else {
    tlElement.append(frag);
    messageListTLCache.items.push(...groups);
    messageListTLCache.end = end;

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
  expectedTlID: string="message_list",
  _: boolean=false
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

function _getMessageSeparator(message: Message): D {
  let separator: D = document.createElement("div");
  separator.dataset.messageSeparator = "";

  if (message.username === username) {
    separator.dataset.messageSelf = "";
  }

  separator.innerHTML = `<a data-internal-link="user" href="/u/${message.username}/" class="plain-link">${escapeHTML(message.display_name)}</a> - ${getTimestamp(message.timestamp)}`;
  generateInternalLinks(separator);

  return separator;
}

function renderMessageTimeline(
  messages: Message[],
  end: boolean,
  _: boolean,
  moreElementOverride?: el,
  prepend: boolean=false
): void {
  clearTimelineStatuses();

  let scrollToBottom: boolean = offset.lower === null;

  if (messages.length === 0) {
    if (offset.lower === null) {
      let none: HTMLElement = document.createElement("i");
      none.classList.add("timeline-status");
      none.innerText = "None";

      tlElement.append(none);
    }

    return;
  }

  let frag: DocumentFragment = document.createDocumentFragment();
  let previous: Message = messages[0];

  for (const message of messages) {
    if (!offset.lower || message.timestamp < offset.lower) { offset.lower = message.timestamp; }
    if (!offset.upper || message.timestamp > offset.upper) { offset.upper = message.timestamp; }

    if (previous.username !== message.username || previous.timestamp - MESSAGE_SEPARATION_TIMESTAMP_THRESHOLD > message.timestamp) {
      frag.append(_getMessageSeparator(previous));
    }

    previous = message;

    let el: D = document.createElement("div");
    el.innerHTML = linkify(escapeHTML(message.content));

    if (message.username === username) {
      el.dataset.messageSelf = "";
    }

    frag.append(el);
  }

  frag.append(_getMessageSeparator(previous));
  let scrollElement: el = document.getElementById("messages-timeline-container");

  if (prepend) {
    tlElement.prepend(frag);

    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  } else {
    let oldScrollTop: number | undefined = scrollElement?.scrollTop;
    let oldScrollHeight: number | undefined = scrollElement?.scrollHeight;

    tlElement.append(frag);

    let more: el = moreElementOverride || document.getElementById("timeline-more");
    if (more) {
      if (end) { more.hidden = true; }
      else { more.hidden = false; }
    }

    if (scrollElement && scrollToBottom) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    } else if (scrollElement && oldScrollTop !== undefined && oldScrollHeight !== undefined) {
      scrollElement.scrollTop = oldScrollTop + scrollElement.scrollHeight - oldScrollHeight;
    }
  }
}

function handleMessageForward(
  messages: Message[],
  end: boolean,
  expectedTlID: string="message",
  _: boolean=false
): void {
  tlPollingPendingResponse = false;

  if (expectedTlID !== currentTlID) {
    console.log("timeline switched, discarding request");
    return;
  }

  if (messages.length === 0) { return; }

  if (!end) {
    reloadTimeline(true);
    return;
  }

  renderMessageTimeline(messages.reverse(), false, false, null, true)
}
