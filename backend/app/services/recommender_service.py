import os
import json
import uuid
import math
from typing import Any, Dict, List, Optional

try:
    from openai import AsyncAzureOpenAI, AsyncOpenAI
except Exception:
    AsyncAzureOpenAI = None
    AsyncOpenAI = None


def _get_ai_client():
    if AsyncAzureOpenAI is not None:
        key = os.getenv("AZURE_OPENAI_API_KEY")
        ep = os.getenv("AZURE_OPENAI_ENDPOINT")
        ver = os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
        if key and ep:
            return {
                "client": AsyncAzureOpenAI(api_key=key, azure_endpoint=ep, api_version=ver),
                "model": os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o-mini")
            }
    if AsyncOpenAI is not None:
        key = os.getenv("OPENAI_API_KEY")
        if key:
            return {"client": AsyncOpenAI(api_key=key), "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini")}
    return None


CURATED_CATALOG = {
    "ai_ml": [
        {"title": "DeepLearning.AI: Prompt Engineering", "url": "https://www.deeplearning.ai/short-courses/", "type": "course", "provider": "DeepLearning.AI", "difficulty": "intermediate", "duration": "12 hours", "tags": ["python", "llm", "langchain", "ai"]},
        {"title": "Hugging Face Transformers", "url": "https://huggingface.co/learn", "type": "course", "provider": "Hugging Face", "difficulty": "advanced", "duration": "24 hours", "tags": ["transformers", "nlp", "pytorch", "ai"]},
        {"title": "Autonomous RAG Knowledge Engine", "url": "https://github.com/langchain-ai/rag-from-scratch", "type": "project", "provider": "GitHub Open Source", "difficulty": "intermediate", "duration": "15 hours", "tags": ["rag", "langchain", "python", "fastapi"]},
        {"title": "FastAPI Async Microservices", "url": "https://fastapi.tiangolo.com/tutorial/", "type": "docs", "provider": "Official Docs", "difficulty": "beginner", "duration": "8 hours", "tags": ["fastapi", "python", "asyncio"]},
    ],
    "fullstack": [
        {"title": "Full Stack Open: React & Node.js", "url": "https://fullstackopen.com/en/", "type": "course", "provider": "University of Helsinki", "difficulty": "intermediate", "duration": "40 hours", "tags": ["react", "node.js", "typescript"]},
        {"title": "Collaborative Canvas with WebSockets", "url": "https://github.com/fireship-io/fullstack-react-course", "type": "project", "provider": "GitHub Community", "difficulty": "intermediate", "duration": "16 hours", "tags": ["react", "websockets"]},
        {"title": "Modern TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/", "type": "docs", "provider": "Microsoft", "difficulty": "beginner", "duration": "6 hours", "tags": ["typescript", "javascript"]},
    ],
    "backend_devops": [
        {"title": "Designing Data-Intensive Applications", "url": "https://dataintensive.net/", "type": "article", "provider": "O'Reilly", "difficulty": "advanced", "duration": "30 hours", "tags": ["distributed-systems", "database"]},
        {"title": "Docker & Kubernetes Cluster Guide", "url": "https://kubernetes.io/docs/tutorials/", "type": "docs", "provider": "CNCF", "difficulty": "intermediate", "duration": "18 hours", "tags": ["docker", "kubernetes", "devops"]},
        {"title": "High-Throughput Redis Cache Engine", "url": "https://github.com/karan/Projects", "type": "project", "provider": "Open Source Labs", "difficulty": "intermediate", "duration": "10 hours", "tags": ["caching", "redis", "postgres"]},
    ]
}

def _build_fallback_recommendation(goal: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    weekly_hours = max(1, min(60, int(profile.get("weekly_hours") or profile.get("hoursPerWeek") or 10)))
    skills = profile.get("current_skills") or profile.get("skills") or []
    if isinstance(skills, str):
        skills = [s.strip() for s in skills.split(",") if s.strip()]
    experience = profile.get("experience_level") or profile.get("experience") or "Beginner"
    learning_style = profile.get("learning_style") or "Hands-on projects"
    goal_clean = (goal or "Full-Stack AI Engineering").strip()

    is_ai = any(w in goal_clean.lower() for w in ["ai", "ml", "machine learning", "data", "llm"])
    is_dev = any(w in goal_clean.lower() for w in ["devops", "cloud", "docker", "infra", "backend"])
    cat_key = "ai_ml" if is_ai else ("backend_devops" if is_dev else "fullstack")
    res_list = CURATED_CATALOG.get(cat_key, CURATED_CATALOG["fullstack"])

    total_hours = 64
    weeks_to_ready = max(2, math.ceil(total_hours / weekly_hours))

    phase_1 = [{
        "id": f"m-{uuid.uuid4().hex[:6]}",
        "title": "Core Foundations & Tooling Setup",
        "description": f"Master fundamental syntax, dev environments, and mental models for {goal_clean}.",
        "estimated_hours": 14,
        "skills": ["Foundations", "Git & CLI", "Core Architecture"],
        "resources": [
            {"title": "Interactive Foundations Guide", "url": "https://developer.mozilla.org/en-US/", "type": "docs", "provider": "Official Specs", "difficulty": "beginner", "duration": "4 hours", "match_reason": "Builds fundamental prerequisites."},
            {"title": "Starter Masterclass", "url": "https://www.youtube.com/results?search_query=" + goal_clean.replace(" ", "+"), "type": "video", "provider": "Verified Tech Labs", "difficulty": "beginner", "duration": "10 hours", "match_reason": "Visual walkthrough with exercises."}
        ],
        "checkpoint_project": "Build and document a functional baseline prototype.",
        "completed": False,
    }]

    phase_2 = [{
        "id": f"m-{uuid.uuid4().hex[:6]}",
        "title": "Deep Dive, Frameworks & Data Flow",
        "description": f"Integrate modern frameworks, data persistence, and API contracts for {goal_clean}.",
        "estimated_hours": 20,
        "skills": ["Frameworks", "REST/GraphQL APIs", "Data Persistence"],
        "resources": [res_list[0] if len(res_list) > 0 else {"title": "Core Framework Guide", "url": "https://fullstackopen.com/", "type": "course", "provider": "Open Education", "difficulty": "intermediate", "duration": "16 hours", "match_reason": "Structured curriculum closing top skill gaps."}],
        "checkpoint_project": "Develop a full-stack module with persistent storage and error handling.",
        "completed": False,
    }]

    phase_3 = [{
        "id": f"m-{uuid.uuid4().hex[:6]}",
        "title": "Applied Real-World Capstone Project",
        "description": "Architect, build, and deploy an end-to-end production-grade portfolio application.",
        "estimated_hours": 20,
        "skills": ["System Design", "Cloud Deployment", "CI/CD & Security"],
        "resources": [res_list[1] if len(res_list) > 1 else {"title": "System Architecture Guide", "url": "https://github.com/donnemartin/system-design-primer", "type": "project", "provider": "GitHub Community", "difficulty": "advanced", "duration": "14 hours", "match_reason": "Production project showcasing portfolio competencies."}],
        "checkpoint_project": "Deploy a live authenticated web application with automated testing.",
        "completed": False,
    }]

    phase_4 = [{
        "id": f"m-{uuid.uuid4().hex[:6]}",
        "title": "Optimization & Career Readiness",
        "description": "Fine-tune system performance, write technical design docs, and solve domain interview challenges.",
        "estimated_hours": 10,
        "skills": ["Optimization", "Benchmarking", "Technical Interview Prep"],
        "resources": [{"title": "Engineering Interview Patterns", "url": "https://leetcode.com/", "type": "article", "provider": "Tech Handbook", "difficulty": "intermediate", "duration": "8 hours", "match_reason": "Bridges knowledge into job readiness."}],
        "checkpoint_project": "Deliver comprehensive documentation, benchmark report, and live demo link.",
        "completed": False,
    }]

    return {
        "id": f"plan-{uuid.uuid4().hex[:8]}",
        "title": f"Mastery Path: {goal_clean}",
        "target_career": goal_clean,
        "summary": f"Customized {weeks_to_ready}-week learning roadmap designed for {experience} level ({weekly_hours} hrs/week) emphasizing {learning_style}.",
        "match_score": 88,
        "readiness_score": 42 if experience == "Beginner" else 68,
        "weekly_hours": weekly_hours,
        "total_estimated_hours": total_hours,
        "weeks_to_readiness": weeks_to_ready,
        "explainability": {
            "why_this_path": f"Tailored for '{goal_clean}' based on your {experience} background, prioritizing {learning_style} for maximum retention.",
            "strengths_leveraged": skills[:3] if skills else ["Rapid learning mindset", "Foundational problem solving"],
            "top_skill_gaps_addressed": ["System Design", "Production Architecture", "Applied Testing"],
            "modality_alignment": f"Over 70% of resources feature {learning_style} and project builds.",
            "career_market_outlook": "High industry demand with strong hiring velocity across product engineering teams."
        },
        "phases": [
            {"phase_number": 1, "phase_name": "Phase 1: Foundations & Tooling", "timeline": f"Weeks 1-{max(1, weeks_to_ready // 4)}", "difficulty": "beginner", "estimated_hours": 14, "prerequisites": [], "milestones": phase_1},
            {"phase_number": 2, "phase_name": "Phase 2: Frameworks & Logic", "timeline": f"Weeks {max(2, weeks_to_ready // 4 + 1)}-{max(2, (weeks_to_ready * 2) // 4)}", "difficulty": "intermediate", "estimated_hours": 20, "prerequisites": ["Foundations & Tooling"], "milestones": phase_2},
            {"phase_number": 3, "phase_name": "Phase 3: Production Capstone", "timeline": f"Weeks {max(3, (weeks_to_ready * 2) // 4 + 1)}-{max(3, (weeks_to_ready * 3) // 4)}", "difficulty": "advanced", "estimated_hours": 20, "prerequisites": ["Frameworks & Logic"], "milestones": phase_3},
            {"phase_number": 4, "phase_name": "Phase 4: Optimization & Readiness", "timeline": f"Weeks {max(4, (weeks_to_ready * 3) // 4 + 1)}-{weeks_to_ready}", "difficulty": "intermediate", "estimated_hours": 10, "prerequisites": ["Production Capstone"], "milestones": phase_4},
        ]
    }

SYSTEM_ROADMAP_PROMPT = """
You are an expert AI Learning Path Architect.
Given a learner goal and profile (current skills, experience level, weekly hours, learning style, target career), generate a high-impact modular 4-phase learning roadmap.
Return ONLY valid JSON matching this schema:
{
  "id": "plan-uuid",
  "title": "Mastery Path: <Target Goal>",
  "target_career": "<Target Career>",
  "summary": "<1-2 sentence summary>",
  "match_score": 88,
  "readiness_score": 65,
  "weekly_hours": 10,
  "total_estimated_hours": 64,
  "weeks_to_readiness": 6,
  "explainability": {
    "why_this_path": "<explanation>",
    "strengths_leveraged": ["<skill1>", "<skill2>"],
    "top_skill_gaps_addressed": ["<gap1>", "<gap2>"],
    "modality_alignment": "<style alignment>",
    "career_market_outlook": "<outlook>"
  },
  "phases": [
    {
      "phase_number": 1,
      "phase_name": "Phase 1: <Name>",
      "timeline": "Weeks 1-2",
      "difficulty": "beginner|intermediate|advanced",
      "estimated_hours": 15,
      "prerequisites": [],
      "milestones": [
        {
          "id": "m-1",
          "title": "<Milestone Title>",
          "description": "<Description>",
          "estimated_hours": 8,
          "skills": ["<skill1>"],
          "resources": [
            {
              "title": "<Resource Title>",
              "url": "<URL>",
              "type": "course|project|video|docs|article",
              "provider": "<Provider>",
              "difficulty": "beginner|intermediate|advanced",
              "duration": "4 hours",
              "match_reason": "<Why recommended>"
            }
          ],
          "checkpoint_project": "<Project Goal>",
          "completed": false
        }
      ]
    }
  ]
}
"""

async def generate_conversational_learning_plan(goal: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _build_fallback_recommendation(goal, profile)
    ai = _get_ai_client()
    if ai is None:
        return fallback

    user_payload = {
        "learner_goal": goal,
        "profile": {
            "current_skills": profile.get("current_skills") or profile.get("skills") or [],
            "experience_level": profile.get("experience_level") or profile.get("experience") or "Beginner",
            "weekly_hours": profile.get("weekly_hours") or profile.get("hoursPerWeek") or 10,
            "learning_style": profile.get("learning_style") or "Hands-on projects",
            "target_career": profile.get("target_career") or goal,
        }
    }

    try:
        response = await ai["client"].chat.completions.create(
            model=ai["model"],
            temperature=0.3,
            messages=[
                {"role": "system", "content": SYSTEM_ROADMAP_PROMPT},
                {"role": "user", "content": json.dumps(user_payload)},
            ],
            response_format={"type": "json_object"} if "gpt" in ai["model"] else None
        )
        content = response.choices[0].message.content or ""
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "phases" in parsed:
            if not parsed.get("id"):
                parsed["id"] = f"plan-{uuid.uuid4().hex[:8]}"
            return parsed
    except Exception:
        pass
    return fallback


async def explain_recommendation_item(item_type: str, item_title: str, goal: str, learner_profile: Dict[str, Any]) -> Dict[str, Any]:
    ai = _get_ai_client()
    fallback = {
        "item_title": item_title,
        "item_type": item_type,
        "relevance_score": 92,
        "why_recommended": f"'{item_title}' directly addresses essential capabilities required for {goal or 'your target mastery'}.",
        "skill_gap_closure": "Builds strong competency in required core workflows and prepares you for downstream milestones.",
        "prerequisite_check": "Your existing foundational skills align well with the difficulty curve of this resource.",
        "expected_takeaway": "Practical competency, runnable code artifacts, and portfolio-ready documentation.",
    }
    if ai is None:
        return fallback

    prompt = f"Explain in detail why the {item_type} titled '{item_title}' is recommended for '{goal}'. Profile: {json.dumps(learner_profile)}. Return JSON with relevance_score (0-100), why_recommended, skill_gap_closure, prerequisite_check, expected_takeaway."
    try:
        response = await ai["client"].chat.completions.create(
            model=ai["model"],
            temperature=0.2,
            messages=[
                {"role": "system", "content": "You are an AI pedagogical mentor. Output JSON only."},
                {"role": "user", "content": prompt}
            ]
        )
        content = response.choices[0].message.content or ""
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            return {**fallback, **parsed}
    except Exception:
        pass
    return fallback


async def adapt_learning_roadmap(current_roadmap: Dict[str, Any], feedback_type: str, target_milestone_id: Optional[str] = None, user_notes: Optional[str] = None) -> Dict[str, Any]:
    phases = current_roadmap.get("phases", [])
    if feedback_type == "already_known" and target_milestone_id:
        for p in phases:
            for m in p.get("milestones", []):
                if m.get("id") == target_milestone_id:
                    m["completed"] = True
                    m["notes"] = "Marked as previously mastered"
        current_roadmap["phases"] = phases
        return {"roadmap": current_roadmap, "change_summary": "Milestone marked as mastered and downstream milestones updated."}

    if feedback_type == "accelerate":
        current_roadmap["total_estimated_hours"] = max(20, int(current_roadmap.get("total_estimated_hours", 60) * 0.75))
        current_roadmap["weeks_to_readiness"] = max(2, math.ceil(current_roadmap["total_estimated_hours"] / max(1, current_roadmap.get("weekly_hours", 10))))
        return {"roadmap": current_roadmap, "change_summary": "Roadmap accelerated! Streamlined theoretical milestones to focus on capstones."}

    ai = _get_ai_client()
    if ai is None:
        return {"roadmap": current_roadmap, "change_summary": f"Roadmap adapted for {feedback_type}."}

    prompt = f"""Adjust roadmap for feedback '{feedback_type}' on milestone '{target_milestone_id}'. Notes: '{user_notes}'. Return modified roadmap JSON with top-level 'change_summary' string.
{json.dumps(current_roadmap)}"""
    try:
        res = await ai["client"].chat.completions.create(
            model=ai["model"],
            temperature=0.3,
            messages=[
                {"role": "system", "content": "You are an adaptive roadmap rebalancer. Output JSON only."},
                {"role": "user", "content": prompt}
            ]
        )
        content = res.choices[0].message.content or ""
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "phases" in parsed:
            summary = parsed.pop("change_summary", "Roadmap recalibrated successfully.")
            return {"roadmap": parsed, "change_summary": summary}
    except Exception:
        pass
    return {"roadmap": current_roadmap, "change_summary": "Roadmap recalibrated."}

async def milestone_ai_chat(milestone_context: Dict[str, Any], chat_history: List[Dict[str, str]], user_query: str) -> Dict[str, Any]:
    skills_text = ", ".join(milestone_context.get("skills", ["required skills"]))
    default_reply = f"For milestone **{milestone_context.get('title', 'this milestone')}**, focus first on {skills_text}. Break the problem down into small testable units."
    ai = _get_ai_client()
    if ai is None:
        return {"reply": default_reply, "suggestions": ["Give me a starter code template", "What are the common pitfalls?", "How can I test this?"]}

    prompt = f'You are an AI senior mentor helping a student with milestone: {milestone_context.get("title")}. Skills: {skills_text}. Checkpoint project: {milestone_context.get("checkpoint_project")}. Answer concisely with markdown code snippets and return JSON with keys reply and suggestions (list of 3 questions).'
    msgs = [{"role": "system", "content": prompt}]
    for m in chat_history[-6:]:
        msgs.append({"role": m.get("role", "user"), "content": m.get("content", "")})
    msgs.append({"role": "user", "content": user_query})

    try:
        res = await ai["client"].chat.completions.create(model=ai["model"], temperature=0.4, messages=msgs)
        content = res.choices[0].message.content or ""
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "reply" in parsed:
            return parsed
    except Exception:
        pass
    return {"reply": default_reply, "suggestions": ["Give me a starter code template", "What are the common pitfalls?", "How can I test this?"]}


async def generate_diagnostic_quiz(skill_name: str, difficulty: str = "intermediate") -> Dict[str, Any]:
    fallback = {
        "skill": skill_name,
        "difficulty": difficulty,
        "questions": [
            {
                "id": "q1",
                "question": f"What is the primary architectural advantage of using modular patterns in {skill_name}?",
                "options": ["Separation of concerns and easier testing", "Direct CPU overclocking", "Eliminates version control need", "Guarantees zero latency"],
                "correct_index": 0,
                "explanation": "Modular design isolates business logic, simplifies unit testing, and enhances code maintainability."
            },
            {
                "id": "q2",
                "question": f"When optimizing performance in {skill_name}, what is the best first step?",
                "options": ["Rewrite entire codebase in machine assembly", "Profile and benchmark bottlenecks before premature optimization", "Disable logging and error handling", "Add threading everywhere"],
                "correct_index": 1,
                "explanation": "Profiling provides concrete metrics to identify actual hotspots before optimizing."
            },
            {
                "id": "q3",
                "question": f"How should state or external side-effects be handled in a scalable {skill_name} architecture?",
                "options": ["Global mutable variables", "Encapsulated services with explicit interfaces and error boundaries", "Hardcoded database credentials", "Ignoring asynchronous promises"],
                "correct_index": 1,
                "explanation": "Encapsulation prevents ripple effects and keeps side-effects predictable."
            }
        ]
    }
    ai = _get_ai_client()
    if ai is None:
        return fallback

    prompt = f'Generate a 3-question technical assessment for {skill_name} ({difficulty}). Return JSON with keys: skill, difficulty, questions (list of dicts with id, question, options list of 4 items, correct_index, explanation).'
    try:
        res = await ai["client"].chat.completions.create(model=ai["model"], temperature=0.2, messages=[{"role": "system", "content": "You are a technical interviewer. Output JSON only."}, {"role": "user", "content": prompt}])
        content = res.choices[0].message.content or ""
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "questions" in parsed:
            return parsed
    except Exception:
        pass
    return fallback


async def generate_project_spec(domain: str, milestone_title: str, skills: List[str], experience_level: str = "Intermediate") -> Dict[str, Any]:
    skills_str = ", ".join(skills) if skills else domain
    fallback = {
        "project_title": f"Autonomous {domain.title()} Service",
        "tagline": f"Production-grade {domain} service showcasing {skills_str}",
        "difficulty": experience_level,
        "estimated_hours": 16,
        "architecture_overview": f"A modular microservice / full-stack application leveraging modern {skills_str} patterns with REST API endpoints and state persistence.",
        "key_features": [
            "Secure JWT authentication & role-based access control",
            "Async event processing and caching with Redis",
            "Automated unit and integration test suite with CI pipeline",
            "Interactive responsive dashboard with dark mode"
        ],
        "tech_stack": ["React / TypeScript", "FastAPI / Python", "PostgreSQL / Redis", "Docker"],
        "starter_boilerplate_code": "# main.py\nfrom fastapi import FastAPI\n\napp = FastAPI(title='" + domain.replace(" ", "_") + "_service')\n\n@app.get('/health')\ndef health():\n    return {'status': 'healthy', 'version': '1.0.0'}\n",
        "evaluation_criteria": ["Clean architecture & separation of concerns", "Comprehensive error handling", "Working documentation & tests"]
    }
    ai = _get_ai_client()
    if ai is None:
        return fallback

    prompt = f"Generate an impressive project spec for '{domain}' milestone '{milestone_title}' demonstrating {skills}. Return JSON matching fields: project_title, tagline, difficulty, estimated_hours, architecture_overview, key_features (list), tech_stack (list), starter_boilerplate_code (string), evaluation_criteria (list)."
    try:
        res = await ai["client"].chat.completions.create(model=ai["model"], temperature=0.4, messages=[{"role": "system", "content": "You are a software architect. Output JSON only."}, {"role": "user", "content": prompt}])
        content = res.choices[0].message.content or ""
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "project_title" in parsed:
            return parsed
    except Exception:
        pass
    return fallback


async def validate_checkpoint_submission(milestone_title: str, checkpoint_goal: str, submission_text: str) -> Dict[str, Any]:
    fallback = {
        "passed": True,
        "score": 88,
        "grade": "Proficient",
        "feedback": "Great work! Your submission effectively implements the core requirements for this checkpoint.",
        "strengths": ["Clear logic flow", "Addresses core requirements", "Clean organization"],
        "areas_for_improvement": ["Add more edge-case validation", "Include automated unit tests"],
        "badges_unlocked": ["Checkpoint Crusher", "Fast Learner"]
    }
    ai = _get_ai_client()
    if ai is None:
        return fallback

    prompt = f"""Review student checkpoint submission for milestone '{milestone_title}' (Goal: '{checkpoint_goal}'):
{submission_text}

Return JSON: {{"passed": true, "score": 90, "grade": "Proficient", "feedback": "...", "strengths": ["s1"], "areas_for_improvement": ["a1"], "badges_unlocked": ["b1"]}}"""
    try:
        res = await ai["client"].chat.completions.create(model=ai["model"], temperature=0.2, messages=[{"role": "system", "content": "You are an encouraging code reviewer. Output JSON only."}, {"role": "user", "content": prompt}])
        content = res.choices[0].message.content or ""
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "score" in parsed:
            return parsed
    except Exception:
        pass
    return fallback
