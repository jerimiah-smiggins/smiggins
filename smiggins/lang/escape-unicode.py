# This escapes non-UTF8 characters in the language files to prevent possible decode errors

import os
import re

ESCAPE_ASCII = re.compile(r'([\\"]|[^\ -~])')

# Function stolen from the json library
def encode(s):
    def replace(match):
        s = match.group(0)
        if s in ['\\', '"', '\b', '\f', '\n', '\r', '\t']:
            return s
        n = ord(s)
        if n < 0x10000:
            return '\\u{0:04x}'.format(n)
        else:
            n -= 0x10000
            s1 = 0xd800 | ((n >> 10) & 0x3ff)
            s2 = 0xdc00 | (n & 0x3ff)
            return '\\u{0:04x}\\u{1:04x}'.format(s1, s2)
    return ESCAPE_ASCII.sub(replace, s)

langs = [i for i in os.listdir() if len(i) <= 10 and i[-5::] == ".json"]

for i in langs:
    print(i)
    f = open(i, "r").read()
    g = open(i, "w")
    g.write(encode(f))
    g.close()
