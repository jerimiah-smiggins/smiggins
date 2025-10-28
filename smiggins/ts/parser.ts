enum ResponseCodes {
  LogIn = 0x01,
  SignUp,
  Follow = 0x10,
  Unfollow,
  Block,
  Unblock,
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
  EditPost = 0x3e,
  DeletePost,
  TimelineGlobal = 0x60,
  TimelineFollowing,
  TimelineUser,
  TimelineComments,
  TimelineNotifications,
  TimelineHashtag,
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

function floatintToStr(num: number): string {
  if (num >> 14 & 1) {
    return "Infinity";
  }

  let negative: number = 1;
  if (num >> 13 & 1) {
    negative = -1;
  }

  let output: number = (num >> 3 & 0b1111111111) * negative;
  let power: number = num & 0b11;
  let d10: boolean = Boolean(num >> 2 & 1);

  if (d10) { output /= 10; }

  let powerLetter: string = "";
  switch (power) {
    case 0: powerLetter = ""; break;
    case 1: powerLetter = "k"; break;
    case 2: powerLetter = "m"; break;
    case 3: powerLetter = "b"; break;
  }

  return String(output) + powerLetter;
}

function floatintToNum(num: number): number {
  if (num >> 14 & 1) {
    return Infinity;
  }

  let negative: number = 1;
  if (num >> 13 & 1) {
    negative = -1;
  }

  let output: number = (num >> 3 & 0b1111111111) * negative;
  let power: number = num & 0b11;
  let d10: boolean = Boolean(num >> 2 & 1);

  if (d10) { output /= 10; }

  return output * (1000 ** power);
}

function _getErrorStrings(code: number, context: number): [title: string | null, content?: string] {
  switch (code) {
    case ErrorCodes.BadRequest: return ["Something went wrong!"];
    case ErrorCodes.BadUsername: switch (context) {
      case ResponseCodes.LogIn: return ["Invalid username.", "No user has that username."];
      case ResponseCodes.SignUp: return ["Invalid username.", "Usernames can only include the characters a-z, 0-9, _, and -."];
      case ResponseCodes.TimelineUser: userSetDNE(); return [null];
      default: return ["Invalid username."];
    }
    case ErrorCodes.UsernameUsed: return ["Username in use."];
    case ErrorCodes.BadPassword: return ["Invalid password."];
    case ErrorCodes.InvalidOTP: return ["Invalid invite code.", "Make sure your invite code is correct and try again."];
    case ErrorCodes.CantInteract: switch (context) {
      case ResponseCodes.DeletePost: return ["Can't delete.", "You don't have permissions to delete this post."];
      default: return ["Can't interact.", "You can't interact with this user for some reason."];
    }
    case ErrorCodes.Blocking: return ["You are blocking this person.", "You need to unblock them to do this."];
    case ErrorCodes.PostNotFound: switch (context) {
      case ResponseCodes.TimelineComments: postSetDNE(); return [null];
      default: return ["Post not found."];
    }
    case ErrorCodes.PollSingleOption: return ["Invalid poll.", "Must have more than one option."];
    case ErrorCodes.NotAuthenticated: return ["Not Authenticated.", "You need to be logged in to do this."];
    case ErrorCodes.Ratelimit: return ["Ratelimited.", "Try again in a few seconds."];
  }

  return ["Something went wrong!", "Error code " + context.toString(16) + code.toString(16)];
}

function _extractString(lengthBits: 8 | 16, data: Uint8Array): [string, leftoverData: Uint8Array] {
  let length: number = _extractInt(lengthBits, data);

  return [
    new TextDecoder().decode(data.slice(lengthBits / 8, lengthBits / 8 + length)),
    data.slice(lengthBits / 8 + length)
  ];
}

function _extractInt(lengthBits: 8 | 16 | 32 | 64, data: Uint8Array): number {
  let output: number = 0;

  for (let i: number = 0; i * 8 < lengthBits; i++) {
    output <<= 8;
    output += data[i];
  }

  return output;
}

function _extractBool(num: number, offset: number): boolean {
  return Boolean((num >> offset) & 1);
}

function _extractPost(data: Uint8Array): [post, leftoverData: Uint8Array] {
  let postId: number = _extractInt(32, data);
  let commentParentId: number | null = null;
  let postTimestamp: number = _extractInt(64, data.slice(4));
  let flags: number = data[12];

  let newData: Uint8Array = data.slice(13);

  if (_extractBool(flags, 6)) {
    commentParentId = _extractInt(32, newData);
    newData = newData.slice(4);
  }

  let interactions = {
    likes: _extractInt(16, newData),
    liked: _extractBool(flags, 3),
    quotes: _extractInt(16, newData.slice(2)),
    comments: _extractInt(16, newData.slice(4)),
  };

  let content: [string, leftoverData: Uint8Array] = _extractString(16, newData.slice(6));
  let contentWarning: [string, leftoverData: Uint8Array] = _extractString(8, content[1]);
  let username: [string, leftoverData: Uint8Array] = _extractString(8, contentWarning[1]);
  let displayName: [string, leftoverData: Uint8Array] = _extractString(8, username[1]);
  let pronouns: [string, leftoverData: Uint8Array] = _extractString(8, displayName[1]);

  let quoteData = null;
  newData = pronouns[1];

  if (_extractBool(flags, 5)) {
    if (!_extractBool(flags, 4)) {
      quoteData = undefined;
    } else {
      let quoteIsComment: boolean = _extractBool(flags, 1);
      let quoteCommentId: null | number = null;

      if (quoteIsComment) {
        quoteCommentId = _extractInt(32, newData.slice(12));
      }

      let quoteContent: [string, leftoverData: Uint8Array] = _extractString(16, newData.slice(12 + (4 * +quoteIsComment)));
      let quoteCW: [string, leftoverData: Uint8Array] = _extractString(8, quoteContent[1]);
      let quoteUsername: [string, leftoverData: Uint8Array] = _extractString(8, quoteCW[1]);
      let quoteDispName: [string, leftoverData: Uint8Array] = _extractString(8, quoteUsername[1]);
      let quotePronouns: [string, leftoverData: Uint8Array] = _extractString(8, quoteDispName[1]);

      quoteData = {
        id: _extractInt(32, newData),
        content: quoteContent[0],
        content_warning: quoteCW[0],
        timestamp: _extractInt(64, newData.slice(4)),
        private: _extractBool(flags, 2),
        comment: quoteCommentId,

        user: {
          username: quoteUsername[0],
          display_name: quoteDispName[0],
          pronouns: quotePronouns[0]
        }
      }

      newData = quotePronouns[1];
    }
  }

  return [{
    id: postId,
    content: content[0],
    content_warning: contentWarning[0],
    timestamp: postTimestamp,
    private: _extractBool(flags, 7),
    comment: commentParentId,

    interactions: interactions,

    user: {
      username: username[0],
      display_name: displayName[0],
      pronouns: pronouns[0]
    },

    quote: quoteData
  }, newData];
}

function _toHex(data: Uint8Array): string {
  return [...data].map((i: number): string => i.toString(16).padStart(2, "0")).join("");
}

function parseResponse(
  data: ArrayBuffer,
  extraVariableSometimesUsed?: string
  // TODO: add an onerror callback (returns true/false depending on if it should use default toast)
  // should be used for likes and whatnot that assume success so they can unlike if it errors
): void {
  let u8arr: Uint8Array = new Uint8Array(data);
  let displayName: [string, leftoverData: Uint8Array];
  let bio: [string, leftoverData: Uint8Array];
  let end: boolean;
  let forwards: boolean;
  let numPosts: number;
  let posts;

  if (u8arr[0] >> 7 & 1) {
    return createToast(..._getErrorStrings(u8arr[1], u8arr[0] ^ (1 << 7)));
  }

  switch (u8arr[0]) {
    case ResponseCodes.LogIn:
    case ResponseCodes.SignUp:
      setTokenCookie(_toHex(u8arr.slice(1)));
      location.href = "/";
      break;

    case ResponseCodes.Follow: updateFollowButton(true, Boolean(u8arr[1] & (1 << 7))); break;
    case ResponseCodes.Unfollow: updateFollowButton(false); break;
    case ResponseCodes.Block: updateBlockButton(true); break;
    case ResponseCodes.Unblock: updateBlockButton(false); break;

    case ResponseCodes.GetProfile:
      displayName = _extractString(8, u8arr.slice(1));
      bio = _extractString(16, displayName[1]);
      let pronouns: [string, leftoverData: Uint8Array] = _extractString(8, bio[1]);

      profileSettingsSetUserData(
        displayName[0],
        bio[0],
        pronouns[0],
        "#" + _toHex(pronouns[1].slice(0, 3)),
        "#" + _toHex(pronouns[1].slice(3, 6)),
        _extractBool(pronouns[1][6], 7),
        _extractBool(pronouns[1][6], 6)
      );
      break;

    case ResponseCodes.SaveProfile:
      createToast("Success!", "Your profile has been saved.");
      updateUserCacheFromCosmeticSettings();
      break;

    case ResponseCodes.DeleteAccount: renderPage("logout"); break;
    case ResponseCodes.ChangePassword: changePasswordSuccess(_toHex(u8arr.slice(1))); break;
    case ResponseCodes.DefaultVisibility: break;
    case ResponseCodes.VerifyFollowers: break;

    case ResponseCodes.CreatePost: prependPostToTimeline(_extractPost(u8arr.slice(1))[0]); break;
    case ResponseCodes.Like: break;
    case ResponseCodes.Unlike: break;
    case ResponseCodes.Pin: createToast("Success!", "Pinned to your profile."); break;
    case ResponseCodes.Unpin: createToast("Success!", "This post is no Pinned to your profilelonger pinned to your profile."); break;
    case ResponseCodes.EditPost: break;
    case ResponseCodes.DeletePost: handlePostDelete(_extractInt(32, u8arr.slice(1))); break;

    case ResponseCodes.TimelineUser:
      displayName = _extractString(8, u8arr.slice(1));
      bio = _extractString(16, displayName[1]);

      userUpdateStats(
        displayName[0],
        bio[0],
        "#" + _toHex(bio[1].slice(0, 3)),
        "#" + _toHex(bio[1].slice(3, 6)),
        _extractBool(bio[1][10], 4) && "pending" || _extractBool(bio[1][10], 5),
        _extractBool(bio[1][10], 2),
        _extractInt(16, bio[1].slice(8)),
        _extractInt(16, bio[1].slice(6))
      );

      u8arr = bio[1].slice(9);

    case ResponseCodes.TimelineComments:
      // Prevent accidentally running this code when on user timeline
      if (u8arr[0] === ResponseCodes.TimelineComments) {
        let postData: [post, leftoverData: Uint8Array] = _extractPost(u8arr.slice(1));
        updateFocusedPost(postData[0]);
        u8arr = postData[1];
      }

    case ResponseCodes.TimelineGlobal:
    case ResponseCodes.TimelineFollowing:
    case ResponseCodes.TimelineHashtag:
      end = _extractBool(u8arr[1], 7);
      forwards = _extractBool(u8arr[1], 6);
      numPosts = u8arr[2];
      posts = [];
      u8arr = u8arr.slice(3);

      for (let i: number = 0; i < numPosts; i++) {
        let postData: [post, Uint8Array] = _extractPost(u8arr);

        posts.push(postData[0]);
        u8arr = postData[1];
      }

      if (forwards) {
        // Add posts directly to timeline instead of forward cache
        if (extraVariableSometimesUsed?.startsWith("$")) {
          handleForward(posts, end, extraVariableSometimesUsed.slice(1), true);
        } else if (extraVariableSometimesUsed) {
          handleForward(posts, end, extraVariableSometimesUsed);
        } else {
          console.log("uh uhhhh why isn't the url set for forwards tl ????");
        }
      } else {
        renderTimeline(insertIntoPostCache(posts), end);
      }

      break;

    case ResponseCodes.TimelineNotifications:
      end = _extractBool(u8arr[1], 7);
      forwards = _extractBool(u8arr[1], 6);
      numPosts = u8arr[2];
      posts = [] as [post, number][];
      u8arr = u8arr.slice(3);

      for (let i: number = 0; i < numPosts; i++) {
        let notificationType = u8arr[0];
        let postData: [post, Uint8Array] = _extractPost(u8arr.slice(1));

        posts.push([postData[0], notificationType]);
        u8arr = postData[1];
      }

      if (forwards) {
        // TODO: forwards handling for notifs
        // Add posts directly to timeline instead of forward cache
        if (extraVariableSometimesUsed?.startsWith("$")) {
          handleNotificationForward(posts, end, extraVariableSometimesUsed.slice(1), true);
        } else if (extraVariableSometimesUsed) {
          handleNotificationForward(posts, end, extraVariableSometimesUsed);
        } else {
          console.log("uh uhhhh why isn't the url set for forwards tl ????");
        }
      } else {
        renderNotificationTimeline(posts, end, false);
      }
      break;

    case ResponseCodes.Notifications:
      pendingNotifications = {
        notifications: _extractBool(u8arr[1], 7),
        messages: _extractBool(u8arr[1], 6),
        follow_requests: _extractBool(u8arr[1], 5)
      };
      resetNotificationIndicators();
      break;

    default: console.log("Unknown response code " + u8arr[0].toString(16));
  }
}
