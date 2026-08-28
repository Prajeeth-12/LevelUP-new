import json
import os
import re
from typing import Any, Dict, List, Optional
import urllib.request
from app.services.ai_service import _client, _parse_llm_json

CHAT_SYSTEM_PROMPT = """You are LevelUP AI Assistant — an expert, proactive career coach, coding mentor, and system design reviewer embedded directly inside the LevelUP application.

You have direct access to the user's current learning context:
- Tracked skills & categories
- 3-column task board (To Do, Current, Past) with priorities and deadlines
- Active career roadmaps & target role goals

Your superpowers:
1. **1-on-1 Voice & Text Mentorship**: Provide concise, encouraging, and accurate advice on coding, DSA, system design, and career progression.
2. **Autonomous Task & Skill Actions**: If the user asks or implies creating, updating, moving, or deleting tasks or skills, generate the corresponding structured ACTIONS in your JSON response so the app executes them automatically!
3. **Multimodal Vision & GitHub Inspection**: When the user provides an image (architecture diagram, database schema, whiteboard drawing) or a GitHub repository link, analyze the engineering architecture, identify missing best practices or gaps, and propose actionable skills and tasks to master.

You MUST always reply with a valid JSON object matching this schema:
{
  "reply": "Your friendly, clear markdown response directly answering the user...",
  "actions": [
    {
      "type": "CREATE_TASK" | "UPDATE_TASK_STATUS" | "UPDATE_TASK_PRIORITY" | "DELETE_TASK" | "CREATE_SKILL" | "UPDATE_SKILL_PROGRESS" | "ADD_SUBSKILLS",
      "data": {
        // for CREATE_TASK:
        "title": "string (required)",
        "priority": "HIGH" | "MEDIUM" | "LOW",
        "status": "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
        "deadline": "YYYY-MM-DDTHH:MM:SS or null",
        "notes": "string or empty"

        // for UPDATE_TASK_STATUS:
        "taskId": "string (or match by title)",
        "taskTitle": "string",
        "status": "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"

        // for UPDATE_TASK_PRIORITY:
        "taskId": "string (or match by title)",
        "taskTitle": "string",
        "priority": "HIGH" | "MEDIUM" | "LOW"

        // for DELETE_TASK:
        "taskId": "string (or match by title)",
        "taskTitle": "string"

        // for CREATE_SKILL:
        "title": "string",
        "categoryName": "string",
        "priority": "HIGH" | "MEDIUM" | "LOW",
        "progress": 0

        // for UPDATE_SKILL_PROGRESS:
        "skillId": "string (or match by title)",
        "skillName": "string",
        "progress": number (0 to 100)

        // for ADD_SUBSKILLS:
        "skillId": "string (or match by title)",
        "skillName": "string",
        "subskills": ["Subskill 1", "Subskill 2"]
      }
    }
  ],
  "suggestedFollowUps": [
    "Short question 1 the user might ask next",
    "Short question 2",
    "Short question 3"
  ]
}

Guidelines:
- If no data modifications are requested, "actions" MUST be an empty array [].
- Never hallucinate tasks that don't exist when updating. Use the tasks provided in the context to match task titles or IDs.
- Keep the tone encouraging, technical yet accessible, and structured with clean markdown bullets where helpful.
"""

def _fetch_github_repo_summary(url: str) -> Optional[str]:
    """Extract owner/repo and fetch public repository metadata."""
    match = re.search(r"github\.com/([^/]+)/([^/]+)", url)
    if not match:
        return None
    owner, repo = match.group(1), match.group(2).replace(".git", "")
    api_url = f"https://api.github.com/repos/{owner}/{repo}"
    try:
        req = urllib.request.Request(api_url, headers={"User-Agent": "LevelUP-Agent"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            full_name = data.get('full_name', f"{owner}/{repo}")
            desc = data.get('description', 'No description')
            lang = data.get('language', 'N/A')
            topics = ', '.join(data.get('topics', []))
            stars = data.get('stargazers_count', 0)
            return f"GitHub Repo: {full_name}\nDescription: {desc}\nLanguage: {lang}\nTopics: {topics}\nStars: {stars}"
    except Exception:
        return f"GitHub Repository: {owner}/{repo}"


def _smart_fallback_response(query: str, context: Dict[str, Any]) -> Dict[str, Any]:
    q = query.lower()
    tracked_skills = context.get('trackedSkills') or []
    tasks = context.get('tasks') or []

    actions = []
    follow_ups = [
        "What should I learn next?",
        "Add a high-priority task for tomorrow",
        "Give me a mock interview question"
    ]

    # 1. Detect Task Creation
    if re.search(r'\b(?:add|create|new|schedule|remind)\b.*\b(?:task|todo|to-do|item)\b', q) or 'add a task' in q or 'create a task' in q:
        title = re.sub(r'^(?:please\s+)?(?:can you\s+)?(?:add|create|new|schedule)\s+(?:a\s+)?(?:(?:high|medium|low)\s+)?(?:priority\s+)?(?:task|todo|to-do)?(?:\s+for\s+me|\s+for|\s+to|\s*:)?\s*', '', query, flags=re.IGNORECASE).strip(' "\':-')
        priority = 'HIGH' if 'high' in q else 'LOW' if 'low' in q else 'MEDIUM'
        status = 'IN_PROGRESS' if any(w in q for w in ['current', 'in progress', 'today', 'now']) else 'NOT_STARTED'

        deadline = None
        if 'tomorrow' in q:
            from datetime import datetime, timedelta
            deadline = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%dT18:00:00')

        if not title:
            title = "Review learning goals and milestones"

        actions.append({
            'type': 'CREATE_TASK',
            'data': {
                'title': title,
                'priority': priority,
                'status': status,
                'deadline': deadline,
                'notes': f'Created via LevelUP AI Assistant'
            }
        })
        return {
            'reply': f"✅ Added **{title}** to your **{'Current (In Progress)' if status == 'IN_PROGRESS' else 'To Do'}** board with **{priority}** priority!",
            'actions': actions,
            'suggestedFollowUps': [
                "Show my current tasks",
                "Add another task for tomorrow",
                "What skills should I learn next?"
            ]
        }

    # 2. General Fallback
    skill_names = [s.get('name') for s in tracked_skills[:3] if s.get('name')]
    skills_context = f" I see you're working on **{', '.join(skill_names)}**." if skill_names else ""
    return {
        'reply': f"👋 I'm your **LevelUP AI Career & Study Assistant**.{skills_context}\n\nI can help you:\n- **Analyze architecture diagrams and GitHub repos** for best practices\n- **Auto-schedule and organize tasks** on your Kanban board\n- **Update your skills and progress** in real-time\n- **Practice technical interview questions**\n\nWhat would you like to work on right now?",
        'actions': [],
        'suggestedFollowUps': follow_ups
    }


async def process_chat_message(
    messages: List[Dict[str, Any]],
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    client_info = _client()
    context = context or {}
    last_user_query = ""
    last_image = None

    for m in reversed(messages):
        if m.get('role') == 'user':
            last_user_query = m.get('content', '')
            last_image = m.get('image')
            break

    # Check for GitHub URLs in user query
    github_info = None
    if "github.com/" in last_user_query:
        github_info = _fetch_github_repo_summary(last_user_query)
        if github_info:
            context['githubInspection'] = github_info

    # Format context into system prompt
    context_str = json.dumps(context, indent=2)
    augmented_system_prompt = f"{CHAT_SYSTEM_PROMPT}\n\n### Current User Context:\n{context_str}\n"

    if client_info is not None:
        try:
            llm_messages = [{'role': 'system', 'content': augmented_system_prompt}]
            for m in messages[-10:]:
                role = m.get('role', 'user')
                content = m.get('content', '')
                image = m.get('image')

                if role == 'user' and image:
                    llm_messages.append({
                        'role': 'user',
                        'content': [
                            {'type': 'text', 'text': content or 'Please inspect and analyze this architecture diagram / whiteboard drawing:'},
                            {'type': 'image_url', 'image_url': {'url': image}}
                        ]
                    })
                else:
                    llm_messages.append({
                        'role': role,
                        'content': content
                    })

            response = await client_info['client'].chat.completions.create(
                model=client_info['model'],
                temperature=0.4,
                messages=llm_messages,
            )

            content = response.choices[0].message.content or ''
            parsed = _parse_llm_json(content)
            if isinstance(parsed, dict) and "reply" in parsed:
                if "actions" not in parsed or not isinstance(parsed["actions"], list):
                    parsed["actions"] = []
                if "suggestedFollowUps" not in parsed or not isinstance(parsed["suggestedFollowUps"], list):
                    parsed["suggestedFollowUps"] = []
                return parsed
            elif content.strip():
                return {
                    "reply": content.strip(),
                    "actions": [],
                    "suggestedFollowUps": [
                        "Tell me more",
                        "Add this as a task",
                        "How do I practice this?"
                    ]
                }
        except Exception as e:
            print(f"Chat agent LLM call error: {e}")

    return _smart_fallback_response(last_user_query, context)


async def auto_organize_tasks(
    tasks: List[Dict[str, Any]],
    hours_budget: int = 12,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Analyzes user's Kanban task board and reorganizes it into an optimal sprint schedule."""
    client_info = _client()
    context = context or {}

    prompt = f"""You are the LevelUP AI Task & Kanban Auto-Scheduler.
Analyze the following list of user tasks across their Kanban board:
Tasks:
{json.dumps(tasks, indent=2)}

Learner Weekly Study Budget: {hours_budget} hours/week.

Your goal is to optimize their Kanban board:
1. Select 2 to 4 high-leverage tasks to move to 'IN_PROGRESS' (Today's / Current sprint) without exceeding daily capacity (~2-4 hours).
2. Ensure realistic priorities (HIGH, MEDIUM, LOW) based on deadlines and cognitive complexity.
3. Keep completed tasks in 'COMPLETED'.
4. Return a clear pedagogical rationale explaining why this schedule prevents burnout and maximizes learning velocity.

You MUST reply with a valid JSON object matching this schema:
{{
  "rationale": "Clear 2-sentence explanation of why these tasks were scheduled for today...",
  "moves": [
    {{
      "taskId": "id of task",
      "taskTitle": "task title",
      "targetStatus": "IN_PROGRESS" | "NOT_STARTED" | "COMPLETED",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "estimatedHours": number,
      "reason": "Short reason for this status/priority"
    }}
  ],
  "todaySprintHours": number,
  "suggestedNewTasks": [
    {{
      "title": "Optional new complementary task",
      "priority": "HIGH" | "MEDIUM",
      "estimatedHours": number
    }}
  ]
}}
"""

    if client_info is not None:
        try:
            response = await client_info['client'].chat.completions.create(
                model=client_info['model'],
                temperature=0.2,
                messages=[
                    {'role': 'system', 'content': 'You are a master productivity and learning scheduler. Always output valid JSON.'},
                    {'role': 'user', 'content': prompt}
                ]
            )
            content = response.choices[0].message.content or ''
            parsed = _parse_llm_json(content)
            if isinstance(parsed, dict) and "moves" in parsed:
                return parsed
        except Exception as e:
            print(f"Auto-schedule LLM error: {e}")

    # Smart Fallback logic
    moves = []
    current_count = 0
    for idx, t in enumerate(tasks):
        t_id = t.get('id') or f"t_{idx}"
        status = t.get('status', 'NOT_STARTED')
        if status == 'COMPLETED':
            continue
        # Move first 2 tasks to IN_PROGRESS
        if current_count < 2:
            moves.append({
                "taskId": t_id,
                "taskTitle": t.get('title', 'Task'),
                "targetStatus": "IN_PROGRESS",
                "priority": "HIGH",
                "estimatedHours": 2,
                "reason": "Top priority focus for today's learning sprint"
            })
            current_count += 1
        else:
            moves.append({
                "taskId": t_id,
                "taskTitle": t.get('title', 'Task'),
                "targetStatus": "NOT_STARTED",
                "priority": "MEDIUM",
                "estimatedHours": 2,
                "reason": "Queued in backlog for upcoming sessions"
            })

    return {
        "rationale": f"Re-balanced your Kanban board based on your {hours_budget}h weekly budget. Selected {min(2, len(tasks))} focus tasks for today's active sprint.",
        "moves": moves,
        "todaySprintHours": current_count * 2,
        "suggestedNewTasks": []
    }
