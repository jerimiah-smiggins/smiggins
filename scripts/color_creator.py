# This program can be ran anywhere. It is used to easliy generate
# the css for new colors for themes.css.

print("Color creator! Used to make themes easily.\nMake sure to add colors to validColors in /js/base.js!\nYou can press ctrl+c to stop this program at any time.\n")

while True:
    name = input("What should this theme called internally? (ex. 'purple', 'orangewhite', etc.)\n>>> ")
    light = input("Enter the realtimecolors.com url for the light version:\n>>> ").split("colors=", 1)[1].split("&", 1)[0].split("-")
    dark = input("Enter the realtimecolors.com url for the dark version:\n>>> ").split("colors=", 1)[1].split("&", 1)[0].split("-")

    print(f"""[data-color="{name}"] {{
  --text: #{dark[0]};
  --background: #{dark[1]};
  --primary: #{dark[2]};
  --secondary: #{dark[3]};
  --accent: #{dark[4]};

  --text-low-opacity: #{dark[0]}33;
  --background-low-opacity: #{dark[1]}33;
  --primary-low-opacity: #{dark[2]}33;
  --secondary-low-opacity: #{dark[3]}33;
  --accent-low-opacity: #{dark[4]}66;
}}

body[data-theme="light"][data-color="{name}"], body[data-theme="light"] [data-color="{name}"] {{
  --text: #{light[0]};
  --background: #{light[1]};
  --primary: #{light[2]};
  --secondary: #{light[3]};
  --accent: #{light[4]};

  --text-low-opacity: #{light[0]}33;
  --background-low-opacity: #{light[1]}33;
  --primary-low-opacity: #{light[2]}33;
  --secondary-low-opacity: #{light[3]}33;
  --accent-low-opacity: #{light[4]}66;
}}""")

