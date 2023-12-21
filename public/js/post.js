let home = true;

dom("timestamp").innerHTML = timeSince(
  Number(dom("timestamp").getAttribute("data-timestamp"))
);
