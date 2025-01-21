import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path

from backend.variables import DATABASE_BACKUPS
from posts.models import GenericData

from smiggins.settings import BASE_DIR, DATABASES

db_path = DATABASES["default"]["NAME"]

td = timedelta(hours=DATABASE_BACKUPS["frequency"])

if DATABASE_BACKUPS["path"].startswith("$"):
    path = BASE_DIR / DATABASE_BACKUPS["path"][1::]
else:
    path = Path(DATABASE_BACKUPS["path"])

def backup_db():
    global update_at

    if not DATABASE_BACKUPS["enabled"]:
        return

    lUObj = None
    try:
        lUObj = GenericData.objects.get(id="database_backup")
        lastUpdate = int(lUObj.value)
    except GenericData.DoesNotExist:
        lastUpdate = 0
    except TypeError:
        lastUpdate = 0

    if datetime.fromtimestamp(lastUpdate) + td > datetime.now():
        return

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

    now = str(int(datetime.now().timestamp()))

    if lUObj:
        lUObj.value = now
        lUObj.save()    
    else:
        GenericData.objects.create(
            id="database_backup",
            value=now
        )
