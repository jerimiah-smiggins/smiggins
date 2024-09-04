from cairosvg import svg2png
from PIL import Image
from os import remove

SVG_FILE = "favicon.svg"
TEMP_FILE = "temp.png"
COLORS: dict[str, dict] = {
    "initial": {
        "#1e1e2e": "BASE",
        "#11111b": "CRUST",
        "#cba6f7": "ACCENT"
    },
    "themes": {
        "light": { # CTP: latte
            "BASE":  "#eff1f5",
            "CRUST": "#dce0e8",
            "ACCENT": {
                "rosewater": "#dc8a78",
                "flamingo":  "#dd7878",
                "pink":      "#ea76cb",
                "mauve":     "#8839ef",
                "red":       "#d20f39",
                "maroon":    "#e64553",
                "peach":     "#fe640b",
                "yellow":    "#df8e1d",
                "green":     "#40a02b",
                "teal":      "#179299",
                "sky":       "#04a5e5",
                "sapphire":  "#209fb5",
                "blue":      "#1e66f5",
                "lavender":  "#7287fd"
            }
        },
        "gray": { # CTP: frappe
            "BASE":  "#303446",
            "CRUST": "#232634",
            "ACCENT": {
                "rosewater": "#f2d5cf",
                "flamingo":  "#eebebe",
                "pink":      "#f4b8e4",
                "mauve":     "#ca9ee6",
                "red":       "#e78284",
                "maroon":    "#ea999c",
                "peach":     "#ef9f76",
                "yellow":    "#e5c890",
                "green":     "#a6d189",
                "teal":      "#81c8be",
                "sky":       "#99d1db",
                "sapphire":  "#85c1dc",
                "blue":      "#8caaee",
                "lavender":  "#babbf1"
            }
        },
        "dark": { # CTP: macchiato
            "BASE":  "#24273a",
            "CRUST": "#181926",
            "ACCENT": {
                "rosewater": "#f4dbd6",
                "flamingo":  "#f0c6c6",
                "pink":      "#f5bde6",
                "mauve":     "#c6a0f6",
                "red":       "#ed8796",
                "maroon":    "#ee99a0",
                "peach":     "#f5a97f",
                "yellow":    "#eed49f",
                "green":     "#a6da95",
                "teal":      "#8bd5ca",
                "sky":       "#91d7e3",
                "sapphire":  "#7dc4e4",
                "blue":      "#8aadf4",
                "lavender":  "#b7bdf8"
            }
        },
        "black": { # CTP: mocha
            "BASE":  "#1e1e2e",
            "CRUST": "#11111b",
            "ACCENT": {
                "rosewater": "#f5e0dc",
                "flamingo":  "#f2cdcd",
                "pink":      "#f5c2e7",
                "mauve":     "#cba6f7",
                "red":       "#f38ba8",
                "maroon":    "#eba0ac",
                "peach":     "#fab387",
                "yellow":    "#f9e2af",
                "green":     "#a6e3a1",
                "teal":      "#94e2d5",
                "sky":       "#89dceb",
                "sapphire":  "#74c7ec",
                "blue":      "#89b4fa",
                "lavender":  "#b4befe"
            }
        },
        "oled": { # CTP: mocha + custom
            "BASE":  "#000000",
            "CRUST": "#11111b",
            "ACCENT": {
                "rosewater": "#f5e0dc",
                "flamingo":  "#f2cdcd",
                "pink":      "#f5c2e7",
                "mauve":     "#cba6f7",
                "red":       "#f38ba8",
                "maroon":    "#eba0ac",
                "peach":     "#fab387",
                "yellow":    "#f9e2af",
                "green":     "#a6e3a1",
                "teal":      "#94e2d5",
                "sky":       "#89dceb",
                "sapphire":  "#74c7ec",
                "blue":      "#89b4fa",
                "lavender":  "#b4befe"
            }
        }
    }
}

svg = open(SVG_FILE, "r").read()

def create_image(svg_data: str, theme_name: str, accent_name: str):
    svg2png(svg_data, write_to=TEMP_FILE, output_width=255, output_height=255)
    img = Image.open(TEMP_FILE)
    img.save(f"favicons/{theme_name}-{accent_name}.ico", sizes=[(16, 16), (32, 32), (64, 64), (128, 128), (255, 255)])

for color, replace in COLORS["initial"].items():
    svg = svg.replace(color, replace)

for theme_name, colors in COLORS["themes"].items():
    _svg = svg

    _svg = _svg.replace("BASE", colors["BASE"])
    _svg = _svg.replace("CRUST", colors["CRUST"])

    for accent_name, accent in colors["ACCENT"].items():
        __svg = _svg
        __svg = __svg.replace("ACCENT", accent)
        create_image(__svg, theme_name, accent_name)

remove(TEMP_FILE)
