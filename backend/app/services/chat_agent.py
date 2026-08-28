import json
import os
import re
from typing import Any, Dict, List, Optional
from app.services.ai_service import _client, _parse_llm_json

CHAT_SYSTEM_PROMPT = """You are LevelUP AI Assistant — an expert, proactive career coach and coding mentor embedded directly inside the LevelUP application.

You have direct access to the user's current learning context:
- Tracked skills & categories
- 3-column task board (To Do, Current, Past) with priorities and deadlines
- Active career roadmaps & target role goals

Your goals:
1. Provide concise, friendly, actionable, and accurate advice on coding, skills, interview preparation, and learning path planning.
2. If the user asks or implies creating, updating, moving, or deleting tasks, skills, or roadmaps, generate the corresponding structured ACTIONS in your JSON response so the app executes them automatically!

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

def _smart_fallback_response(query: str, context: Dict[str, Any]) -> Dict[str, Any]:
    q = query.lower()
    tracked_skills = context.get('trackedSkills') or []
    tasks = context.get('tasks') or []
    roadmap = context.get('activeRoadmap') or {}

    actions = []
    follow_ups = [
        "What should I learn next?",
        "Add a high-priority task for tomorrow",
        "Give me a mock interview question"
    ]

    # 1. Detect Task Creation
    if re.search(r'\b(?:add|create|new|schedule|remind)\b.*\b(?:task|todo|to-do|item)\b', q) or 'add a task' in q or 'create a task' in q:
        # Extract title
        title = re.sub(r'^(?:please\s+)?(?:can you\s+)?(?:add|create|new|schedule)\s+(?:a\s+)?(?:(?:high|medium|low)\s+)?(?:priority\s+)?(?:task|todo|to-do)?(?:\s+for\s+me|\s+for|\s+to|\s*:)?\s*', '', query, flags=re.IGNORECASE).strip(' "\':-')
        # Check priority in prompt
        priority = 'HIGH' if 'high' in q else 'LOW' if 'low' in q else 'MEDIUM'
        status = 'IN_PROGRESS' if any(w in q for w in ['current', 'in progress', 'today', 'now']) else 'NOT_STARTED'

        # Deadline extraction
        deadline = None
        if 'tomorrow' in q:
            import datetime
            tmrw = datetime.date.today() + datetime.timedelta(days=1)
            deadline = f"{tmrw.isoformat()}T18:00:00"
        elif 'today' in q:
            import datetime
            deadline = f"{datetime.date.today().isoformat()}T20:00:00"

        # Clean title of deadline/priority words
        clean_title = re.sub(r'\s+(?:due\s+)?(?:by\s+)?(?:tomorrow|today|at\s+\d+.*)$', '', title, flags=re.IGNORECASE).strip(' "\':-')
        if not clean_title or clean_title.lower() in ['task', 'high priority', 'priority']:
            clean_title = "Study & Practice " + (tracked_skills[0].get('name') if tracked_skills else 'Core Concepts')

        actions.append({
            'type': 'CREATE_TASK',
            'data': {
                'title': clean_title,
                'priority': priority,
                'status': status,
                'deadline': deadline,
                'notes': 'Added via LevelUP AI Assistant'
            }
        })

        due_str = f" (due {deadline.split('T')[0]})" if deadline else ""
        board_label = 'Current' if status == 'IN_PROGRESS' else 'To Do'
        return {
            'reply': f"✨ **Task Created!** I have added **'{clean_title}'** with **{priority} Priority** to your **{board_label}** board{due_str}.\n\nYou can track and move it directly on your 3-column task board.",
            'actions': actions,
            'suggestedFollowUps': [
                "Move this task to Current",
                "What skills do I need for this?",
                "Give me study resources"
            ]
        }

    # 2. Detect Task Movement / Completion
    if any(k in q for k in ['mark', 'move task', 'start task', 'complete task', 'finish task']):
        matched_task = None
        target_status = 'COMPLETED' if any(w in q for w in ['done', 'complete', 'finish', 'past']) else 'IN_PROGRESS' if any(w in q for w in ['current', 'start', 'in progress']) else 'NOT_STARTED'

        for t in tasks:
            if t.get('title') and t.get('title').lower() in q:
                matched_task = t
                break
        if not matched_task and tasks:
            matched_task = tasks[0]

        if matched_task:
            actions.append({
                'type': 'UPDATE_TASK_STATUS',
                'data': {
                    'taskId': matched_task.get('id'),
                    'taskTitle': matched_task.get('title'),
                    'status': target_status
                }
            })
            status_label = 'Past (Completed)' if target_status == 'COMPLETED' else 'Current (In Progress)' if target_status == 'IN_PROGRESS' else 'To Do'
            return {
                'reply': f"🔄 **Task Updated!** I have moved **'{matched_task.get('title')}'** to **{status_label}** on your Kanban board.",
                'actions': actions,
                'suggestedFollowUps': [
                    "What's my next priority task?",
                    "Show today's summary",
                    "Add another task"
                ]
            }

    # 3. Detect Skill Progress Updates
    if 'progress' in q or 'update skill' in q:
        pct_match = re.search(r'(\d{1,3})%', q)
        pct = int(pct_match.group(1)) if pct_match else 50
        matched_skill = None
        for s in tracked_skills:
            name = s.get('name') or s.get('title') or ''
            if name and name.lower() in q:
                matched_skill = s
                break
        if not matched_skill and tracked_skills:
            matched_skill = tracked_skills[0]

        if matched_skill:
            actions.append({
                'type': 'UPDATE_SKILL_PROGRESS',
                'data': {
                    'skillId': matched_skill.get('id'),
                    'skillName': matched_skill.get('name'),
                    'progress': pct
                }
            })
            return {
                'reply': f"📈 **Skill Updated!** Set progress for **{matched_skill.get('name')}** to **{pct}%**. Your dashboard readiness metrics have been refreshed.",
                'actions': actions,
                'suggestedFollowUps': [
                    f"Give me an interview question on {matched_skill.get('name')}",
                    "Generate subskills for this",
                    "What should I learn next?"
                ]
            }

    # 4. Detect Mock Interview Request
    if any(k in q for k in ['interview', 'question', 'quiz', 'mock']):
        top_skill = (tracked_skills[0].get('name') if tracked_skills else 'System Design')
        return {
            'reply': f"🎙️ **Mock Interview Question ({top_skill})**:\n\n> *\"How would you optimize performance and manage state lifecycle efficiently in a large-scale {top_skill} application under high concurrency?\"*\n\n**Key areas interviewers look for:**\n1. Architectural design choices & trade-offs\n2. Caching & memoization strategies\n3. Error handling, telemetry & observability\n\n💡 *Type your thoughts or bullet points below and I'll grade your response!*",
            'actions': [],
            'suggestedFollowUps': [
                "Here is my answer: ...",
                "Give me another interview question",
                "Add task: Practice mock interviews"
            ]
        }

    # 5. Detect Learning Recommendation
    if any(k in q for k in ['learn next', 'recommend', 'what next', 'career path', 'roadmap']):
        first_skill = tracked_skills[0].get('name') if tracked_skills else 'Full Stack Architecture'
        return {
            'reply': f"🚀 **Recommended Next Learning Focus**:\n\nBased on your active skills ({', '.join([s.get('name','') for s in tracked_skills[:3]]) or 'Web & Cloud Development'}), here is your recommended sequence:\n\n1. **Deepen {first_skill}**: Solidify asynchronous patterns and performance profiling.\n2. **Cloud & Containerization**: Dockerize your project and set up automated CI/CD pipelines.\n3. **System Design & API Security**: Implement JWT authentication, rate limiting, and caching.\n\nWould you like me to add any of these as tasks to your **To Do** board?",
            'actions': [],
            'suggestedFollowUps': [
                f"Add task: Practice {first_skill} advanced patterns",
                "Add task: Setup CI/CD pipeline",
                "Give me a study plan for this week"
            ]
        }

    # Default Contextual Greeting / Coaching
    skill_names = [s.get('name') for s in tracked_skills[:3] if s.get('name')]
    skills_context = f" I see you're working on **{', '.join(skill_names)}**." if skill_names else ""
    return {
        'reply': f"👋 I'm your **LevelUP AI Career & Study Assistant**.{skills_context}\n\nI can help you:\n- **Create and organize tasks** on your 3-column Kanban board\n- **Update your skills and progress** in real-time\n- **Provide mock interview questions** and technical deep dives\n- **Plan your daily learning schedule**\n\nWhat would you like to work on right now?",
        'actions': [],
        'suggestedFollowUps': follow_ups
    }


async def process_chat_message(
    messages: List[Dict[str, str]],
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    client_info = _client()
    context = context or {}
    last_user_query = ""
    for m in reversed(messages):
        if m.get('role') == 'user':
            last_user_query = m.get('content', '')
            break

    # Format context into system prompt
    context_str = json.dumps(context, indent=2)
    augmented_system_prompt = f"{CHAT_SYSTEM_PROMPT}\n\n### Current User Context:\n{context_str}\n"

    if client_info is not None:
        try:
            # Build message history for LLM
            llm_messages = [{'role': 'system', 'content': augmented_system_prompt}]
            for m in messages[-10:]: # Keep last 10 turns
                llm_messages.append({
                    'role': m.get('role', 'user'),
                    'content': m.get('content', '')
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

    # Seamless smart fallback if remote LLM endpoint is offline
    return _smart_fallback_response(last_user_query, context)

