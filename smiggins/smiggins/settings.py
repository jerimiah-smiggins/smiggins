from pathlib import Path

from backend.variables import DEBUG, WEBSITE_URL  # noqa: F401

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-y$sfjl+rlc(gbdjm4h@-!zxn8$z@nkcdd_9g^^yq&-=!b(8d43'

ALLOWED_HOSTS = ["*"]
CSRF_TRUSTED_ORIGINS = [WEBSITE_URL]

INSTALLED_APPS = [
    'posts.apps.PostsConfig',
    'django.contrib.admin',
    'django.contrib.auth', # not used but required for dj-admin
    'django.contrib.contenttypes',
    'django.contrib.messages', # not used but required for dj-admin
    'django.contrib.sessions', # not used but required for dj-admin
    'django.contrib.staticfiles',
    'ninja',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    "posts.middleware.ratelimit.Ratelimit"
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

USE_I18N = False
USE_TZ = False
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

STATIC_ROOT = BASE_DIR / "collected-static"
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / "static-custom",
    BASE_DIR / "static",
]

SERVICE_WORDER_DIR = BASE_DIR / "static/sw.js"
