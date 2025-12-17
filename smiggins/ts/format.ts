// api stuff

enum ResponseCodes {
  NOOP = -1,
  LogIn = 0x01,
  SignUp,
  Follow = 0x10,
  Unfollow,
  Block,
  Unblock,
  AcceptFolreq,
  DenyFolreq,
  GetProfile = 0x20,
  SaveProfile,
  DeleteAccount,
  ChangePassword,
  DefaultVisibility,
  VerifyFollowers,
  CreatePost = 0x30,
  Like,
  Unlike,
  Pin,
  Unpin,
  PollVote,
  PollRefresh,
  EditPost = 0x3e,
  DeletePost,
  AdminDeleteUser = 0x40,
  GenerateOTP,
  DeleteOTP,
  ListOTP,
  GetAdminPermissions,
  SetAdminPermissions,
  MessageGroupTimeline = 0x50,
  MessageTimeline,
  MessageSend,
  MessageGetGID,
  TimelineGlobal = 0x60,
  TimelineFollowing,
  TimelineUser,
  TimelineComments,
  TimelineNotifications,
  TimelineHashtag,
  TimelineFolreq,
  TimelineSearch,
  TimelineUserFollowing,
  TimelineUserFollowers,
  Notifications = 0x70
};

enum ErrorCodes {
  BadRequest,
  BadUsername = 0x10,
  UsernameUsed,
  BadPassword,
  InvalidOTP,
  CantInteract = 0x20,
  Blocking,
  PostNotFound = 0x30,
  PollSingleOption,
  NotAuthenticated = 0xfe,
  Ratelimit
};

class _api_Base {
  readonly id: ResponseCodes = ResponseCodes.NOOP;
  readonly version: number = 0;

  readonly url: string = "/api/noop";
  readonly method: Method = "GET";

  disabled: (el | undefined)[] = [];

  requestBody: ArrayBuffer | string | null = null;
  requestParams: string | null = null;

  constructor(...params: any) {}

  async fetch(): Promise<boolean | void> {
    for (const el of this.disabled) {
      el?.setAttribute("disabled", "");
    }

    return fetch(this.url + (this.requestParams ? ((this.url.includes("?") ? "&" : "?") + this.requestParams) : ""), {
      method: this.method,
      body: this.requestBody
    }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
      .then((ab: ArrayBuffer): Uint8Array => (new Uint8Array(ab)))
      .then((u8arr: Uint8Array): boolean => {
        if ((u8arr[0] & 0b01111111) !== this.id) {
          throw Error(`Bad response code - expected ${this.id}/${this.id | 0x80}, got ${u8arr[0]}`);
        }

        if (u8arr[0] >> 7 & 1) {
          this.err(u8arr[1]);
          return false;
        }

        if (u8arr[1] !== this.version) {
          alert(lr(L.generic.pending_update, {
            t: pageTitle,
            c: `r${u8arr[0].toString(16)}v${u8arr[1]}t${Math.round(Date.now() / 1000)}`
          }));
          throw Error("Bad version");
        }

        this.handle(u8arr);
        return true;
      })
      // inline function to make this in always work properly
      .catch((err: any): void => (this.genericError(err)))
      .finally((): void => (this.always()));
  }

  always(): void {
    for (const el of this.disabled) {
      el?.removeAttribute("disabled");
    }
  }

  // handles the response
  handle(u8arr: Uint8Array): void {
    throw Error("Not Implemented");
  }

  // builtin api error handling
  err(code: ErrorCodes): void {
    createToast(..._getErrorStrings(code, this.id));
  }

  // for when there is an actual js error thrown
  genericError(err: any): void {
    createToast(L.errors.something_went_wrong, String(err));
    this.always();
    throw err;
  }
}

class _api_TimelineBase extends _api_Base {
  expectedTlID: string;

  constructor(offset: number | null, forwards: boolean | "force") {
    super();
    this.expectedTlID = currentTlID;

    if (offset) {
      this.requestParams = `offset=${offset}`;

      if (forwards) {
        this.requestParams += "&forwards=true";

        if (forwards === "force") {
          this.expectedTlID = "$" + this.expectedTlID;
        }
      }
    }
  }

  handle(u8arr: Uint8Array): void {
    let end: boolean = _extractBool(u8arr[2], 7);
    let forwards: boolean | "force" = _extractBool(u8arr[2], 6);
    let numPosts: number = u8arr[3];
    let posts: Post[] = [];
    u8arr = u8arr.slice(4);

    for (let i: number = 0; i < numPosts; i++) {
      let postData: [Post, Uint8Array] = _extractPost(u8arr);

      posts.push(postData[0]);
      u8arr = postData[1];
    }

    if (forwards) {
      if (this.expectedTlID.startsWith("$")) {
        // Add posts directly to timeline instead of forward cache
        handleForward(posts, end, this.expectedTlID.slice(1), true);
      } else {
        handleForward(posts, end, this.expectedTlID);
      }
    } else {
      renderTimeline(insertIntoPostCache(posts), end);
    }
  }
}

// 0X - Authentication
class api_LogIn extends _api_Base {
  readonly id: ResponseCodes = ResponseCodes.LogIn;
  readonly version: number = 0;

  readonly url: string = "/api/user/login";
  readonly method: Method = "POST";

  constructor(username: string, password: string, button?: Bel) {
    super();

    this.requestBody = buildRequest(
      [username, 8],
      hexToBytes(sha256(password))
    );

    this.disabled = [button];
  }

  handle(u8arr: Uint8Array): void {
    setTokenCookie(_toHex(u8arr.slice(2)));
    location.href = "/";
  }
}

class api_SignUp extends api_LogIn {
  readonly id: ResponseCodes = ResponseCodes.SignUp;
  readonly version: number = 0;

  readonly url: string = "/api/user/signup";
}

// 1X - Relationships
class api_Follow extends _api_Base {
  readonly id: ResponseCodes = ResponseCodes.Follow;
  readonly version: number = 0;

  readonly url: string = "/api/user/follow";
  readonly method: Method = "POST";

  constructor(username: string, button?: Bel) {
    super();
    this.requestBody = username;
    this.disabled = [button];
  }

  handle(u8arr: Uint8Array): void {
    updateFollowButton(true, Boolean(u8arr[2] & (1 << 7)));
  }
}

class api_Unfollow extends api_Follow {
  readonly id: ResponseCodes = ResponseCodes.Unfollow;
  readonly version: number = 0;

  readonly method: Method = "DELETE";

  handle(u8arr: Uint8Array): void {
    updateFollowButton(false);
  }
}

class api_Block extends api_Follow {
  readonly id: ResponseCodes = ResponseCodes.Block;
  readonly version: number = 0;

  readonly url: string = "/api/user/block";
  readonly method: Method = "POST";

  handle(u8arr: Uint8Array): void {
    updateBlockButton(true);
  }
}

class api_Unblock extends api_Block {
  readonly id: ResponseCodes = ResponseCodes.Unblock;
  readonly version: number = 0;

  readonly method: Method = "DELETE";

  handle(u8arr: Uint8Array): void {
    updateBlockButton(false);
  }
}

class api_AcceptFollowRequest extends _api_Base {
  readonly id: ResponseCodes = ResponseCodes.AcceptFolreq;
  readonly version: number = 0;

  readonly url: string = "/api/user/follow-request";
  readonly method: Method = "POST";

  constructor(username: string) {
    super();
    this.requestBody = username;
  }

  handle(u8arr: Uint8Array): void {}
}

class api_DenyFollowRequest extends api_AcceptFollowRequest {
  readonly id: ResponseCodes = ResponseCodes.DenyFolreq;
  readonly version: number = 0;

  readonly method: Method = "DELETE";
}

// 2X - Settings and Account Management
class api_GetProfile extends _api_Base {
  readonly id: ResponseCodes = ResponseCodes.GetProfile;
  readonly version: number = 0;

  readonly url: string = "/api/user";
  readonly method: Method = "GET";

  handle(u8arr: Uint8Array): void {
    let displayName: [string, Uint8Array] = _extractString(8, u8arr.slice(2));
    let bio: [string, Uint8Array] = _extractString(16, displayName[1]);
    let pronouns: [string, Uint8Array] = _extractString(8, bio[1]);

    profileSettingsSetUserData(
      displayName[0],
      bio[0],
      pronouns[0],
      "#" + _toHex(pronouns[1].slice(0, 3)),
      "#" + _toHex(pronouns[1].slice(3, 6)),
      _extractBool(pronouns[1][6], 7),
      _extractBool(pronouns[1][6], 6)
    );
  }
}

class api_SaveProfile extends _api_Base {
  readonly id: ResponseCodes = ResponseCodes.SaveProfile;
  readonly version: number = 0;

  readonly url: string = "/api/user";
  readonly method: Method = "PATCH";

  constructor(
    gradient: boolean,
    displayName: string,
    bio: string,
    pronouns: string,
    colorOne: string,
    colorTwo: string,
    button?: Bel,
  ) {
    super();
    this.disabled = [button];
    this.requestBody = buildRequest(
      gradient,
      [displayName, 8],
      [bio, 16],
      [pronouns, 8],
      hexToBytes(colorOne + colorTwo)
    );
  }

  handle(u8arr: Uint8Array): void {
    createToast(L.generic.success, L.settings.profile_saved);
    updateUserCacheFromCosmeticSettings();
  }
}

class api_DeleteAccount extends _api_Base {
  id: ResponseCodes = ResponseCodes.DeleteAccount;
  version: number = 1;

  url: string = "/api/user";
  method: Method = "DELETE";

  constructor(username: string, password: string, button?: Bel) {
    super();
    this.disabled = [button];
    this.requestBody = buildRequest(
      hexToBytes(sha256(password)),
      [username, 8]
    );
  }

  handle(u8arr: Uint8Array): void {
    renderPage("logout");
  }
}

class api_ChangePassword extends _api_Base {
  id: ResponseCodes = ResponseCodes.ChangePassword;
  version: number = 0;

  url: string = "/api/user/password";
  method: Method = "PATCH";

  constructor(currentPassword: string, newPassword: string, button?: Bel) {
    super();
    this.disabled = [button];
    this.requestBody = buildRequest(
      hexToBytes(sha256(currentPassword) + sha256(newPassword))
    );
  }

  handle(u8arr: Uint8Array): void {
    changePasswordSuccess(_toHex(u8arr.slice(2)));
  }
}

class api_DefaultVisibility extends _api_Base {
  id: ResponseCodes = ResponseCodes.DefaultVisibility;
  version: number = 0;

  url: string = "/api/user/default_post";
  method: Method = "PATCH";

  constructor(defaultPrivate: boolean) {
    super();
    this.requestBody = buildRequest([+defaultPrivate, 8]);
  }

  handle(u8arr: Uint8Array): void {}
}

class api_VerifyFollowers extends _api_Base {
  id: ResponseCodes = ResponseCodes.VerifyFollowers;
  version: number = 0;

  url: string = "/api/user/verify_followers";
  method: Method = "PATCH";

  constructor(verify: boolean) {
    super();
    this.requestBody = buildRequest([+verify, 8]);
  }

  handle(u8arr: Uint8Array): void {}
}

// 3X - Posts and Interactions
class api_CreatePost extends _api_Base {
  id: ResponseCodes = ResponseCodes.CreatePost;
  version: number = 0;

  url: string = "/api/post";
  method: Method = "POST";

  constructor(
    content: string,
    cw: string | null,
    followersOnly: boolean,
    extra?: {
      quote?: number,
      poll?: string[],
      comment?: number
    }
  ) {
    super();
    this.requestBody = buildRequest(
      followersOnly,
      Boolean(extra && extra.quote),
      Boolean(extra && extra.poll && extra.poll.length),
      Boolean(extra && extra.comment),
      [content, 16],
      [cw || "", 8],
      ...((extra && extra.poll && extra.poll.length) ? [[extra.poll.length, 8] as [number, 8], ...extra.poll.map((a: string): [string, 8] => ([a, 8]))] : []),
      ...((extra && extra.quote) ? [[extra.quote, 32] as [number, 32]] : []),
      ...((extra && extra.comment) ? [[extra.comment, 32] as [number, 32]] : [])
    );
  }

  handle(u8arr: Uint8Array): void {
    prependPostToTimeline(_extractPost(u8arr.slice(2))[0]);
  }
}

class api_Like extends _api_Base {
  id: ResponseCodes = ResponseCodes.Like;
  version: number = 0;

  url: string;
  method: Method = "POST";

  constructor(pid: number) {
    super();
    this.url = `/api/post/like/${pid}`
  }

  handle(u8arr: Uint8Array): void {}
}

class api_Unlike extends api_Like {
  id: ResponseCodes = ResponseCodes.Unlike;
  version: number = 0;

  method: Method = "DELETE";

  handle(u8arr: Uint8Array): void {}
}

class api_Pin extends _api_Base {
  id: ResponseCodes = ResponseCodes.Pin;
  version: number = 0;

  url: string;
  method: Method = "POST";

  constructor(pid: number) {
    super();
    this.url = `/api/post/pin/${pid}`
  }

  handle(u8arr: Uint8Array): void {
    createToast(L.generic.success, L.post.pinned);
  }
}

class api_Unpin extends _api_Base {
  id: ResponseCodes = ResponseCodes.Unpin;
  version: number = 0;

  url: string = "/api/post/pin";
  method: Method = "DELETE";

  handle(u8arr: Uint8Array): void {
    createToast(L.generic.success, L.post.unpinned);
    document.getElementById("user-pinned-container")?.setAttribute("hidden", "");
  }
}

class api_PollVote extends _api_Base {
  id: ResponseCodes = ResponseCodes.PollVote;
  version: number = 0;

  url: string = "/api/post/poll";
  method: Method = "POST";

  constructor(pid: number, option: number) {
    super();
    this.requestBody = buildRequest([pid, 32], [option, 8]);
  }

  handle(u8arr: Uint8Array): void {
    let pid: number = _extractInt(32, u8arr.slice(2));
    let pollData: Post["poll"] = _extractPoll(u8arr.slice(6))[0];

    let c: Post | undefined = postCache[pid];
    if (c) { c.poll = pollData; }

    refreshPollDisplay(pid, true);
  }
}

class api_PollRefresh extends api_PollVote {
  id: ResponseCodes = ResponseCodes.PollRefresh;
  version: number = 0;

  url: string;
  method: Method = "GET";

  constructor(pid: number) {
    super(0, 0);
    this.url = `/api/post/poll/${pid}`;
    this.requestBody = null;
  }
}

class api_EditPost extends _api_Base {
  id: ResponseCodes = ResponseCodes.EditPost;
  version: number = 0;

  url: string = "/api/post";
  method: Method = "PATCH";

  constructor(id: number, content: string, cw: string, privatePost: boolean, button?: Bel) {
    super();
    this.disabled = [button];
    this.requestBody = buildRequest(
      [id, 32],
      privatePost,
      [content, 16],
      [cw, 8]
    );
  }

  handle(u8arr: Uint8Array): void {}
}

class api_DeletePost extends _api_Base {
  id: ResponseCodes = ResponseCodes.DeletePost;
  version: number = 0;

  url: string = "/api/post";
  method: Method = "DELETE";

  constructor(pid: number) {
    super();
    this.requestBody = buildRequest([pid, 32]);
  }

  handle(u8arr: Uint8Array): void {
    handlePostDelete(_extractInt(32, u8arr.slice(2)));
  }
}

// 4X - Administration
class api_AdminDeleteUser extends _api_Base {
  id: ResponseCodes = ResponseCodes.AdminDeleteUser;
  version: number = 0;

  url: string = "/api/admin/user";
  method: Method = "DELETE";

  constructor(username: string) {
    super();
    this.requestBody = username;
  }

  handle(u8arr: Uint8Array): void {
    createToast(L.generic.success, L.admin.user_deleted);
  }
}

class api_GenerateOTP extends _api_Base {
  id: ResponseCodes = ResponseCodes.GenerateOTP;
  version: number = 0;

  url: string = "/api/admin/invite";
  method: Method = "POST";

  handle(u8arr: Uint8Array): void {
    let otp: string = _toHex(u8arr.slice(2));
    let el: el = document.getElementById("generate-otp-output");
    if (el) { el.classList.add("otp"); el.innerText = otp; }
    el?.removeAttribute("hidden");
    navigator.clipboard.writeText(otp)
      .then((): void => createToast(L.generic.copied, L.admin.invite_code_copied));
  }
}

class api_DeleteOTP extends _api_Base {
  id: ResponseCodes = ResponseCodes.DeleteOTP;
  version: number = 0;

  url: string = "/api/admin/invite";
  method: Method = "DELETE";

  constructor(otp: string) {
    super();
    this.requestBody = buildRequest(hexToBytes(otp));
  }

  handle(u8arr: Uint8Array): void {}
}

class api_ListOTP extends _api_Base {
  id: ResponseCodes = ResponseCodes.ListOTP;
  version: number = 0;

  url: string = "/api/admin/invite";
  method: Method = "GET";

  handle(u8arr: Uint8Array): void {
    let el: el = document.getElementById("otp-list");
    if (!el) { return; }

    let otps: RegExpMatchArray[] = [..._toHex(u8arr.slice(2)).matchAll(/.{64}/g)];
    if (!otps.length) { el.innerHTML = `<i>${L.generic.none}</i>`; return; }

    el.innerHTML = otps.map((a: RegExpMatchArray): string => `<div data-otp-container="${a[0]}"><code class="otp">${a[0]}</code> <button data-otp="${a}">${L.admin.otp_delete_button}</button></div>`).join("");

    for (const button of el.querySelectorAll("button")) {
      button.addEventListener("click", adminDeleteOTP);
    }
  }
}

class api_GetAdminPermissions extends _api_Base {
  id: ResponseCodes = ResponseCodes.GetAdminPermissions;
  version: number = 0;

  url: string;
  method: Method = "GET";

  constructor(username: string) {
    super();
    this.url = `/api/admin/permissions/${username}`;
  }

  handle(u8arr: Uint8Array): void {
    adminSetPermissionCheckboxes(_extractInt(16, u8arr.slice(2)));
  }
}

class api_SetAdminPermissions extends _api_Base {
  id: ResponseCodes = ResponseCodes.SetAdminPermissions;
  version: number = 0;

  url: string = "/api/admin/permissions";
  method: Method = "POST";

  constructor(username: string, val: number) {
    super();
    this.requestBody = buildRequest([val, 16], [username, 8]);
  }

  handle(u8arr: Uint8Array): void {
    createToast(L.generic.success, L.admin.permissions_saved);
  }
}

// 5X - Messages
class api_MessageGroupTimeline extends _api_TimelineBase {
  id: ResponseCodes = ResponseCodes.MessageGroupTimeline;
  version: number = 0;

  url: string = "/api/message/list";
  method: Method = "GET";

  handle(u8arr: Uint8Array): void {
    let end: boolean = _extractBool(u8arr[2], 7);
    let forwards: boolean | "force" = _extractBool(u8arr[2], 6);
    let numGroups: number = u8arr[3];
    let messageListItems: MessageList[] = [];
    u8arr = u8arr.slice(4);

    for (let i: number = 0; i < numGroups; i++) {
      let gid: number = _extractInt(32, u8arr);
      let ts: number = _extractInt(64, u8arr.slice(4));
      let unread: boolean = _extractBool(u8arr[12], 7);
      let content: [string, Uint8Array] = _extractString(16, u8arr.slice(13));
      u8arr = content[1].slice(1);

      let members: string[] = [];
      for (let i: number = 0; i < Math.min(content[1][0] - 1, 3); i++) {
        let name: [string, Uint8Array] = _extractString(8, u8arr);
        members.push(name[0]);
        u8arr = name[1];
      }

      messageListItems.push({
        group_id: gid,
        timestamp: ts,
        unread: unread,
        recent_content: content[0],

        members: {
          count: content[1][0],
          names: members
        }
      });
    }

    if (forwards) {
      handleMessageListForward(messageListItems, end, "message_list", true);
    } else {
      renderMessageListTimeline(messageListItems, end, false);
    }

  }
}

class api_MessageTimeline extends _api_TimelineBase {
  id: ResponseCodes = ResponseCodes.MessageTimeline;
  version: number = 0;

  url: string;
  method: Method = "GET";

  constructor(offset: number | null, forwards: boolean | "force", gid: number) {
    super(offset, forwards);
    this.url = `/api/messages/${gid}`;
  }

  handle(u8arr: Uint8Array): void {
    let memberCount: number = u8arr[2];
    let members: string[] = [];
    u8arr = u8arr.slice(3);
    for (let i: number = 0; i < Math.min(memberCount - 1, 3); i++) {
      let name: [string, Uint8Array] = _extractString(8, u8arr);
      members.push(name[0]);
      u8arr = name[1];
    }

    let el: el = document.getElementById("message-title");
    if (el)  {
      el.innerHTML = getMessageTitle(members, memberCount);
    }

    let end: boolean = _extractBool(u8arr[0], 7);
    let forwards: boolean | "force" = _extractBool(u8arr[0], 6);
    let numMessages: number = u8arr[1];
    let messages: Message[] = [];
    u8arr = u8arr.slice(2);

    for (let i: number = 0; i < numMessages; i++) {
      let ts: number = _extractInt(64, u8arr);
      let content: [string, Uint8Array] = _extractString(16, u8arr.slice(8));
      let username: [string, Uint8Array] = _extractString(8, content[1]);
      let displayName: [string, Uint8Array] = _extractString(8, username[1]);
      u8arr = displayName[1];

      messages.push({
        timestamp: ts,
        content: content[0],
        username: username[0],
        display_name: displayName[0]
      });
    }

    if (forwards) {
      handleMessageForward(messages, end, "message", true);
    } else {
      renderMessageTimeline(messages, end, false);
    }
  }
}

class api_MessageSend extends _api_Base {
  id: ResponseCodes = ResponseCodes.MessageSend;
  version: number = 0;

  url: string;
  method: Method = "POST";

  constructor(gid: number, content: string, input?: Iel) {
    super();
    this.disabled = [input];
    this.url = `/api/message/${gid}`;
    this.requestBody = buildRequest([content, 16]);
  }

  handle(u8arr: Uint8Array): void {
    let compose: Iel = document.getElementById("messages-compose") as Iel;
    if (compose) {
      compose.disabled = false;
      compose.value = "";
      compose.focus();
    }

    if (document.querySelector("#timeline-posts > div")) {
      timelinePolling(true);
    } else {
      reloadTimeline(true);
    }
  }
}

class api_MessageGetGID extends _api_Base {
  id: ResponseCodes = ResponseCodes.MessageGetGID;
  version: number = 0;

  url: string = "/api/message/group";
  method: Method = "GET";

  constructor(usernames: string[], button?: Bel) {
    super();
    this.disabled = [button];
    this.requestParams = `usernames=${usernames.join(",")}`;
  }

  handle(u8arr: Uint8Array): void {
    let gid: number = _extractInt(32, u8arr.slice(2));

    history.pushState("message", "", `/message/${gid}/`);
    renderPage("message");
    clearModal()
  }
}

// 6X - Timelines
class api_TimelineGlobal extends _api_TimelineBase {
  id: ResponseCodes = ResponseCodes.TimelineGlobal;
  version: number = 0;

  url: string;
  method: Method = "GET";

  constructor(offset: number | null, forwards: boolean | "force", comments?: boolean) {
    super(offset, forwards);
    this.url = `/api/timeline/global${comments ? "?comments=true" : ""}`;
  }
}

class api_TimelineFollowing extends _api_TimelineBase {
  id: ResponseCodes = ResponseCodes.TimelineFollowing;
  version: number = 0;

  url: string;
  method: Method = "GET";

  constructor(offset: number | null, forwards: boolean | "force", comments?: boolean) {
    super(offset, forwards);
    this.url = `/api/timeline/following${comments ? "?comments=true" : ""}`;
  }
}

class api_TimelineUser extends _api_TimelineBase {
  id: ResponseCodes = ResponseCodes.TimelineUser;
  version: number = 0;

  url: string;
  method: Method = "GET";

  constructor(offset: number | null, forwards: boolean | "force", username?: string, comments?: boolean) {
    super(offset, forwards);
    this.url = `/api/timeline/user/${username}${comments ? "?include_comments=true" : ""}`;
  }

  handle(u8arr: Uint8Array): void {
    let displayName: [string, Uint8Array] = _extractString(8, u8arr.slice(2));
    let pronouns: [string, Uint8Array] = _extractString(8, displayName[1]);
    let bio: [string, Uint8Array] = _extractString(16, pronouns[1]);
    let flags: number = bio[1][12];
    let pinned: number | null = null;
    let pinnedPostData: [Post, Uint8Array] | undefined;

    // has pinned post
    if (_extractBool(flags, 2)) {
      pinnedPostData = _extractPost(bio[1].slice(13));
      pinned = insertIntoPostCache([pinnedPostData[0]])[0];
    }

    userUpdateStats(
      displayName[0],
      pronouns[0],
      bio[0],
      "#" + _toHex(bio[1].slice(0, 3)),
      "#" + _toHex(bio[1].slice(3, 6)),
      _extractBool(flags, 3) && "pending" || _extractBool(flags, 5),
      _extractBool(flags, 4),
      _extractInt(16, bio[1].slice(8)),
      _extractInt(16, bio[1].slice(6)),
      _extractInt(16, bio[1].slice(10)),
      pinned
    );

    u8arr = new Uint8Array([0, 0, flags].concat(Array.from(pinnedPostData ? pinnedPostData[1] : bio[1].slice(13))));

    super.handle(u8arr);
  }
}

class api_TimelineComments extends _api_TimelineBase {
  id: ResponseCodes = ResponseCodes.TimelineComments;
  version: number = 0;

  url: string;
  method: Method = "GET";

  constructor(offset: number | null, forwards: boolean | "force", pid?: number, sort?: "recent" | "oldest") {
    super(offset, forwards);
    this.url = `/api/timeline/post/${pid}?sort=${sort}`;
  }

  handle(u8arr: Uint8Array): void {
    let postData: [Post, leftoverData: Uint8Array] = _extractPost(u8arr.slice(2));
    updateFocusedPost(postData[0]);
    u8arr = new Uint8Array([0].concat(Array.from(postData[1])));
    super.handle(u8arr);
  }
}

class api_TimelineNotifications extends _api_TimelineBase {
  id: ResponseCodes = ResponseCodes.TimelineNotifications;
  version: number = 0;

  url: string = "/api/timeline/notifications";
  method: Method = "GET";

  handle(u8arr: Uint8Array): void {
    let end: boolean = _extractBool(u8arr[2], 7);
    let forwards: boolean | "force" = _extractBool(u8arr[2], 6);
    let numPosts: number = u8arr[3];
    let posts: [Post, number][] = [] as [Post, number][];
    u8arr = u8arr.slice(4);

    for (let i: number = 0; i < numPosts; i++) {
      let postData: [Post, Uint8Array] = _extractPost(u8arr.slice(1));
      posts.push([postData[0], u8arr[0]]);
      u8arr = postData[1];
    }

    if (forwards) {
      handleNotificationForward(posts, end, "notifications");
    } else {
      renderNotificationTimeline(posts, end, false);
    }
  }
}

class api_TimelineHashtag extends _api_TimelineBase {
  id: ResponseCodes = ResponseCodes.TimelineHashtag;
  version: number = 0;

  url: string;
  method: Method = "GET";

  constructor(offset: number | null, forwards: boolean | "force", tag?: string, sort?: "recent" | "oldest") {
    super(offset, forwards);
    this.url = `/api/timeline/tag/${tag}?sort=${sort}`;
  }
}

class api_TimelineFolreq extends _api_TimelineBase {
  id: ResponseCodes = ResponseCodes.TimelineFolreq;
  version: number = 1;

  url: string = "/api/timeline/follow-requests";
  method: Method = "GET";

  constructor(offset: number | null, _: any) { super(offset, false); }

  handle(u8arr: Uint8Array): void {
    let end: boolean = _extractBool(u8arr[2], 7);
    let numUsers: number = u8arr[3];
    let users: FollowRequestUserData[] = [];
    u8arr = u8arr.slice(4);

    for (let i: number = 0; i < numUsers; i++) {
      let id: number = _extractInt(32, u8arr);
      let username: [string, Uint8Array] = _extractString(8, u8arr.slice(4));
      let pronouns: [string, Uint8Array] = _extractString(8, username[1]);
      let displayName: [string, Uint8Array] = _extractString(8, pronouns[1].slice(6));
      let bio: [string, Uint8Array] = _extractString(16, displayName[1]);

      u8arr = bio[1];

      users.push({
        username: username[0],
        pronouns: pronouns[0] || null,
        color_one: "#" + _toHex(pronouns[1].slice(0, 3)),
        color_two: "#" + _toHex(pronouns[1].slice(3, 6)),
        display_name: displayName[0],
        bio: bio[0],
        id: id
      });
    }

    renderFolreqTimeline(users, end, false);
  }
}

class api_TimelineSearch extends _api_TimelineBase {
  id: ResponseCodes = ResponseCodes.TimelineSearch;
  version: number = 0;

  url: string;
  method: Method = "GET";

  constructor(offset: number | null, forwards: boolean | "force", params?: string, sort?: "new" | "old") {
    super(offset, forwards);
    this.url = `/api/timeline/search?sort=${sort}&${params}`;
  }
}

class api_TimelineUserFollowing extends _api_TimelineBase {
  id: ResponseCodes = ResponseCodes.TimelineUserFollowing;
  version: number = 0;

  url: string;
  method: Method = "GET";

  constructor(offset: number | null, username: string) {
    super(offset, false);
    this.url = `/api/timeline/user/following/${username}`;
  }

  handle(u8arr: Uint8Array): void {
    let end: boolean = _extractBool(u8arr[2], 7);
    let numUsers: number = u8arr[3];
    let users: FollowRequestUserData[] = [];
    u8arr = u8arr.slice(4);

    for (let i: number = 0; i < numUsers; i++) {
      let id: number = _extractInt(32, u8arr);
      let username: [string, Uint8Array] = _extractString(8, u8arr.slice(4));
      let pronouns: [string, Uint8Array] = _extractString(8, username[1]);
      let displayName: [string, Uint8Array] = _extractString(8, pronouns[1].slice(6));
      let bio: [string, Uint8Array] = _extractString(16, displayName[1]);

      u8arr = bio[1];

      users.push({
        username: username[0],
        pronouns: pronouns[0] || null,
        color_one: "#" + _toHex(pronouns[1].slice(0, 3)),
        color_two: "#" + _toHex(pronouns[1].slice(3, 6)),
        display_name: displayName[0],
        bio: bio[0],
        id: id
      });
    }

    renderFollowingTimeline(users, end);
  }
}

class api_TimelineUserFollowers extends api_TimelineUserFollowing {
  id: ResponseCodes = ResponseCodes.TimelineUserFollowers;

  constructor(offset: number | null, username: string) {
    super(offset, username);
    this.url = `/api/timeline/user/followers/${username}`;
  }
}

// 7X - Statuses
class api_Notifications extends _api_Base {
  id: ResponseCodes = ResponseCodes.Notifications;
  version: number = 0;

  url: string = "/api/notifications";
  method: Method = "GET";

  handle(u8arr: Uint8Array): void {
    pendingNotifications = {
      notifications: _extractBool(u8arr[2], 7),
      messages: _extractBool(u8arr[2], 6),
      follow_requests: _extractBool(u8arr[2], 5)
    };

    resetNotificationIndicators();
  }

  genericError(err: any): void {}
}
