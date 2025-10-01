function inputEnterEvent(e: KeyboardEvent): void {
  if (e.key !== "Enter") { return; }

  let el: HTMLElement = e.currentTarget as HTMLElement;
  let eventQuery: string | undefined = (e.ctrlKey && el.dataset.enterSubmit) || el.dataset.enterNext || el.dataset.enterSubmit;
  if (!eventQuery || eventQuery === "!avoid") { return; }

  let newElement: HTMLElement | null = document.querySelector(eventQuery);
  if (!newElement) { return; }

  newElement.focus();
  if (newElement.nodeName === "BUTTON") { newElement.click(); }

  e.preventDefault();
}

function togglePasswords(e: Event): void {
  let toText: HTMLInputElement[];
  let toPassword: HTMLInputElement[];

  let queries: string = "";

  let baseElement: EventTarget | null = e.target;
  if (baseElement) {
    queries = (baseElement as HTMLButtonElement).dataset.passwordToggle || "";
  }

  if (queries) {
    toText = [];
    toPassword = [];

    for (const q of queries.split(",")) {
      let el: HTMLInputElement | null = document.querySelector(q.trim());
      if (el) {
        if (el.type === "password") { toText.push(el); }
        else { toPassword.push(el); }
      }
    }
  } else {
    toText = [...(document.querySelectorAll("input[type=\"password\"]") as NodeListOf<HTMLInputElement>)];
    toPassword = [...(document.querySelectorAll("input[data-toggle-password]") as NodeListOf<HTMLInputElement>)];
  }

  for (const el of toText) {
    el.type = "text";
    el.dataset.togglePassword = "";
  }

  for (const el of toPassword) {
    el.type = "password";
    delete el.dataset.togglePassword;
  }
}

function sha256(ascii: string): string {
  function rightRotate(value: any, amount: any): any {
    return (value >>> amount) | (value << (32 - amount));
  };

  let maxWord: number = Math.pow(2, 32);
  let result: string = '';

  let words: number[] = [];
  let asciiBitLength: number = ascii["length"] * 8;

  let hash: number[] = [];
  let k: number[] = [];
  let primeCounter: number = k["length"];

  let isComposite: { [key: number]: number } = {};
  for (let candidate: number = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i: number = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (candidate ** .5 * maxWord) | 0;
      k[primeCounter++] = (candidate ** (1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80'
  while (ascii["length"] % 64 - 56) ascii += '\x00'
  for (let i: number = 0; i < ascii["length"]; i++) {
    let j: number = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength)

  for (let j: number = 0; j < words.length;) {
    let w: number[] = words.slice(j, j += 16);
    let oldHash: number[] = hash;
    hash = hash.slice(0, 8);

    for (let i: number = 0; i < 64; i++) {
      let w15: number = w[i - 15];
      let w2: number = w[i - 2];
      let a: number = hash[0]
      let e: number = hash[4];
      let temp1: number = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5])^((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      let temp2: number = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (let i: number = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i: number = 0; i < 8; i++) {
    for (let j: number = 3; j + 1; j--) {
      let b: number = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }

  return result;
}

function escapeHTML(str: string): string {
  if (str === undefined) { return "⚠️"; }
  return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;").replaceAll("`", "&#96;");
}

function unescapeHTML(str: string): string {
  if (str === undefined) { return "⚠️"; }
  return str.replaceAll("&#96;", "`").replaceAll("&quot;", "\"").replaceAll("&lt;", "<").replaceAll("&amp;", "&");
}

function getTimestamp(timestamp: number, raw: boolean=false): string {
  let difference: number = Math.round(Date.now() / 1000 - timestamp);
  let future: boolean = difference < 0;
  let complexTimestamps: boolean = !!localStorage.getItem("smiggins-complex-timestamps");
  if (future) { difference = -difference; }

  let output: string = "?";

  if (difference < 60) {
    output = `${difference}s`;
  } else if (difference < 60 * 60) {
    output = `${Math.floor(difference / 60)}m` + (complexTimestamps ? `${difference % 60}s` : "");
  } else if (difference < 60 * 60 * 24) {
    output = `${Math.floor(difference / 60 / 60)}h` + (complexTimestamps ? `${Math.floor(difference / 60) % 60}m` : "");
  } else if (difference < 60 * 60 * 24 * 365) {
    output = `${Math.floor(difference / 60 / 60 / 24)}d` + (complexTimestamps ? `${Math.floor(difference / 60 / 60) % 24}h` : "");
  } else if (!isNaN(timestamp)) {
    output = `${Math.floor(difference / 60 / 60 / 24 / 365)}y` + (complexTimestamps ? `${Math.floor(difference / 60 / 60 / 24) % 365}d` : "");
  }

  if (future) { output = "in " + output; }
  if (raw) { return output; }
  return `<span data-timestamp="${timestamp}">${output}</span>`;
}

function updateTimestamps(): void {
  let timestamps: NodeListOf<HTMLSpanElement> = document.querySelectorAll("[data-timestamp]");

  for (const i of timestamps) {
    let newTime: string = getTimestamp(+(i.dataset.timestamp || NaN), true);
    if (newTime !== i.innerText) {
      i.innerText = newTime;
    }
  }
}

function errorCodeStrings(
  code: apiErrors | undefined,
  context?: string,
  data?: { [key: string]: string }
): [title: string, content?: string] {
  switch (code) {
    case "BAD_PASSWORD": return ["Invalid password."];
    case "BAD_USERNAME": switch (context) {
      case "login": return ["Invalid username.", `User '${data?.username}' does not exist.`];
      default: return ["Invalid username."];
    }
    case "INVALID_OTP": return ["Invalid invite code.", "Make sure your invite code is correct and try again."];
    case "NOT_AUTHENTICATED": return ["Not authenticated."];
    case "POLL_SINGLE_OPTION": return ["Invalid poll.", "Must have more than one option."];
    case "RATELIMIT": return ["Ratelimited.", "Try again in a few seconds."];
    case "USERNAME_USED": switch (context) {
      case "login": return ["Username in use.", `User '${data?.username}' already exists.`];
      default: return ["Username in use."];
    }
    case "CANT_INTERACT": return ["Can't interact.", "You can't interact with this user for some reason."];
    case "BLOCKING": return ["You are blocking this person.", "You need to unblock them to do this."];
  }

  return [code || "Something went wrong!"];
}

function setTokenCookie(token: string): void {
  document.cookie = `token=${token};Path=/;SameSite=Lax;Expires=${new Date(Date.now() + (356 * 24 * 60 * 60 * 1000)).toUTCString()}`;
}

function genericCheckbox(storageId: string): (e: Event) => void {
  return function(e: Event): void {
    let el: HTMLInputElement | null = e.target as HTMLInputElement | null;

    if (el) {
      if (el.checked) { localStorage.setItem(storageId, "1"); }
      else { localStorage.removeItem(storageId); }
    } 
  };
}

function getMentionsFromPost(p: post): string[] {
  let re: RegExp = /@([a-zA-Z0-9_\-]+)/g;
  let mentions: string[] = [...new Set([[null, p.user.username] as [null, string], ...p.content.matchAll(re)].map((a) => (a[1].toLowerCase())))].sort((a, b) => (a < b ? -1 : 1));

  if (mentions.includes(username)) {
    mentions.splice(mentions.indexOf(username), 1);
  }

  return mentions;
}
