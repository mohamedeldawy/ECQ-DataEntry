import argparse
import hmac
import logging
import os
import secrets
import sqlite3
from datetime import date, timedelta
from functools import wraps
from pathlib import Path

from flask import (
    Flask,
    abort,
    g,
    jsonify,
    render_template,
    request,
    send_from_directory,
    send_file,
    session,
)
from werkzeug.security import check_password_hash, generate_password_hash


ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("QUALITY_DASHBOARD_DATA_DIR", ROOT / "instance"))
UPLOAD_DIR = Path(os.environ.get("QUALITY_DASHBOARD_UPLOAD_DIR", DATA_DIR / "uploads"))
DATABASE = Path(os.environ.get("QUALITY_DASHBOARD_DATABASE", DATA_DIR / "dashboard.sqlite3"))
MAX_UPLOAD_BYTES = 50 * 1024 * 1024
CATALOGS = {"teachers", "grades", "subjects", "lectures"}
STARTER_CATALOGS = {
    "grades": ["Junior 4", "Junior 5", "Junior 6", "Middle 1", "Middle 2", "Middle 3", "Senior 1"],
    "subjects": [
        "Science-En",
        "Science-Ar",
        "Math-En",
        "Math-Ar",
        "Social-Studies",
        "Arabic",
        "English",
        "Integrated-Science-En",
        "Integrated-Science-Ar",
        "Philosophy",
        "Geography",
        "History",
    ],
}

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config.update(
    MAX_CONTENT_LENGTH=MAX_UPLOAD_BYTES + 1024 * 1024,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("QUALITY_DASHBOARD_COOKIE_SECURE", "1") != "0",
    PERMANENT_SESSION_LIFETIME=timedelta(hours=12),
)
app.logger.setLevel(logging.INFO)


def _secret_key():
    configured = os.environ.get("QUALITY_DASHBOARD_SECRET_KEY")
    if configured:
        return configured
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    secret_path = DATA_DIR / "session-secret"
    try:
        key = secret_path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        key = secrets.token_urlsafe(48)
        try:
            with secret_path.open("x", encoding="utf-8") as secret_file:
                secret_file.write(key)
        except FileExistsError:
            key = secret_path.read_text(encoding="utf-8").strip()
    if not key:
        raise RuntimeError("The session signing key is empty.")
    return key


app.secret_key = _secret_key()


def get_db():
    if "db" not in g:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        DATABASE.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(DATABASE, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 30000")
        g.db = connection
    return g.db


@app.teardown_appcontext
def close_db(_error=None):
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    DATABASE.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE, timeout=30)
    try:
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('manager', 'dataEntry', 'quality')),
                subject_id INTEGER REFERENCES catalogs(id) ON DELETE SET NULL,
                active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CHECK (role != 'quality' OR subject_id IS NOT NULL)
            );
            CREATE TABLE IF NOT EXISTS catalogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL CHECK (type IN ('teachers', 'grades', 'subjects', 'lectures')),
                label TEXT NOT NULL COLLATE NOCASE,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (type, label)
            );
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                teacher_id INTEGER NOT NULL REFERENCES catalogs(id) ON DELETE RESTRICT,
                grade_id INTEGER NOT NULL REFERENCES catalogs(id) ON DELETE RESTRICT,
                subject_id INTEGER NOT NULL REFERENCES catalogs(id) ON DELETE RESTRICT,
                lecture_id INTEGER NOT NULL REFERENCES catalogs(id) ON DELETE RESTRICT,
                quality_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                data_entry_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
                task_owner TEXT NOT NULL CHECK (task_owner IN ('dataEntry', 'quality')),
                start_date TEXT,
                delivery_date TEXT,
                lecture_schedule TEXT,
                asking_date TEXT,
                warning_date TEXT,
                shooting_date TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CHECK (task_owner != 'dataEntry' OR data_entry_id IS NOT NULL)
            );
            CREATE TABLE IF NOT EXISTS task_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                kind TEXT NOT NULL CHECK (kind IN ('raw', 'prepared')),
                name TEXT NOT NULL,
                stored_name TEXT NOT NULL UNIQUE,
                size INTEGER NOT NULL CHECK (size >= 0),
                uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS tasks_subject_idx ON tasks(subject_id);
            CREATE INDEX IF NOT EXISTS tasks_delivery_idx ON tasks(delivery_date);
            CREATE INDEX IF NOT EXISTS task_files_task_kind_idx ON task_files(task_id, kind);
            """
        )
        connection.commit()
    finally:
        connection.close()


def json_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        abort(400, description="Invalid JSON request body.")
    return body


def require_csrf():
    supplied = request.headers.get("X-CSRF-Token", "")
    expected = session.get("csrf_token", "")
    if not supplied or not expected or not hmac.compare_digest(supplied, expected):
        abort(403, description="Your session expired. Refresh the page and try again.")
    origin = request.headers.get("Origin")
    if origin and origin.rstrip("/") != request.host_url.rstrip("/"):
        abort(403, description="Request origin is not allowed.")


@app.before_request
def protect_mutations():
    if request.method in {"POST", "PUT", "PATCH", "DELETE"} and request.path.startswith("/api/"):
        require_csrf()


def user_json(user):
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "subject_id": user["subject_id"],
        "active": bool(user["active"]),
    }


def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    user = get_db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if user is None or not user["active"]:
        session.clear()
        return None
    return user


def login_required(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        user = current_user()
        if user is None:
            abort(401, description="Sign in to continue.")
        g.user = user
        return handler(*args, **kwargs)

    return wrapped


def roles_required(*allowed_roles):
    def decorator(handler):
        @wraps(handler)
        @login_required
        def wrapped(*args, **kwargs):
            if g.user["role"] not in allowed_roles:
                abort(403, description="You do not have permission to perform this action.")
            return handler(*args, **kwargs)

        return wrapped

    return decorator


def catalog_row(catalog_id, expected_type=None):
    if isinstance(catalog_id, bool) or not (
        isinstance(catalog_id, int)
        or isinstance(catalog_id, str) and catalog_id.isdecimal()
    ):
        abort(400, description="Choose a valid item from the matching list.")
    catalog_id = int(catalog_id)
    row = get_db().execute("SELECT * FROM catalogs WHERE id = ?", (catalog_id,)).fetchone()
    if row is None or (expected_type and row["type"] != expected_type):
        abort(400, description="Choose a valid item from the matching list.")
    return row


def valid_date(value, field_name):
    if value in (None, ""):
        return None
    if not isinstance(value, str):
        abort(400, description=f"{field_name} must be a date.")
    try:
        parsed = date.fromisoformat(value)
        if parsed.isoformat() != value:
            raise ValueError
        return parsed.isoformat()
    except ValueError:
        abort(400, description=f"{field_name} must use YYYY-MM-DD format.")


def task_files(task_id):
    rows = get_db().execute(
        "SELECT * FROM task_files WHERE task_id = ? ORDER BY uploaded_at, id",
        (task_id,),
    ).fetchall()
    return {
        "raw_files": [file_json(row) for row in rows if row["kind"] == "raw"],
        "prepared_files": [file_json(row) for row in rows if row["kind"] == "prepared"],
    }


def file_json(file_row):
    return {
        "id": file_row["id"],
        "task_id": file_row["task_id"],
        "kind": file_row["kind"],
        "name": file_row["name"],
        "size": file_row["size"],
        "uploaded_by": file_row["uploaded_by"],
        "uploaded_at": file_row["uploaded_at"],
    }


def task_json(task):
    result = dict(task)
    result.update(task_files(task["id"]))
    return result


TASK_SELECT = """
    SELECT t.*,
      teacher.label AS teacher, grade.label AS grade,
      subject.label AS subject, lecture.label AS lecture,
      quality.name AS quality_name, data_entry.name AS data_entry_name
    FROM tasks t
    JOIN catalogs teacher ON teacher.id = t.teacher_id
    JOIN catalogs grade ON grade.id = t.grade_id
    JOIN catalogs subject ON subject.id = t.subject_id
    JOIN catalogs lecture ON lecture.id = t.lecture_id
    JOIN users quality ON quality.id = t.quality_id
    LEFT JOIN users data_entry ON data_entry.id = t.data_entry_id
"""


def task_for_user(task_id, user):
    task = get_db().execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if task is None:
        abort(404, description="Task not found.")
    if user["role"] == "quality" and task["subject_id"] != user["subject_id"]:
        abort(404, description="Task not found.")
    return task


def file_for_user(file_id, user):
    file_row = get_db().execute(
        """
        SELECT f.*, t.subject_id
        FROM task_files f JOIN tasks t ON t.id = f.task_id
        WHERE f.id = ?
        """,
        (file_id,),
    ).fetchone()
    if file_row is None:
        abort(404, description="File not found.")
    if user["role"] == "quality":
        if file_row["kind"] != "raw" or file_row["subject_id"] != user["subject_id"]:
            abort(404, description="File not found.")
    return file_row


def require_quality_for_subject(user_id, subject_id):
    member = get_db().execute(
        "SELECT id, role, subject_id, active FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    if member is None or not member["active"] or member["role"] != "quality":
        abort(400, description="Choose an active Quality team member.")
    if member["subject_id"] != subject_id:
        abort(400, description="The selected Quality member is not assigned to this subject.")
    return member


def require_data_entry(user_id):
    member = get_db().execute(
        "SELECT id, role, active FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    if member is None or not member["active"] or member["role"] != "dataEntry":
        abort(400, description="Choose an active Data Entry team member.")
    return member


def task_values(body):
    db = get_db()
    teacher = catalog_row(body.get("teacher_id"), "teachers")
    grade = catalog_row(body.get("grade_id"), "grades")
    subject = catalog_row(body.get("subject_id"), "subjects")
    lecture = catalog_row(body.get("lecture_id"), "lectures")
    quality_id = parse_id(body.get("quality_id"), "Choose a Quality member.")
    quality = require_quality_for_subject(quality_id, subject["id"])
    owner = body.get("task_owner")
    if not isinstance(owner, str) or owner not in {"dataEntry", "quality"}:
        abort(400, description="Choose Data Entry or Quality as the task owner.")
    data_entry = None
    if owner == "dataEntry":
        data_entry_id = parse_id(body.get("data_entry_id"), "Choose a Data Entry team member.")
        data_entry = require_data_entry(data_entry_id)
    values = (
        teacher["id"],
        grade["id"],
        subject["id"],
        lecture["id"],
        quality["id"],
        data_entry["id"] if data_entry else None,
        owner,
        valid_date(body.get("start_date"), "Start date"),
        valid_date(body.get("delivery_date"), "Delivery date"),
        valid_date(body.get("lecture_schedule"), "Lecture schedule"),
        valid_date(body.get("asking_date") if owner == "dataEntry" else None, "Asking date"),
        valid_date(body.get("warning_date") if owner == "dataEntry" else None, "Warning date"),
        valid_date(body.get("shooting_date"), "Shooting date"),
    )
    return values


def parse_id(value, message):
    if isinstance(value, bool) or not (
        isinstance(value, int)
        or isinstance(value, str) and value.isdecimal()
    ):
        abort(400, description=message)
    identifier = int(value)
    if identifier < 1:
        abort(400, description=message)
    return identifier


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/app.js")
def javascript_bundle():
    return send_from_directory(ROOT / "static", "app.js", mimetype="text/javascript")


@app.get("/styles.css")
def stylesheet():
    return send_from_directory(ROOT / "static", "styles.css", mimetype="text/css")


@app.get("/api/session")
def session_info():
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_urlsafe(32)
    user = current_user()
    if user and user["role"] == "manager":
        seed_starter_catalogs()
    return jsonify({
        "user": user_json(user) if user else None,
        "csrf_token": session["csrf_token"],
    })


def seed_starter_catalogs():
    db = get_db()
    seeded = db.execute(
        "SELECT 1 FROM app_settings WHERE key = 'starter_catalogs_seeded'"
    ).fetchone()
    if seeded:
        return
    for kind, labels in STARTER_CATALOGS.items():
        for label in labels:
            db.execute(
                "INSERT OR IGNORE INTO catalogs (type, label) VALUES (?, ?)",
                (kind, label),
            )
    db.execute(
        "INSERT INTO app_settings (key, value) VALUES ('starter_catalogs_seeded', '1')"
    )
    db.commit()


@app.post("/api/login")
def login():
    body = json_body()
    email = str(body.get("email", "")).strip().lower()
    password = body.get("password")
    if not email or not isinstance(password, str) or not password:
        abort(400, description="Enter your email and password.")
    user = get_db().execute(
        "SELECT * FROM users WHERE email = ? COLLATE NOCASE",
        (email,),
    ).fetchone()
    if user is None or not user["active"] or not check_password_hash(user["password_hash"], password):
        abort(401, description="Email or password is incorrect.")
    session.clear()
    session.permanent = True
    session["user_id"] = user["id"]
    session["csrf_token"] = secrets.token_urlsafe(32)
    if user["role"] == "manager":
        seed_starter_catalogs()
    return jsonify({"user": user_json(user), "csrf_token": session["csrf_token"]})


@app.post("/api/logout")
@login_required
def logout():
    session.clear()
    return jsonify({"success": True})


@app.get("/api/catalogs")
@login_required
def get_catalogs():
    rows = get_db().execute("SELECT * FROM catalogs ORDER BY type, label COLLATE NOCASE").fetchall()
    return jsonify([dict(row) for row in rows])


@app.post("/api/catalogs")
@roles_required("manager")
def create_catalog():
    body = json_body()
    kind = body.get("type")
    label = str(body.get("label", "")).strip()
    if not isinstance(kind, str) or kind not in CATALOGS or not label or len(label) > 100:
        abort(400, description="Enter a valid list type and name.")
    try:
        cursor = get_db().execute("INSERT INTO catalogs (type, label) VALUES (?, ?)", (kind, label))
        get_db().commit()
    except sqlite3.IntegrityError:
        abort(409, description="This item already exists in the list.")
    return jsonify({"id": cursor.lastrowid, "type": kind, "label": label}), 201


@app.patch("/api/catalogs/<int:catalog_id>")
@roles_required("manager")
def update_catalog(catalog_id):
    body = json_body()
    label = str(body.get("label", "")).strip()
    if not label or len(label) > 100:
        abort(400, description="Enter a name between 1 and 100 characters.")
    try:
        cursor = get_db().execute("UPDATE catalogs SET label = ? WHERE id = ?", (label, catalog_id))
        if cursor.rowcount == 0:
            abort(404, description="List item not found.")
        get_db().commit()
    except sqlite3.IntegrityError:
        abort(409, description="This item already exists in the list.")
    return jsonify({"success": True})


@app.delete("/api/catalogs/<int:catalog_id>")
@roles_required("manager")
def delete_catalog(catalog_id):
    try:
        cursor = get_db().execute("DELETE FROM catalogs WHERE id = ?", (catalog_id,))
        if cursor.rowcount == 0:
            abort(404, description="List item not found.")
        get_db().commit()
    except sqlite3.IntegrityError:
        abort(409, description="This item is used by a task or team member and cannot be deleted.")
    return jsonify({"success": True})


@app.get("/api/users")
@roles_required("manager")
def list_users():
    users = get_db().execute(
        "SELECT id, name, email, role, subject_id, active, created_at FROM users ORDER BY name COLLATE NOCASE"
    ).fetchall()
    return jsonify([dict(user, active=bool(user["active"])) for user in users])


@app.post("/api/users")
@roles_required("manager")
def create_user():
    body = json_body()
    name = str(body.get("name", "")).strip()
    email = str(body.get("email", "")).strip().lower()
    password = body.get("password")
    role = body.get("role")
    if not name or len(name) > 100 or "@" not in email:
        abort(400, description="Enter a valid name and email address.")
    if not isinstance(password, str) or len(password) < 8:
        abort(400, description="The temporary password must contain at least 8 characters.")
    if not isinstance(role, str) or role not in {"dataEntry", "quality"}:
        abort(400, description="Choose Data Entry or Quality.")
    subject_id = None
    if role == "quality":
        subject_id = catalog_row(body.get("subject_id"), "subjects")["id"]
    try:
        cursor = get_db().execute(
            """
            INSERT INTO users (name, email, password_hash, role, subject_id)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name, email, generate_password_hash(password), role, subject_id),
        )
        get_db().commit()
    except sqlite3.IntegrityError:
        abort(409, description="An account with that email already exists.")
    user = get_db().execute(
        "SELECT id, name, email, role, subject_id, active FROM users WHERE id = ?",
        (cursor.lastrowid,),
    ).fetchone()
    return jsonify(user_json(user)), 201


@app.patch("/api/users/<int:user_id>")
@roles_required("manager")
def update_user(user_id):
    body = json_body()
    member = get_db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if member is None or member["role"] == "manager":
        abort(404, description="Team member not found.")
    name = str(body.get("name", "")).strip()
    role = body.get("role")
    if not name or len(name) > 100 or not isinstance(role, str) or role not in {"dataEntry", "quality"}:
        abort(400, description="Enter a valid name and team role.")
    subject_id = None
    if role == "quality":
        subject_id = catalog_row(body.get("subject_id"), "subjects")["id"]
    if member["role"] != role or member["subject_id"] != subject_id:
        assignment = get_db().execute(
            """
            SELECT
              EXISTS(SELECT 1 FROM tasks WHERE quality_id = ?) AS is_quality_assigned,
              EXISTS(SELECT 1 FROM tasks WHERE data_entry_id = ?) AS is_data_entry_assigned
            """,
            (user_id, user_id),
        ).fetchone()
        if assignment["is_quality_assigned"] or assignment["is_data_entry_assigned"]:
            abort(
                409,
                description="Reassign this member's tasks before changing their role or subject.",
            )
    try:
        get_db().execute(
            "UPDATE users SET name = ?, role = ?, subject_id = ? WHERE id = ?",
            (name, role, subject_id, user_id),
        )
        get_db().commit()
    except sqlite3.IntegrityError:
        abort(409, description="The account role cannot be changed because it is assigned to existing tasks.")
    return jsonify({"success": True})


@app.post("/api/users/<int:user_id>/password")
@roles_required("manager")
def reset_user_password(user_id):
    body = json_body()
    password = body.get("password")
    if not isinstance(password, str) or len(password) < 8:
        abort(400, description="The temporary password must contain at least 8 characters.")
    cursor = get_db().execute(
        "UPDATE users SET password_hash = ? WHERE id = ? AND role != 'manager'",
        (generate_password_hash(password), user_id),
    )
    if cursor.rowcount == 0:
        abort(404, description="Team member not found.")
    get_db().commit()
    return jsonify({"success": True})


@app.delete("/api/users/<int:user_id>")
@roles_required("manager")
def deactivate_user(user_id):
    cursor = get_db().execute(
        "UPDATE users SET active = 0 WHERE id = ? AND role != 'manager'",
        (user_id,),
    )
    if cursor.rowcount == 0:
        abort(404, description="Team member not found.")
    get_db().commit()
    return jsonify({"success": True})


@app.post("/api/users/<int:user_id>/activate")
@roles_required("manager")
def activate_user(user_id):
    cursor = get_db().execute(
        "UPDATE users SET active = 1 WHERE id = ? AND role != 'manager'",
        (user_id,),
    )
    if cursor.rowcount == 0:
        abort(404, description="Team member not found.")
    get_db().commit()
    return jsonify({"success": True})


@app.get("/api/tasks")
@login_required
def list_tasks():
    user = g.user
    if user["role"] == "quality":
        rows = get_db().execute(
            TASK_SELECT + " WHERE t.subject_id = ? ORDER BY t.delivery_date, t.id",
            (user["subject_id"],),
        ).fetchall()
    else:
        rows = get_db().execute(TASK_SELECT + " ORDER BY t.delivery_date, t.id").fetchall()
    result = []
    for row in rows:
        item = task_json(row)
        if user["role"] == "quality":
            item["prepared_files"] = []
        result.append(item)
    return jsonify(result)


@app.post("/api/tasks")
@roles_required("manager")
def create_task():
    body = json_body()
    values = task_values(body)
    cursor = get_db().execute(
        """
        INSERT INTO tasks (
          teacher_id, grade_id, subject_id, lecture_id, quality_id, data_entry_id,
          task_owner, start_date, delivery_date, lecture_schedule, asking_date,
          warning_date, shooting_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        values,
    )
    get_db().commit()
    task = get_db().execute(TASK_SELECT + " WHERE t.id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify(task_json(task)), 201


@app.patch("/api/tasks/<int:task_id>")
@roles_required("manager")
def update_task(task_id):
    values = task_values(json_body())
    cursor = get_db().execute(
        """
        UPDATE tasks SET
          teacher_id = ?, grade_id = ?, subject_id = ?, lecture_id = ?,
          quality_id = ?, data_entry_id = ?, task_owner = ?, start_date = ?,
          delivery_date = ?, lecture_schedule = ?, asking_date = ?,
          warning_date = ?, shooting_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (*values, task_id),
    )
    if cursor.rowcount == 0:
        abort(404, description="Task not found.")
    get_db().commit()
    task = get_db().execute(TASK_SELECT + " WHERE t.id = ?", (task_id,)).fetchone()
    return jsonify(task_json(task))


@app.delete("/api/tasks/<int:task_id>")
@roles_required("manager")
def delete_task(task_id):
    task_for_user(task_id, g.user)
    rows = get_db().execute("SELECT stored_name FROM task_files WHERE task_id = ?", (task_id,)).fetchall()
    get_db().execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    get_db().commit()
    for row in rows:
        try:
            (UPLOAD_DIR / row["stored_name"]).unlink(missing_ok=True)
        except OSError:
            app.logger.exception("Could not remove uploaded task file %s", row["stored_name"])
    return jsonify({"success": True})


@app.post("/api/tasks/<int:task_id>/files")
@login_required
def upload_task_file(task_id):
    user = g.user
    task = task_for_user(task_id, user)
    kind = request.form.get("kind")
    if kind not in {"raw", "prepared"}:
        abort(400, description="Choose Raw or Prepared file type.")
    if user["role"] == "quality" and kind != "raw":
        abort(403, description="Quality members can upload Raw files only.")
    if user["role"] == "quality" and task["subject_id"] != user["subject_id"]:
        abort(404, description="Task not found.")
    uploaded = request.files.get("file")
    if uploaded is None or not uploaded.filename:
        abort(400, description="Choose a file to upload.")
    uploaded.stream.seek(0, os.SEEK_END)
    size = uploaded.stream.tell()
    uploaded.stream.seek(0)
    if size <= 0 or size > MAX_UPLOAD_BYTES:
        abort(413, description="Files must be between 1 byte and 50 MB.")
    original_name = uploaded.filename.replace("\\", "/").rsplit("/", 1)[-1].replace("\x00", "").strip()
    original_name = "".join(char for char in original_name if ord(char) >= 32 and ord(char) != 127)[:255]
    if not original_name:
        abort(400, description="The uploaded file name is invalid.")
    suffix = Path(original_name).suffix[:20]
    stored_name = f"{secrets.token_hex(24)}{suffix}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    destination = UPLOAD_DIR / stored_name
    uploaded.save(destination)
    try:
        cursor = get_db().execute(
            """
            INSERT INTO task_files (task_id, kind, name, stored_name, size, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (task_id, kind, original_name, stored_name, size, user["id"]),
        )
        get_db().commit()
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    row = get_db().execute("SELECT * FROM task_files WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify(file_json(row)), 201


@app.put("/api/files/<int:file_id>")
@login_required
def replace_task_file(file_id):
    user = g.user
    existing = file_for_user(file_id, user)
    if user["role"] == "quality" and existing["kind"] != "raw":
        abort(403, description="Quality members can replace Raw files only.")
    uploaded = request.files.get("file")
    if uploaded is None or not uploaded.filename:
        abort(400, description="Choose a replacement file.")
    uploaded.stream.seek(0, os.SEEK_END)
    size = uploaded.stream.tell()
    uploaded.stream.seek(0)
    if size <= 0 or size > MAX_UPLOAD_BYTES:
        abort(413, description="Files must be between 1 byte and 50 MB.")
    original_name = uploaded.filename.replace("\\", "/").rsplit("/", 1)[-1].replace("\x00", "").strip()
    original_name = "".join(char for char in original_name if ord(char) >= 32 and ord(char) != 127)[:255]
    if not original_name:
        abort(400, description="The uploaded file name is invalid.")
    suffix = Path(original_name).suffix[:20]
    stored_name = f"{secrets.token_hex(24)}{suffix}"
    destination = UPLOAD_DIR / stored_name
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    uploaded.save(destination)
    old_path = UPLOAD_DIR / existing["stored_name"]
    try:
        get_db().execute(
            """
            UPDATE task_files SET name = ?, stored_name = ?, size = ?,
              uploaded_by = ?, uploaded_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (original_name, stored_name, size, user["id"], file_id),
        )
        get_db().commit()
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    try:
        old_path.unlink(missing_ok=True)
    except OSError:
        app.logger.exception("Could not remove replaced task file %s", existing["stored_name"])
    row = get_db().execute("SELECT * FROM task_files WHERE id = ?", (file_id,)).fetchone()
    return jsonify(file_json(row))


@app.delete("/api/files/<int:file_id>")
@roles_required("manager", "dataEntry")
def delete_task_file(file_id):
    row = file_for_user(file_id, g.user)
    get_db().execute("DELETE FROM task_files WHERE id = ?", (file_id,))
    get_db().commit()
    try:
        (UPLOAD_DIR / row["stored_name"]).unlink(missing_ok=True)
    except OSError:
        app.logger.exception("Could not remove uploaded task file %s", row["stored_name"])
    return jsonify({"success": True})


@app.get("/api/files/<int:file_id>/download")
@login_required
def download_task_file(file_id):
    row = file_for_user(file_id, g.user)
    path = UPLOAD_DIR / row["stored_name"]
    if not path.is_file():
        abort(404, description="The file is missing from the server.")
    return send_file(path, as_attachment=True, download_name=row["name"])


@app.post("/api/change-password")
@login_required
def change_password():
    body = json_body()
    password = body.get("password")
    if not isinstance(password, str) or len(password) < 8:
        abort(400, description="The password must contain at least 8 characters.")
    get_db().execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (generate_password_hash(password), g.user["id"]),
    )
    get_db().commit()
    return jsonify({"success": True})


@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(403)
@app.errorhandler(404)
@app.errorhandler(409)
@app.errorhandler(413)
def handle_http_error(error):
    return jsonify({"error": error.description}), error.code


@app.errorhandler(sqlite3.Error)
def handle_database_error(error):
    app.logger.exception("Database request failed", exc_info=error)
    return jsonify({"error": "A database error occurred. Please try again."}), 500


def create_manager(name, email, password):
    if not name.strip() or "@" not in email or len(password) < 8:
        raise ValueError("Provide a manager name, valid email, and password of at least 8 characters.")
    init_db()
    connection = sqlite3.connect(DATABASE)
    try:
        connection.execute(
            """
            INSERT INTO users (name, email, password_hash, role, active)
            VALUES (?, ?, ?, 'manager', 1)
            """,
            (name.strip(), email.strip().lower(), generate_password_hash(password)),
        )
        connection.commit()
    finally:
        connection.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Quality dashboard administration")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("init-db", help="Create the SQLite database and upload folder")
    manager_parser = subparsers.add_parser("create-manager", help="Create the first manager account")
    manager_parser.add_argument("--name", required=True)
    manager_parser.add_argument("--email", required=True)
    manager_parser.add_argument("--password")
    args = parser.parse_args()
    if args.command == "init-db":
        init_db()
        print(f"Database initialized at {DATABASE}")
    else:
        import getpass

        password = args.password or getpass.getpass("Manager password (8+ characters): ")
        create_manager(args.name, args.email, password)
        print(f"Manager account created for {args.email}")
