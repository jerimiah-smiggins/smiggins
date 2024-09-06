import json5

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = True
email = False
url = None

try:
    f: dict = json5.load(open(BASE_DIR / "settings.json", "r"))

    for key, val in f.items():
        if isinstance(val, bool) and key.lower() == "debug":
            DEBUG = val

        elif isinstance(val, bool) and key.lower() in ["enable_email", "email"]:
            email = val

        elif isinstance(val, str) and key.lower() == "website_url":
            url = val

except ValueError:
    ...
except FileNotFoundError:
    ...

if email and url is None:
    email = False

if email:
    try:
        from backend._api_keys import smtp_auth # type: ignore

        EMAIL_HOST = smtp_auth["EMAIL_HOST"]
        EMAIL_HOST_USER = smtp_auth["EMAIL_HOST_USER"]
        EMAIL_HOST_PASSWORD = smtp_auth["EMAIL_HOST_PASSWORD"]
        EMAIL_PORT = smtp_auth["EMAIL_PORT"]
        EMAIL_USE_TLS = smtp_auth["EMAIL_USE_TLS"]
        DEFAULT_FROM_EMAIL = smtp_auth["DEFAULT_FROM_EMAIL"]

        del smtp_auth

    except ImportError:
        print("\x1b[91mIn order to allow emails, you need to have smtp_auth set in backend/_api_keys.py!\x1b[0m")

del email, url, key, val

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

CACHES = {
    "default": {
        "BACKEND": f"django.core.cache.backends.{'dummy.DummyCache' if DEBUG else 'filebased.FileBasedCache'}",
        "LOCATION": BASE_DIR / "django_cache",
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
