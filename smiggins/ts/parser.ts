enum ResponseCodes {
  LogIn = 0x01,
  SignUp
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

function _getErrorStrings(code: number, context: number): [title: string, content?: string] {
  console.log(code, context);
  switch (code) {
    case ErrorCodes.BadRequest: return ["Something went wrong!"];
    case ErrorCodes.BadUsername: switch (context) {
      case ResponseCodes.LogIn: return ["Invalid username.", "No user has that username."];
      case ResponseCodes.SignUp: return ["Invalid username.", "Usernames can only include the characters a-z, 0-9, _, and -."];
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

function parseResponse(data: ArrayBuffer): void {
  let u8arr: Uint8Array = new Uint8Array(data);

  if (u8arr[0] >> 7 & 1) {
    return createToast(..._getErrorStrings(u8arr[1], u8arr[0] ^ (1 << 7)));
  }

  switch (u8arr[0]) {
    case ResponseCodes.LogIn:
    case ResponseCodes.SignUp:
      setToken([...u8arr.slice(1)].map((i: number): string => i.toString(16).padStart(2, "0")).join(""));
      break;
    default:
      console.log("Unknown response code " + u8arr[0].toString(16));
  }
}
