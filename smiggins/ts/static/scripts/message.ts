function refreshMessageList(fromStart=false): void {
  if (fromStart) {
    timelineConfig.vars.offset = -1;
    dom("user-list").innerHTML = "";
  } else {
    timelineConfig.vars.offset++;
    if (!timelineConfig.vars.offset) {
      timelineConfig.vars.offset++;
    }
  }

  s_fetch(`/api/messages/list?offset=${timelineConfig.vars.offset}`, {
    disable: [dom("refresh"), dom("more")]
  });
}

function refreshMessages(start=false, forward=true): void {
  let params: {
    username: string,
    forward: boolean,
    offset: number
  } = {
    username: context.username,
    forward: start || forward,
    offset: start ? -1 : forward ? forwardOffset : reverseOffset
  };

  if (start) {
    dom("messages-go-here-btw").innerHTML = "";
    forwardOffset = 0;
    reverseOffset = 0;
  }

  if (c > 0) {
    return;
  }

  c++;

  s_fetch(`/api/messages?username=${params.username}&forward=${params.forward}&offset=${params.offset}`, {
    extraData: {
      start: start
    },
    postFunction: (success: boolean): void => {
      --c;
    }
  });
}

let forwardOffset: number;
let reverseOffset: number;

function messageInit(): void {
  c = 0;
  forwardOffset = 0
  reverseOffset = 0

  dom("your-mom").onkeydown = (event: KeyboardEvent): void => {
    if ((event.key === "Enter") && !event.shiftKey) {
      event.preventDefault();

      if ((dom("your-mom") as HTMLInputElement).value) {
        s_fetch("/api/messages", {
          method: "POST",
          body: JSON.stringify({
            content: (dom("your-mom") as HTMLInputElement).value,
            username: context.username
          }),
          disable: [dom("your-mom")],
        });
      }
    }
  }

  killIntervals.push(setInterval(
    (): void => {
      if (!document.visibilityState || document.visibilityState == "visible") {
        refreshMessages(false, false);
      }
    }, 10 * 1000
  ));

  refreshMessages(true);
}

function messageListInit(): void {
  timelineConfig.vars.offset = -1;
  refreshMessageList(true);
}


