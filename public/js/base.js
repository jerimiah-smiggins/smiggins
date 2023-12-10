const dom = id => document.getElementById(id);

function setCookie(name, value) {
  let date = new Date();
  date.setTime(date.getTime() + (356 * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};Path=/;Expires=${date.toUTCString()}`;
}

function eraseCookie(name) {
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

async function sha256(message) {
  const msgBuffer = new TextEncoder('utf-8').encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
  return hashHex;
}

function timeSince(date) {
  let seconds = Math.floor((+(new Date()) / 1000 - date + 1));

  let interval = seconds / 31536000;
  if (interval >= 1) { return Math.floor(interval) + " year" + (Math.floor(interval) == 1 ? "" : "s"); }

  interval = seconds / 2592000;
  if (interval >= 1) { return Math.floor(interval) + " month" + (Math.floor(interval) == 1 ? "" : "s"); }

  interval = seconds / 86400;
  if (interval >= 1) { return Math.floor(interval) + " day" + (Math.floor(interval) == 1 ? "" : "s"); }

  interval = seconds / 3600;
  if (interval >= 1) { return Math.floor(interval) + " hour" + (Math.floor(interval) == 1 ? "" : "s"); }

  interval = seconds / 60;
  if (interval >= 1) { return Math.floor(interval) + " minute" + (Math.floor(interval) == 1 ? "" : "s"); }

  return Math.floor(seconds) + " second" + (Math.floor(seconds) == 1 ? "" : "s");
}
