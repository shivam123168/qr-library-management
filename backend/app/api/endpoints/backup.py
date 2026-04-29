import subprocess
import os
import pymysql
import io
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.responses import StreamingResponse
from datetime import datetime
from app.api.deps_with_librarian import get_current_librarian

router = APIRouter()

def generate_sql_dump():
    conn = pymysql.connect(
        host=os.getenv("MYSQLHOST"),
        user=os.getenv("MYSQLUSER"),
        password=os.getenv("MYSQLPASSWORD"),
        database=os.getenv("MYSQLDATABASE"),
        # port=int(os.getenv("MYSQLPORT", 3306)),
        cursorclass=pymysql.cursors.Cursor
    )

    cursor = conn.cursor()

    sql_dump = ""

    # Get all tables
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()

    for table in tables:
        table_name = table[0]

        # Create table structure
        cursor.execute(f"SHOW CREATE TABLE {table_name}")
        create_table_sql = cursor.fetchone()[1]
        sql_dump += f"\n\n-- TABLE: {table_name}\n"
        sql_dump += f"{create_table_sql};\n\n"

        # Table data
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()

        for row in rows:
            values = ", ".join(
                [f"'{str(v).replace('\'', '\\\'')}'" if v is not None else "NULL" for v in row]
            )
            sql_dump += f"INSERT INTO {table_name} VALUES ({values});\n"

    conn.close()
    return sql_dump


@router.get("/backup/manual")
def manual_backup(current_librarian=Depends(get_current_librarian)):

    sql_data = generate_sql_dump()

    buffer = io.StringIO(sql_data)

    return StreamingResponse(
        buffer,
        media_type="application/sql",
        headers={
            "Content-Disposition": "attachment; filename=library_backup.sql"
        }
    )


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
