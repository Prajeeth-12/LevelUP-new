import json
import os
import re
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

# Ensure environment variables from .env are loaded and take precedence
load_dotenv(override=True)

try:
    from openai import AsyncAzureOpenAI, AsyncOpenAI
except Exception:  # pragma: no cover - optional dependency path
    AsyncAzureOpenAI = None
    AsyncOpenAI = None



def _client():
    # 1. MiniMax / OpenAI-compatible configuration
    api_key = os.getenv('MINIMAX_API_KEY') or os.getenv('OPENAI_API_KEY')
    if api_key in ('your-api-key-here', 'mock-openai-key', ''):
        api_key = os.getenv('MINIMAX_API_KEY')

    base_url = os.getenv('MINIMAX_BASE_URL') or os.getenv('OPENAI_BASE_URL') or 'https://api.gmi-serving.com/v1'
    model = os.getenv('MINIMAX_MODEL') or os.getenv('OPENAI_MODEL') or 'MiniMaxAI/MiniMax-M3'

    if api_key and AsyncOpenAI is not None:
        return {
            'client': AsyncOpenAI(api_key=api_key, base_url=base_url),
            'model': model,
        }

    # 2. Azure OpenAI fallback
    if AsyncAzureOpenAI is not None:
        azure_api_key = os.getenv('AZURE_OPENAI_API_KEY')
        endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
        api_version = os.getenv('AZURE_OPENAI_API_VERSION')
        if azure_api_key and endpoint and api_version:
            return {
                'client': AsyncAzureOpenAI(
                    api_key=azure_api_key,
                    azure_endpoint=endpoint,
                    api_version=api_version,
                ),
                'model': os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'gpt-4o-mini'),
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


async def _ask_ai(system_prompt: str, payload: Dict[str, Any], fallback: Dict[str, Any]) -> Dict[str, Any]:
    client_info = _client()
    if client_info is None:
        return fallback

    try:
        response = await client_info['client'].chat.completions.create(
            model=client_info['model'],
            temperature=0.2,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': json.dumps(payload)},
            ],
        )
        content = response.choices[0].message.content or ''
        parsed = _parse_llm_json(content)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        return fallback

    return fallback


def _make_subskills(skill_name: str) -> List[Dict[str, Any]]:
    base = [
        f'{skill_name} fundamentals',
        f'{skill_name} core concepts',
        f'{skill_name} practice exercises',
        f'{skill_name} real-world project',
    ]
    return [{'title': item, 'done': False} for item in base]


async def generate_subskills(payload: Dict[str, Any]) -> Dict[str, Any]:
    skill_name = payload.get('skillName') or payload.get('courseLink') or 'Skill'
    fallback = {
        'skillName': skill_name,
        'subskills': _make_subskills(skill_name),
        'source': 'fallback',
    }
    system_prompt = 'Return JSON with skillName and subskills array of {title, done} only.'
    return await _ask_ai(system_prompt, payload, fallback)


async def progress_insights(payload: Dict[str, Any]) -> Dict[str, Any]:
    fallback = {
        'title': 'Progress insights',
        'suggestions': [
            'Focus on one high-priority skill this week.',
            'Complete at least one linked task daily.',
            'Review inactive skills and reset their next action.',
        ],
        'source': 'fallback',
    }
    system_prompt = 'Return JSON with title and suggestions array of short sentences.'
    return await _ask_ai(system_prompt, payload, fallback)


async def priority_suggestions(payload: Dict[str, Any]) -> Dict[str, Any]:
    skills = payload.get('skills', [])
    suggestions = []
    for skill in skills[:5]:
        suggestions.append({
            'id': skill.get('id'),
            'name': skill.get('name'),
            'priority': 'HIGH' if skill.get('progress', 0) < 40 else skill.get('priority', 'MEDIUM'),
        })
    fallback = {'suggestions': suggestions, 'source': 'fallback'}
    system_prompt = 'Return JSON with suggestions array containing id, name, and priority.'
    return await _ask_ai(system_prompt, payload, fallback)


async def task_plan(payload: Dict[str, Any]) -> Dict[str, Any]:
    tasks = payload.get('tasks', [])
    ordered = sorted(
        tasks,
        key=lambda item: (
            0 if item.get('priority') == 'HIGH' else 1 if item.get('priority') == 'MEDIUM' else 2,
            item.get('deadline') or '9999-12-31',
        ),
    )
    fallback = {
        'orderedTasks': [
            {'id': task.get('id'), 'title': task.get('title'), 'skillId': task.get('skillId')} for task in ordered
        ],
        'source': 'fallback',
    }
    system_prompt = 'Return JSON with orderedTasks array containing id, title, skillId.'
    return await _ask_ai(system_prompt, payload, fallback)


async def skill_gap(payload: Dict[str, Any]) -> Dict[str, Any]:
    target_role = (payload.get('targetRole') or '').lower()
    skills = payload.get('skills', [])
    required_map = {
        'frontend': ['html', 'css', 'javascript', 'react', 'state management'],
        'backend': ['python', 'fastapi', 'apis', 'databases', 'authentication'],
        'data': ['python', 'sql', 'statistics', 'visualization', 'machine learning'],
        'devops': ['linux', 'docker', 'ci/cd', 'cloud', 'kubernetes'],
    }
    required = []
    for key, values in required_map.items():
        if key in target_role:
            required = values
            break
    if not required:
        required = ['core concepts', 'practical projects', 'testing', 'portfolio']

    skill_names = {item.get('name', '').lower() for item in skills}
    missing = [item for item in required if item not in skill_names]
    fallback = {
        'targetRole': payload.get('targetRole', ''),
        'missingSkills': missing,
        'learningOrder': missing[:],
        'source': 'fallback',
    }
    system_prompt = 'Return JSON with targetRole, missingSkills, and learningOrder arrays.'
    return await _ask_ai(system_prompt, payload, fallback)


async def path_optimize(payload: Dict[str, Any]) -> Dict[str, Any]:
    selected = payload.get('selectedSkills', [])
    ordered = sorted(selected, key=lambda skill: (skill.get('priority') != 'HIGH', skill.get('progress', 0)))
    fallback = {
        'recommendedOrder': [skill.get('name') for skill in ordered],
        'source': 'fallback',
    }
    system_prompt = 'Return JSON with recommendedOrder array of skill names.'
    return await _ask_ai(system_prompt, payload, fallback)


async def time_estimate(payload: Dict[str, Any]) -> Dict[str, Any]:
    difficulty = (payload.get('difficulty') or 'MEDIUM').upper()
    hours = {'HIGH': 24, 'MEDIUM': 16, 'LOW': 8}.get(difficulty, 12)
    fallback = {
        'skillName': payload.get('skillName', ''),
        'estimatedHours': hours,
        'source': 'fallback',
    }
    system_prompt = 'Return JSON with skillName and estimatedHours only.'
    return await _ask_ai(system_prompt, payload, fallback)


async def weekly_report(payload: Dict[str, Any]) -> Dict[str, Any]:
    tasks = payload.get('tasks', [])
    skills = payload.get('skills', [])
    done = sum(1 for task in tasks if task.get('status') == 'COMPLETED')
    missed = sum(1 for task in tasks if task.get('status') != 'COMPLETED')
    progress_count = sum(1 for skill in skills if skill.get('progress', 0) > 0)
    fallback = {
        'done': done,
        'missed': missed,
        'skillsProgressed': progress_count,
        'improve': ['Keep a daily task cadence', 'Link each task to one skill', 'Review stalled skills'],
        'source': 'fallback',
    }
    system_prompt = 'Return JSON with done, missed, skillsProgressed, and improve array.'
    return await _ask_ai(system_prompt, payload, fallback)
