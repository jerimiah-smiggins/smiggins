let home = true;

document.querySelector(".main-content").innerHTML = linkifyText(document.querySelector(".main-content").innerHTML);

dom("timestamp").innerHTML = timeSince(
  Number(dom("timestamp").getAttribute("data-timestamp"))
);
