import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path

from backend.variables import DATABASE_BACKUPS

from smiggins.settings import BASE_DIR, DATABASES

db_path = DATABASES["default"]["NAME"]

td = timedelta(hours=DATABASE_BACKUPS["frequency"])
update_at = datetime.now() + td

if DATABASE_BACKUPS["path"].startswith("$"):
    path = BASE_DIR / DATABASE_BACKUPS["path"][1::]
else:
    path = Path(DATABASE_BACKUPS["path"])

def backup_db():
    global update_at

    if DATABASE_BACKUPS["enabled"] or update_at > datetime.now():
        return

    update_at = datetime.now() + td
    os.makedirs(path, exist_ok=True)

    if os.path.exists(path / DATABASE_BACKUPS["filename"].replace("$", str(DATABASE_BACKUPS["keep"]))):
        os.remove(path / DATABASE_BACKUPS["filename"].replace("$", str(DATABASE_BACKUPS["keep"])))

    for i in range(DATABASE_BACKUPS["keep"] - 1, 0, -1):
        if os.path.exists(path / DATABASE_BACKUPS["filename"].replace("$", str(i))):
            print(f"{i} => {i + 1}")
            os.rename(
                path / DATABASE_BACKUPS["filename"].replace("$", str(i)),
                path / DATABASE_BACKUPS["filename"].replace("$", str(i + 1))
            )

    shutil.copy(db_path, path / DATABASE_BACKUPS["filename"].replace("$", str(1)))
