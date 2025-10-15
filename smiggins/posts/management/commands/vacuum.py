from django.core.management.base import BaseCommand
from django.db import connection, transaction


class Command(BaseCommand):
    help = "Vacuums the database, defragmenting and reducing gaps, as well as likely reducing filesize."

    def handle(self, *args, **kwargs):
        print("Vacuuming...", end="")

        cursor = connection.cursor()
        cursor.execute("vacuum")
        transaction.commit()

        print(" done!")
