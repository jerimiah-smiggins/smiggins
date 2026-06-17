# Migrating to Postgres from SQLite
1. Make sure postgres is installed, and you know the password, and smiggins is
   on **version v1.4.9** with the database fully migrated.
2. Make a database of the preferred name (`CREATE DATABASE name;`) - To enter
   the psql command line, you can run `sudo -u postgres psql`, assuming the
   database is running under the `postgres` user.
3. Before updating smiggins, dump the old database (`python3 manage.py dumpdata -o database.json`)
4. Then, you can update smiggins to **v1.5.0**. Make sure your postgres config
   in `settings.yaml` is accurate.
5. Migrate the postgres database to the newest format (`python3 manage.py migrate`)
6. Restore the dumped data created in step 3 (`python3 manage.py loaddata database.json`)
   - You may need to do some manual pruning of the data, because for example
     SQLite doesn't enforce the `max_length` property on `CharField`s
