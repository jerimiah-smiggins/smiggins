# social-media-thing
(name and project wip)

online version (at least for now): https://trinkey.pythonanywhere.com

official discord server: https://discord.gg/tH7QnHApwu

## wtf is this and why did you make it
it's like twitter but bad basically, i made it because im really bored

## how tf do i use this
1. download the files from the directory either using git or the website
2. make a new file in the `_server_module` folder called `_api_keys.py`
3. in that file, put the following code:
```py
auth_key = b"put some random text here"
```
4. run `python manage.py migrate` then `python manage.py runserver` in the smiggins folder (make sure you have python and the flask, django and django-ninja libraries installed). if you get an error, you
might need to update one of the libraries, or change the port to something above 1000 if you don't have admin permissions
6. on your web browser go to the url `localhost` (specify port if needed, don't add the `www.` or `https://` part)
7. after that everything should work on it's own, make sure to report any features or suggestions

## where can i report issues or suggest stuff
go to the [issues tab](https://github.com/trinkey/social-media-thing) and make a new issue (make sure you're logged in with github)

## how can i contribute to this project
if there is a specific thing you want to do, you can make an issue (if a duplicate doesn't already exist) and then
assign yourself if you can. (if you can't assign yourself as you're not a contributor, you can make a comment on it
stating that you are going to do it)

once you finish programming you can create a new fork with your code and then make a pull request with it.

if you have contributed a lot to this project, you can message me on any platform that i use (email: asdfjkltrinketio@gmail.com,
discord: `@trinkey_`, twitter: `@trinkey_2`) and let me know your github username and stuff that you have worked on and i'll consider it
