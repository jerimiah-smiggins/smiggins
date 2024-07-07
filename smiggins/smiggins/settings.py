import json5

from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = True
email = False

try:
    f: dict = json5.load(open(BASE_DIR / "settings.json", "r"))

    for key, val in f.items():
        if isinstance(val, bool) and key.lower() == "debug":
            DEBUG = val

        elif isinstance(val, bool) and key.lower() in ["enable_email", "email"]:
            email = val

except ValueError:
    ...
except FileNotFoundError:
    ...

try:
    from backend._api_keys import smtp_auth # type: ignore
except ImportError:
    if email:
        print("\x1b[91mIn order to allow emails, you need to have stmp_auth set in backend/_api_keys.py!\x1b[0m")
        email = False

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-y$sfjl+rlc(gbdjm4h@-!zxn8$z@nkcdd_9g^^yq&-=!b(8d43'

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    'posts.apps.PostsConfig',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'ninja',
]

MIDDLEWARE = [
    'backend.middleware.AddTDMReservation',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'smiggins.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / "templates"
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'smiggins.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'EST'
USE_I18N = True
USE_TZ = True
STATIC_ROOT = BASE_DIR / "collected-static"
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / "static"]
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
EMAIL_HOST = smtp_auth["EMAIL_HOST"]
EMAIL_HOST_USER = smtp_auth["EMAIL_HOST_USER"]
EMAIL_HOST_PASSWORD = smtp_auth["EMAIL_HOST_PASSWORD"]
EMAIL_PORT = smtp_auth["EMAIL_PORT"]
EMAIL_USE_TLS = smtp_auth["EMAIL_USE_TLS"]
