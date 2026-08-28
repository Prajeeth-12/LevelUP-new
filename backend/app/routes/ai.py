from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from app.services.ai_service import (
    generate_subskills,
    path_optimize,
    priority_suggestions,
    progress_insights,
    skill_gap,
    task_plan,
    time_estimate,
    weekly_report,
)
from app.services.chat_agent import process_chat_message
from app.utils.auth import verify_firebase_token

router = APIRouter(prefix='/ai', tags=['AI'])


class GenerateSubskillsRequest(BaseModel):
    skillName: Optional[str] = ''
    courseLink: Optional[str] = ''


class ProgressInsightsRequest(BaseModel):
    skills: List[Dict[str, Any]] = Field(default_factory=list)
    tasks: List[Dict[str, Any]] = Field(default_factory=list)


class PrioritySuggestionsRequest(BaseModel):
    skills: List[Dict[str, Any]] = Field(default_factory=list)
    activityTimestamps: List[Dict[str, Any]] = Field(default_factory=list)


class TaskPlanRequest(BaseModel):
    availableTime: Optional[int] = 0
    tasks: List[Dict[str, Any]] = Field(default_factory=list)


class SkillGapRequest(BaseModel):
    targetRole: str
    skills: List[Dict[str, Any]] = Field(default_factory=list)


class PathOptimizeRequest(BaseModel):
    selectedSkills: List[Dict[str, Any]] = Field(default_factory=list)


class TimeEstimateRequest(BaseModel):
    skillName: str
    difficulty: Optional[str] = 'MEDIUM'


class WeeklyReportRequest(BaseModel):
    skills: List[Dict[str, Any]] = Field(default_factory=list)
    tasks: List[Dict[str, Any]] = Field(default_factory=list)


class ChatRequest(BaseModel):
    messages: List[Dict[str, str]] = Field(default_factory=list)
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)


@router.post('/generate-subskills')
async def route_generate_subskills(body: GenerateSubskillsRequest, user_id: str = Depends(verify_firebase_token)):
    result = await generate_subskills(body.dict())
    return {**result, 'userId': user_id}


@router.post('/progress-insights')
async def route_progress_insights(body: ProgressInsightsRequest, user_id: str = Depends(verify_firebase_token)):
    result = await progress_insights(body.dict())
    return {**result, 'userId': user_id}


@router.post('/priority-suggestions')
async def route_priority_suggestions(body: PrioritySuggestionsRequest, user_id: str = Depends(verify_firebase_token)):
    result = await priority_suggestions(body.dict())
    return {**result, 'userId': user_id}


@router.post('/task-plan')
async def route_task_plan(body: TaskPlanRequest, user_id: str = Depends(verify_firebase_token)):
    result = await task_plan(body.dict())
    return {**result, 'userId': user_id}


@router.post('/skill-gap')
async def route_skill_gap(body: SkillGapRequest, user_id: str = Depends(verify_firebase_token)):
    result = await skill_gap(body.dict())
    return {**result, 'userId': user_id}


@router.post('/path-optimize')
async def route_path_optimize(body: PathOptimizeRequest, user_id: str = Depends(verify_firebase_token)):
    result = await path_optimize(body.dict())
    return {**result, 'userId': user_id}


@router.post('/time-estimate')
async def route_time_estimate(body: TimeEstimateRequest, user_id: str = Depends(verify_firebase_token)):
    result = await time_estimate(body.dict())
    return {**result, 'userId': user_id}


@router.post('/weekly-report')
async def route_weekly_report(body: WeeklyReportRequest, user_id: str = Depends(verify_firebase_token)):
    result = await weekly_report(body.dict())
    return {**result, 'userId': user_id}


@router.post('/chat')
async def route_chat(body: ChatRequest, user_id: str = Depends(verify_firebase_token)):
    result = await process_chat_message(body.messages, body.context)
    return {**result, 'userId': user_id}

