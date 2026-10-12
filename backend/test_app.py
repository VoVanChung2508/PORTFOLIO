import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from app import create_app


class PortfolioApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.app = create_app(
            {
                "TESTING": True,
                "DATABASE_PATH": str(Path(self.temp_dir.name) / "portfolio.sqlite3"),
                "ADMIN_TOKEN": "a" * 40,
                "PUSHBULLET_TOKEN": "test-token",
                "MESSAGE_MAX_LENGTH": 30,
                "ADMIN_MAX_LENGTH": 20,
            }
        )
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_health_and_initial_banner(self):
        self.assertEqual(self.client.get("/health").json["status"], "ok")
        self.assertEqual(self.client.get("/api/banner").json, {"message": "", "updatedAt": None})

    def test_admin_requires_valid_bearer_token_and_persists_banner(self):
        payload = {"message": "Xin chao ban"}
        self.assertEqual(self.client.post("/api/admin/banner", json=payload).status_code, 401)
        response = self.client.post(
            "/api/admin/banner", json=payload, headers={"Authorization": f"Bearer {'a' * 40}"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/banner").json["message"], payload["message"])

        restarted_app = create_app(
            {"TESTING": True, "DATABASE_PATH": self.app.config["DATABASE_PATH"]}
        )
        self.assertEqual(restarted_app.test_client().get("/api/banner").json["message"], payload["message"])

    def test_admin_rejects_invalid_content(self):
        response = self.client.post(
            "/api/admin/banner",
            json={"message": "x" * 21},
            headers={"Authorization": f"Bearer {'a' * 40}"},
        )
        self.assertEqual(response.status_code, 400)

    def test_admin_without_a_configured_token_still_rejects_anonymous_requests(self):
        self.app.config["ADMIN_TOKEN"] = ""
        response = self.client.post("/api/admin/banner", json={"message": "Xin chao"})
        self.assertEqual(response.status_code, 401)

    @patch("app.requests.post")
    def test_guest_message_is_sent_to_pushbullet(self, push):
        push.return_value = Mock(ok=True, status_code=200)
        response = self.client.post("/api/messages", json={"name": "An", "message": "Xin chao"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(push.call_args.kwargs["timeout"], (3, 8))
        self.assertEqual(push.call_args.kwargs["json"]["body"], "Xin chao")

    def test_guest_message_rejects_long_content(self):
        response = self.client.post("/api/messages", json={"message": "x" * 31})
        self.assertEqual(response.status_code, 400)

    def test_guest_message_does_not_claim_delivery_without_pushbullet(self):
        self.app.config["PUSHBULLET_TOKEN"] = ""
        response = self.client.post("/api/messages", json={"message": "Xin chao"})
        self.assertEqual(response.status_code, 503)

    def test_admin_rate_limit_applies_to_failed_attempts(self):
        for _ in range(5):
            response = self.client.post("/api/admin/banner", json={"message": "Xin chao"})
            self.assertEqual(response.status_code, 401)
        response = self.client.post("/api/admin/banner", json={"message": "Xin chao"})
        self.assertEqual(response.status_code, 429)


if __name__ == "__main__":
    unittest.main()
