from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_public_blog_posts_list():
    response = client.get("/api/v1/blog/posts")
    assert response.status_code == 200
    data = response.json()
    assert "posts" in data
    assert isinstance(data["posts"], list)


def test_public_blog_post_not_found():
    response = client.get("/api/v1/blog/posts/does-not-exist-slug")
    assert response.status_code == 404
