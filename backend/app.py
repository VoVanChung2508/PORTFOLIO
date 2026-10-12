import hmac
import logging
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import requests
from flask import Flask, current_app, jsonify, request
from werkzeug.middleware.proxy_fix import ProxyFix

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("portfolio")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def database_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(current_app.config["DATABASE_PATH"], timeout=5)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database(app: Flask) -> None:
    database_path = Path(app.config["DATABASE_PATH"])
    database_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(database_path, timeout=5) as connection:
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute(
            "CREATE TABLE IF NOT EXISTS banner ("
            "id INTEGER PRIMARY KEY CHECK (id = 1), message TEXT NOT NULL, updated_at TEXT NOT NULL)"
        )
        connection.execute(
            "CREATE TABLE IF NOT EXISTS rate_limits ("
            "bucket TEXT PRIMARY KEY, window_start INTEGER NOT NULL, count INTEGER NOT NULL)"
        )


def check_rate_limit(bucket: str, limit: int, period: int) -> tuple[bool, int]:
    now = int(datetime.now(timezone.utc).timestamp())
    window_start = now - now % period
    with database_connection() as connection:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute(
            "SELECT window_start, count FROM rate_limits WHERE bucket = ?", (bucket,)
        ).fetchone()
        if row is None or row["window_start"] != window_start:
            connection.execute(
                "INSERT INTO rate_limits(bucket, window_start, count) VALUES (?, ?, 1) "
                "ON CONFLICT(bucket) DO UPDATE SET window_start=excluded.window_start, count=1",
                (bucket, window_start),
            )
            allowed = True
        elif row["count"] >= limit:
            allowed = False
        else:
            connection.execute(
                "UPDATE rate_limits SET count = count + 1 WHERE bucket = ?", (bucket,)
            )
            allowed = True
        connection.execute("DELETE FROM rate_limits WHERE window_start < ?", (now - 86400,))
    return allowed, period - now % period


def error_response(message: str, status: int):
    return jsonify(error=message), status


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_mapping(
        DATABASE_PATH=os.getenv("DATABASE_PATH", "../data/portfolio.sqlite3"),
        ADMIN_TOKEN=os.getenv("ADMIN_TOKEN", ""),
        PUSHBULLET_TOKEN=os.getenv("PUSHBULLET_TOKEN", ""),
        PUSHBULLET_DEVICE_IDEN=os.getenv("PUSHBULLET_DEVICE_IDEN", ""),
        MESSAGE_MAX_LENGTH=int(os.getenv("MESSAGE_MAX_LENGTH", "1000")),
        ADMIN_MAX_LENGTH=int(os.getenv("ADMIN_MAX_LENGTH", "180")),
    )
    if test_config:
        app.config.update(test_config)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=0, x_port=0, x_prefix=0)
    initialize_database(app)

    @app.get("/health")
    def health():
        try:
            with database_connection() as connection:
                connection.execute("SELECT 1").fetchone()
        except sqlite3.Error:
            logger.exception("Health check database query failed")
            return jsonify(status="unhealthy", database="unavailable"), 503
        return jsonify(status="ok", database="ok")

    @app.get("/api/banner")
    def get_banner():
        with database_connection() as connection:
            row = connection.execute(
                "SELECT message, updated_at FROM banner WHERE id = 1"
            ).fetchone()
        return jsonify(
            message=row["message"] if row else "",
            updatedAt=row["updated_at"] if row else None,
        )

    @app.post("/api/admin/banner")
    def update_banner():
        client_ip = request.remote_addr or "unknown"
        allowed, retry_after = check_rate_limit(f"admin:{client_ip}", 5, 300)
        if not allowed:
            response = error_response("Quá nhiều lần thử. Vui lòng đợi rồi thử lại.", 429)
            response[0].headers["Retry-After"] = str(retry_after)
            return response

        authorization = request.headers.get("Authorization", "")
        supplied_token = authorization[7:] if authorization.startswith("Bearer ") else ""
        if not supplied_token:
            return error_response("Thông tin xác thực không hợp lệ.", 401)
        expected_token = current_app.config["ADMIN_TOKEN"]
        if len(expected_token) < 32:
            return error_response("Quản trị viên chưa được cấu hình ADMIN_TOKEN đủ mạnh.", 503)
        if not hmac.compare_digest(supplied_token, expected_token):
            return error_response("Thông tin xác thực không hợp lệ.", 401)

        payload = request.get_json(silent=True)
        if not isinstance(payload, dict) or not isinstance(payload.get("message"), str):
            return error_response("Nội dung banner không hợp lệ.", 400)
        message = payload["message"].strip()
        if not message:
            return error_response("Lời nhắn không được để trống.", 400)
        if len(message) > current_app.config["ADMIN_MAX_LENGTH"]:
            return error_response("Lời nhắn vượt quá giới hạn ký tự.", 400)

        updated_at = utc_now()
        with database_connection() as connection:
            connection.execute(
                "INSERT INTO banner(id, message, updated_at) VALUES (1, ?, ?) "
                "ON CONFLICT(id) DO UPDATE SET message=excluded.message, updated_at=excluded.updated_at",
                (message, updated_at),
            )
        logger.info("Banner updated by an authenticated administrator")
        return jsonify(message=message, updatedAt=updated_at)

    @app.post("/api/messages")
    def send_message():
        client_ip = request.remote_addr or "unknown"
        allowed, retry_after = check_rate_limit(f"message:{client_ip}", 3, 300)
        if not allowed:
            response = error_response("Bạn đã gửi quá nhiều lời nhắn. Hãy thử lại sau.", 429)
            response[0].headers["Retry-After"] = str(retry_after)
            return response

        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return error_response("Dữ liệu gửi lên không hợp lệ.", 400)
        message = payload.get("message")
        name = payload.get("name", "")
        if not isinstance(message, str) or not isinstance(name, str):
            return error_response("Tên hoặc nội dung không đúng định dạng.", 400)
        message = message.strip()
        name = name.strip()
        if not message:
            return error_response("Lời nhắn không được để trống.", 400)
        if len(message) > current_app.config["MESSAGE_MAX_LENGTH"]:
            return error_response("Lời nhắn vượt quá giới hạn ký tự.", 400)
        if len(name) > 80:
            return error_response("Tên người gửi vượt quá 80 ký tự.", 400)

        pushbullet_token = current_app.config["PUSHBULLET_TOKEN"]
        if not pushbullet_token:
            return error_response("Chủ website chưa cấu hình Pushbullet. Lời nhắn chưa được gửi.", 503)

        push_data = {
            "type": "note",
            "title": f"Lời nhắn portfolio từ {name or 'Khách truy cập'}",
            "body": message,
        }
        device_iden = current_app.config["PUSHBULLET_DEVICE_IDEN"]
        if device_iden:
            push_data["device_iden"] = device_iden
        try:
            result = requests.post(
                "https://api.pushbullet.com/v2/pushes",
                json=push_data,
                headers={"Access-Token": pushbullet_token},
                timeout=(3, 8),
            )
            if not result.ok:
                logger.warning("Pushbullet returned HTTP %s", result.status_code)
                return error_response("Pushbullet chưa chấp nhận lời nhắn. Vui lòng thử lại sau.", 502)
        except requests.RequestException:
            logger.warning("Pushbullet request failed")
            return error_response("Không thể gửi thông báo đến Pushbullet. Vui lòng thử lại sau.", 502)

        logger.info("Guest message delivered to Pushbullet")
        return jsonify(message="Lời nhắn đã được gửi thành công. Cảm ơn bạn!"), 201

    @app.errorhandler(400)
    def bad_request(_error):
        return error_response("Yêu cầu không hợp lệ.", 400)

    @app.errorhandler(404)
    def not_found(_error):
        return error_response("Không tìm thấy endpoint.", 404)

    @app.errorhandler(405)
    def method_not_allowed(_error):
        return error_response("Phương thức HTTP không được hỗ trợ.", 405)

    @app.errorhandler(413)
    def payload_too_large(_error):
        return error_response("Dữ liệu gửi lên quá lớn.", 413)

    @app.errorhandler(500)
    def internal_error(_error):
        logger.exception("Unhandled application error")
        return error_response("Máy chủ gặp sự cố. Vui lòng thử lại sau.", 500)

    return app


app = create_app()
