# Frequently Asked Questions
## How do I run this server?
Read [this document](running-the-server.md)

## I see the "⚠️" emoji somewhere. What does this mean?
Something broke. Please [create an issue](https://github.com/jerimiah-smiggins/smiggins/issues)
including your username (or if you were logged out) and what page you were
trying to view, along with any further information on how to reproduce this.

## What is a user ID? How is it different from a username?
A user ID is a unique number identifying every account. These are never used by
the frontend except on the admin page, it is mainly used in the backend. These
always start at 1, incrementing with every new user. To find these, you need to
have access to the database, or have a [Django superuser account](#how-can-i-access-the-database)

## Do you have X feature? / Can you add Y?
[Make an issue](https://github.com/jerimiah-smiggins/smiggins/issues).

## How can I access the database?
SQLite isn't a very human-friendly format, which you may have realized if you
have tried to open the database file in a text editor. In order to view the
database and it's contents, you can instead use Django's built in database
webpage.

To set this up, you need to have access to the database itself. To create a
Django superuser account, you can run `python manage.py createsuperuser`. From
there, you can just follow the on-screen instructions to create the account.

Once you have created the superuser account, you can navigate to the `/django-admin/`
page on your website. Note that **you do NOT need to restart your server** after
creating a superuser account.

If you get a "CSRF verification failed" error when trying to log in to the admin
page, read how to [configure CSRF trusted origins](/docs/running-the-server.md#how-to-configure-csrf-trusted-origins)

> [!CAUTION]
>
> It is strongly advised to not directly edit values from the `/django-admin/`
> page unless you are 100% sure you know what you're doing, as it is a lot
> easier to break things unintentionally this way. If there is a way to do what
> you are trying to do directly from the website, then you should do it that way
> instead.
