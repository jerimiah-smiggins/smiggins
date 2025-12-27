// these functions have been borrowed from ts/parser.ts

function lr(str: string, replacements: { [key: string]: string }): string {
  let values: { [key: string]: string } = {};

  for (const [key, _] of Object.entries(replacements)) {
    values[key] = `TEMP_${Math.random()}`;
    str = str.replaceAll("%" + key, values[key]);
  }

  for (const [key, val] of Object.entries(replacements)) {
    str = str.replaceAll(values[key], val);
  }

  return str;
}

function n(data: { [key in number | "*"]: string }, num: number): string {
  if (data[num]) {
    return data[num];
  }

  return data["*"];
}
