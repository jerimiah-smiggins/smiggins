from pathlib import Path

from backend.variables import DEBUG, ENABLE_EMAIL, WEBSITE_URL, dotenv_or_

BASE_DIR = Path(__file__).resolve().parent.parent

if ENABLE_EMAIL:
    try:
        from backend._api_keys import smtp_auth  # type: ignore
    except ImportError:
        smtp_auth = {}

    EMAIL_HOST =          dotenv_or_("email_host",          smtp_auth["EMAIL_HOST"]          if "EMAIL_HOST"          in smtp_auth else None)
    EMAIL_HOST_USER =     dotenv_or_("email_host_user",     smtp_auth["EMAIL_HOST_USER"]     if "EMAIL_HOST_USER"     in smtp_auth else None)
    EMAIL_HOST_PASSWORD = dotenv_or_("email_host_password", smtp_auth["EMAIL_HOST_PASSWORD"] if "EMAIL_HOST_PASSWORD" in smtp_auth else None)
    EMAIL_PORT =          dotenv_or_("email_port",          smtp_auth["EMAIL_PORT"]          if "EMAIL_PORT"          in smtp_auth else None, int)
    EMAIL_USE_TLS =       dotenv_or_("email_use_tls",       smtp_auth["EMAIL_USE_TLS"]       if "EMAIL_USE_TLS"       in smtp_auth else None)
    DEFAULT_FROM_EMAIL =  dotenv_or_("default_from_email",  smtp_auth["DEFAULT_FROM_EMAIL"]  if "DEFAULT_FROM_EMAIL"  in smtp_auth else None, lambda x: x.lower() == "true")

    del smtp_auth

del ENABLE_EMAIL, WEBSITE_URL, dotenv_or_

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
    'backend.middleware.CustomHeaders',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
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
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

STATIC_ROOT = BASE_DIR / "collected-static"
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / "static-custom",
    BASE_DIR / "static",
]
