let hasHistoryBeenUsedYet: boolean = false;
let contextLoading: boolean = false;
const pageNotFound: "404" = "404";

// Some icons are from Font Awesome
const icons: { [key: string]: string } = {
  settings : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="${escapeHTML(lang.settings.title)}"><path d="M495.9 166.6c3.2 8.7.5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4l-55.6 17.8c-8.8 2.8-18.6.3-24.5-6.8-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4c-1.1-8.4-1.7-16.9-1.7-25.5s.6-17.1 1.7-25.4l-43.3-39.4c-6.9-6.2-9.6-15.9-6.4-24.6 4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2 5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8 8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>`,
  home     : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" aria-label="${escapeHTML(lang.home.title)}"><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40h-16c-1.1 0-2.2 0-3.3-.1-1.4.1-2.8.1-4.2.1H392c-22.1 0-40-17.9-40-40v-88c0-17.7-14.3-32-32-32h-64c-17.7 0-32 14.3-32 32v88c0 22.1-17.9 40-40 40h-55.9c-1.5 0-3-.1-4.5-.2-1.2.1-2.4.2-3.6.2h-16c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9.1-2.8v-69.6H32c-18 0-32-14-32-32.1 0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7l255.4 224.5c8 7 12 15 11 24z"/></svg>`,
  like     : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="${escapeHTML(lang.post.unlike)}"><path d="m47.6 300.4 180.7 168.7c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9l180.7-168.7c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141-45.6-7.6-92 7.3-124.6 39.9l-12 12-12-12c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>`,
  unlike   : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="${escapeHTML(lang.post.like)}"><path d="m225.8 468.2-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144 39.4-7.6 79.7 1.5 111.8 24.1 9 6.4 17.4 13.8 25 22.3 4.2-4.8 8.7-9.2 13.5-13.3 3.7-3.2 7.5-6.2 11.5-9 32.1-22.6 72.4-31.7 111.8-24.2C462 58.6 512 119.1 512 189.5v3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9zM239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20-.1-.1c-23.1-25.9-58-37.7-92-31.2-46.6 8.9-80.2 49.5-80.2 96.9v3.3c0 28.5 11.9 55.8 32.8 75.2L256 430.7 431.2 268a102.7 102.7 0 0 0 32.8-75.2v-3.3c0-47.3-33.6-88-80.1-96.9-34-6.5-69 5.4-92 31.2l-.1.1-.1.1-17.8 20c-.3.4-.7.7-1 1.1-4.5 4.5-10.6 7-16.9 7s-12.4-2.5-16.9-7z"/></svg>`,
  comment  : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="${escapeHTML(lang.post.comment)}"><path d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4 26.5 9.6 56.2 15.1 87.8 15.1 124.7 0 208-80.5 208-160S380.7 80 256 80 48 160.5 48 240c0 32 12.4 62.8 35.7 89.2 8.6 9.7 12.8 22.5 11.8 35.5-1.4 18.1-5.7 34.7-11.3 49.4 17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9c1.8-2.7 3.5-5.4 5.1-8.1 10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240 0 125.1 114.6 32 256 32s256 93.1 256 208-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9-11.9 8.7-31.3 20.6-54.3 30.6-15.1 6.6-32.3 12.6-50.1 16.1-.8.2-1.6.3-2.4.5-4.4.8-8.7 1.5-13.2 1.9-.2 0-.5.1-.7.1-5.1.5-10.2.8-15.3.8-6.5 0-12.3-3.9-14.8-9.9S0 457.4 4.5 452.8c4.1-4.2 7.8-8.7 11.3-13.5 1.7-2.3 3.3-4.6 4.8-6.9.1-.2.2-.3.3-.5z"/></svg>`,
  lock     : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="${escapeHTML(lang.post.private_post)}"><path transform="scale(0.85) translate(10 70)" d="M144 128v64h160v-64c0-44.2-35.8-80-80-80s-80 35.8-80 80zm-48 64v-64C96 57.3 153.3 0 224 0s128 57.3 128 128v64h32c35.3 0 64 28.7 64 64v192c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64h32zm-48 64v192c0 8.8 7.2 16 16 16h320c8.8 0 16-7.2 16-16V256c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16z"/></svg>`,
  share    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="${escapeHTML(lang.generic.share)}"><path d="M307 34.8c-11.5 5.1-19 16.6-19 29.2v64H176C78.8 128 0 206.8 0 304c0 113.3 81.5 163.9 100.2 174.1 2.5 1.4 5.3 1.9 8.1 1.9 10.9 0 19.7-8.9 19.7-19.7 0-7.5-4.3-14.4-9.8-19.5-9.4-8.9-22.2-26.4-22.2-56.8 0-53 43-96 96-96h96v64c0 12.6 7.4 24.1 19 29.2s25 3 34.4-5.4l160-144c6.7-6.1 10.6-14.7 10.6-23.8s-3.8-17.7-10.6-23.8l-160-144a31.76 31.76 0 0 0-34.4-5.4z"/></svg>`,
  user     : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="${escapeHTML(lang.settings.profile_title)}"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>`,
  quote    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="${escapeHTML(lang.post.quote)}"><path d="M0 216C0 149.7 53.7 96 120 96h16c13.3 0 24 10.7 24 24s-10.7 24-24 24h-16c-39.8 0-72 32.2-72 72v10c5.1-1.3 10.5-2 16-2h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64zm48 72v64c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16m336-16h-64c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16m-128 48V216c0-66.3 53.7-120 120-120h16c13.3 0 24 10.7 24 24s-10.7 24-24 24h-16c-39.8 0-72 32.2-72 72v10c5.1-1.3 10.5-2 16-2h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64h-64c-35.3 0-64-28.7-64-64z"/></svg>`,
  delete   : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="red" aria-label="${escapeHTML(lang.post.delete)}"><path d="m170.5 51.6-19 28.4h145l-19-28.4c-1.5-2.2-4-3.6-6.7-3.6h-93.7c-2.7 0-5.2 1.3-6.7 3.6zm147-26.6 36.7 55H424c13.3 0 24 10.7 24 24s-10.7 24-24 24h-8v304c0 44.2-35.8 80-80 80H112c-44.2 0-80-35.8-80-80V128h-8c-13.3 0-24-10.7-24-24s10.7-24 24-24h69.8l36.7-55.1C140.9 9.4 158.4 0 177.1 0h93.7c18.7 0 36.2 9.4 46.6 24.9zM80 128v304c0 17.7 14.3 32 32 32h224c17.7 0 32-14.3 32-32V128zm80 64v208c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16m80 0v208c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16m80 0v208c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16"/></svg>`,
  bell     : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="${escapeHTML(lang.notifications.title)}"><path d="M224 0c-17.7 0-32 14.3-32 32v19.2C119 66 64 130.6 64 208v18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416h384c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3c-31.2-35.2-48.5-80.5-48.5-127.6V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3H160c0 17 6.7 33.3 18.7 45.3S207 512 224 512s33.3-6.7 45.3-18.7z"/></svg>`,
  pin      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" aria-label="${escapeHTML(lang.post.pin)}"><path d="m134.6 51.7-10.8 140.9c-1.1 14.6-8.8 27.8-20.9 36-23.9 16.2-41.8 40.8-49.1 70.3l-1.3 5.1h279l-1.3-5.1c-7.4-29.5-25.2-54.1-49.1-70.2-12.1-8.2-19.8-21.5-20.9-36l-10.8-141c-.1-1.2-.1-2.5-.1-3.7H134.8c0 1.2 0 2.5-.2 3.7M168 352H32c-9.9 0-19.2-4.5-25.2-12.3s-8.2-17.9-5.8-27.5l6.2-25c10.3-41.3 35.4-75.7 68.7-98.3L83.1 96l3.7-48H56c-4.4 0-8.6-1.2-12.2-3.3C36.8 40.5 32 32.8 32 24 32 10.7 42.7 0 56 0h272c13.3 0 24 10.7 24 24 0 8.8-4.8 16.5-11.8 20.7-3.6 2.1-7.7 3.3-12.2 3.3h-30.8l3.7 48 7.1 92.9c33.3 22.6 58.4 57.1 68.7 98.3l6.2 25c2.4 9.6.2 19.7-5.8 27.5S361.7 352 351.9 352H216v136c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/></svg>`,
  unpin    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="red" aria-label="${escapeHTML(lang.post.unpin)}"><path d="m134.6 51.7-10.8 140.9c-1.1 14.6-8.8 27.8-20.9 36-23.9 16.2-41.8 40.8-49.1 70.3l-1.3 5.1h279l-1.3-5.1c-7.4-29.5-25.2-54.1-49.1-70.2-12.1-8.2-19.8-21.5-20.9-36l-10.8-141c-.1-1.2-.1-2.5-.1-3.7H134.8c0 1.2 0 2.5-.2 3.7M168 352H32c-9.9 0-19.2-4.5-25.2-12.3s-8.2-17.9-5.8-27.5l6.2-25c10.3-41.3 35.4-75.7 68.7-98.3L83.1 96l3.7-48H56c-4.4 0-8.6-1.2-12.2-3.3C36.8 40.5 32 32.8 32 24 32 10.7 42.7 0 56 0h272c13.3 0 24 10.7 24 24 0 8.8-4.8 16.5-11.8 20.7-3.6 2.1-7.7 3.3-12.2 3.3h-30.8l3.7 48 7.1 92.9c33.3 22.6 58.4 57.1 68.7 98.3l6.2 25c2.4 9.6.2 19.7-5.8 27.5S361.7 352 351.9 352H216v136c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/></svg>`,
  message  : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="${escapeHTML(lang.messages.list_title)}"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4l217.6 163.2c11.4 8.5 27 8.5 38.4 0l217.6-163.2c12.1-9.1 19.2-23.3 19.2-38.4 0-26.5-21.5-48-48-48zM0 176v208c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V176L294.4 339.2a63.9 63.9 0 0 1-76.8 0z"/></svg>`,
  follower : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" aria-label="${escapeHTML(lang.user_page.pending_title)}"><path d="M96 128a128 128 0 1 1 256 0 128 128 0 1 1-256 0M0 482.3C0 383.8 79.8 304 178.3 304h91.4c98.5 0 178.3 79.8 178.3 178.3 0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3M464 332v-64h-64c-13.3 0-24-10.7-24-24s10.7-24 24-24h64v-64c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24h-64v64c0 13.3-10.7 24-24 24s-24-10.7-24-24"/></svg>`,
  more     : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="${escapeHTML(lang.post.more)}"><path d="M0 96c0-17.7 14.3-32 32-32h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32m0 160c0-17.7 14.3-32 32-32h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32m448 160c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h384c17.7 0 32 14.3 32 32"/></svg>`,
  edit     : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="${escapeHTML(lang.post.edit)}"><path d="M395.8 39.6c9.4-9.4 24.6-9.4 33.9 0l42.6 42.6c9.4 9.4 9.4 24.6 0 33.9L417.6 171 341 94.4zM318.4 117l76.6 76.6-219 219V400c0-8.8-7.2-16-16-16h-32v-32c0-8.8-7.2-16-16-16H99.4zM66.9 379.5c1.2-4 2.7-7.9 4.7-11.5H96v32c0 8.8 7.2 16 16 16h32v24.4c-3.7 1.9-7.5 3.5-11.6 4.7l-92.8 27.3 27.3-92.8zM452.4 17c-21.9-21.9-57.3-21.9-79.2 0L60.4 329.7c-11.4 11.4-19.7 25.4-24.2 40.8L.7 491.5c-1.7 5.6-.1 11.7 4 15.8s10.2 5.7 15.8 4l121-35.6c15.4-4.5 29.4-12.9 40.8-24.2L495 138.8c21.9-21.9 21.9-57.3 0-79.2zM331.3 202.7c6.2-6.2 6.2-16.4 0-22.6s-16.4-6.2-22.6 0l-128 128c-6.2 6.2-6.2 16.4 0 22.6s16.4 6.2 22.6 0z"/></svg>`
};

const pages: { [key: string]: [() => string, (() => void) | null] } = {
  "404": [(): string => `<h1>${lang.http["404"].standard_title}</h1>${lang.http["404"].standard_description}<br><a data-link href="/">${lang.http.home}</a>`, null],
  "404_user": [(): string => `<h1>${lang.http["404"].user_title}</h1>${lang.http["404"].user_description}<br><a data-link href="/">${lang.http.home}</a>`, null],
  "404_post": [(): string => `<h1>${lang.http["404"].post_title}</h1>${lang.http["404"].post_description}<br><a data-link href="/">${lang.http.home}</a>`, null],
  index: [(): string => `
    <h1>${escapeHTML(conf.site_name)}</h1>
    <h3>${escapeHTML(conf.version)}</h3>
    ${conf.new_accounts === false ? lang.account.no_new + "<br>" : `<a data-link href='/signup/'>${lang.account.sign_up_title}</a> -`}
    <a data-link href='/login/'>${lang.account.log_in_title}</a>
    ${context.source ? `<br><br>
      <a href="https://github.com/jerimiah-smiggins/smiggins" target="_blank">${lang.generic.source_code}</a>` : ""}
    ${context.discord ? `<br>${context.source ? "" : "<br>"}
      <a href="https://discord.gg/${context.discord}" target="_blank">${lang.generic.discord}</a>` : ""}
  `, null],
  login: [(): string => `
    <h1>${ lang.account.log_in_title }</h1>
    <input id="username" maxlength="${conf.max_username_length}" placeholder="${lang.account.username_placeholder}"><br>
    <input id="password" placeholder="${lang.account.password_placeholder}" type="password"><br><br>
    <button id="submit">${lang.account.log_in_title}</button><br><br>
    <button id="toggle-password">${lang.account.toggle_password}</button><br><br>
    <a data-link href="/signup/">${lang.account.sign_up_instead}</a>
    ${conf.email ? `<br><a data-link href="/reset-password/">${lang.account.forgot_password}</a>` : ""}
  `, loggedIn ? null : loginInit],
  signup: [(): string => `
    <h1>${lang.account.sign_up_title}</h1>
    ${conf.new_accounts === false ? escapeHTML(lang.account.no_new) + "<br><br>" : `
      <input id="username" maxlength="${conf.max_username_length}" placeholder="${lang.account.username_placeholder}"><br>
      <input id="password" placeholder="${lang.account.password_placeholder}" type="password"><br>
      <input id="confirm" placeholder="${lang.account.confirm_placeholder}" type="password"><br><br>
      ${conf.new_accounts === "otp" ? `
        <div>${lang.account.invite_code_info}</div>
        <input id="otp" placeholder="${lang.account.invite_code}" maxlength="32"><br>
      ` : ""}
      <button id="submit">${lang.account.sign_up_title}</button><br><br>
      <button id="toggle-password">${lang.account.toggle_password}</button><br><br>
    `}

    <a data-link href="/login/">${lang.account.log_in_instead}</a>
  `, loggedIn ? null : signupInit],
  logout: [(): string => `<a href="/">${lang.account.log_out_description}</a>`, logoutInit],
  home: [(): string => `
    <label for="default-private">${lang.post.type_followers_only}:</label>
    <input id="default-private" type="checkbox" ${defaultPrivate ? "checked" : ""}><br>
    ${conf.content_warnings ? `<input id="c-warning" data-create-post maxlength="${conf.max_content_warning_length}" placeholder="${lang.home.c_warning_placeholder}"><br>` : ""}
    <textarea id="post-text" data-create-post maxlength="${conf.max_post_length}" placeholder="${lang.home.post_input_placeholder}"></textarea><br>
    <button id="post" class="inverted">${lang.generic.post}</button><br>
    ${conf.polls ? `
      <button id="toggle-poll" class="inverted">${lang.home.poll}</button><br>
      <div hidden id="poll"></div>
    ` : ""}
    <p id="switch">
      <a data-timeline="following" data-storage-id="home-page" href="javascript:void(0);">${lang.home.timeline.following}</a> -
      <a data-timeline="recent" data-storage-id="home-page" href="javascript:void(0);">${lang.home.timeline.global}</a>
    </p>
    <button id="refresh" onclick="refresh()">${lang.generic.refresh}</button>
    <div id="posts"></div>
    <button id="more" onclick="refresh(true)" hidden>${lang.generic.load_more}</button>
  `, loggedIn ? (): void => { homeInit(); timelineInit(); } : null],
  settings: [(): string => `
    <h1>${lang.settings.title}</h1>
    <hr><br>
    <button class="big-button primary" id="save">${lang.generic.save}</button>
    <div class="settings-container">
      <div class="settings-side">
        <h2>${lang.settings.profile_title}</h2>
        ${lang.settings.profile_basic_title}<br>

        <input id="displ-name" autocomplete="off" placeholder="${lang.settings.profile_display_name_placeholder}" value="${escapeHTML(context.display_name)}" maxlength="${conf.max_display_name_length}"><br>
        ${conf.user_bios ? `<textarea id="bio" placeholder="${lang.settings.profile_bio_placeholder}" maxlength="${conf.max_bio_length}">${escapeHTML(context.bio)}</textarea><br>` : ""}<br>

        ${conf.pronouns && lang.generic.pronouns.enable_pronouns ? `
          ${lang.generic.pronouns.title}<br>
          ${lang.generic.pronouns.enable_secondary ? `
          <table class="center">
              <tr>
                <td class="right"><label for="pronouns-primary">${lang.generic.pronouns.primary_label}</label></td>
                <td class="left">
          ` : ""}
                  <select id="pronouns-primary">
                    ${inlineFor(
                      lang.generic.pronouns.primary,
                      ((noun: { key: string, special: string, name: string }): string => `<option value="${noun.key}" data-special="${noun.special}">${noun.name}</option>`)
                    )}
                  </select>
            ${lang.generic.pronouns.enable_secondary ? `
                </td>
              </tr>

              <tr id="pronouns-secondary-container">
                <td class="right"><label for="pronouns-secondary">${lang.generic.pronouns.secondary_label}</label></${lang.generic.pronouns.enable_secondary ? "td" : "span"}>
                <td class="left">
                  <select id="pronouns-secondary">
                    ${inlineFor(
                      lang.generic.pronouns.secondary,
                      ((noun: { key: string, special: string, name: string }): string => `<option value="${noun.key}" data-special="${noun.special}">${noun.name}</option>`)
                    )}
                  </select>
                </td>
              </tr>
            </table>
            ` : ""}<br>
        ` : ""}

        ${lang.settings.profile_banner_title}<br>
        <div id="banner"></div><br>
        <input aria-label="${lang.settings.profile_banner_title}" id="banner-color" value="${context.banner_color_one}" type="color">
        ${conf.gradient_banners ? `
          <input aria-label="${lang.settings.profile_banner_title}" ${context.gradient ? "" : "hidden"} id="banner-color-two" value="${context.banner_color_two}" type="color"><br>
          <label for="banner-is-gradient">${lang.settings.profile_gradient}</label>
          <input id="banner-is-gradient" ${context.gradient ? "checked" : ""} type="checkbox">
        ` : ""}<br><br>

        <label for="default-post">${lang.settings.profile_default_post}</label><br>
        <select id="default-post">
          <option value="public" ${context.default_post_private ? "" : "selected"}>${lang.post.type_public}</option>
          <option value="followers" ${context.default_post_private ? "selected" : ""}>${lang.post.type_followers_only}</option>
        </select><br><br>

        <label for="followers-approval">${lang.settings.profile_followers_approval}</label>
        <input type="checkbox" id="followers-approval" ${context.verify_followers ? "checked" : ""}>
      </div>

      <div>
        <h2>${lang.settings.cosmetic_title}</h2>
        <label for="theme">${lang.settings.cosmetic_theme}:</label><br>
        <select id="theme">
          <option ${context.theme == "auto" ? "selected" : ""} value="auto">${lang.settings.cosmetic_themes.auto}</option>
          ${inlineFor(
            context.themes,
            ((theme: { id: string, name: string }): string => `<option ${context.theme == theme.id ? "selected" : ""} value="${theme.id}">${escapeHTML(theme.name)}</option>`)
          )}
        </select><br><br>

        <label for="lang">${lang.settings.cosmetic_language}:</label><br>
        <select id="lang">
          ${inlineFor(
            context.languages,
            ((language: string): string => `<option value="${language}" ${language == context.language ? "selected" : ""}>${getLanguageName(language)}</option>`)
          )}
        </select><br><br>

        <label>
          ${lang.settings.cosmetic_checkboxes}
          <input id="disable-checkboxes" type="checkbox">
        </label><br><br>

        <label for="expand-cws">${lang.settings.cosmetic_expand}</label>
        <input id="expand-cws" type="checkbox"><br><br>

        <label for="compact">${lang.settings.cosmetic_compact}</label>
        <input id="compact" type="checkbox"><br><br>

        ${lang.settings.cosmetic_bar}:<br>
        <table class="center">
          <tr>
            <td class="right"><label for="bar-pos">${lang.settings.cosmetic_bar_position}</label></td>
            <td class="left">
              <select id="bar-pos">
                <option value="ur">${lang.settings.cosmetic_bar_ur}</option>
                <option value="lr">${lang.settings.cosmetic_bar_lr}</option>
                <option value="ul">${lang.settings.cosmetic_bar_ul}</option>
                <option value="ll">${lang.settings.cosmetic_bar_ll}</option>
              </select>
            </td>
          </tr>
          <tr>
            <td class="right"><label for="bar-dir">${lang.settings.cosmetic_bar_direction}</label></td>
            <td class="left">
              <select id="bar-dir">
                <option value="h">${lang.settings.cosmetic_bar_h}</option>
                <option value="v">${lang.settings.cosmetic_bar_v}</option>
              </select>
            </td>
          </tr>
        </table><br><br>

        ${conf.dynamic_favicon ? `
          <label for="old-favi">${lang.settings.cosmetic_old_favicon}</label>
          <input type="checkbox" id="old-favi"><br><br>
        ` : ""}

        <label for="color">${lang.settings.cosmetic_color}:</label><br>
        <div id="color-selector"></div>
        <div id="post-example"></div>
      </div>

      <div class="settings-side">
        <h2>${lang.settings.account_title}</h2>
        ${lang.settings.account_password}<br>
        <input type="password" autocomplete="off" placeholder="${lang.settings.account_password_current}" id="current"><br>
        <input type="password" autocomplete="off" placeholder="${lang.settings.account_password_new}" id="password"><br>
        <input type="password" autocomplete="off" placeholder="${lang.account.confirm_placeholder}" id="confirm"><br>
        <button id="toggle-password">${lang.account.toggle_password}</button>
        <button id="set-password">${lang.generic.save}</button><br><br>

        <h3>${lang.settings.mute.title}</h3>
        <div>${lang.settings.mute.soft}</div>
        <textarea id="soft-mute" placeholder="${lang.settings.mute.placeholder}">${escapeHTML(muted.filter((i: [string, number, boolean]): boolean => (!i[2])).map((val: [string, number, boolean]): string => (val[0])).join("\n"))}</textarea>
        <div>${lang.settings.mute.hard}</div>
        <textarea id="hard-mute" placeholder="${lang.settings.mute.placeholder}">${escapeHTML(muted.filter((i: [string, number, boolean]): boolean => (i[2])).map((val: [string, number, boolean]): string => (val[0])).join("\n"))}</textarea><br>
        <small>${lang.settings.mute.hard_description}</small><br>
        <button id="save-muted">${lang.generic.save}</button><br>
        <small>${lang.settings.mute.description.replaceAll("%m", String(conf.max_muted_words)).replaceAll("%c", String(conf.max_muted_word_length))}</small>

        ${conf.email ? `
          <label for="email">${lang.settings.account_email}</label><br>
          <input ${context.email && context.email_valid ? "disabled" : ""} value="${escapeHTML(context.email)}" id="email" type="email" placeholder="email@example.com"></br>
          <input type="password" autocomplete="off" placeholder="${lang.account.password_placeholder}" id="email-password"><br>
          <button id="email-submit">${context.email && context.email_valid ? lang.settings.account_email_update : lang.generic.save}</button>
          <div id="email-output">${context.email && !context.email_valid ? lang.settings.account_email_verify : ""}</div><br><br>
        ` : ""}

        ${lang.admin.account_deletion.title}<br>
        <button id="delete-account">${lang.admin.account_deletion.button}</button>

        ${conf.account_switcher ? `
          <br><br>
          <div id="switcher">
            <label for="accs">${lang.settings.account_switcher}</label><br>
            <select id="accs"></select><br>
            <button id="acc-switch">${lang.settings.account_switcher_switch}</button>
            <button id="acc-remove">${lang.settings.account_switcher_remove}</button><br><br>
            <a data-link href="/logout/?from=switcher">${lang.settings.account_switcher_add}</a>
          </div>
        ` : ""}
      </div>
    </div>

    <a data-link href="/logout/">${conf.account_switcher ? lang.settings.logout : lang.settings.logout_singular}</a><br><br>

    ${isAdmin ? `<a data-link href='/admin'>${lang.settings.admin}</a><br>` : ""}
    ${context.source ? `<a href="https://github.com/jerimiah-smiggins/smiggins" target="_blank">${lang.generic.source_code}</a><br>` : ""}
    ${context.discord ? `<a href="https://discord.gg/${context.discord}" target="_blank">${lang.generic.discord}</a><br>` : ""}

    ${isAdmin || context.source || context.discord ? "<br>" : ""}
    <hr><br>

    ${conf.site_name} ${conf.version}
    ${context.source ? `<br><a href="https://github.com/jerimiah-smiggins/smiggins/tree/main/CHANGELOG.md" target="_blank">${lang.settings.changelogs}</a>` : ""}
    ${context.contact ? `<br><a data-link href="/contact/">${lang.contact.title}</a>` : ""}
    ${context.credits ? `<br><a data-link href="/credits/">${lang.credits.title}</a>` : ""}
  `, loggedIn ? settingsInit : null],
  contact: [(): string => `
    <h1>${lang.contact.subtitle}</h1>
    <h2>${conf.site_name} ${conf.version}</h2>
    <ul>
      ${
        context.contact,
        ((contact: string): string => `<li>
          ${contact[0] == "email" ?
            `<a href="mailto:${encodeURIComponent(contact[1])}">${escapeHTML(contact[1])}</a>`
          : contact[0] == "url" ?
            `<a href="${encodeURIComponent(contact[1])}">${escapeHTML(contact[1])}</a>`
          : escapeHTML(contact[1])}
        </li>`)
      }
    </ul>
  `, null],
  credits: [(): string => `
    <h1>${lang.credits.title}</h1>
    <h2>${conf.site_name} ${conf.version}</h2>

    <h3>${lang.credits.main_title}</h3>
    <ul>
      <li>${lang.credits.lead} <a href="https://github.com/${context.credits.lead[0]}}/" target="_blank">${context.credits.lead[0]}</a></li>
      <li>
        ${lang.credits.contributors}<br>
        <ul>
          ${inlineFor(
            context.credits.contributors,
            "<li><a href=\"https://github.com/%s/\" target=\"_blank\">%s</a></li>",
            `<li><i>${lang.generic.none}</i></li>`
          )}
        </ul>
      </li>
    </ul>
    ${context.cache_langs ? `
      <h3>${lang.credits.lang_title}</h3>
      <ul>
        ${inlineFor(
          context.langs,
          ((l: { code: string, maintainers: string[], past_maintainers: string[] }): string => `
            <li>
              ${getLanguageName(l.code)}:<br>
              <ul>
                <li>
                  ${lang.credits.current}<br>
                  <ul>
                    ${inlineFor(
                      l.maintainers,
                      "<li><a href=\"https://github.com/%s/\" target=\"_blank\">%s</a></li>",
                      `<li><i>${lang.generic.none}</i></li>`
                    )}
                  </ul>
                </li>
                ${l.past_maintainers.length ? `
                  <li>
                    ${lang.credits.past}<br>
                    <ul>
                      ${inlineFor(
                        l.past_maintainers,
                        "<li><a href=\"https://github.com/%s/\" target=\"_blank\">%s</a></li>"
                      )}
                    </ul>
                  </li>
                ` : ""}
              </ul>
            </li>
          `)
        )}
      </ul>
    ` : ""}
    <h3>${lang.credits.other_title}</h3>
    <ul>
      <li>${lang.credits.fontawesome.replaceAll("%s", "<a href=\"https://fontawesome.com/\" target=\"_blank\">Font Awesome</a>")}</li>
    </ul>
  `, null],
  admin: [(): string => `
    <h1>${lang.admin.title}</h1>
    <hr>

    <div class="actions-container">
      ${testMask(Mask.DeletePost) ? (conf.post_deletion ? `
        <div>
          <h3><label for="post-id">${lang.admin.post_deletion.title}</label></h3>
          <div id="post-deletion">
            <input id="post-id" placeholder="${lang.admin.post_id_placeholder}"><br>
            <label for="comment-toggle">${lang.admin.is_comment_label}</label>
            <input id="comment-toggle" type="checkbox"><br>
            <button id="post-delete">${lang.admin.post_deletion.button}</button>
          </div>
        </div>
      ` : `<h3 class="red">${lang.admin.disabled.deletion}</h3>`) : ""}

      ${testMask(Mask.DeleteUser) ? `
        <div>
          <h3><label for="account-del-identifier">${lang.admin.account_deletion.title}</label></h3>
          <div>
            <input id="account-del-identifier" placeholder="${lang.admin.user_id_placeholder}"><br>
            <label for="delete-id-toggle">${lang.admin.use_id_label}</label>
            <input id="delete-id-toggle" type="checkbox"><br>
            <button id="account-delete">${lang.admin.account_deletion.button}</button>
          </div>
        </div>
      ` : ""}

      ${testMask(Mask.CreateBadge) || testMask(Mask.DeleteBadge) || testMask(Mask.GiveBadges) ? (conf.badges ? `
        <div>
          ${testMask(Mask.GiveBadges) ? `
            <h3><label for="badge-identifier">${lang.admin.badge.manage_title}</label></h3>
            <input id="badge-identifier" placeholder="${lang.admin.user_id_placeholder}"><br>
            <label for="badge-use-id">${ lang.admin.use_id_label}</label>
            <input id="badge-use-id" type="checkbox"><br>
            <label for="badge-name">${lang.admin.badge.name_label}</label>
            <select id="badge-name">
              ${inlineFor(
                Object.keys(badges).filter((val: string): boolean => (val !== "administrator")),
                "<option value=\"%s\">%s</option>",
                `<option value="">${lang.admin.badge.manage_empty}</option>`
              )}
            </select><br>
            <button id="badge-add">${lang.admin.badge.manage_add_button}</button>
            <button id="badge-remove">${lang.admin.badge.manage_remove_button}</button>
          ` : ""}

          ${testMask(Mask.CreateBadge) ? `
            <h3><label for="badge-create-name">${lang.admin.badge.create_title}</label></h3>
            <input id="badge-create-name" placeholder="${lang.admin.badge.name_placeholder}" maxlength="64"><br>
            <textarea id="badge-create-data" placeholder="${lang.admin.badge.data_placeholder}" maxlength="65536"></textarea><br>
            <button id="badge-create">${lang.admin.badge.create_button}</button>
          ` : ""}

          ${testMask(Mask.DeleteBadge) ? `
            <h3><label for="badge-delete-name">${lang.admin.badge.delete_title}</label></h3>
            <input id="badge-delete-name" placeholder="${lang.admin.badge.name_placeholder}"><br>
            <button id="badge-delete">${lang.admin.badge.delete_button}</button>
          ` : ""}
        </div>
      ` : `<h3 class="red">${lang.admin.disabled.badge}</h3>`) : ""}

      ${testMask(Mask.ModifyAccount) ? `
        <div>
          <h3><label for="data-identifier">${lang.admin.modify.title}</label></h3>
          <input id="data-identifier" placeholder="${lang.admin.user_id_placeholder}"><br>
          <label for="data-use-id">${lang.admin.use_id_label}</label>
          <input type="checkbox" id="data-use-id"><br>
          <button id="data-get">${lang.admin.modify.get_button}</button><br><br>
          <div id="data-section"></div>
        </div>
      ` : ""}

      ${testMask(Mask.AdminLevel) ? `
        <div>
          <h3><label for="level-identifier">${lang.admin.permissions.title}</label></h3>
          <input id="level-identifier" placeholder="${lang.admin.user_id_placeholder}"><br>
          <label for="level-use-id">${lang.admin.use_id_label}</label>
          <input id="level-use-id" type="checkbox"><br><br>

          <b>${lang.admin.permissions.label}</b><br>
          <div id="level-selection">
            ${inlineFor(
              [...Array(context.max_level).keys()],
              ((lv: number): string => `
                <p>
                  <input type="checkbox" id="level-${lv}"><label for="level-${lv}">
                  ${lang.admin.permissions.descriptions[String(lv)]}
                  ${context.permissions_disabled[String(lv)] ? `
                    <span class="red">(${lang.admin.disabled.generic})</span>
                  ` : ""}
                  ${lang.admin.permissions.descriptions_extra[String(lv)] ? `
                    <small>${lang.admin.permissions.descriptions_extra[String(lv)]}</small>
                  ` : ""}
                </label>
              </p>
              `)
            )}
          </div>

          <button id="level-set">${lang.admin.permissions.set}</button>
          <button id="level-load">${lang.admin.permissions.load}</button>
        </div>
      ` : ""}

      ${testMask(Mask.GenerateOTP) ? (conf.new_accounts === "otp" ? `
        <div>
          <h3>${lang.admin.otp.generate}</h3>
          <button id="otp-create">${lang.admin.otp.generate_button}</button>
          <div id="otp-generated"></div>
          <h3>${lang.admin.otp.all}</h3>
          <button id="otp-load">${lang.admin.otp.all_button}</button>
          <div id="otp-all"></div>
        </div>
      ` : `<h3 class="red">${lang.admin.disabled.otp}</h3>`) : ""}

      ${testMask(Mask.ChangeMutedWords) ? `
        <div>
          <h3>${lang.settings.mute.title}</h3>
          <textarea id="muted" placeholder="${lang.settings.mute.placeholder}">${escapeHTML(context.muted)}</textarea><br>
          <button id="save-muted">${lang.generic.save}</button><br>
          <small>${lang.settings.mute.description.replaceAll("%m", String(conf.max_muted_words)).replaceAll("%c", String(conf.max_muted_word_length))}</small>
        </div>
      ` : ""}
    </div>

    ${testMask(Mask.ReadLogs) ? `
      <br><br>
      <button id="load-logs">${lang.admin.logs.button}</button>
      <div id="admin-logs"></div>
    ` : ""}
  `, isAdmin ? adminInit : null],
  reset: [(): string => `
    <h1><label for="username">${lang.email.reset.html_title}</label></h1>
    <input placeholder="${lang.account.username_placeholder}" id="username"><br>
    <button id="submit">Submit</button><br><br>
    <a href="/login/">${lang.http.home}</a><br><br>
  `, loggedIn || !conf.email ? null : resetPasswordInit]
};

function inlineFor(
  iter: any[],
  callback: ((obj: any) => string) | string,
  empty: string | null=null
): string {
  let out: string = "";

  for (const item of iter) {
    if (typeof callback == "string") {
      out += callback.replaceAll("%s", String(item));
    } else {
      out += callback(item);
    }
  }

  if (out === "") {
    out = empty;
  }

  return out;
}

function registerLinks(element: HTMLElement): void {
  for (const el of element.querySelectorAll("a[data-link]")) {
    el.addEventListener("click", linkEventHandler);
    el.removeAttribute("data-link");
  }
}

function linkEventHandler(event: MouseEvent): void {
  // allow using ctrl to open in a new tab
  if (event.ctrlKey) { return; }

  event.preventDefault();

  // the element.href property automatically adds the whole url (ex. http://localhost:8000/login/ instead of /login/), which is why this is needed
  let path: string = (event.currentTarget as HTMLAnchorElement).getAttribute("href");

  if (location.href == path || location.pathname == path) {
    return;
  }

  redirect(path);
}

function renderPage(): void {
  document.title = `${context.strings[0] ? `${context.strings[0]} - ` : ""}${conf.site_name} ${conf.version}`;
  dom("content").dataset.page = context.page;
  redirectConfirmation = null;
  onLoad = null;
  updateIconBar();

  let page;
  if (pages[context.page]) {
    page = pages[context.page];
  } else {
    page = pages[pageNotFound];
  }

  dom("content").innerHTML = page[0]();
  registerLinks(dom("content"));

  if (page[1]) {
    page[1]();
  }
}

function loadContext(url: string, postFunction: () => void=renderPage): void {
  if (contextLoading) {
    return;
  }

  contextLoading = true;

  fetch(`/api/init/context?url=${encodeURIComponent(url.split("?")[0])}`)
    .then((response) => (response.json()))
    .then((json: {
      success: boolean,
      context: _context,
      message?: string,
      set_url?: string
    }) => {
      if (json.success) {
        context = json.context;
        let args: [_context, "", string?] = [context, ""];

        if (json.set_url) {
          args.push(json.set_url);
        } else if (url !== location.pathname) {
          args.push(url);
        }

        if (!hasHistoryBeenUsedYet) {
          history.replaceState(...args);
          hasHistoryBeenUsedYet = true;
        } else {
          history.pushState(...args);
        }

        console.log(context);
        contextLoading = false;
        postFunction();
      } else {
        // This should only happen if ratelimiting occurs
        contextLoading = false;
        toast(`${somethingWentWrong} ${json.message || ""}`, true);
      }
    })
    .catch((err: any) => {
      contextLoading = false;
      toast(`${somethingWentWrong} ${err}`, true);
      throw err;
    })
}

addEventListener("popstate", (e: PopStateEvent): void => {
  if (e.state) {
    context = e.state;
    renderPage();
  }
});
