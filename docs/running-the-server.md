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

## General maintainence suggestions
You should try to keep your instance up to date, with database backups in case
something goes wrong.

It is also suggested that you occasionally vacuum the database, in order to
reduce disk usage and minimize fragmentation and gaps, especially after any
migrations. This can be done by running `python manage.py vacuum`.

## How set up a local testing server
First, you will need to run some commands in the command line in order to get
the code on your device, install required packages, etc.
```bash
# Clone the code onto your local computer
git clone https://github.com/jerimiah-smiggins/smiggins.git

# Go into the folder that contains the code
cd smiggins

# Optional: change git branch
git switch branch-name

# Install Python libraries
python -m pip install --upgrade -r requirements.txt
```

Then, you need to create the `.env` file. The content should look something like
the following:
```ini
auth_key = ""

# these keys are used for push notifications.
# the can be generated at https://steveseguin.github.io/vapid/
VAPID_public_key = "your public key"
VAPID_private_key = "your private key"
```

> [!NOTE]
>
> The auth_key variable doesn't need to be anything in particular. It is only
> here as compatability for when it was used for authentication. It allows
> legacy accounts to still be logged into and migrated to the new system.

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

## How to create an upgrade script
If you want to update your instance to newer versions easily, you can use an
update script. These aren't at all difficult to make. This tutorial assumes you
are using linux.

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
