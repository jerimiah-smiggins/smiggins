// Common variables used throughout the site
let home: boolean | void;
let logged_in: boolean | void;
let profile: boolean | void;
let share: string | void;
let url: string;
let type: string;
let includeUserLink: boolean;
let includePostLink: boolean;
let inc: number;
let disableTimeline: boolean;
let c: number;
let offset: number;

let globalIncrement: number = 0;

function dom(id: string): HTMLElement {
  return document.getElementById(id);
}

const validColors: string[] = [
  "rosewater", "flamingo", "pink", "mauve",
  "red", "maroon", "peach", "yellow", "green",
  "teal", "sky", "sapphire", "blue", "lavender"
]

const months: string[] = lang.generic.time.months;
const pronouns: { [key: string]: string } = lang.generic.pronouns;

pronouns._a = pronouns.a;
pronouns._o = pronouns.o;
pronouns._v = pronouns.v;

function showlog(str: string, time: number = 3000): void {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => {
    --inc;
    if (!inc) {
      dom("error").innerText = "";
    }
  }, time);
};

function setCookie(name: string, value: string): void {
  let date = new Date();
  date.setTime(date.getTime() + (356 * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};Path=/;SameSite=Lax;Expires=${date.toUTCString()}`;
}

function eraseCookie(name: string): void {
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function genericKeyboardEvent(e: KeyboardEvent, func: Function) {
  if (e.key == "Enter" || e.key == " ") {
    e.preventDefault();
    func();
  }
}

function sha256(ascii: string): string {
  function rightRotate(value: any, amount: any): any {
    return (value >>> amount) | (value << (32 - amount));
  };

  let maxWord: number = Math.pow(2, 32);
  let result: string = '';

  let words = [];
  let asciiBitLength: number = ascii["length"] * 8;

  let hash = [];
  let k = [];
  let primeCounter: number = k["length"];

  let isComposite = {};
  for (let candidate: number = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i: number = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80'
  while (ascii["length"] % 64 - 56) ascii += '\x00'
  for (let i: number = 0; i < ascii["length"]; i++) {
    let j: number = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words["length"]] = ((asciiBitLength / maxWord) | 0);
  words[words["length"]] = (asciiBitLength)

  for (let j: number = 0; j < words["length"];) {
    let w = words.slice(j, j += 16);
    let oldHash = hash;
    hash = hash.slice(0, 8);

    for (let i: number = 0; i < 64; i++) {
      let w15 = w[i - 15];
      let w2 = w[i - 2];
      let a = hash[0]
      let e = hash[4];
      let temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5])^((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
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
};

function timeSince(date: number): string {
  let dateObject: Date = new Date(date * 1000);
  let dateString: string = `${months[dateObject.getMonth()]} ${dateObject.getDate()}, ${dateObject.getFullYear()}, ${String(dateObject.getHours()).padStart(2, "0")}:${String(dateObject.getMinutes()).padStart(2, "0")}:${String(dateObject.getSeconds()).padStart(2, "0")}`;

  let seconds: number = Math.floor((+(new Date()) / 1000 - date + 1));
  let unit: string = "second"
  let amount: number = seconds > 0 ? seconds : 0;

  const timeAmounts: { name: string, amount: number }[] = [
    { name: "minute", amount: 60 },
    { name: "hour",   amount: 3600 },
    { name: "day",    amount: 86400 },
    { name: "month",  amount: 2592000 },
    { name: "year",   amount: 31536000 }
  ]

  for (const info of timeAmounts) {
    let interval: number = seconds / info.amount;

    if (interval >= 1) {
      unit = info.name;
      amount = Math.floor(interval);
    }
  }

  return `<span data-timestamp="${date}" title="${dateString}">${lang.generic.time.ago.replaceAll("%s", `${Math.floor(amount)} ${lang.generic.time[unit + (Math.floor(amount) == 1 ? "_singular" : "_plural")]}`)}</span>`;
}

function escapeHTML(str: string): string {
  return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;");
}

/*
  <div class="upper-content">
        <a href="/u/trinkey" class="no-underline text">
          </a><div class="main-area"><a href="/u/trinkey" class="no-underline text">
            <span class="displ-name">
              <span style="--color-one: #b1a2dd; --color-two: #7883e2" class="user-badge banner-pfp"></span>
              
              trinkey
              <span aria-hidden="true" class="user-badge"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><title>Developer</title><path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6m80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3l89.3 89.4-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3"></path></svg></span> <span aria-hidden="true" class="user-badge"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 724 727"><path d="M444 95c0 .55-2.475 1-5.5 1s-5.5.386-5.5.858c0 .471-2.812 1.151-6.25 1.509-3.437.359-6.4 1.098-6.583 1.643-.184.544-1.646.99-3.25.99s-2.917.45-2.917 1-1.125 1-2.5 1-2.5.45-2.5 1-1.35 1-3 1-3 .45-3 1-.675 1-1.5 1-1.5.391-1.5.868c0 .478-1.903 1.124-4.228 1.436-2.326.312-4.389 1.046-4.584 1.631-.195.586-1.217 1.065-2.271 1.065s-1.917.45-1.917 1-1.35 1-3 1-3 .45-3 1-.675 1-1.5 1-1.5.45-1.5 1-.9 1-2 1-2 .4-2 .889c0 .488-1.575 1.184-3.5 1.545s-3.5 1.086-3.5 1.611-.9.955-2 .955-2 .45-2 1-.9 1-2 1-2 .45-2 1-.51 1-1.133 1-1.86.828-2.75 1.84-2.855 2.146-4.367 2.519-2.75 1.121-2.75 1.66c0 .54-.485.981-1.078.981s-2.808 1.8-4.922 4-4.381 4-5.039 4c-1.661 0-8.961 7.684-8.961 9.434 0 .787-.9 1.717-2 2.066s-2 1.472-2 2.496-.675 2.536-1.5 3.361-1.5 2.432-1.5 3.572c0 1.139-.45 2.071-1 2.071-.596 0-1 3.833-1 9.5s.404 9.5 1 9.5c.55 0 1 1.125 1 2.5s.41 2.5.912 2.5 1.216 1.8 1.588 4 1.074 4 1.562 4c.487 0 2.91 2.025 5.385 4.5s4.769 4.5 5.098 4.5 1.273.675 2.098 1.5 3.043 1.5 4.928 1.5c1.886 0 3.429.45 3.429 1 0 .578 3.167 1 7.5 1s7.5-.422 7.5-1c0-.55 1.318-1 2.929-1s3.603-.675 4.428-1.5 1.982-1.5 2.572-1.5c.589 0 1.071-.45 1.071-1s.9-1 2-1 2-.45 2-1 .87-1 1.933-1 2.218-.9 2.567-2 1.472-2 2.496-2 2.536-.675 3.361-1.5 2.177-1.5 3.004-1.5 1.79-.9 2.139-2 1.504-2 2.567-2 1.933-.45 1.933-1 .9-1 2-1 2-.42 2-.933 1.012-1.252 2.25-1.643c1.238-.39 2.978-1.546 3.867-2.567.89-1.021 2.352-1.857 3.25-1.857s1.633-.45 1.633-1 .576-1 1.279-1c.704 0 1.918-.886 2.698-1.968.848-1.177 3.15-2.228 5.721-2.614 2.366-.355 4.302-1.044 4.302-1.532 0-.487 1.35-.886 3-.886s3-.45 3-1 1.125-1 2.5-1 2.5-.45 2.5-1 1.8-1 4-1 4-.45 4-1 2.025-1 4.5-1 4.5-.45 4.5-1c0-.624 5.833-1 15.5-1s15.5.376 15.5 1c0 .578 3.167 1 7.5 1s7.5.422 7.5 1c0 .55 2.025 1 4.5 1s4.5.45 4.5 1 1.35 1 3 1 3 .45 3 1 1.125 1 2.5 1 2.5.4 2.5.889c0 .488 1.575 1.184 3.5 1.545s3.5 1.086 3.5 1.611.9.955 2 .955 2 .45 2 1 .9 1 2 1 2 .45 2 1 .675 1 1.5 1 1.5.45 1.5 1 .694 1 1.542 1c2.073 0 2.781.602 12.063 10.267 1.708 1.778 4.044 3.876 5.192 4.662 1.208.827 2.36 3.039 2.733 5.25.355 2.102 1.056 3.821 1.558 3.821s.912.675.912 1.5.45 1.5 1 1.5 1 .9 1 2 .45 2 1 2 1 1.575 1 3.5.45 3.5 1 3.5c.625 0 1 6 1 16s-.375 16-1 16c-.55 0-1 1.575-1 3.5s-.45 3.5-1 3.5-1 .9-1 2-.45 2-1 2-1 .675-1 1.5-.45 1.5-1 1.5-1 .868-1 1.929-.675 2.603-1.5 3.428-1.5 1.769-1.5 2.098-2.025 2.623-4.5 5.098-4.5 4.938-4.5 5.473-.88.974-1.955.974-3.079 1.125-4.454 2.5-2.871 2.5-3.325 2.5c-.453 0-1.473.9-2.266 2s-2.242 2-3.221 2c-.978 0-1.779.422-1.779.939s-2.025 1.242-4.5 1.613-4.5 1.074-4.5 1.562c0 .487-.9.886-2 .886s-2 .45-2 1-1.575 1-3.5 1-3.5.45-3.5 1-1.575 1-3.5 1-3.5.45-3.5 1-1.8 1-4 1-4 .412-4 .915-3.375 1.231-7.5 1.617c-4.125.387-7.5 1.1-7.5 1.585 0 .486-1.575.883-3.5.883s-3.5.45-3.5 1-1.575 1-3.5 1-3.5.45-3.5 1-1.8 1-4 1-4 .45-4 1-1.575 1-3.5 1-3.5.412-3.5.915-3.375 1.231-7.5 1.617c-4.125.387-7.5 1.1-7.5 1.585 0 .486-2.025.883-4.5.883s-4.5.45-4.5 1-.675 1-1.5 1-1.5.45-1.5 1-1.35 1-3 1-3 .45-3 1-.9 1-2 1-2 .401-2 .892c0 .49-1.125 1.174-2.5 1.519s-2.5 1.069-2.5 1.608-.801.981-1.779.981c-.979 0-2.441.955-3.25 2.123-.809 1.167-2.033 2.71-2.721 3.428-.687.718-1.25 1.689-1.25 2.157s-.9 1.499-2 2.292c-1.174.847-2 2.589-2 4.221 0 1.528-.45 2.779-1 2.779-.583 0-1 3.333-1 8s.417 8 1 8c.55 0 1 1.35 1 3s.45 3 1 3 1 .87 1 1.933.9 2.218 2 2.567 2 .986 2 1.414c0 1.523 3.76 5.086 5.367 5.086.898 0 1.633.45 1.633 1s.863 1 1.917 1 2.085.507 2.292 1.127 2.719 1.352 5.583 1.627 5.208.893 5.208 1.373 2.475.873 5.5.873 5.5.45 5.5 1c0 .571 3 1 7 1s7 .429 7 1c0 .55 2.025 1 4.5 1s4.5.45 4.5 1 2.25 1 5 1 5 .392 5 .871 2.7 1.176 6 1.549c3.3.374 6 1.107 6 1.63s1.35.95 3 .95 3 .45 3 1 1.35 1 3 1 3 .45 3 1 1.125 1 2.5 1 2.5.45 2.5 1 .9 1 2 1 2 .43 2 .955 1.575 1.25 3.5 1.611 3.5 1.057 3.5 1.545c0 .489.9.889 2 .889s2 .45 2 1 .576 1 1.279 1c.704 0 1.928.9 2.721 2s2.242 2 3.221 2c.978 0 1.779.45 1.779 1s.837 1 1.86 1 2.705 1.125 3.737 2.5 2.444 2.5 3.135 2.5c1.642 0 22.268 20.653 22.268 22.297 0 .694.9 1.91 2 2.703s2 1.824 2 2.292.675 1.526 1.5 2.351 1.5 2.368 1.5 3.428.45 1.929 1 1.929 1 .9 1 2 .45 2 1 2 1 .675 1 1.5.45 1.5 1 1.5 1 1.35 1 3 .45 3 1 3 1 1.088 1 2.417.438 2.566.973 2.75c.534.183 1.274 3.595 1.643 7.583s1.057 7.25 1.528 7.25.856 3.825.856 8.5c0 5 .412 8.5 1 8.5.556 0 1 2.667 1 6s-.444 6-1 6c-.564 0-1 2.833-1 6.5 0 3.575-.393 6.5-.873 6.5s-1.098 2.343-1.373 5.208c-.275 2.864-1.007 5.376-1.627 5.583S567 548.479 567 550.083c0 1.605-.45 2.917-1 2.917s-1 .576-1 1.279c0 .704-.9 1.928-2 2.721s-2 2.242-2 3.221c0 .978-.42 1.779-.933 1.779s-1.236.958-1.608 2.129c-.628 1.977-19.705 21.871-20.973 21.871-.548 0-1.966 1.074-4.949 3.75-.767.688-2.101 1.25-2.966 1.25-.864 0-1.571.45-1.571 1s-.576 1-1.279 1c-.704 0-1.928.9-2.721 2s-2.242 2-3.221 2c-.978 0-1.779.45-1.779 1s-1.125 1-2.5 1-2.5.435-2.5.966-2.25 1.264-5 1.628c-2.75.365-5 1.056-5 1.535s-1.575.871-3.5.871-3.5.45-3.5 1-1.575 1-3.5 1-3.5.45-3.5 1c0 .636-7.833 1-21.5 1s-21.5-.364-21.5-1c0-.55-2.475-1-5.5-1s-5.5-.45-5.5-1-1.575-1-3.5-1-3.5-.398-3.5-.884c0-.485-2.925-1.196-6.5-1.579s-6.5-1.11-6.5-1.617-.675-.92-1.5-.92-1.5-.45-1.5-1-.9-1-2-1-2-.45-2-1-.9-1-2-1-2-.45-2-1-.576-1-1.279-1c-.704 0-1.928-.9-2.721-2s-2.222-2-3.175-2c-1.832 0-6.825-4.423-6.825-6.045 0-.525-.707-.955-1.571-.955-1.544 0-4.429-2.263-4.429-3.474 0-.339-1.012-1.7-2.25-3.023-3.951-4.226-4.75-5.385-4.75-6.893 0-.812-.9-1.761-2-2.11s-2-1.405-2-2.347c0-.941-.9-2.36-2-3.153s-2-2.256-2-3.252-.675-2.07-1.5-2.386-1.5-1.328-1.5-2.248-.9-2.321-2-3.114-2-2.242-2-3.221c0-.978-.43-1.779-.955-1.779-1.24 0-6.045-4.805-6.045-6.045 0-.525-.9-.955-2-.955s-2-.45-2-1-.863-1-1.917-1-2.105-.562-2.335-1.25c-.306-.913-3.876-1.25-13.251-1.25s-12.943.337-13.247 1.25c-.229.688-1.279 1.25-2.333 1.25s-1.917.45-1.917 1-.9 1-2 1-2 .43-2 .955c0 1.077-3.643 4.801-6.862 7.016-1.176.809-2.138 2.271-2.138 3.25 0 .978-.4 1.779-.889 1.779-.488 0-1.184 1.575-1.545 3.5s-1.086 3.5-1.611 3.5c-.532 0-.955 3.769-.955 8.5 0 4.675.387 8.5.861 8.5.473 0 1.14 2.36 1.481 5.244s1.08 5.397 1.64 5.583c.56.187 1.018.977 1.018 1.756s.45 1.417 1 1.417 1 .9 1 2 .45 2 1 2 1 .9 1 2 .45 2 1 2 1 .9 1 2 .414 2 .921 2c.506 0 1.241 1.462 1.634 3.249s1.553 3.977 2.579 4.867 1.866 1.918 1.866 2.285c0 .366 1.575 2.241 3.5 4.166s3.5 4.385 3.5 5.466.438 1.967.974 1.967c.813 0 5.137 4.108 10.728 10.192 2.269 2.469 4.215 3.808 5.535 3.808.727 0 1.983.942 2.792 2.093 2.999 4.268 4.538 5.604 7.221 6.266 1.512.374 2.75 1.121 2.75 1.66 0 .54.576.981 1.279.981.704 0 1.928.9 2.721 2s2.242 2 3.221 2c.978 0 1.779.45 1.779 1s.9 1 2 1 2 .441 2 .981c0 .539 1.125 1.263 2.5 1.608s2.5 1.029 2.5 1.519c0 .491.9.892 2 .892s2 .45 2 1 1.125 1 2.5 1 2.5.45 2.5 1 .9 1 2 1 2 .45 2 1 .9 1 2 1 2 .418 2 .928 2.475 1.237 5.5 1.615 5.5 1.086 5.5 1.572c0 .487 1.125.885 2.5.885s2.5.45 2.5 1 1.8 1 4 1 4 .45 4 1 1.575 1 3.5 1 3.5.45 3.5 1 1.988 1 4.417 1c2.644 0 4.583.502 4.833 1.25.607 1.822 72.892 1.822 73.5 0 .265-.795 2.389-1.25 5.833-1.25 2.98 0 5.417-.45 5.417-1s1.575-1 3.5-1 3.5-.45 3.5-1 1.125-1 2.5-1 2.5-.45 2.5-1 1.35-1 3-1 3-.399 3-.886c0-.488 2.025-1.191 4.5-1.562s4.5-1.097 4.5-1.613c0-.517.9-.939 2-.939s2-.45 2-1 .675-1 1.5-1 1.5-.45 1.5-1 1.251-1 2.779-1c1.615 0 3.372-.823 4.194-1.963.779-1.08 2.79-2.265 4.47-2.634s3.783-1.511 4.673-2.537S566.439 652 567.3 652s1.851-.9 2.2-2 1.312-2 2.139-2 2.179-.675 3.004-1.5 2.368-1.5 3.428-1.5 1.929-.438 1.929-.974c0-1.281 8.764-10.026 10.048-10.026 1.298 0 11.952-10.654 11.952-11.952 0-1.284 8.745-10.048 10.026-10.048.536 0 .974-.694.974-1.542 0-1.443.639-2.453 3.75-5.921.687-.767 1.25-1.777 1.25-2.245s.9-1.499 2-2.292 2-2.077 2-2.853.84-2.141 1.866-3.031 2.187-3.08 2.579-4.867 1.128-3.249 1.634-3.249c.507 0 .921-.9.921-2s.45-2 1-2 1-.9 1-2 .45-2 1-2 1-.675 1-1.5.45-1.5 1-1.5 1-1.312 1-2.917.479-3.076 1.065-3.271c.585-.195 1.319-2.258 1.631-4.584s.958-4.228 1.436-4.228c.477 0 .868-1.125.868-2.5s.45-2.5 1-2.5 1-1.8 1-4 .45-4 1-4 1-1.575 1-3.5.45-3.5 1-3.5c.564 0 1-2.833 1-6.5s.436-6.5 1-6.5c.639 0 1-8.667 1-24s-.361-24-1-24c-.564 0-1-2.833-1-6.5s-.436-6.5-1-6.5c-.55 0-1-1.575-1-3.5s-.45-3.5-1-3.5-1-1.575-1-3.5-.45-3.5-1-3.5-1-1.35-1-3-.418-3-.928-3-1.237-2.475-1.615-5.5-1.086-5.5-1.572-5.5c-.487 0-.885-.675-.885-1.5s-.45-1.5-1-1.5-1-.9-1-2-.45-2-1-2-1-.9-1-2-.45-2-1-2-1-.482-1-1.071c0-.59-.675-1.747-1.5-2.572s-1.5-2.368-1.5-3.428-.45-1.929-1-1.929-1-.9-1-2-.381-2-.847-2c-1.353 0-5.153-3.621-5.153-4.91 0-1.192-1.429-3.209-3.818-5.388-.725-.661-4.409-4.24-8.188-7.952-3.778-3.712-7.392-6.75-8.031-6.75-.638 0-2.422-1.35-3.963-3s-3.297-3-3.901-3c-.605 0-1.099-.441-1.099-.981 0-.539-1.237-1.286-2.75-1.66s-3.478-1.507-4.367-2.519c-.89-1.012-2.127-1.84-2.75-1.84s-1.133-.45-1.133-1-.9-1-2-1-2-.45-2-1-.9-1-2-1-2-.43-2-.955-1.575-1.25-3.5-1.611-3.5-1.057-3.5-1.545c0-.489-.9-.889-2-.889s-2-.45-2-1-.675-1-1.5-1-1.5-.45-1.5-1-1.35-1-3-1-3-.45-3-1 .9-1 2-1 2-.422 2-.939 2.025-1.242 4.5-1.613 4.5-1.074 4.5-1.562c0-.487.9-.886 2-.886s2-.45 2-1 .675-1 1.5-1 1.5-.45 1.5-1 .9-1 2-1 2-.45 2-1 .9-1 2-1 2-.45 2-1 .675-1 1.5-1 1.5-.45 1.5-1 .868-1 1.929-1 2.603-.675 3.428-1.5 2.207-1.5 3.072-1.5c.864 0 1.571-.435 1.571-.967 0-1.221 11.263-12.033 12.536-12.033 1.203 0 3.464-2.891 3.464-4.429 0-.864.381-1.571.847-1.571 1.368 0 5.153-3.627 5.153-4.939 0-.662.563-1.831 1.25-2.598 3.192-3.559 3.75-4.515 3.75-6.421 0-1.123.45-2.042 1-2.042s1-.9 1-2 .45-2 1-2 1-.675 1-1.5.45-1.5 1-1.5 1-.9 1-2 .398-2 .885-2c.486 0 1.194-2.475 1.572-5.5s1.105-5.5 1.615-5.5.928-1.35.928-3 .45-3 1-3 1-2.025 1-4.5.45-4.5 1-4.5c.571 0 1-3 1-7s.429-7 1-7c.626 0 1-6.167 1-16.5s-.374-16.5-1-16.5c-.564 0-1-2.833-1-6.5s-.436-6.5-1-6.5c-.55 0-1-2.25-1-5s-.45-5-1-5-1-1.125-1-2.5-.387-2.5-.861-2.5c-.473 0-1.14-2.36-1.481-5.244s-1.08-5.397-1.64-5.583c-.56-.187-1.018-1.652-1.018-3.256s-.45-2.917-1-2.917-1-.675-1-1.5-.45-1.5-1-1.5-1-.801-1-1.779c0-.979-.883-2.416-1.963-3.194-1.08-.779-2.265-2.79-2.634-4.47s-1.511-3.783-2.537-4.673-1.866-2.353-1.866-3.251-.402-1.633-.894-1.633c-1.764 0-6.783-5.554-7.457-8.25-.378-1.512-1.114-2.75-1.635-2.75s-2.522-1.575-4.447-3.5-3.761-3.5-4.079-3.5-1.662-1.012-2.985-2.25c-4.251-3.974-5.387-4.75-6.961-4.75-.848 0-1.542-.381-1.542-.847 0-1.577-3.725-5.153-5.367-5.153-.898 0-1.633-.45-1.633-1s-.914-1-2.031-1c-1.118 0-2.291-.675-2.607-1.5s-1.428-1.5-2.469-1.5-1.893-.45-1.893-1-.9-1-2-1-2-.45-2-1-.675-1-1.5-1-1.5-.45-1.5-1-.9-1-2-1-2-.391-2-.868c0-.478-1.903-1.124-4.228-1.436-2.326-.312-4.389-1.046-4.584-1.631-.195-.586-1.667-1.065-3.271-1.065s-2.917-.45-2.917-1-1.125-1-2.5-1-2.5-.45-2.5-1-1.8-1-4-1-4-.45-4-1-1.575-1-3.5-1-3.5-.414-3.5-.92-4.5-1.239-10-1.629-10-1.101-10-1.58-4.275-.871-9.5-.871c-5.667 0-9.5-.404-9.5-1 0-.63-6.667-1-18-1s-18 .37-18 1M109.25 243.676c-1.787.248-3.25.872-3.25 1.387 0 .516-.801.937-1.779.937-.979 0-2.428.9-3.221 2s-1.813 2-2.266 2-1.95 1.125-3.325 2.5-2.929 2.5-3.454 2.5-.955.707-.955 1.571c0 .865-.675 2.247-1.5 3.072s-1.5 2.368-1.5 3.428S87.55 265 87 265s-1 2.025-1 4.5-.45 4.5-1 4.5c-.564 0-1 2.833-1 6.5s.436 6.5 1 6.5c.55 0 1 2.475 1 5.5s.392 5.5.872 5.5c.479 0 1.079 5.037 1.332 11.194.3 7.275.87 11.331 1.629 11.584.642.214 1.167 1.251 1.167 2.305S91.45 325 92 325s1 .801 1 1.779c0 .979.955 2.441 2.123 3.25 2.674 1.854 3.994 3.174 5.848 5.848.809 1.168 2.106 2.123 2.882 2.123s2.266.984 3.309 2.187c1.694 1.953 3.117 2.233 13.303 2.623 15.731.602 24.264-.38 25.059-2.885.336-1.059 1.255-1.925 2.042-1.925 1.987 0 9.434-7.407 9.434-9.383 0-.889.45-1.617 1-1.617s1-.9 1-2 .45-2 1-2 1-.675 1-1.5.45-1.5 1-1.5 1-2.475 1-5.5.45-5.5 1-5.5 1-1.8 1-4-.45-4-1-4c-.6 0-1-4-1-10s-.4-10-1-10c-.55 0-1-1.575-1-3.5s-.45-3.5-1-3.5-1-1.8-1-4-.414-4-.921-4c-.506 0-1.238-1.448-1.627-3.218-.389-1.769-1.999-4.425-3.579-5.901S150 253.908 150 253.553c0-1.055-4.823-5.553-5.955-5.553-.575 0-1.045-.45-1.045-1s-.863-1-1.917-1-2.104-.562-2.333-1.25c-.301-.904-3.989-1.288-13.333-1.387-7.104-.075-14.38.066-16.167.313M119 502c0 .55-1.35 1-3 1s-3 .45-3 1-.675 1-1.5 1-1.5.45-1.5 1-.801 1-1.779 1c-.979 0-2.428.9-3.221 2s-2.081 2-2.862 2c-1.854 0-7.138 5.545-7.138 7.491 0 .83-.45 1.509-1 1.509s-1 .675-1 1.5-.45 1.5-1 1.5-1 1.35-1 3-.45 3-1 3c-.606 0-1 4.333-1 11s.394 11 1 11c.55 0 1 2.475 1 5.5s.45 5.5 1 5.5c.593 0 1 3.667 1 9s.407 9 1 9c.55 0 1 2.475 1 5.5s.45 5.5 1 5.5 1 .9 1 2 .394 2 .875 2 1.145 1.348 1.474 2.996c.793 3.966 10.689 13.862 14.655 14.655 1.648.329 2.996.993 2.996 1.474s1.575.875 3.5.875 3.5.45 3.5 1c0 .578 3.167 1 7.5 1s7.5-.422 7.5-1c0-.55 1.575-1 3.5-1s3.5-.45 3.5-1 1.33-1 2.955-1c1.818 0 3.916-.962 5.454-2.5 1.375-1.375 2.778-2.5 3.117-2.5 1.187 0 3.474-2.871 3.474-4.361 0-.827.9-1.79 2-2.139s2-1.504 2-2.567.422-1.933.939-1.933 1.242-2.025 1.613-4.5 1.074-4.5 1.562-4.5c.487 0 .886-7.2.886-16s-.384-16-.852-16c-.469 0-1.16-4.388-1.535-9.75s-1.116-9.9-1.647-10.083c-.531-.184-.966-1.871-.966-3.75s-.45-3.417-1-3.417-1-.9-1-2-.45-2-1-2-1-.675-1-1.5-.45-1.5-1-1.5-1-.9-1-2-.45-2-1-2-1-.882-1-1.961c0-1.078-.697-2.54-1.548-3.25-.852-.709-2.631-2.301-3.955-3.539-1.323-1.238-3.102-2.25-3.952-2.25s-1.545-.45-1.545-1-.675-1-1.5-1-1.5-.45-1.5-1-.9-1-2-1-2-.45-2-1c0-.6-4-1-10-1s-10 .4-10 1"></path></svg></span> <span aria-hidden="true" class="user-badge"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="var(--base)" d="M0 73.1C0 32.8 32.8 0 73.1 0h365.7c40.3 0 73.1 32.8 73.1 73.1v365.7c0 40.3-32.8 73.1-73.1 73.1H73.1C32.8 511.9 0 479.1 0 438.8z"></path><path fill="var(--crust)" d="m388.9 159.2 53.2-.6v235.6c0 42.9-34.8 77.8-77.8 77.8H247.6c-14.3 0-25.9-11.6-25.9-25.9s11.6-25.9 25.9-25.9H293L182.8 332v114.1c0 14.3-11.6 25.9-25.9 25.9S131 460.4 131 446.1V261.4c8.5 2.2 17.2 3.2 25.9 3.2 38.4 0 72-20.8 89.9-51.9h13.9c54.1 0 101.8 27.6 129.6 69.5v-69.1l-1.3-53.9zm-258 75c-17.7-6.2-32.5-18.7-41.6-34.8-6.5-11.3-10.2-24.6-10.2-38.6v-95c0-4.8 3.8-8.6 8.6-8.7h.2c2.7 0 5.2 1.3 6.8 3.4l10.4 13.9 22 29.4 3.9 5.2h51.9l3.9-5.2 22-29.4 10.4-13.8c1.6-2.2 4.1-3.5 6.8-3.5h.2c4.8 0 8.6 3.9 8.6 8.7v95c0 14.6-4.1 28.8-11.7 41.2-2.3 3.8-5 7.4-8 10.7-14.3 15.9-35 27.1-58 25.9s-18.1-1.5-26.2-4.4m51.9-60.4c7.2 0 13-5.8 13-13s-5.8-13-13-13-13 5.8-13 13 5.8 13 13 13m-38.9-13c0-7.2-5.8-13-13-13s-13 5.8-13 13 5.8 13 13 13 13-5.8 13-13"></path><path fill="var(--crust)" d="m389.2 169.1-.4-10.6v-.7c1.4-34.2-27.2-54.5-44.9-53.1h-1.8c-9.8.4-17.6 4.7-22.7 10.8-1.3 1.7-2.6 3.4-3.6 5.3 4.8-3 10.3-4.5 16.3-3.9 24.8 2.1 31.3 25.5 30.6 37.4-.8 14.8-10 28.6-25.5 35.4-16.9 8.4-36 3.6-48.6-4.5-14.3-9.1-25.6-24.7-28.3-45.3-3.7-21.5 4.7-43.2 17.9-59.2 14-16.3 35.5-28.9 61.5-29.7 52.4-3.9 104.2 45.4 102.5 107.6"></path><path fill="var(--accent)" d="m379.7 148.5 53.2-.6v235.6c0 42.9-34.8 77.8-77.8 77.8H238.4c-14.3 0-25.9-11.6-25.9-25.9s11.6-25.9 25.9-25.9h45.4l-110.2-88.2v114.1c0 14.3-11.6 25.9-25.9 25.9s-25.9-11.6-25.9-25.9V250.7c8.5 2.2 17.2 3.2 25.9 3.2 38.4 0 72-20.8 89.9-51.9h13.9c53.1 0 101.8 27.6 129.6 69.5v-69.1l-1.3-53.9zm-257.9 75c-17.7-6.2-32.5-18.7-41.6-34.8-6.5-11.3-10.2-24.6-10.2-38.6v-95c0-4.8 3.8-8.6 8.6-8.7h.2c2.7 0 5.2 1.3 6.8 3.4L96 63.7l22 29.4 3.9 5.2h51.9l3.9-5.2 22-29.4 10.4-13.8c1.6-2.2 4.1-3.5 6.8-3.5h.2c4.8 0 8.6 3.9 8.6 8.7v95c0 14.6-4.1 28.8-11.7 41.2-2.3 3.8-5 7.4-8 10.7-14.3 15.9-35 25.9-53 25.9s-23.1-1.5-31.2-4.4m56.8-60.4c7.2 0 13-5.8 13-13s-5.8-13-13-13-13 5.8-13 13 5.8 13 13 13m-38.9-13c0-7.2-5.8-13-13-13s-13 5.8-13 13 5.8 13 13 13 13-5.8 13-13"></path><path fill="var(--accent)" d="M379.8 149v-1.9c1.3-34.2-27.4-54.5-45.1-53.1h-1.8c-9.8.4-17.6 4.7-22.7 10.8-1.3 1.7-2.6 3.4-3.6 5.3 4.8-3 10.3-4.5 16.3-3.9 24.8 2.1 31.3 25.5 30.6 37.4-.8 14.8-10 28.6-25.5 35.4-16.9 8.4-36 3.6-48.6-4.5-14.3-9.1-25.6-24.7-28.3-45.3-3.7-21.5 4.7-43.2 17.9-59.2 14-16.3 35.5-28.9 61.5-29.7 52.4-3.9 104.2 45.9 102.5 108.1"></path></svg></span> <span aria-hidden="true" class="user-badge"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>Verified</title><path d="M200.3 81.5C210.9 61.5 231.9 48 256 48s45.1 13.5 55.7 33.5c5.4 10.2 17.3 15.1 28.3 11.7 21.6-6.6 46.1-1.4 63.1 15.7s22.3 41.5 15.7 63.1c-3.4 11 1.5 22.9 11.7 28.2 20 10.6 33.5 31.6 33.5 55.7s-13.5 45.1-33.5 55.7c-10.2 5.4-15.1 17.2-11.7 28.2 6.6 21.6 1.4 46.1-15.7 63.1s-41.5 22.3-63.1 15.7c-11-3.4-22.9 1.5-28.2 11.7-10.6 20-31.6 33.5-55.7 33.5s-45.1-13.5-55.7-33.5c-5.4-10.2-17.2-15.1-28.2-11.7-21.6 6.6-46.1 1.4-63.1-15.7S86.6 361.6 93.2 340c3.4-11-1.5-22.9-11.7-28.2C61.5 301.1 48 280.1 48 256s13.5-45.1 33.5-55.7c10.2-5.4 15.1-17.3 11.7-28.3-6.6-21.6-1.4-46.1 15.7-63.1s41.5-22.3 63.1-15.7c11 3.4 22.9-1.5 28.2-11.7zM256 0c-35.9 0-67.8 17-88.1 43.4-33-4.3-67.6 6.2-93 31.6S39 135 43.3 168C17 188.2 0 220.1 0 256s17 67.8 43.4 88.1c-4.3 33 6.2 67.6 31.6 93s60 35.9 93 31.6c20.2 26.3 52.1 43.3 88 43.3s67.8-17 88.1-43.4c33 4.3 67.6-6.2 93-31.6s35.9-60 31.6-93c26.3-20.2 43.3-52.1 43.3-88s-17-67.8-43.4-88.1c4.3-33-6.2-67.6-31.6-93S377 39 344 43.3C323.8 17 291.9 0 256 0m113 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0z"></path></svg></span> <span aria-hidden="true" class="user-badge"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>Administrator</title><path d="M232 59.6v390.7C99.2 375.7 64.4 227.3 64 139.7c0-5 3.1-10.2 9-12.8zm48 390.8V59.6L439 127c5.9 2.5 9.1 7.8 9 12.8-.4 87.5-35.2 236-168 310.6M457.7 82.8 269.4 2.9C265.2 1 260.7 0 256 0s-9.2 1-13.4 2.9L54.3 82.8c-22 9.3-38.4 31-38.3 57.2.5 99.2 41.3 280.7 213.6 363.2 16.7 8 36.1 8 52.8 0C454.8 420.7 495.5 239.2 496 140c.1-26.2-16.3-47.9-38.3-57.2"></path></svg></span>
            </span>
            <span class="upper-lower-opacity">
              </span></a><a href="/u/trinkey" class="no-underline text">
                <span class="username">@trinkey</span>
              </a> -
              <span class="pronouns">she/her</span> -
              <span class="timestamp"><span data-timestamp="1727231547" title="Sep 24, 2024, 22:32:27"><span data-timestamp="1727231547" title="Sep 24, 2024, 22:32:27">2 days ago</span></span></span>
            
          </div>
        
      </div>
*/

function getPostHTML(
  postJSON: _postJSON,
  isComment: boolean = false,
  includeUserLink: boolean = true,
  includePostLink: boolean = true,
  fakeMentions: boolean = false,
  pageFocus: boolean = false,
  isPinned: boolean = false
): string {
  return `<div class="post-container" data-${isComment ? "comment" : "post"}-id="${postJSON.post_id}">
    <div class="post">
      <div class="upper-content">
        ${includeUserLink ? `<a href="/u/${postJSON.creator.username}" class="no-underline text">` : "<span>"}
          <div class="main-area">
            <span class="displ-name">
              <span style="--color-one: ${postJSON.creator.color_one}; --color-two: ${postJSON.creator[ENABLE_GRADIENT_BANNERS && postJSON.creator.gradient_banner ? "color_two" : "color_one"]}" class="user-badge banner-pfp"></span>
              ${postJSON.private ? `<span class="user-badge">${icons.lock}</span>` : ""}
              ${escapeHTML(postJSON.creator.display_name)}
              ${postJSON.creator.badges.length ? `<span aria-hidden="true" class="user-badge">${postJSON.creator.badges.map((icon) => (badges[icon])).join("</span> <span aria-hidden=\"true\" class=\"user-badge\">")}</span>` : ""}
            </span>
            <span class="upper-lower-opacity">
              <span class="username">@${postJSON.creator.username}</span> -
              ${pronouns[postJSON.creator.pronouns] ? `<span class="pronouns">${pronouns[postJSON.creator.pronouns]}</span> -` : ""}
              <span class="timestamp">${timeSince(postJSON.timestamp)}</span>
            </span>
          </div>
        ${includeUserLink ? "</a>" : "</span>"}
      </div>

      ${postJSON.c_warning ? `<details class="c-warning"><summary>${postJSON.c_warning}</summary>` : ""}
      <div class="main-content">
        ${includePostLink ? `<a aria-hidden="true" href="/${isComment ? "c" : "p"}/${postJSON.post_id}" tabindex="-1" class="text no-underline">` : ""}
          ${
            linkifyHtml(escapeHTML(postJSON.content), {
              formatHref: {
                mention: (href: string): string => fakeMentions ? "javascript:void(0);" : "/u" + href,
                hashtag: (href: string): string => "/hashtag/" + href.slice(1)
              }
            }).replaceAll("\n", "<br>")
              .replaceAll("<a", includePostLink ? "  \n" : "<a target=\"_blank\"")
              .replaceAll("</a>", includePostLink ? `</a><a aria-hidden="true" href="/${isComment ? "c" : "p"}/${postJSON.post_id}" tabindex="-1" class="text no-underline">` : "</a>")
              .replaceAll("  \n", "</a><a target=\"_blank\"")
              .replaceAll(`<a aria-hidden="true" href="/${isComment ? "c" : "p"}/${postJSON.post_id}" tabindex="-1" class="text no-underline"></a>`, "")
              .replaceAll("<a target=\"_blank\" href=\"/", "<a href=\"/")
          }
        ${includePostLink ? "</a>" : ""}
      </div>

      ${
        postJSON.quote ? `
          <div class="quote-area">
            <div class="post">
              ${
                postJSON.quote.blocked ? (postJSON.quote.blocked_by_self ? lang.home.quote_blocked : lang.home.quote_blocked_other) : postJSON.quote.deleted ? lang.home.quote_deleted : postJSON.quote.can_view ? `
                  <div class="upper-content">
                    <a href="/u/${postJSON.quote.creator.username}" class="no-underline text">
                      <div class="main-area">
                        <span class="displ-name">
                          <span style="--color-one: ${postJSON.quote.creator.color_one}; --color-two: ${postJSON.quote.creator[ENABLE_GRADIENT_BANNERS && postJSON.quote.creator.gradient_banner ? "color_two" : "color_one"]}" class="user-badge banner-pfp"></span>
                          ${escapeHTML(postJSON.quote.creator.display_name)}
                          ${postJSON.quote.private ? `<span class="user-badge">${icons.lock}</span>` : ""}
                          ${postJSON.quote.creator.badges.length ? `<span aria-hidden="true" class="user-badge">${postJSON.quote.creator.badges.map((icon) => (badges[icon])).join("</span> <span aria-hidden=\"true\" class=\"user-badge\">")}</span>` : ""}
                        </span>
                        <span class="upper-lower-opacity">
                            <span class="username">@${postJSON.quote.creator.username}</span> -
                          ${pronouns[postJSON.quote.creator.pronouns] ? `<span class="pronouns">${pronouns[postJSON.quote.creator.pronouns]}</span> -` : ""}
                          <span class="timestamp">${timeSince(postJSON.quote.timestamp)}</span>
                        </span>
                      </div>
                    </a>
                  </div>

                  ${postJSON.quote.c_warning ? `<details class="c-warning"><summary>${postJSON.quote.c_warning}</summary>` : ""}
                  <div class="main-content">
                    <a aria-hidden="true" href="/${postJSON.quote.comment ? "c" : "p"}/${postJSON.quote.post_id}" class="text no-underline">
                      ${
                        linkifyHtml(escapeHTML(postJSON.quote.content), {
                          formatHref: {
                            mention: (href: string): string => fakeMentions ? "javascript:void(0);" : "/u" + href,
                            hashtag: (href: string): string => "/hashtag/" + href.slice(1)
                          }
                        }).replaceAll("\n", "<br>")
                          .replaceAll("<a", "  \n")
                          .replaceAll("</a>", `</a><a aria-hidden="true" href="/${postJSON.quote.comment ? "c" : "p"}/${postJSON.quote.post_id}" class="text no-underline">`)
                          .replaceAll("  \n", "</a><a target=\"_blank\"")
                          .replaceAll(`<a aria-hidden="true" href="/${postJSON.quote.comment ? "c" : "p"}/${postJSON.quote.post_id}" class="text no-underline"></a>`, "")
                          .replaceAll("<a target=\"_blank\" href=\"/", "<a href=\"/")
                      }

                      ${postJSON.quote.has_quote ? `<br><i>${lang.home.quote_recursive}</i>` : ""}
                      ${postJSON.quote.poll ? `<br><i>${lang.home.quote_poll}</i>` : ""}
                    </a>
                  </div>
                  ${postJSON.quote.c_warning ? `</details>` : ""}
                ` : lang.home.quote_private
              }
            </div>
          </div>
        ` : ""
      }

      ${
        postJSON.poll && typeof postJSON.poll == "object"? ((): string => {
          let output: string = `<div id="gi-${globalIncrement}">`;
          let c: number = 0;

          if (postJSON.poll.voted || !postJSON.logged_in) {
            for (const option of postJSON.poll.content) {
              c++;
              output += `<div class="poll-bar-container">
                <div class="poll-bar ${option.voted ? "voted" : ""}">
                  <div style="width:${option.votes / postJSON.poll.votes * 100 || 0}%"></div>
                </div>
                <div class="poll-text">
                  ${Math.round(option.votes / postJSON.poll.votes * 1000) / 10 || 0}% - ${escapeHTML(option.value)}
                </div>
              </div>`;
            }
          } else {
            for (const option of postJSON.poll.content) {
              c++;
              output += `<div data-index="${c}"
                         data-total-votes="${postJSON.poll.votes}"
                         data-votes="${option.votes}"
                         class="poll-bar-container"
                         role="button"
                         onclick="vote(${c}, ${postJSON.post_id}, ${globalIncrement})"
                         onkeydown="genericKeyboardEvent(event, () => (vote(${c}, ${postJSON.post_id}, ${globalIncrement})))"
                         tabindex="0">
                <div class="poll-text">${escapeHTML(option.value)}</div>
              </div>`;
            }
          }

          globalIncrement++;

          return `${output}<small>
            ${(postJSON.poll.votes == 1 ? lang.home.poll_total_singular : lang.home.poll_total_plural).replaceAll("%s", postJSON.poll.votes)}
            ${postJSON.poll.voted || !postJSON.logged_in ? "" : `<span class="remove-when-the-poll-gets-shown"> -
              <span class="toggle-poll" onclick="togglePollResults(${globalIncrement - 1})" role="button" onkeydown="genericKeyboardEvent(event, () => (togglePollResults(${globalIncrement - 1})))" tabindex="0">${lang.home.poll_view_results}</span>
            </span>`}
          </small></div>`;
        })() : ""
      }
      ${postJSON.c_warning ? `</details>` : ""}

      <div class="bottom-content">
        ${includePostLink ? `<a href="/${isComment ? "c" : "p"}/${postJSON.post_id}" class="text no-underline">` : ""}
          <span class="bottom-content-icon comment-icon">${icons.comment}</span> ${postJSON.comments}
        ${includePostLink ? "</a>" : ""}
        <span class="bottom-spacing"></span>
        ${
          ENABLE_QUOTES ? `<button class="bottom-content-icon" ${fakeMentions ? "" : `onclick="addQuote('${postJSON.post_id}', ${isComment})"`}>
            ${icons.quote}
            <span class="quote-number">${postJSON.quotes}</span>
          </button>
          <span class="bottom-spacing"></span>` : ''
        }

        <span class="bottom-content-icon like-secondary">
          ${icons.like}
        </span>

        <button class="bottom-content-icon like" data-liked="${postJSON.liked}" ${fakeMentions ? "" : `onclick="toggleLike(${postJSON.post_id}, ${isComment ? "'comment'" : "'post'"})"`}>
          ${postJSON.liked ? icons.like : icons.unlike}
          <span class="like-number">${postJSON.likes}</span>
        </button>

        ${
          (postJSON.can_pin && ENABLE_PINNED_POSTS) || (postJSON.can_delete && ENABLE_POST_DELETION) ? `
          <span class="bottom-spacing"></span>
          <button class="bottom-content-icon more-button">${icons.more}</button>

          <div class="more-container">${
            postJSON.can_pin && ENABLE_PINNED_POSTS ? `<button class="bottom-content-icon ${isPinned && postJSON.can_pin ? "red" : ""}" onclick="${isPinned && postJSON.can_pin ? "un" : ""}pinPost(${isPinned && postJSON.can_pin ? "" : postJSON.post_id})">
              ${isPinned && postJSON.can_pin ? icons.unpin : icons.pin}
              ${isPinned && postJSON.can_pin ? lang.post.unpin : lang.post.pin}
            </button>` : ""
          } ${
            postJSON.can_delete && ENABLE_POST_DELETION ? `<button class="bottom-content-icon red" onclick="deletePost(${postJSON.post_id}, ${isComment}, ${pageFocus})">
              ${icons.delete}
              ${lang.post.delete}
            </button>` : ""
          }</div>` : ""
        }
      </div>
      <div class="post-after"></div>
    </div>
  </div>`;
}
function trimWhitespace(string: string, purge_newlines: boolean = false): string {
  const whitespace: string[] = [
    "\x09",   "\x0b",   "\x0c",   "\xa0",
    "\u1680", "\u2000", "\u2001", "\u2002",
    "\u2003", "\u2004", "\u2005", "\u2006",
    "\u2007", "\u2008", "\u2009", "\u200a",
    "\u200b", "\u2028", "\u2029", "\u202f",
    "\u205f", "\u2800", "\u3000", "\ufeff"
  ];

  string = string.replaceAll("\x0d", "");

  if (purge_newlines) {
    string = string.replaceAll("\x0a", " ").replaceAll("\x85", " ")
  }

  for (const char of whitespace) {
    string = string.replaceAll(char, " ");
  }

  while (string.includes("\n ") || string.includes("   ") || string.includes("\n\n\n")) {
    string = string.replaceAll("\n ", "\n").replaceAll("   ", "  ").replaceAll("\n\n\n", "\n\n");
  }

  return string;
}

function postTextInputEvent(): void {
  if (typeof setUnload === "function") {
    setUnload();
  }

  let newCursorPosition: number = trimWhitespace(this.value.slice(0, this.selectionStart + 1)).length - (this.value.length > this.selectionStart ? 1 : 0);
  let newVal: string = trimWhitespace(this.value);

  newCursorPosition = newCursorPosition < 0 ? 0 : newCursorPosition;

  if (newVal != this.value) {
    this.value = trimWhitespace(this.value);
    this.setSelectionRange(newCursorPosition, newCursorPosition);
  }
}

// Some icons from Font Awesome
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
  more     : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-label="${escapeHTML(lang.post.more)}"><path d="M0 96c0-17.7 14.3-32 32-32h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32m0 160c0-17.7 14.3-32 32-32h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32m448 160c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h384c17.7 0 32 14.3 32 32"/></svg>`
};

function forEach(iter: NodeListOf<Element>, callback: CallableFunction): any[] {
  let out: any[] = [];

  for (let i: number = 0; i < iter.length; i++) {
    out.push(callback(iter[i], i));
  }

  return out;
}

setInterval(
  function(): void {
    forEach(document.querySelectorAll("[data-timestamp]"), (val: HTMLElement, index: number): void => {
      val.innerHTML = timeSince(Number(val.dataset.timestamp));
    });
  }, 5000
);
