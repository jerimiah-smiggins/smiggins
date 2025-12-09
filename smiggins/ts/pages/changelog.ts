function _getChanges(version: string, changes: VersionData["changes"]): string {
  let list: string = changes.map((a: string): string => (`<li>${a}</li>`)).join("");
  return `<details><summary>All changes in v${version}</summary><ul>${list}</ul></details>`;
}

function _getVersionSpotlight(spotlight: VersionData["major_changes"]): string {
  if (!spotlight) { return ""; }
  let list: string = spotlight?.map((a): string => (`<div>${a.icon ? Icons[a.icon] : ""}${a.info}</div>`)).join("") || "";
  return list && `<div class="version-spotlight">${list}</div>`;
}

function checkVersionNewer(current: string, version: string): boolean {
  let target: number[] = current.split(".").map(Number);
  let ver: number[] = version.split(".").map(Number);

  return ver[0] as number > target[0] // A.x.x -> B.x.x
      || ver[0] as number === target[0] && ver[1] as number > target[1] // A.B.x -> A.C.x
      || ver[0] as number === target[0] && ver[1] as number === target[1] && ver[2] as number > target[2]; // A.B.C -> A.B.D;
}

function generateChangesHTML(since: "all" | string): string {
  let queuedVersions: string[] = Object.keys(changes);

  // get list of versions included
  if (since !== "all") {
    if (!since.match(/^[0-9]+\.[0-9]+\.[0-9]+$/)) { return "Invalid"; }
    let realQueued: string[] = [];

    for (const verString of queuedVersions) {
      if (checkVersionNewer(since, verString)) {
        realQueued.push(verString);
      }
    }

    queuedVersions = realQueued;
  }

  if (queuedVersions.length === 0) {
    return "No changes";
  }

  // sort in descending order
  queuedVersions.sort((a: string, b: string): number => {
    let aNum: number[] = a.split(".").map(Number);
    let bNum: number[] = b.split(".").map(Number);

    return bNum[0] - aNum[0] || bNum[1] - aNum[1] || bNum[2] - aNum[2];
  });

  let output: string = "";

  if (since === "all") {
    // all format - [header, spotlight, all changes]
    for (const ver of queuedVersions) {
      let data: VersionData = changes[ver];
      output += `<h2>v${ver}</h2> <div class="changelog-description">- ${data.description}</div>${_getVersionSpotlight(data.major_changes)}${_getChanges(ver, data.changes)}`;
    }
  } else {
    // since format - all spotlight, [header, all changes]
    let allMajorChanges: VersionData["major_changes"] = ([] as any[]).concat(...queuedVersions.map((a: string) => (changes[a].major_changes || [])));

    output += "<h2>What's new?</h2><br>" + _getVersionSpotlight(allMajorChanges);

    for (const ver of queuedVersions) {
      let data: VersionData = changes[ver];
      output += `<h2>v${ver}</h2> <div class="changelog-description">- ${data.description}</div>${_getChanges(ver, data.changes)}`;
    }
  }

  return output;
}

let expectedVersion: string | null = localStorage.getItem("smiggins-last-version");

if (loggedIn && expectedVersion && checkVersionNewer(expectedVersion, version) && !localStorage.getItem("smiggins-hide-changelog")) {
  setTimeout((): void => { // give js time to load the rest of the file + snippets to prevent conflicts
    createUpdateModal(localStorage.getItem("smiggins-last-version") || "0.0.0");
    localStorage.setItem("smiggins-last-version", version);
  }, 100);
}
