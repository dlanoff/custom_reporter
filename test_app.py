import unittest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class BasicLayoutAPITest(unittest.TestCase):
    def test_create_and_get_layout(self):
        layout_name = "test_layout_1"
        components_sent = [{"type": "text", "position": 0, "config": {"data": "hi"}}]

        # ── create ─────────────────────────────────────────────
        create = client.post(
            "/layouts/", json={"name": layout_name, "components": components_sent}
        )
        self.assertEqual(create.status_code, 200)

        # ── fetch ──────────────────────────────────────────────
        fetch = client.get(f"/layouts/{layout_name}")
        self.assertEqual(fetch.status_code, 200)

        data = fetch.json()
        self.assertEqual(data["name"], layout_name)  # name matches
        self.assertEqual(data["components"], components_sent)  # components match

    def test_sample_layout_endpoint(self):
        res = client.get("/sample-layout")
        self.assertEqual(res.status_code, 200)
        self.assertIn("components", res.json())


if __name__ == "__main__":
    unittest.main()
