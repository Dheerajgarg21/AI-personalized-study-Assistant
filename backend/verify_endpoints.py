from fastapi.testclient import TestClient
from app.main import app

def test_full_pipeline():
    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/api/health")
        assert res.status_code == 200
        print("1. Health Check:", res.json())

        # 2. Profile endpoint
        res = client.get("/api/profile")
        assert res.status_code == 200
        profile = res.json()
        print("2. Student Profile Loaded:", profile["name"], "| Course:", profile["course_name"])
        assert "learning_states" in profile
        print("   Structured Learning States Count:", len(profile["learning_states"]))

        # 3. Courses & Topics
        res = client.get("/api/courses")
        assert res.status_code == 200
        courses = res.json()
        print("3. Courses Loaded:", len(courses), "| Topics:", len(courses[0]["topics"]))

        # 4. Knowledge Map
        res = client.get("/api/knowledge-map")
        assert res.status_code == 200
        kmap = res.json()
        print("4. Knowledge Map Loaded:", len(kmap["nodes"]), "nodes,", len(kmap["edges"]), "prerequisite edges")

        # 5. RAG Chat QA
        res = client.post("/api/chat", json={
            "message": "Explain Cyclic Redundancy Check CRC in simple English",
            "prompt_mode": "simple"
        })
        assert res.status_code == 200
        chat_res = res.json()
        print("5. RAG Chat Response Received!")
        print("   Grounded:", chat_res["grounded"])
        print("   Sources Cited:", len(chat_res["sources"]))
        if chat_res["sources"]:
            print("   First Source:", chat_res["sources"][0]["document_name"], "Page:", chat_res["sources"][0]["page_number"])

        # 6. Adaptive Quiz Generation
        res = client.post("/api/quiz/generate", json={
            "topic_id": courses[0]["topics"][0]["id"],
            "difficulty": "medium",
            "num_questions": 3
        })
        assert res.status_code == 200
        quiz = res.json()
        print("6. Quiz Generated:", quiz["title"], "| Questions:", len(quiz["questions"]))

        # 7. Submit Quiz Attempt
        q_id = quiz["questions"][0]["id"]
        res = client.post("/api/quiz/submit", json={
            "quiz_id": quiz["id"],
            "answers": {str(q_id): "B"}
        })
        assert res.status_code == 200
        quiz_eval = res.json()
        print("7. Quiz Evaluated:", quiz_eval["score"], "/", quiz_eval["total_questions"], "| Accuracy:", quiz_eval["accuracy"])
        print("   Recommended Action:", quiz_eval["recommended_action"])

        # 8. Adaptive Study Plan
        res = client.get("/api/study-plan")
        assert res.status_code == 200
        plan = res.json()
        if plan:
            print("8. Active Study Plan Loaded: Tasks Count:", len(plan["tasks"]), "| Exam Date:", plan["exam_date"])

        # 9. Recommendations
        res = client.get("/api/recommendations")
        assert res.status_code == 200
        recs = res.json()
        print("9. Agent Recommendations Generated:", len(recs["recommendations"]))

        # 10. Progress Analytics
        res = client.get("/api/progress")
        assert res.status_code == 200
        prog = res.json()
        print("10. Progress Analytics Loaded! Overall Mastery:", prog["stats"]["overall_progress_percentage"], "%")

    print("\nALL 10 CORE ENDPOINTS VERIFIED AND PASSING 100%!")

if __name__ == "__main__":
    test_full_pipeline()
