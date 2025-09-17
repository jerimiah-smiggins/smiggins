const icons: { [key: string]: string } = {
  private: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="Private post"><path d="M130.9 168.3v54.4h136v-54.4c0-37.57-30.43-68-68-68s-68 30.43-68 68m-40.8 54.4v-54.4c0-60.095 48.705-108.8 108.8-108.8s108.8 48.705 108.8 108.8v54.4h27.2c30.005 0 54.4 24.395 54.4 54.4v163.2c0 30.005-24.395 54.4-54.4 54.4h-272c-30.005 0-54.4-24.395-54.4-54.4V277.1c0-30.005 24.395-54.4 54.4-54.4zm-40.8 54.4v163.2c0 7.48 6.12 13.6 13.6 13.6h272c7.48 0 13.6-6.12 13.6-13.6V277.1c0-7.48-6.12-13.6-13.6-13.6h-272c-7.48 0-13.6 6.12-13.6 13.6"/></svg>',
  back: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M7.4 273.4C2.7 268.8 0 262.6 0 256s2.7-12.8 7.4-17.4l176-168c9.6-9.2 24.8-8.8 33.9.8s8.8 24.8-.8 33.9L83.9 232H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H83.9l132.7 126.6c9.6 9.2 9.9 24.3.8 33.9s-24.3 9.9-33.9.8l-176-168z"/></svg>',

  comment: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Comment"><path d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4 26.5 9.6 56.2 15.1 87.8 15.1 124.7 0 208-80.5 208-160S380.7 80 256 80 48 160.5 48 240c0 32 12.4 62.8 35.7 89.2 8.6 9.7 12.8 22.5 11.8 35.5-1.4 18.1-5.7 34.7-11.3 49.4 17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9q2.7-4.05 5.1-8.1c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240 0 125.1 114.6 32 256 32s256 93.1 256 208-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9-11.9 8.7-31.3 20.6-54.3 30.6-15.1 6.6-32.3 12.6-50.1 16.1-.8.2-1.6.3-2.4.5-4.4.8-8.7 1.5-13.2 1.9-.2 0-.5.1-.7.1-5.1.5-10.2.8-15.3.8-6.5 0-12.3-3.9-14.8-9.9S0 457.4 4.5 452.8c4.1-4.2 7.8-8.7 11.3-13.5q2.55-3.45 4.8-6.9c.1-.2.2-.3.3-.5z"/></svg>',
  quote: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="Quote"><path d="M0 216C0 149.7 53.7 96 120 96h16c13.3 0 24 10.7 24 24s-10.7 24-24 24h-16c-39.8 0-72 32.2-72 72v10c5.1-1.3 10.5-2 16-2h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64zm48 72v64c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16m336-16h-64c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16m-128 48V216c0-66.3 53.7-120 120-120h16c13.3 0 24 10.7 24 24s-10.7 24-24 24h-16c-39.8 0-72 32.2-72 72v10c5.1-1.3 10.5-2 16-2h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64h-64c-35.3 0-64-28.7-64-64z"/></svg>',
  like: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Like"><path d="m225.8 468.2-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144 39.4-7.6 79.7 1.5 111.8 24.1 9 6.4 17.4 13.8 25 22.3 4.2-4.8 8.7-9.2 13.5-13.3 3.7-3.2 7.5-6.2 11.5-9 32.1-22.6 72.4-31.7 111.8-24.2C462 58.6 512 119.1 512 189.5v3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9M239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20-.1-.1c-23.1-25.9-58-37.7-92-31.2-46.6 8.9-80.2 49.5-80.2 96.9v3.3c0 28.5 11.9 55.8 32.8 75.2L256 430.7 431.2 268a102.7 102.7 0 0 0 32.8-75.2v-3.3c0-47.3-33.6-88-80.1-96.9-34-6.5-69 5.4-92 31.2l-.1.1-.1.1-17.8 20c-.3.4-.7.7-1 1.1-4.5 4.5-10.6 7-16.9 7s-12.4-2.5-16.9-7z"/></svg>',
  like_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Remove like"><path d="m47.6 300.4 180.7 168.7c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9l180.7-168.7c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141-45.6-7.6-92 7.3-124.6 39.9l-12 12-12-12c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5"/></svg>',

  // navbar icons
  home_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" aria-label="Home"><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40h-16c-1.1 0-2.2 0-3.3-.1-1.4.1-2.8.1-4.2.1H392c-22.1 0-40-17.9-40-40v-88c0-17.7-14.3-32-32-32h-64c-17.7 0-32 14.3-32 32v88c0 22.1-17.9 40-40 40h-55.9c-1.5 0-3-.1-4.5-.2-1.2.1-2.4.2-3.6.2h-16c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9.1-2.8v-69.6H32c-18 0-32-14-32-32.1 0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7l255.4 224.5c8 7 12 15 11 24"/></svg>',
  home: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" aria-label="Home"><path d="M303.5 5.7c-9-7.6-22.1-7.6-31.1 0l-264 224c-10.1 8.6-11.3 23.7-2.8 33.8s23.7 11.3 33.8 2.8L64 245.5V432c0 44.2 35.8 80 80 80h288c44.2 0 80-35.8 80-80V245.5l24.5 20.8c10.1 8.6 25.3 7.3 33.8-2.8s7.3-25.3-2.8-33.8zM112 432V204.8L288 55.5l176 149.3V432c0 17.7-14.3 32-32 32h-48V312c0-22.1-17.9-40-40-40H232c-22.1 0-40 17.9-40 40v152h-48c-17.7 0-32-14.3-32-32m128 32V320h96v144z"/></svg>',
  notifications_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="Notifications"><path d="M224 0c-17.7 0-32 14.3-32 32v19.2C119 66 64 130.6 64 208v18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416h384c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3c-31.2-35.2-48.5-80.5-48.5-127.6V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32m45.3 493.3c12-12 18.7-28.3 18.7-45.3H160c0 17 6.7 33.3 18.7 45.3S207 512 224 512s33.3-6.7 45.3-18.7"/></svg>',
  notifications: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="Notifications"><path d="M224 0c-17.7 0-32 14.3-32 32v19.2C119 66 64 130.6 64 208v25.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416h400c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6c-28.3-35.5-43.8-79.6-43.8-125V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32m0 96c61.9 0 112 50.1 112 112v25.4c0 47.9 13.9 94.6 39.7 134.6H72.3c25.8-40 39.7-86.7 39.7-134.6V208c0-61.9 50.1-112 112-112m64 352H160c0 17 6.7 33.3 18.7 45.3S207 512 224 512s33.3-6.7 45.3-18.7S288 465 288 448"/></svg>',
  messages_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Messages"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4l217.6 163.2c11.4 8.5 27 8.5 38.4 0l217.6-163.2c12.1-9.1 19.2-23.3 19.2-38.4 0-26.5-21.5-48-48-48zM0 176v208c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V176L294.4 339.2a63.9 63.9 0 0 1-76.8 0z"/></svg>',
  messages: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Messages"><path d="M64 112c-8.8 0-16 7.2-16 16v22.1l172.5 141.6c20.7 17 50.4 17 71.1 0L464 150.1V128c0-8.8-7.2-16-16-16zM48 212.2V384c0 8.8 7.2 16 16 16h384c8.8 0 16-7.2 16-16V212.2L322 328.8c-38.4 31.5-93.7 31.5-132 0zM0 128c0-35.3 28.7-64 64-64h384c35.3 0 64 28.7 64 64v256c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64z"/></svg>',
  user_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="Profile"><path d="M224 256a128 128 0 1 0 0-256 128 128 0 1 0 0 256m-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3z"/></svg>',
  user: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="Profile"><path d="M304 128a80 80 0 1 0-160 0 80 80 0 1 0 160 0m-208 0a128 128 0 1 1 256 0 128 128 0 1 1-256 0M49.3 464h349.5c-8.9-63.3-63.3-112-129-112h-91.4c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304h91.4c98.5 0 178.3 79.8 178.3 178.3 0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3"/></svg>',
  settings_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Settings"><path d="M495.9 166.6c3.2 8.7.5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4l-55.6 17.8c-8.8 2.8-18.6.3-24.5-6.8-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4c-1.1-8.4-1.7-16.9-1.7-25.5s.6-17.1 1.7-25.4l-43.3-39.4c-6.9-6.2-9.6-15.9-6.4-24.6 4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2 5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8 8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160"/></svg>',
  settings: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Settings"><path d="M256 0c17 0 33.6 1.7 49.8 4.8 7.9 1.5 21.8 6.1 29.4 20.1 2 3.7 3.6 7.6 4.6 11.8l9.3 38.5c1.4 5.8 11.2 11.5 16.9 9.8l38-11.2c4-1.2 8.1-1.8 12.2-1.9 16.1-.5 27 9.4 32.3 15.4 22.1 25.1 39.1 54.6 49.9 86.3 2.6 7.6 5.6 21.8-2.7 35.4-2.2 3.6-4.9 7-8 10L459 246.3c-4.2 4-4.2 15.5 0 19.5l28.7 27.3c3.1 3 5.8 6.4 8 10 8.2 13.6 5.2 27.8 2.7 35.4-10.8 31.7-27.8 61.1-49.9 86.3-5.3 6-16.3 15.9-32.3 15.4-4.1-.1-8.2-.8-12.2-1.9L366 427c-5.7-1.7-15.5 4-16.9 9.8l-9.3 38.5c-1 4.2-2.6 8.2-4.6 11.8-7.7 14-21.6 18.5-29.4 20.1-16.2 3.1-32.8 4.8-49.8 4.8s-33.6-1.7-49.8-4.8c-7.9-1.5-21.8-6.1-29.4-20.1-2-3.7-3.6-7.6-4.6-11.8l-9.3-38.5c-1.4-5.8-11.2-11.5-16.9-9.8l-38 11.2c-4 1.2-8.1 1.8-12.2 1.9-16.1.5-27-9.4-32.3-15.4-22-25.1-39.1-54.6-49.9-86.3-2.6-7.6-5.6-21.8 2.7-35.4 2.2-3.6 4.9-7 8-10L53 265.7c4.2-4 4.2-15.5 0-19.5l-28.8-27.3c-3.1-3-5.8-6.4-8-10-8.2-13.6-5.2-27.8-2.6-35.3 10.8-31.7 27.8-61.1 49.9-86.3 5.3-6 16.3-15.9 32.3-15.4 4.1.1 8.2.8 12.2 1.9L146 85c5.7 1.7 15.5-4 16.9-9.8l9.3-38.5c1-4.2 2.6-8.2 4.6-11.8 7.7-14 21.6-18.5 29.4-20.1C222.4 1.7 239 0 256 0m-37.9 51.4-8.5 35.1c-7.8 32.3-45.3 53.9-77.2 44.6l-34.5-10.2c-16.5 19.3-29.5 41.7-38 65.7l26.2 24.9c24 22.8 24 66.2 0 89l-26.2 24.9c8.5 24 21.5 46.4 38 65.7l34.6-10.2c31.8-9.4 69.4 12.3 77.2 44.6l8.5 35.1c24.6 4.5 51.3 4.5 75.9 0l8.5-35.1c7.8-32.3 45.3-53.9 77.2-44.6l34.6 10.2c16.5-19.3 29.5-41.7 38-65.7l-26.2-24.9c-24-22.8-24-66.2 0-89l26.2-24.9c-8.5-24-21.5-46.4-38-65.7l-34.6 10.2c-31.8 9.4-69.4-12.3-77.2-44.6l-8.5-35.1c-24.6-4.5-51.3-4.5-75.9 0zM208 256a48 48 0 1 0 96 0 48 48 0 1 0-96 0m48 96a96 96 0 1 1 0-192 96 96 0 1 1 0 192"/></svg>'
};

let snippetVariables: { [key: string]: string } = {
  site_name: "Jerimiah Smiggins",
  home_page: loggedIn ? "home" : "index",
  username: loggedIn ? username : "",
  selected_if_default_private: defaultPostPrivate ? "selected" : "",
  checked_if_default_private: defaultPostPrivate ? "checked" : ""
};

let snippetProcessing: { [key: string]: (element: HTMLDivElement) => void } = {
  input_enter: p_inputEnter,
  password_toggle: p_passwordToggle,
  timeline_switch: p_tlSwitch,
  timeline_more: p_tlMore,
  login: p_login,
  signup: p_signup,
  logout: p_logout,
  home: p_home,
  user: p_user,
  post: p_post,
  post_page: p_postPage,

  settings_profile: p_settingsProfile,
  settings_cosmetic: p_settingsCosmetic,
  settings_account: p_settingsAccount
};

// @ts-expect-error
let snippets: { [key in snippet]: snippetData} = {};

function getSnippet(snippet: snippet, extraVariables?: { [key: string]: string | [value: string, max_repl: number] }): HTMLDivElement {
  let s: snippetData = snippets[snippet];
  let content = s.content;

  for (const i of Object.keys(icons)) {
    content = content.replaceAll(`@{icon_${i}}`, icons[i]);
  }

  for (const i of s.variables) {
    let replacementValue: string = "";
    let replacementCount: number = 0;

    if (typeof i === "string") {
      if (i in snippetVariables) {
        replacementValue = snippetVariables[i];
      } else {
        console.log(`Unknown snippet variable "${i}"`);
      }
    } else {
      replacementCount = i[1];

      if (i[0] in snippetVariables) {
        replacementValue = i[0];
      } else {
        console.log(`Unknown snippet variable "${i}"`);
      }
    }

    if (replacementCount) {
      for (let _: number = 0; _ < replacementCount; _++) {
        content = content.replace(`@{${typeof i === "string" ? i : i[0]}}`, replacementValue);
      }
    } else {
      content = content.replaceAll(`@{${typeof i === "string" ? i : i[0]}}`, replacementValue);
    }
  }

  if (extraVariables) {
    for (const i of Object.keys(extraVariables)) {
      if (typeof extraVariables[i] === "string") {
        content = content.replaceAll(`@{${i}}`, extraVariables[i]);
      } else {
        for (let _: number = 0; _ < extraVariables[i][1]; _++) {
          content = content.replace(`@{${i}}`, extraVariables[i][0]);
        }
      }
    }
  }

  let element: HTMLDivElement = document.createElement("div");
  element.innerHTML = content;

  for (const i of s.processing) {
    if (i in snippetProcessing) {
      snippetProcessing[i](element);
    } else {
      console.log(`Unknown snippet process "${i}"`);
    }
  }

  generateInternalLinks(element);
  return element;
}

function p_inputEnter(element: HTMLDivElement): void {
  for (const el of element.querySelectorAll("[data-enter-submit]")) {
    (el as HTMLElement).onkeydown = inputEnterEvent;
  }
}

function p_passwordToggle(element: HTMLDivElement): void {
  for (const el of element.querySelectorAll("[data-password-toggle]")) {
    (el as HTMLElement).onclick = togglePasswords;
  }
}

for (const snippet of document.querySelectorAll("[data-snippet]") as NodeListOf<HTMLDivElement>) {
  snippets[snippet.dataset.snippet as snippet] = {
    variables: snippet.dataset.snippetVariables?.split(",").filter((a: string): string => a).map((a: string): string | [string, number] => {
      if (a.includes(":")) { return [a.split(":")[0], +a.split(":")[1]]; }
      return a;
    }) || [],
    processing: snippet.dataset.snippetProcessing?.split(",").filter((a: string): string => a) || [],
    content: snippet.innerHTML
  };

  snippet.remove();
}

document.getElementById("snippets")?.remove();
