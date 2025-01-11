# Running the Server
Throughout these tutorials, the command `python` will be used in the place of
whatever command would normally run Python 3.10+. If you're using Windows, this
command will likely be `py`, or if you're on Mac or Linux, it's likely going to
be `python3` or `python3[version]` where `[version]` is the python version, ex.
`python310` for Python 3.10.

These instructions assume you have **[git](https://git-scm.com/)** and
**[Python 3.10+](https://python.org/)** installed.

Tutorials for PythonAnywhere assume that you have cloned the smiggins repository
in your home directory, resulting in a file path like `/home/USERNAME/smiggins/smiggins/settings.yaml`
for the `settings.yaml` file.

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

Then, you need to create the `.env` file. To do so, you can run one of
the following commands based on your operating system:
```bash
# Linux/Mac:
echo "auth_key=some random text this can be anything" > ./smiggins/.env

# Windows:
echo auth_key=some random text this can be anything > ./smiggins/.env
```

> [!WARNING]
>
> Once you set the contents of this variable, **DO NOT CHANGE IT!** This will
> cause all existing accounts to not be able to be logged in to.

Next, you will need to create the database. To do so, run this command:
```bash
python manage.py migrate
```

If you need to, make sure that the `website_url` property in the
[`settings.yaml`](/smiggins/settings.yaml) file is properly set.

Finally, in order to run the server itself, just run this command:
```bash
python manage.py runserver
```

## How to set up an instance on [PythonAnywhere](https://www.pythonanywhere.com/)
First, you'll need to create a new webapp. When doing so, make sure you select
the following settings:
- Manual configuration
- Python 3.10 (Python 3.10 is the minimum version for Django 5.X, which is
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

Then, you need to create the `.env` file. To do so, you can run this
command:
```bash
echo "auth_key=some random text this can be anything" > ./smiggins/.env
```

> [!WARNING]
>
> Once you set the contents of this variable, **DO NOT CHANGE IT!** This will
> cause all existing accounts to not be able to be logged in to.

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
for use is to change a couple of settings. Open the `settings.yaml` file in your
preferred editor (either by navigating there in the PythonAnywhere files web ui
or by using a terminal-based text editor like nano), and make sure that the
`debug` setting is set to `false` and that the `website_url` setting is set to
the url of your website, which is likely `https://USERNAME.pythonanywhere.com`.
Feel free to adjust any of the other configuration however you like.

From there, you can go to the webapps dashboard and restart your server. In a
few seconds, it should be all up and running.

## How to set up Gmail integration
The first things you need to do are:
- Make sure you have a Gmail account to use for this - emails are going to be
sent from whichever email is used for this process
- Ensure that [2FA is enabled](https://myaccount.google.com/signinoptions/twosv)
for your Gmail account

Once you do those, you are going to need to create an app password for your
email. To do so, go to [this link](https://myaccount.google.com/u/3/apppasswords).
The app name can be whatever you want, and the app password should be four
strings of four letters. Save this for the next step.

In the [`.env`](/smiggins/.env) file, add the following
code, modifying it to your needs:
```bash
email_host=smtp.gmail.com
email_host_user=[email]@gmail.com # put the full email, like example@gmail.com
email_host_password=xxxx xxxx xxxx xxxx # put in the password obtained in the previous step
email_port=587
email_use_tls=True
default_from_email=[email]@gmail.com # put the full email, like example@gmail.com
```

## How to create an upgrade script
If you want to update your instance to newer versions easily, you can use an
update script. These aren't at all difficult to make.

The first thing you are going to want to do is make a new file, say `update-smiggins.sh`:
```bash
# Create the file:
touch update-smiggins.sh

# Make the file executable:
chmod +x update-smiggins.sh
```

Then, open the file with your preferred text editor. In the file, put the
following commands:
```bash
# Make sure to change this directory to the one that includes the smiggins folder.
# The smiggins folder in question is the one that contains the manage.py and
# settings.yaml files.
cd /home/USERNAME/path/to/smiggins/

# Discard any modified files in order to prevent conflicts
git clean

# Fetch any new changes
git pull

# Set settings
echo '
# Put your backend config here
debug: false
website_url: https://example.com
max_post_length: 999
# ...
' > settings.yaml

# Optional: Update any packages
python -m pip install --upgrade -r ../requirements.txt

# Create/migrate database changes
python manage.py migrate

# Update collected static files
python manage.py collectstatic --noinput
```

## How to configure CSRF trusted origins
### UPDATE:
For versions **0.13.8 and above**, this variable is **automatically set** based
on the `website_url` setting.

---

When logging in to the `/django-admin/` panel, you may see a "CSRF Verification
Failed" error. To fix this, you just need to add the following line to the
[`settings.py`](/smiggins/smiggins/settings.py) file:
```py
CSRF_TRUSTED_ORIGINS = ["https://example.com"]
```

You can add as many domains to this array. You may need to specify both the http
and https version of your url if they both point to the same server. If you need
to allow all subdomains on a domain, you can do so by adding `https://*.example.com`
to the array.

Make sure to restart the server after configuring this.

If you want to add this automatically with your upgrade script, you can append
this to your script:
```bash
echo "CSRF_TRUSTED_ORIGINS = ['https://example.com']" >> smiggins/smiggins/smiggins/settings.py
```

## How to configure nginx for your server
After installing nginx if you haven't already, you are going to want to make a
new nginx site configuration:
```bash
# Replace with your preferred text editor
sudo nano /etc/nginx/sites-available/smiggins
```

In there, you are going to want to put the following:
```conf
server {
    # Replace [port] with the port you want to have the server on
    listen [port];
    # Replace [url] with the link to your server. Might be your ip address if you don't have a domain
    server_name [url];

    location / {
        proxy_pass http://0.0.0.0:[port];
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
       alias /path/to/collected-static/;
    }
}
```

Then, restart nginx:
```bash
sudo systemctl restart nginx
```

## How to configure Gunicorn for your server
First, you're going to want to make a gunicorn configuration file. For example,
`gunicorn.py`:
```py
bind = "0.0.0.0:80" # Set the ip/port to bind to - 0.0.0.0 is probably what you want
workers = 3 # The amount of web workers to run - higher = more users at once can thrive
```

Then, you need to make sure gunicorn is installed:
```bash
python -m pip install gunicorn
```

To run the server, just run:
```bash
gunicorn smiggins.wsgi:application --config gunicorn.py
```
