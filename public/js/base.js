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
