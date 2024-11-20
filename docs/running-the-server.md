# Running the Server
Throughout these tutorials, the command `python` will be used in the place of
whatever command would normally run Python 3.10+. If you're using Windows, this
command will likely be `py`, or if you're on Mac or Linux, it's likely going to
be `python3` or `python3[version]` where `[version]` is the python version, ex.
`python310` for Python 3.10.

These instructions assume you have **[git](https://git-scm.com/)** and
**[Python 3.10+](https://python.org/)** installed.

Tutorials for PythonAnywhere assume that you have cloned the smiggins repository
in your home directory, resulting in a file path like `/home/USERNAME/smiggins/smiggins/settings.json`
for the `settings.json` file.

## How set up a local testing server
First, you will need to run some commands in the command line in order to get
the code on your device, install required packages, etc.
```bash
# Clone the code onto your local computer
git clone https://github.com/jerimiah-smiggins/smiggins.git

# Go into the folder that contains the code
cd smiggins

# Optional: change git branch
# git switch branch-name

# Install Python libraries
python -m pip install --upgrade -r requirements.txt
```

Then, you need to create the `_api_keys.py` file. To do so, you can run one of
the following commands based on your operating system:
```bash
# Linux/Mac:
echo "auth_key = b'some random text this can be anything'" > ./smiggins/backend/_api_keys.py

# Windows:
echo auth_key = b'some random text this can be anything' > ./smiggins/backend/_api_keys.py
```

> [!WARNING]
>
> Once you set the contents of this variable, **DO NOT CHANGE IT!** This will
> cause all existing accounts to not be able to be logged in to.

Next, you will need to create the database. To do so, run this command:
```bash
python manage.py migrate
```

If you need to, make sure that the `site_url` property in the
[settings.json file](/smiggins/settings.json) is properly set.

Finally, in order to run the server itself, just run this command:
```bash
python manage.py runserver
```

## How to set up an instance on [PythonAnywhere](https://www.pythonanywhere.com/)
First, you'll need to create a new webapp. When doing so, make sure you select
the following settings:
- Manual configuration
- Python 3.10 (Python 3.10 is the minimum version for Django 3.X, which is
needed for smiggins.)

Then, in PythonAnywhere's console, you will need to run a couple commands:
```bash
# Clone the code onto your local computer
git clone https://github.com/jerimiah-smiggins/smiggins.git

# Go into the folder that contains the code
cd smiggins

# Optional: change git branch
# git switch branch-name

# Install Python libraries
python -m pip install --upgrade -r requirements.txt
```

Then, you need to create the `_api_keys.py` file. To do so, you can run this
command:
```bash
echo "auth_key = b'some random text this can be anything'" > ./smiggins/backend/_api_keys.py
```

Next, you will need to set up the WSGI configuration file. To do so, you can
either use a terminal-based text editor, like `nano`, or use PythonAnywhere's
file editing webpage.
- nano: `nano /var/www/USERNAME_pythonanywhere_com.wsgi.py`
- Webpage: `https://www.pythonanywhere.com/user/USERNAME/files/var/www/USERNAME_pythonanywhere_com.wsgi.py`

In this file, you will need to put the following code:
```py
import os
import sys

path = "/home/USERNAME/smiggins/smiggins"
if path not in sys.path:
    sys.path.append(path)

os.environ["DJANGO_SETTINGS_MODULE"] = "smiggins.settings"

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

Next, you'll want to go onto the web app dashboard on PythonAnywhere, found at
`https://www.pythonanywhere.com/user/USERNAME/webapps/`. From there, you are
going to want to add an entry in the "Static Files" section with the **URL** set
to `/static/` and the **Directory** set to `/home/USERNAME/smiggins/smiggins/collected-static`

From here, you have two options. You can either:
- [Create an upgrade script](#how-to-create-an-upgrade-script) instead of
finishing the rest of this tutorial (very easy to upgrade to future releases,
however it requires a little bit of effort)
- Keep following this tutorial (harder to update your instance to newer versions
in the future)

**By continuing to follow the rest of these steps, you have chosen to not create
an upgrade script.**

You are going to need to do a few small things before your server is ready for
use. There are two very simple things that can be done right away. Back in your
console, navigate to the directory that has the `manage.py` file (`cd ~/smiggins/smiggins/`)
From there, you are going to want to run `python manage.py collectstatic` (set
up serving static files) and `python manage.py migrate` (create the database).

After you do those two things, all you need to do before your server is ready
for use is to change a couple of settings. Open the `settings.json` file in your
preferred editor (either by navigating there in the PythonAnywhere files web ui
or by using a terminal-based text editor like nano), and make sure that the
`debug` setting is set to `false` and that the `website_url` setting is set to
the url of your website, which is likely `https://USERNAME.pythonanywhere.com`.
Feel free to adjust any of the other configuration however you like.

From there, you can go to the webapps dashboard and restart your server. In a
few seconds, it should be all up and running.

<details>
  <summary><h2 style="display: inline">
    How to upgrade versions on PythonAnywhere (using a venv)
  </h2></summary>

  To clone the newest version, do the following commands in the
  `~/smiggins` folder:
  ```bash
  git stash
  git pull
  git stash pop
  ```

  Then, in the venv console, run these commands in the `~/smiggins/smiggins`
  folder:
  ```bash
  python manage.py collectstatic
  python manage.py migrate
  ```

  Then, just restart the server from the webapp dashboard!
</details>

<details>
  <summary><h2 style="display: inline">
    How to upgrade versions on PythonAnywhere (no venv)
  </h2></summary>

  To clone the newest version, do the following commands in the
  `~/smiggins` folder:
  ```bash
  git stash
  git pull
  git stash pop
  ```

  Then, in the venv console, run these commands in the `~/smiggins/smiggins`
  folder:
  ```bash
  python3.10 manage.py collectstatic
  python3.10 manage.py migrate
  ```

  Then, just restart the server from the webapp dashboard!
</details>

<details>
  <summary><h2 style="display: inline">
    Where can I report issues or suggest stuff
  </h2></summary>

  go to the [issues tab](https://github.com/jerimiah-smiggins/smiggins/issues)
  and make a new issue (make sure you're logged in with github)
</details>

<details>
  <summary><h2 style="display: inline">
    How to setup Gmail on PythonAnywhere
  </h2></summary>

  First, you need to make sure 2 step verification is enabled for the gmail
  account you want to send the emails from. Do this by going to
  <a href="https://myaccount.google.com/signinoptions/twosv">this link</a>.

  Next, you'll need to create an app password, by going to
  <a href="https://myaccount.google.com/u/3/apppasswords">this link</a>. The app
  name can be anything you want, and it should show you four strings of four
  letters. Save this for the next step.

  Finally, in the `_api_keys.py` file in the backend folder, put the following
  code, modifying it for your needs:
  ```py
  smtp_auth = {
      "EMAIL_HOST": "smtp.gmail.com",
      "EMAIL_HOST_USER": "[email]@gmail.com", # put the full email, like example@gmail.com
      "EMAIL_HOST_PASSWORD": "xxxx xxxx xxxx xxxx", # put in the password obtained in the previous step
      "EMAIL_PORT": 587,
      "EMAIL_USE_TLS": True,
      "DEFAULT_FROM_EMAIL": "[email]@gmail.com" # put the full email, like example@gmail.com
  }
  ```
</details>

## How to create an upgrade script
TODO

## How to configure CSRF trusted origins
TODO

## How to configure nginx for your server
TODO
