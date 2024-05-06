const dom = (id) => (document.getElementById(id));

const usernameRegex = /(@[a-zA-Z0-9_\-]+)/g;
const usernameRegexFull = /^[a-z0-9_\-]+$/g;

const months = [
  "Jan", "Feb", "Mar", "Apr",
  "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec"
];

const validColors = [
  "rosewater", "flamingo", "pink", "mauve",
  "red", "maroon", "peach", "yellow", "green",
  "teal", "sky", "sapphire", "blue", "lavender"
]

const pronouns = {
  _a: "ask pronouns",
  _o: "other pronouns",
  _v: "avoid pronouns",
  aa: "any/all",  af: "any/she",  ai: "any/all",   am: "any/he",  an: "any/they",  ao: "any/its", ax: "any/other",
  fa: "she/any",  ff: "she/her",  fi: "she/her",   fm: "she/he",  fn: "she/they",  fo: "she/it",  fx: "she/other",
  ma: "he/all",   mf: "he/her",   mi: "he/him",    mm: "he/him",  mn: "he/they",   mo: "he/it",   mx: "he/other",
  na: "they/any", nf: "they/she", ni: "they/them", nm: "they/he", nn: "they/them", no: "they/it", nx: "they/other",
  oa: "it/any",   of: "it/she",   oi: "it/its",    om: "it/he",   on: "it/they",   oo: "it/its",  ox: "it/other"
}

// Placeholder
let showlog = (str, time=0) => { };

function setCookie(name, value) {
  let date = new Date();
  date.setTime(date.getTime() + (356 * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};Path=/;Expires=${date.toUTCString()}`;
}

function eraseCookie(name) {
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  };

  let maxWord = Math.pow(2, 32);
  let i, j;
  let result = '';

  let words = [];
  let asciiBitLength = ascii["length"]*8;

  let hash = sha256.h = sha256.h || [];
  let k = sha256.k = sha256.k || [];
  let primeCounter = k["length"];

  let isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80'
  while (ascii["length"]%64 - 56) ascii += '\x00'
  for (i = 0; i < ascii["length"]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words["length"]] = ((asciiBitLength / maxWord) | 0);
  words[words["length"]] = (asciiBitLength)

  for (j = 0; j < words["length"];) {
    let w = words.slice(j, j += 16);
    let oldHash = hash;
    hash = hash.slice(0, 8);

    let w15, a, temp1, temp2;

    for (i = 0; i < 64; i++) {
      w15 = w[i - 15], w2 = w[i - 2];
      a = hash[0], e = hash[4];
      temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5])^((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))  + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      let b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }
  return result;
};

function timeSince(date) {
  let dateObject = new Date(date * 1000);
  let dateString = `${months[dateObject.getMonth()]} ${dateObject.getDate()}, ${dateObject.getFullYear()}, ${String(dateObject.getHours()).padStart(2, "0")}:${String(dateObject.getMinutes()).padStart(2, "0")}:${String(dateObject.getSeconds()).padStart(2, "0")}`;

  let seconds = Math.floor((+(new Date()) / 1000 - date + 1));
  let unit = "second", amount = seconds > 0 ? seconds : 0;

  for (const info of [
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
    ["month", 2592000],
    ["year", 31536000]
  ]) {
    let interval = seconds / info[1];

    if (interval >= 1) {
      unit = info[0];
      amount = Math.floor(interval);
    }
  }

  return `<span data-timestamp="${date}" title="${dateString}">${Math.floor(amount)} ${unit}${Math.floor(amount) == 1 ? "" : "s"}</span>`;
}

function escapeHTML(str) {
  return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;")
}

function getPostHTML(
  postJSON,
  isComment=false,
  includeUserLink=true,
  includePostLink=true,
  fakeMentions=false,
  pageFocus=false,
  isPinned=false
) {
  return `<div class="post-container" data-${isComment ? "comment" : "post"}-id="${postJSON.post_id}">
    <div class="post">
      <div class="upper-content">
        ${includeUserLink ? `<a href="/u/${postJSON.creator.username}" class="no-underline text">` : ""}
          <div class="displ-name">
            ${escapeHTML(postJSON.creator.display_name)} ${postJSON.creator.private ? `<span class="user-badge">${icons.lock}</span>` : ""}
            ${postJSON.creator.badges.length ? `<span class="user-badge">${postJSON.creator.badges.map((icon) => (badges[icon])).join("</span> <span class=\"user-badge\">")}</span>` : ""}
          </div>
          <span class="upper-lower-opacity">
            <div class="username">@${postJSON.creator.username}</div> -
            ${pronouns[postJSON.creator.pronouns] ? `<div class="pronouns">${pronouns[postJSON.creator.pronouns]}</div> -` : ""}
            <div class="timestamp">${timeSince(postJSON.timestamp)} ago</div>
          </span>
        ${includeUserLink ? "</a>" : ""}
      </div>

      <div class="main-content">
        ${includePostLink ? `<a href="/${isComment ? "c" : "p"}/${postJSON.post_id}" tabindex="-1" class="text no-underline">` : ""}
          ${
            linkifyHtml(escapeHTML(postJSON.content), {
              formatHref: { mention: (href) => fakeMentions ? "#" : "/u" + href }
            }).replaceAll("\n", "<br>")
              .replaceAll("<a", includePostLink ? "  \n" : "<a target=\"_blank\"")
              .replaceAll("</a>", includePostLink ? `</a><a href="/${isComment ? "c" : "p"}/${postJSON.post_id}" tabindex="-1" class="text no-underline">` : "</a>")
              .replaceAll("  \n", "</a><a target=\"_blank\"")
              .replaceAll(`<a href="/${isComment ? "c" : "p"}/${postJSON.post_id}" tabindex="-1" class="text no-underline"></a>`, "")
              .replaceAll("<a target=\"_blank\" href=\"/", "<a href=\"/")
          }
        ${includePostLink ? "</a>" : ""}
      </div>

      ${
        postJSON.quote ? `
          <div class="quote-area">
            <div class="post">
              ${
                postJSON.quote.blocked ? "This post is from an account you've blocked" : postJSON.quote.deleted ? "The original post was deleted" : postJSON.quote.can_view ? `
                  <div class="upper-content">
                    ${includeUserLink || postJSON.creator.username !== postJSON.quote.creator.username ? `<a href="/u/${postJSON.quote.creator.username}" class="no-underline text">` : ""}
                      <div class="displ-name">
                        ${escapeHTML(postJSON.quote.creator.display_name)} ${postJSON.quote.creator.private ? `<span class="user-badge">${icons.lock}</span>` : ""}
                        ${postJSON.quote.creator.badges.length ? `<span class="user-badge">${postJSON.quote.creator.badges.map((icon) => (badges[icon])).join("</span> <span class=\"user-badge\">")}</span>` : ""}
                      </div>
                      <span class="upper-lower-opacity">
                        <div class="username">@${postJSON.quote.creator.username}</div> -
                        ${pronouns[postJSON.quote.creator.pronouns] ? `<div class="pronouns">${pronouns[postJSON.quote.creator.pronouns]}</div> -` : ""}
                        <div class="timestamp">${timeSince(postJSON.quote.timestamp)} ago</div>
                      </span>
                    ${includeUserLink || postJSON.creator.username !== postJSON.quote.creator.username ? "</a>" : ""}
                  </div>

                  <div class="main-content">
                    <a href="/${postJSON.quote.comment ? "c" : "p"}/${postJSON.quote.post_id}" class="text no-underline">
                      ${
                        linkifyHtml(escapeHTML(postJSON.quote.content), {
                          formatHref: { mention: (href) => fakeMentions ? "#" : "/u" + href }
                        }).replaceAll("\n", "<br>")
                          .replaceAll("<a", "  \n")
                          .replaceAll("</a>", `</a><a href="/${postJSON.quote.comment ? "c" : "p"}/${postJSON.quote.post_id}" class="text no-underline">`)
                          .replaceAll("  \n", "</a><a target=\"_blank\"")
                          .replaceAll(`<a href="/${postJSON.quote.comment ? "c" : "p"}/${postJSON.quote.post_id}" class="text no-underline"></a>`, "")
                          .replaceAll("<a target=\"_blank\" href=\"/", "<a href=\"/")
                      }

                      ${postJSON.quote.has_quote ? "<br><i>Quoting another post...</i>" : ""}
                    </a>
                  </div>
                ` : "This person limits who can view their profile."
              }
            </div>
          </div>
        ` : ""
      }

      <div class="bottom-content">
        ${includePostLink ? `<a href="/${isComment ? "c" : "p"}/${postJSON.post_id}" class="text no-underline">` : ""}
          <span class="bottom-content-icon comment-icon">${icons.comment}</span>${postJSON.comments}
        ${includePostLink ? "</a>" : ""}
        <div class="bottom-spacing"></div>
        <button class="bottom-content-icon" ${fakeMentions ? "" : `onclick="addQuote('${postJSON.post_id}', ${isComment})"`}>
          ${icons.quote}
          <span class="quote-number">${postJSON.quotes}</span>
        </button>
        <div class="bottom-spacing"></div>
        <button class="bottom-content-icon like" tabindex="0" data-liked="${postJSON.liked}" ${fakeMentions ? "" : `onclick="toggleLike(${postJSON.post_id}, ${isComment ? "'comment'" : "'post'"})"`}>
          ${postJSON.liked ? icons.like : icons.unlike}
          <span class="like-number">${postJSON.likes}</span>
        </button>
        ${
          postJSON.can_pin ? `
          <div class="bottom-spacing"></div>
          <button class="bottom-content-icon ${isPinned ? "red" : ""}" tabindex="0" onclick="${isPinned ? "un" : ""}pinPost(${isPinned ? "" : postJSON.post_id})">
            ${icons.pin}
          </button>` : ""
        }
        ${
          postJSON.can_delete ? `
          <div class="bottom-spacing"></div>
          <button class="bottom-content-icon red" tabindex="0" onclick="deletePost(${postJSON.post_id}, ${isComment}, ${pageFocus})">
            ${icons.delete}
          </button>` : ""
        }
      </div>
      <div class="post-after"></div>
    </div>
  </div>`;
}

function trimWhitespace(string, purge_newlines=false) {
  const whitespace = [
    "\x09",   "\x0b",   "\x0c",   "\xa0",
    "\u1680", "\u2000", "\u2001", "\u2002",
    "\u2003", "\u2004", "\u2005", "\u2006",
    "\u2007", "\u2008", "\u2009", "\u200a",
    "\u200b", "\u2028", "\u2029", "\u202f",
    "\u205f", "\u2800", "\u3000", "\ufeff"
  ];

  string = string.replaceAll("\x0d", "");

  if (purge_newlines) {
    string = string.replaceAll("\x0a", " ").replaceAll("\x85")
  }

  for (const char of whitespace) {
    string = string.replaceAll(char, " ");
  }

  while (string.includes("\n ") || string.includes("   ") || string.includes("\n\n\n")) {
    string = string.replaceAll("\n ", "\n").replaceAll("   ", "  ").replaceAll("\n\n\n", "\n\n");
  }

  return string;
}

function postTextInputEvent() {
  let newCursorPosition = trimWhitespace(this.value.slice(0, this.selectionStart + 1)).length - (this.value.length > this.selectionStart ? 1 : 0);
  let newVal = trimWhitespace(this.value);

  newCursorPosition = newCursorPosition < 0 ? 0 : newCursorPosition;

  if (newVal != this.value) {
    this.value = trimWhitespace(this.value);
    this.setSelectionRange(newCursorPosition, newCursorPosition);
  }
}

// Icons from Font Awesome
const icons = {
  settings : '<a title="Settings" href="/settings"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M495.9 166.6c3.2 8.7.5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4l-55.6 17.8c-8.8 2.8-18.6.3-24.5-6.8-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4c-1.1-8.4-1.7-16.9-1.7-25.5s.6-17.1 1.7-25.4l-43.3-39.4c-6.9-6.2-9.6-15.9-6.4-24.6 4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2 5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8 8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg></a>',
  home     : '<a title="Home" href="/home"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40h-16c-1.1 0-2.2 0-3.3-.1-1.4.1-2.8.1-4.2.1H392c-22.1 0-40-17.9-40-40v-88c0-17.7-14.3-32-32-32h-64c-17.7 0-32 14.3-32 32v88c0 22.1-17.9 40-40 40h-55.9c-1.5 0-3-.1-4.5-.2-1.2.1-2.4.2-3.6.2h-16c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9.1-2.8v-69.6H32c-18 0-32-14-32-32.1 0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7l255.4 224.5c8 7 12 15 11 24z"/></svg></a>',
  like     : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="m47.6 300.4 180.7 168.7c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9l180.7-168.7c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141-45.6-7.6-92 7.3-124.6 39.9l-12 12-12-12c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>',
  unlike   : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="m225.8 468.2-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144 39.4-7.6 79.7 1.5 111.8 24.1 9 6.4 17.4 13.8 25 22.3 4.2-4.8 8.7-9.2 13.5-13.3 3.7-3.2 7.5-6.2 11.5-9 32.1-22.6 72.4-31.7 111.8-24.2C462 58.6 512 119.1 512 189.5v3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9zM239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20-.1-.1c-23.1-25.9-58-37.7-92-31.2-46.6 8.9-80.2 49.5-80.2 96.9v3.3c0 28.5 11.9 55.8 32.8 75.2L256 430.7 431.2 268a102.7 102.7 0 0 0 32.8-75.2v-3.3c0-47.3-33.6-88-80.1-96.9-34-6.5-69 5.4-92 31.2l-.1.1-.1.1-17.8 20c-.3.4-.7.7-1 1.1-4.5 4.5-10.6 7-16.9 7s-12.4-2.5-16.9-7z"/></svg>',
  comment  : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4 26.5 9.6 56.2 15.1 87.8 15.1 124.7 0 208-80.5 208-160S380.7 80 256 80 48 160.5 48 240c0 32 12.4 62.8 35.7 89.2 8.6 9.7 12.8 22.5 11.8 35.5-1.4 18.1-5.7 34.7-11.3 49.4 17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9c1.8-2.7 3.5-5.4 5.1-8.1 10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240 0 125.1 114.6 32 256 32s256 93.1 256 208-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9-11.9 8.7-31.3 20.6-54.3 30.6-15.1 6.6-32.3 12.6-50.1 16.1-.8.2-1.6.3-2.4.5-4.4.8-8.7 1.5-13.2 1.9-.2 0-.5.1-.7.1-5.1.5-10.2.8-15.3.8-6.5 0-12.3-3.9-14.8-9.9S0 457.4 4.5 452.8c4.1-4.2 7.8-8.7 11.3-13.5 1.7-2.3 3.3-4.6 4.8-6.9.1-.2.2-.3.3-.5z"/></svg>',
  lock     : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><title>Private Account</title><path d="M144 128v64h160v-64c0-44.2-35.8-80-80-80s-80 35.8-80 80zm-48 64v-64C96 57.3 153.3 0 224 0s128 57.3 128 128v64h32c35.3 0 64 28.7 64 64v192c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64h32zm-48 64v192c0 8.8 7.2 16 16 16h320c8.8 0 16-7.2 16-16V256c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16z"/></svg>',
  share    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M307 34.8c-11.5 5.1-19 16.6-19 29.2v64H176C78.8 128 0 206.8 0 304c0 113.3 81.5 163.9 100.2 174.1 2.5 1.4 5.3 1.9 8.1 1.9 10.9 0 19.7-8.9 19.7-19.7 0-7.5-4.3-14.4-9.8-19.5-9.4-8.9-22.2-26.4-22.2-56.8 0-53 43-96 96-96h96v64c0 12.6 7.4 24.1 19 29.2s25 3 34.4-5.4l160-144c6.7-6.1 10.6-14.7 10.6-23.8s-3.8-17.7-10.6-23.8l-160-144a31.76 31.76 0 0 0-34.4-5.4z"/></svg>',
  user     : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>',
  quote    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 216C0 149.7 53.7 96 120 96h16c13.3 0 24 10.7 24 24s-10.7 24-24 24h-16c-39.8 0-72 32.2-72 72v10c5.1-1.3 10.5-2 16-2h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64zm48 72v64c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16m336-16h-64c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16m-128 48V216c0-66.3 53.7-120 120-120h16c13.3 0 24 10.7 24 24s-10.7 24-24 24h-16c-39.8 0-72 32.2-72 72v10c5.1-1.3 10.5-2 16-2h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64h-64c-35.3 0-64-28.7-64-64z"/></svg>',
  delete   : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="m170.5 51.6-19 28.4h145l-19-28.4c-1.5-2.2-4-3.6-6.7-3.6h-93.7c-2.7 0-5.2 1.3-6.7 3.6zm147-26.6 36.7 55H424c13.3 0 24 10.7 24 24s-10.7 24-24 24h-8v304c0 44.2-35.8 80-80 80H112c-44.2 0-80-35.8-80-80V128h-8c-13.3 0-24-10.7-24-24s10.7-24 24-24h69.8l36.7-55.1C140.9 9.4 158.4 0 177.1 0h93.7c18.7 0 36.2 9.4 46.6 24.9zM80 128v304c0 17.7 14.3 32 32 32h224c17.7 0 32-14.3 32-32V128zm80 64v208c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16m80 0v208c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16m80 0v208c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16"/></svg>',
  bell     : '<a title="Notifications" href="/notifications"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 0c-17.7 0-32 14.3-32 32v19.2C119 66 64 130.6 64 208v18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416h384c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3c-31.2-35.2-48.5-80.5-48.5-127.6V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3H160c0 17 6.7 33.3 18.7 45.3S207 512 224 512s33.3-6.7 45.3-18.7z"/></svg></a>',
  pin      : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" xml:space="preserve"><path d="m134.6 51.7-10.8 140.9c-1.1 14.6-8.8 27.8-20.9 36-23.9 16.2-41.8 40.8-49.1 70.3l-1.3 5.1h279l-1.3-5.1c-7.4-29.5-25.2-54.1-49.1-70.2-12.1-8.2-19.8-21.5-20.9-36l-10.8-141c-.1-1.2-.1-2.5-.1-3.7H134.8c0 1.2 0 2.5-.2 3.7M168 352H32c-9.9 0-19.2-4.5-25.2-12.3s-8.2-17.9-5.8-27.5l6.2-25c10.3-41.3 35.4-75.7 68.7-98.3L83.1 96l3.7-48H56c-4.4 0-8.6-1.2-12.2-3.3C36.8 40.5 32 32.8 32 24 32 10.7 42.7 0 56 0h272c13.3 0 24 10.7 24 24 0 8.8-4.8 16.5-11.8 20.7-3.6 2.1-7.7 3.3-12.2 3.3h-30.8l3.7 48 7.1 92.9c33.3 22.6 58.4 57.1 68.7 98.3l6.2 25c2.4 9.6.2 19.7-5.8 27.5S361.7 352 351.9 352H216v136c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/></svg>'
};

setInterval(
  function() {
    [...document.querySelectorAll("[data-timestamp]")].forEach((val) => {
      val.innerHTML = timeSince(Number(val.dataset.timestamp));
    })
  }, 5_000
);
