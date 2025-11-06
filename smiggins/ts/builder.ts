function _intToBytes(num: number, length: number=1): Uint8Array {
  let arr: Uint8Array = new Uint8Array(length);

  for (let i: number = 0; i < length; i++) {
    arr[i] = (num >> (8 * (length - i - 1))) & 0xff;
  }

  return arr;
}

function hexToBytes(hex: string): Uint8Array {
  let length: number = Math.floor(hex.length / 2);
  let arr: Uint8Array = new Uint8Array(length);

  for (let i: number = 0; i < length; i++) {
    arr[i] = Number("0x" + hex.slice(i * 2, i * 2 + 2));
  }

  return arr;
}

function buildRequest(data: (Uint8Array | boolean | [number, bits: 8 | 16 | 32 | 64] | [string, lengthBits: 8 | 16])[]): ArrayBuffer {
  let response: number[] = [];
  let boolPendingData: number = 0
  let numBools: number = 0

  for (const i of data) {
    if (numBools && typeof i !== "boolean") {
      response.push(boolPendingData << (8 - numBools));
      boolPendingData = 0;
      numBools = 0;
    }

    if (typeof i === "boolean") {
      boolPendingData <<= 1;
      boolPendingData |= Number(i);
      numBools++;
    } else if (typeof i === "object") {
      // @ts-expect-error
      if (i.push) {
        if (typeof i[0] === "string") { // [string, lengthBits]
          let buf: Uint8Array = new TextEncoder().encode(i[0]);
          response = response.concat(Array.from(_intToBytes(buf.length, Math.floor(i[1] / 8))), Array.from(buf));
        } else { // [number, bits]
          response = response.concat(Array.from(_intToBytes(i[0], Math.floor(i[1] / 8))));
        }
      } else { // Uint8Array
        response = response.concat(Array.from(i as Uint8Array));
      }
    } else {
      console.log("invalid type for buildRequest", i);
    }

    if (numBools == 8) {
      response.push(boolPendingData);
      boolPendingData = 0;
      numBools = 0;
    }
  }

  if (numBools) {
    response.push(boolPendingData << (8 - numBools));
  }

  return new Uint8Array(response).buffer;
}
