import subprocess
import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from datetime import datetime
from app.api.deps_with_librarian import get_current_librarian

router = APIRouter()

@router.get("/backup/manual")
def manual_backup(current_librarian=Depends(get_current_librarian)):

    try:
        command = [
          "mysqldump",
          "-h", os.getenv("mysql.railway.internal"),
          "-u", os.getenv("root"),
          f"-p{os.getenv('Pass@123')}",
          os.getenv("qrlms")
        ]

        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        def iterfile():
            for chunk in iter(lambda: process.stdout.read(1024), b""):
                yield chunk

        return StreamingResponse(
            iterfile(),
            media_type="application/sql",
            headers={
                "Content-Disposition": "attachment; filename=library_backup.sql"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@router.get("/backup/list")
def list_backups(current_librarian = Depends(get_current_librarian)):
    try:
        backup_dir = "backups"

        if not os.path.exists(backup_dir):
            return {"files": []}

        files = []

        for file in os.listdir(backup_dir):
            if file.endswith(".sql"):
                filepath = os.path.join(backup_dir, file)

                files.append({
                    "filename": file,
                    "size_kb": round(os.path.getsize(filepath) / 1024, 2),
                    "created_at": os.path.getctime(filepath)
                })

        # Sort latest first
        files.sort(key=lambda x: x["created_at"], reverse=True)

        return {"files": files}

    except Exception as e:
        return {"error": str(e)}





@router.get("/backup/download/{filename}")
def download_backup(filename: str, current_librarian = Depends(get_current_librarian)):
    try:
        filepath = os.path.join("backups", filename)

        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found")

        return FileResponse(
            path=filepath,
            filename=filename,
            media_type='application/sql'
        )

    except Exception as e:
        return {"error": str(e)}
