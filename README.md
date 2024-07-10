# smiggins
official discord server: https://discord.gg/tH7QnHApwu

online version (at least for now): https://trinkey.pythonanywhere.com

## notice
here at smiggins incorporated (real company trust), we like to promote a kind
and inclusive argument. this means that **zero racism, sexism, homophobia,
etc. will be tolerated** in anywhere related to this project, including github
issues, the discord server, and the official main instance. if you think that
someone violates this and you believe that they are doing something wrong, feel
free to reach out to [@trinkey](https://github.com/trinkey). if you don't agree
with this, then don't start drama about it, just leave and pretend smiggins
doesn't exist.

<details>
  <summary><h2 style="display: inline">How to run locally</h2></summary>

  1. Clone the github repo or download the files

  2. With python, install the needed libraries
  (`python -m pip install --upgrade -r requirements.txt`,
  or use `py -m ...` on windows)

  3. Create the `_api_keys.py` file:
      ```bash
      touch ~/smiggins/smiggins/backend/_api_keys.py
      echo "auth_key = b'some random text this can be anything'" > ~/smiggins/smiggins/backend/_api_keys.py
      ```
      if you're on Windows then ~~fuck you~~ it's probably easier to do this
      using file explorer
  4. In the folder REPO_BASE/smiggins run the command
  `python3 manage.py migrate` (once again `py ...` for windows)

  5. In the settings.json file, make sure the site_url property is set properly

  6. Then, to start the server, run `python3 manage.py runserver` (`py ...` on
  windows still). If you want to start the server but already have the files,
  just do this step again. When updating versions, repeat step four too assuming
  you don't delete the `_api_keys.py` file, then you'd have to do step three
  again too.
</details>

<details>
  <summary><h2 style="display: inline">
    How to set up the server on PythonAnywhere (using a venv)
  </h2></summary>

  1. Create a venv (the name can be anything). if you already have one feel free
  to skip this step
    ```bash
      # the VENV_NAME can be anything
      mkvirtualenv VENV_NAME --python=/usr/bin/python3.10
      ```

  2. On the webapp setup page, create a new webapp. If you already have one,
  delete it and recreate it if it has a different config. You should click the
  following buttons in this order:
      - Add a new web app
      - Next
      - Manual configuration
      - Python 3.X (it doesn't matter)
      - Next

  3. On the webapp dashboard, in the "Virtualenv" section, you are going to want
  to enter the path to your venv. It should be
  `/home/USERNAME/.virtualenvs/VENV_NAME`.

  4. Click the "Start a console on this virtualenv" button to create a console
  in the venv. Then install needed libraries.
      ```bash
      python -m pip install --upgrade -r requirements.txt
      ```

  5. Clone the github repo
      ```bash
      cd ~
      git clone https://github.com/jerimiah-smiggins/smiggins.git
      # Optional: Change branch
      git switch branch-name
      ```

  6. Open the file at `/var/www/USERNAME_pythonanywhere_com.wgsi.py` and put the
  following python code, replacing "USERNAME" with your PythonAnywhere username:
      ```py
      import os
      import sys

      path = '/home/USERNAME/smiggins/smiggins'
      if path not in sys.path:
          sys.path.append(path)

      os.environ['DJANGO_SETTINGS_MODULE'] = 'smiggins.settings'

      from django.core.wsgi import get_wsgi_application
      application = get_wsgi_application()
      ```

  7. Back on the webapp dashboard, in the "Static Files" section, make an entry
  for `/static/` with the path set to
  `/home/USERNAME/smiggins/smiggins/collected-static`

  8. In the file at `/home/USERNAME/smiggins/smiggins/settings.json`,
  make sure the following settings are set:
      - debug: `False`
      - website_url: The url of your website. Likely "https://USERNAME.pythonanywhere.com"
  You can configure all of the other settings in this file.

  9. Create the `_api_keys.py` file:
      ```bash
      touch ~/smiggins/smiggins/backend/_api_keys.py
      echo "auth_key = b'some random text this can be anything'" > ~/smiggins/smiggins/backend/_api_keys.py
      ```

  10. In your venv console, run the following commands to create the database
  and setup the static files:
      ```bash
      cd ~/smiggins/smiggins
      python manage.py collectstatic
      python manage.py migrate
      ```
</details>

<details>
  <summary><h2 style="display: inline">
    How to set up the server on PythonAnywhere (no venv)
  </h2></summary>

  1. Create a new webapp using the following settings:
      - Manual configuration
      - Python 3.10

  2. Install and update the required libraries
     ```bash
     python -m pip install --upgrade -r requirements.txt
     ```

  3. Clone the github repo
      ```bash
      cd ~
      git clone https://github.com/jerimiah-smiggins/smiggins.git
      # Optional: Change branch
      git switch branch-name
      ```

  4. Open the file at `/var/www/USERNAME_pythonanywhere_com.wgsi.py` and put the
  following python code, replacing "USERNAME" with your PythonAnywhere username:
      ```py
      import os
      import sys

      path = '/home/USERNAME/smiggins/smiggins'
      if path not in sys.path:
          sys.path.append(path)

      os.environ['DJANGO_SETTINGS_MODULE'] = 'smiggins.settings'

      from django.core.wsgi import get_wsgi_application
      application = get_wsgi_application()
      ```
      This file can be found at the url
      https://www.pythonanywhere.com/user/USERNAME/files/var/www/USERNAME_pythonanywhere_com.wgsi.py

  6. Back on the webapp dashboard, in the "Static Files" section, make an entry
  for `/static/` with the path set to
  `/home/USERNAME/smiggins/smiggins/collected-static`

  8. In the file at `/home/USERNAME/smiggins/smiggins/settings.json`,
  make sure the following settings are set:
      - debug: `False`
      - website_url: The url of your website. Likely "https://USERNAME.pythonanywhere.com"
  You can configure all of the other settings in this file.

  9. Create the `_api_keys.py` file:
      ```bash
      touch ~/smiggins/smiggins/backend/_api_keys.py
      echo "auth_key = b'some random text this can be anything'" > ~/smiggins/smiggins/backend/_api_keys.py
      ```

  10. In your venv console, run the following commands to create the database
  and setup the static files:
      ```bash
      cd ~/smiggins/smiggins
      python3.10 manage.py collectstatic
      python3.10 manage.py migrate
      ```
</details>

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
    How can I contribute to this project
  </h2></summary>

  if you would like to help tranlate this website, read
  [this file](smiggins/lang/README.md)

  if there is a specific thing you want to do, you can make an issue (if a
  duplicate doesn't already exist).

  once you finish programming you can create a new fork with your code and then
  make a pull request with it.

  anyone who gets contributor access to the repository is decided by
  [@trinkey](https://github.com/trinkey). if you think you are deserving of
  getting it and don't currently have it, let her know.
</details>
