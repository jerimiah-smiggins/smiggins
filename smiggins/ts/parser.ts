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
  TimelineUser = 0xff // Not implemeneted
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

function _getErrorStrings(code: number, context: number): [title: string | null, content?: string] {
  console.log(code, context);
  switch (code) {
    case ErrorCodes.BadRequest: return ["Something went wrong!"];
    case ErrorCodes.BadUsername: switch (context) {
      case ResponseCodes.LogIn: return ["Invalid username.", "No user has that username."];
      case ResponseCodes.SignUp: return ["Invalid username.", "Usernames can only include the characters a-z, 0-9, _, and -."];
      case ResponseCodes.TimelineUser: return [null]; // TODO: update timeline to show user dne
      default: return ["Invalid username."];
    }
    case ErrorCodes.UsernameUsed: return ["Username in use."];
    case ErrorCodes.BadPassword: return ["Invalid password."];
    case ErrorCodes.InvalidOTP: return ["Invalid invite code.", "Make sure your invite code is correct and try again."];
    case ErrorCodes.CantInteract: return ["Can't interact.", "You can't interact with this user for some reason."];
    case ErrorCodes.Blocking: return ["You are blocking this person.", "You need to unblock them to do this."];
    case ErrorCodes.PostNotFound: return ["Post not found."];
    case ErrorCodes.PollSingleOption: return ["Invalid poll.", "Must have more than one option."];
    case ErrorCodes.NotAuthenticated: return ["Not Authenticated.", "You need to be logged in to do this."];
    case ErrorCodes.Ratelimit: return ["Ratelimited.", "Try again in a few seconds."];
  }

  return ["Something went wrong!", "Error code " + context.toString(16) + code.toString(16)];
}

function _extractString(lengthBits: 8 | 16, data: Uint8Array): [string, leftoverData: Uint8Array] {
  let length: number = 0;

  for (let i: number = 0; i * 8 < lengthBits; i += 1) {
    length <<= 8;
    length += data[i];
  }

  return [
    new TextDecoder().decode(data.slice(lengthBits / 8, lengthBits / 8 + length)),
    data.slice(lengthBits / 8 + length)
  ];
}

function _extractBool(num: number, offset: number): boolean {
  return Boolean((num >> offset) & 1);
}

function _toHex(data: Uint8Array): string {
  return [...data].map((i: number): string => i.toString(16).padStart(2, "0")).join("");
}

function parseResponse(data: ArrayBuffer): void {
  let u8arr: Uint8Array = new Uint8Array(data);

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
      let displayName: [string, leftoverData: Uint8Array] = _extractString(8, u8arr.slice(1));
      let bio: [string, leftoverData: Uint8Array] = _extractString(16, displayName[1]);

      profileSettingsSetUserData(
        displayName[0],
        bio[0],
        "#" + _toHex(bio[1].slice(0, 3)),
        "#" + _toHex(bio[1].slice(3, 6)),
        _extractBool(bio[1][6], 7),
        _extractBool(bio[1][6], 6)
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

    default: console.log("Unknown response code " + u8arr[0].toString(16));
  }
}
