# Use when updating from a version <=0.3.2 to a version >=0.3.3

import json
import os

user_list = os.listdir("./users/")
followers = [-1 for _ in range(max([int(i) for i in user_list]))]

for i in user_list:
    for o in json.loads(open(f"./users/{i}/settings.json", "r").read())["following"]:
        try:
            followers[o - 1] += 1
        except:
            print(i, o)

for i in user_list:
    user_json = json.loads(open(f"./users/{i}/settings.json", "r").read())
    user_json["followers"] = followers[int(i) - 1]
    f = open(f"./users/{i}/settings.json", "w")
    f.write(json.dumps(user_json))
    f.close()
