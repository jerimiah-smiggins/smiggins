// handles replacements in language strings
function lr(str: string, replacements: { [key: string]: string }): string {
  for (const [key, val] of Object.entries(replacements)) {
    str = str.replaceAll("%" + key, val);
  }
  return str;
}

// handles numbered language strings
function n(data: { [key in number | "*"]: string }, num: number): string {
  if (data[num]) {
    return data[num];
  }

  return data["*"];
}

// turns a language key string (ex. "generic.none") and turns it into the
// respective language string (ex. L.generic.none -> "None")
function langFromRaw(key: string): string {
  let response: any = L;

  for (const sect of key.split(".")) {
    response = response[sect];

    if (!response) {
      return key;
    }
  }

  return String(response);
}

function floatintToStr(num: number): string {
  if (num >> 14 & 1) {
    return L.numbers.infinity;
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
    case 0: powerLetter = "%n"; break;
    case 1: powerLetter = L.numbers.thousand; break;
    case 2: powerLetter = L.numbers.million; break;
    case 3: powerLetter = L.numbers.billion; break;
  }

  return lr(powerLetter, {
    n: String(output)
  });
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
    case ErrorCodes.BadRequest: return [L.errors.something_went_wrong];
    case ErrorCodes.BadUsername: switch (context) {
      case ResponseCodes.LogIn:
      case ResponseCodes.AdminDeleteUser:
      case ResponseCodes.GetAdminPermissions:
      case ResponseCodes.SetAdminPermissions:
        return [L.errors.bad_username, L.errors.username_no_user];
      case ResponseCodes.SignUp: return [L.errors.bad_username, L.errors.username_characters];
      case ResponseCodes.TimelineUser: userSetDNE(); return [null];
      default: return [L.errors.bad_username];
    }
    case ErrorCodes.UsernameUsed: return [L.errors.username_used];
    case ErrorCodes.BadPassword: return [L.errors.bad_password];
    case ErrorCodes.InvalidOTP: return [L.errors.invalid_otp, L.errors.invalid_otp_more];
    case ErrorCodes.CantInteract: switch (context) {
      case ResponseCodes.DeletePost: return [L.errors.cant_delete, L.errors.cant_delete_more];
      default: return [L.errors.cant_interact, L.errors.cant_interact_more];
    }
    case ErrorCodes.Blocking: return [L.errors.blocking, L.errors.blocking_more];
    case ErrorCodes.PostNotFound: switch (context) {
      case ResponseCodes.TimelineComments: postSetDNE(); return [null];
      default: return [L.errors.post_not_found];
    }
    case ErrorCodes.PollSingleOption: return [L.errors.invalid_poll, L.errors.poll_more_than_one];
    case ErrorCodes.NotAuthenticated: return [L.errors.not_authenticated, L.errors.not_authenticated_more];
    case ErrorCodes.Ratelimit: return [L.errors.ratelimit, L.errors.ratelimit_more];
  }

  return [L.errors.something_went_wrong, lr(L.errors.error_code, { c: context.toString(16) + code.toString(16) })];
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

function _extractPost(data: Uint8Array): [Post, leftoverData: Uint8Array] {
  let postId: number = _extractInt(32, data);
  let commentParentId: number | null = null;
  let postTimestamp: number = _extractInt(64, data.slice(4));
  let flags: [number, number] = [data[12], data[13]];
  let edited: [post: boolean, quote: boolean] = [_extractBool(flags[1], 7), _extractBool(flags[1], 6)]

  let newData: Uint8Array = data.slice(14);

  if (_extractBool(flags[0], 6)) {
    commentParentId = _extractInt(32, newData);
    newData = newData.slice(4);
  }

  let interactions = {
    likes: _extractInt(16, newData),
    liked: _extractBool(flags[0], 3),
    quotes: _extractInt(16, newData.slice(2)),
    comments: _extractInt(16, newData.slice(4)),
  };

  let content: [string, Uint8Array] = _extractString(16, newData.slice(6));
  let contentWarning: [string, Uint8Array] = _extractString(8, content[1]);
  let username: [string, Uint8Array] = _extractString(8, contentWarning[1]);
  let displayName: [string, Uint8Array] = _extractString(8, username[1]);
  let pronouns: [string, Uint8Array] = _extractString(8, displayName[1]);
  let banner: [string, string] = ["#" + _toHex(pronouns[1].slice(0, 3)), "#" + _toHex(pronouns[1].slice(3, 6))];

  newData = pronouns[1].slice(6);

  let pollData = null
  if (_extractBool(flags[0], 0)) {
    let d = _extractPoll(newData)
    pollData = d[0];
    newData = d[1];
  }

  let quoteData: Post["quote"] = null;
  if (_extractBool(flags[0], 5)) {
    if (!_extractBool(flags[0], 4)) {
      quoteData = false as false;
    } else {
      let quoteIsComment: boolean = _extractBool(flags[0], 1);
      let quoteCommentId: null | number = null;

      if (quoteIsComment) {
        quoteCommentId = _extractInt(32, newData.slice(12));
      }

      let quoteContent: [string, leftoverData: Uint8Array] = _extractString(16, newData.slice(12 + (4 * +quoteIsComment)));
      let quoteCW: [string, leftoverData: Uint8Array] = _extractString(8, quoteContent[1]);
      let quoteUsername: [string, leftoverData: Uint8Array] = _extractString(8, quoteCW[1]);
      let quoteDispName: [string, leftoverData: Uint8Array] = _extractString(8, quoteUsername[1]);
      let quotePronouns: [string, leftoverData: Uint8Array] = _extractString(8, quoteDispName[1]);
      let quoteBanner: [string, string] = ["#" + _toHex(quotePronouns[1].slice(0, 3)), "#" + _toHex(quotePronouns[1].slice(3, 6))];

      quoteData = {
        id: _extractInt(32, newData),
        content: quoteContent[0],
        content_warning: quoteCW[0],
        timestamp: _extractInt(64, newData.slice(4)),
        private: _extractBool(flags[0], 2),
        comment: quoteCommentId,
        edited: edited[1],
        has_poll: _extractBool(flags[1], 5),
        has_quote: _extractBool(flags[1], 4),

        user: {
          username: quoteUsername[0],
          display_name: quoteDispName[0],
          pronouns: quotePronouns[0],
          banner: quoteBanner
        }
      };

      newData = quotePronouns[1].slice(6);
    }
  }

  return [{
    id: postId,
    content: content[0],
    content_warning: contentWarning[0],
    timestamp: postTimestamp,
    private: _extractBool(flags[0], 7),
    comment: commentParentId,
    edited: edited[0],

    interactions: interactions,

    poll: pollData,

    user: {
      username: username[0],
      display_name: displayName[0],
      pronouns: pronouns[0],
      banner: banner
    },

    quote: quoteData
  }, newData];
}

function _extractPoll(data: Uint8Array): [Post["poll"], leftoverData: Uint8Array] {
  let pollData: Post["poll"] = {
    votes: _extractInt(16, data),
    has_voted: false,
    items: [] as {
      content: string,
      percentage: number,
      voted: boolean
    }[]
  };

  let optionCount: number = _extractInt(8, data.slice(2));
  data = data.slice(3);

  for (let i: number = 0; i < optionCount; i++) {
    let content: [string, Uint8Array] = _extractString(8, data);
    let pct: number = _extractInt(16, content[1]);
    let voted: boolean = _extractBool(content[1][2], 7);
    data = content[1].slice(3);

    if (voted) { pollData.has_voted = true; }

    pollData.items.push({
      content: content[0],
      percentage: pct / 10,
      voted: voted
    });
  }

  return [pollData, data];
}

function _toHex(data: Uint8Array): string {
  return [...data].map((i: number): string => i.toString(16).padStart(2, "0")).join("");
}
