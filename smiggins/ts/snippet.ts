let snippetVariables: { [key: string]: string } = {
  site_name: "Jerimiah Smiggins",
  home_page: loggedIn ? "home" : "index",
  username: loggedIn ? username : ""
};

let snippetProcessing: { [key: string]: (element: HTMLDivElement) => void } = {
  input_enter: p_inputEnter,
  password_toggle: p_passwordToggle,
  login: p_login,
  signup: p_signup,
  logout: p_logout,
  home: p_home,
  timeline_switch: p_tlSwitch,
  timeline_more: p_tlMore
};

// @ts-expect-error
let snippets: { [key in snippet]: snippetData} = {};

function getSnippet(snippet: snippet, extraVariables?: { [key: string]: string }): HTMLDivElement {
  let s: snippetData = snippets[snippet];
  let content = s.content;

  for (const i of s.variables) {
    let replacementValue: string = "";

    if (i in snippetVariables) {
      replacementValue = snippetVariables[i];
    } else {
      console.log(`Unknown snippet variable "${i}"`);
    }

    content = content.replaceAll(`@{${i}}`, replacementValue);
  }

  if (extraVariables) {
    for (const i of Object.keys(extraVariables)) {
      content = content.replaceAll(`@{${i}}`, extraVariables[i]);
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
    variables: snippet.dataset.snippetVariables?.split(",").filter((a: string): string => a) || [],
    processing: snippet.dataset.snippetProcessing?.split(",").filter((a: string): string => a) || [],
    content: snippet.innerHTML
  };

  snippet.remove();
}

document.getElementById("snippets")?.remove();
