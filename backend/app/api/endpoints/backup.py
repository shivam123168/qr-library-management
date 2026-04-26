import subprocess
import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from datetime import datetime
from app.api.deps_with_librarian import get_current_librarian

router = APIRouter()

@router.get("/backup/manual")
def manual_backup(current_librarian = Depends(get_current_librarian)):
    try:
        # 🔹 Create folder if not exists
        os.makedirs("backups", exist_ok=True)

        filename = f"backup_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.sql"
        filepath = f"backups/{filename}"

        command = [
            "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
            "-u", "root",
            "-pPass@123",
            "qrlms"
        ]

        with open(filepath, "w") as f:
            result = subprocess.run(
                command,
                stdout=f,
                stderr=subprocess.PIPE,
                text=True
            )

        if result.returncode != 0:
            return {"error": result.stderr}

        return FileResponse(path=filepath, filename=filename)

    except Exception as e:
        return {"error": str(e)}
    


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