home = true;
offset = -1;

function refreshMessageList(fromStart=false): void {
  if (fromStart) {
    offset = -1;
    dom("user-list").innerHTML = "";
  } else {
    offset++;
    if (!offset) {
      offset++;
    }
  }

  s_fetch(`/api/messages/list?offset=${offset}`, {
    disable: [dom("refresh"), dom("more")]
  })
}

refreshMessageList(true);
