# social-media-thing
(name and project wip)

official discord server: https://discord.gg/tH7QnHApwu

online version (at least for now): https://trinkey.pythonanywhere.com

<details>
  <summary><h2 style="display: inline-block">How to run locally</summary>

  1. Clone the github repo or download the files
  2. With python, install the needed libraries (`python3 -m pip install --upgrade django django-ninja`, `py -m ...` on windows)
  3. Create the `_api_keys.py` file:
      ```bash
      touch ~/social-media-thing/smiggins/backend/_api_keys.py
      echo "auth_key = b'some random text this can be anything'" > ~/social-media-thing/smiggins/backend/_api_keys.py
      ```
      if you're on Windows then fuck you figure it out yourself
  4. In the folder REPO_BASE/smiggins run the command `python3 manage.py migrate` (`py ...` for windows)
  5. Then, to start the server, run `python3 manage.py runserver` (`py ...` on windows still). If you want to start the server but already have the files, just do this step again. When updating versions, repeat step four too assuming you don't delete the `_api_keys.py` file, then you'd have to do step three again too.
</details>

<details>
  <summary><h2 style="display: inline-block">How to set up the Django version on PythonAnywhere</h2></summary>

  1. Create a venv (the name can be anything). if you already have one feel free to skip this step
      ```bash
      mkvirtualenv VENV_NAME --python=/usr/bin/python3.10 # the VENV_NAME can be anything
      ```

  2. On the webapp setup page, create a new webapp. If you already have one, delete it and recreate it if it has a different config. You should click the following buttons in this order:
      - Add a new web app
      - Next
      - Manual configuration
      - Python 3.X (it doesn't matter)
      - Next

  3. On the webapp dashboard, in the "Virtualenv" section, you are going to want to enter the path to your venv. It should be `/home/USERNAME/.virtualenvs/VENV_NAME`.

  4. Click the "Start a console on this virtualenv" button to create a console in the venv. Then install needed libraries.
      ```bash
      python -m pip install --upgrade pip
      python -m pip install --upgrade django django-ninja
      ```

  5. Clone the github repo
      ```bash
      cd ~
      git clone https://github.com/trinkey/social-media-thing.git
      # Optional: Change branch
      git switch branch-name
      ```

  6. Open the file at `/var/www/USERNAME_pythonanywhere_com.wgsi.py` and put the following python code, replacing "USERNAME" with your PythonAnywhere username:
      ```py
      import os
      import sys

      path = '/home/USERNAME/social-media-thing/smiggins'
      if path not in sys.path:
          sys.path.append(path)

      os.environ['DJANGO_SETTINGS_MODULE'] = 'smiggins.settings'

      from django.core.wsgi import get_wsgi_application
      application = get_wsgi_application()
      ```

  7. Back on the webapp dashboard, in the "Static Files" section, make an entry for `/static/` with the path set to `/home/USERNAME/social-media-thing/smiggins/collected-static`

  8. In the file at `/home/USERNAME/social-media-thing/smiggins/backend/_settings.py`, make sure the following settings are set:
      - debug: `False`

  9. Create the `_api_keys.py` file:
      ```bash
      touch ~/social-media-thing/smiggins/backend/_api_keys.py
      echo "auth_key = b'some random text this can be anything'" > ~/social-media-thing/smiggins/backend/_api_keys.py
      ```

  10. In your venv console, run the following commands to create the database and setup the static files:
      ```bash
      cd ~/social-media-thing/smiggins
      python manage.py collectstatic
      python manage.py migrate
      ```
</details>

<details>
  <summary><h2 style="display: inline-block">How to upgrade versions on PythonAnywhere</summary>

  To clone the newest version, do the following commands in the `~/social-media-thing` folder:
  ```bash
  git stash
  git pull
  git stash pop
  ```

  Then, in the venv console, run these commands in the `~/social-media-thing/smiggins` folder:
  ```bash
  python manage.py collectstatic
  python manage.py migrate
  ```

  Then, just restart the server from the webapp dashboard!
</details>

<details>
  <summary><h2 style="display: inline-block">Where can I report issues or suggest stuff</summary>

  go to the [issues tab](https://github.com/trinkey/social-media-thing) and make a new issue (make sure you're logged in with github)
</details>

<details>
  <summary><h2 style="display: inline-block">How can I contribute to this project</h2></summary>

  if there is a specific thing you want to do, you can make an issue (if a duplicate doesn't already exist) and then
  assign yourself if you can. (if you can't assign yourself as you're not a contributor, you can make a comment on it
  stating that you are going to do it)

  once you finish programming you can create a new fork with your code and then make a pull request with it.

  if you have contributed a lot to this project, you can message me on any platform that i use (email: asdfjkltrinketio@gmail.com,
  discord: `@trinkey_`, twitter: `@trinkey_2`) and let me know your github username and stuff that you have worked on and i'll consider
  adding you to the repository
</details>
