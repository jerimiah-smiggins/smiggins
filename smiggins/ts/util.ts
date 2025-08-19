function inputEnterEvent(e: KeyboardEvent): void {
  if (e.key !== "Enter") { return; }

  let el: HTMLElement = e.currentTarget as HTMLElement;
  let eventQuery: string | undefined = (e.ctrlKey && el.dataset.enterSubmit) || el.dataset.enterNext || el.dataset.enterSubmit;
  if (!eventQuery) { return; }

  let newElement: HTMLElement | null = document.querySelector(eventQuery);
  if (!newElement) { return; }

  newElement.focus();
  if (newElement.nodeName === "BUTTON") { newElement.click(); }

  e.preventDefault();
}

function togglePasswords(): void {
  let toText: NodeListOf<HTMLInputElement> = document.querySelectorAll("input[type=\"password\"]");
  let toPassword: NodeListOf<HTMLInputElement> = document.querySelectorAll("input[data-toggle-password]");

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
