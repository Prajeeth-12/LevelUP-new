import os
import json
import re
from typing import Any, Dict, List, Optional

try:
  from openai import AsyncAzureOpenAI, AsyncOpenAI
except Exception:  # pragma: no cover - optional dependency path
  AsyncAzureOpenAI = None
  AsyncOpenAI = None


def _client():
  # 1. MiniMax / OpenAI-compatible configuration
  openai_api_key = os.getenv('OPENAI_API_KEY') or os.getenv('MINIMAX_API_KEY')
  base_url = os.getenv('OPENAI_BASE_URL') or os.getenv('MINIMAX_BASE_URL') or 'https://api.gmi-serving.com/v1'
  model = os.getenv('OPENAI_MODEL') or os.getenv('MINIMAX_MODEL') or 'MiniMaxAI/MiniMax-M3'

  if openai_api_key and AsyncOpenAI is not None:
    return {
      'client': AsyncOpenAI(api_key=openai_api_key, base_url=base_url),
      'model': model,
    }

  # 2. Azure OpenAI fallback
  if AsyncAzureOpenAI is not None:
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_version = os.getenv("AZURE_OPENAI_API_VERSION")

    if api_key and endpoint and api_version:
      return {
        'client': AsyncAzureOpenAI(
          api_key=api_key,
          azure_endpoint=endpoint,
          api_version=api_version,
        ),
        'model': os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o-mini"),
      }

  return None


def _parse_llm_json(content: str) -> Optional[Dict[str, Any]]:
  if not content:
    return None
  try:
    return json.loads(content)
  except Exception:
    pass
  match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content, re.DOTALL)
  if match:
    try:
      return json.loads(match.group(1))
    except Exception:
      pass
  start = content.find('{')
  end = content.rfind('}')
  if start != -1 and end != -1 and end > start:
    try:
      return json.loads(content[start:end+1])
    except Exception:
      pass
  return None


def _fallback_roadmap(profile: Dict[str, Any]) -> Dict[str, Any]:
  skills: List[str] = []
  raw_skills = profile.get("skills", "")
  if isinstance(raw_skills, str):
    skills = [item.strip() for item in raw_skills.split(",") if item.strip()]

  focus = skills[:3] or ["Problem solving", "Core foundations", "Project practice"]
  career = profile.get("goals") or profile.get("goal") or "Personal Learning Path"

  return {
    "career_decision": {
      "career": career,
      "reasoning": "Fallback roadmap generated locally because Azure OpenAI credentials are not configured.",
      "confidence": 58,
      "skill_match_percentage": 50,
      "market_readiness": 45,
      "industry_demand": "stable",
      "key_strengths": focus[:2],
      "skill_gaps": ["Consistency", "Applied projects", "Interview practice"],
      "time_to_job_ready": "3-6 months",
      "alternatives": [],
    },
    "learning_roadmap": {
      "duration_months": 4,
      "roadmap": [
        {
          "phase": "Phase 1: Foundations",
          "duration": "2-4 weeks",
          "difficulty": "beginner",
          "focus_skills": focus,
          "outcomes": [f"Build a foundation in {focus[0] if focus else 'core skills'}"],
          "milestones": [],
          "prerequisites": [],
        },
        {
          "phase": "Phase 2: Practice",
          "duration": "3-4 weeks",
          "difficulty": "intermediate",
          "focus_skills": ["Hands-on practice", "Small projects"],
          "outcomes": ["Complete one small guided project"],
          "milestones": [],
          "prerequisites": focus,
        },
        {
          "phase": "Phase 3: Portfolio",
          "duration": "4-6 weeks",
          "difficulty": "intermediate",
          "focus_skills": ["Portfolio building", "Documentation"],
          "outcomes": ["Publish one portfolio project"],
          "milestones": [],
          "prerequisites": ["Foundations", "Practice"],
        },
      ],
    },
  }

SYSTEM_PROMPT = """
You are an AI Learning Roadmap Planner.

Your task:
- Create a realistic, comprehensive learning roadmap for a given career
- Adapt it to the student's profile, goals, and available time
- Keep the roadmap practical and structured
- Provide 4-6 phases of learning with clear progression
- Include specific resources and milestones for each phase
- Add difficulty ratings and time estimates

Return ONLY valid JSON in this exact format:
{
  "career_decision": {
    "career": "<career title>",
    "reasoning": "<detailed explanation>",
    "confidence": <number 0-100>,
    "skill_match_percentage": <number 0-100>,
    "market_readiness": <number 0-100>,
    "industry_demand": "<trending|stable|declining>",
    "key_strengths": ["<strength 1>", "<strength 2>"],
    "skill_gaps": ["<gap 1>", "<gap 2>"],
    "time_to_job_ready": "<estimated months>",
    "alternatives": [
      {"career": "<alt 1>", "match_score": <0-100>, "reason": "<reason>"}
    ]
  },
  "learning_roadmap": {
    "duration_months": <number>,
    "roadmap": [
      {
        "phase": "Phase 1: Foundations",
        "duration": "4-6 weeks",
        "difficulty": "<beginner|intermediate|advanced>",
        "focus_skills": ["skill1", "skill2"],
        "outcomes": ["outcome1", "outcome2"],
        "milestones": [
          {
            "name": "<milestone name>",
            "description": "<what to achieve>",
            "estimated_hours": <number>,
            "resources": [
              {
                "type": "<course|documentation|project|video>",
                "title": "<resource title>",
                "url": "<url or description>",
                "duration": "<time estimate>"
              }
            ]
          }
        ],
        "prerequisites": ["<prerequisite 1>", "<prerequisite 2>"]
      }
    ]
  }
}
"""

async def generate_roadmap(profile: dict) -> dict:
  client_info = _client()
  if client_info is None:
    return _fallback_roadmap(profile)

  try:
    response = await client_info['client'].chat.completions.create(
        model=client_info['model'],
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(profile)}
        ],
        temperature=0.3
    )

    content = response.choices[0].message.content or ""
    parsed = _parse_llm_json(content)
    if isinstance(parsed, dict) and "career_decision" in parsed:
      return parsed
    return _fallback_roadmap(profile)
  except Exception:
    return _fallback_roadmap(profile)


ADAPT_SYSTEM_PROMPT = """
You are an AI Learning Roadmap Adapter.

Your task:
- Analyze the student's current roadmap and their progress.
- If they are progressing well, suggest advanced topics or speed up the timeline.
- If they are stuck or slow, suggest remedial resources or break down steps further.
- Keep the structure consistent with the original roadmap but modify future phases.

Input JSON:
{
  "current_roadmap": { ... },
  "progress": { "completed_phases": X, "total_phases": Y, "streak_days": Z }
}

Return ONLY valid JSON for the new "learning_roadmap" part:
{
  "duration_months": <number>,
  "roadmap": [
    {
      "phase": "Phase X: ...",
      "duration": "...",
      "focus_skills": [...],
      "outcomes": [...]
    }
  ]
}
"""

async def adapt_roadmap(current_data: dict) -> dict:
  client_info = _client()
  if client_info is None:
    return current_data.get("learning_roadmap")

  input_data = {
      "current_roadmap": current_data.get("learning_roadmap"),
      "progress": current_data.get("progress")
  }

  try:
    response = await client_info['client'].chat.completions.create(
        model=client_info['model'],
        messages=[
            {"role": "system", "content": ADAPT_SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(input_data)}
        ],
        temperature=0.3
    )

    content = response.choices[0].message.content or ""
    parsed = _parse_llm_json(content)
    if isinstance(parsed, dict):
      return parsed
    return current_data.get("learning_roadmap")
  except Exception:
    return current_data.get("learning_roadmap")
