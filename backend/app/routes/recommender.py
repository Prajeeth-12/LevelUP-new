from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from app.utils.auth import get_optional_firebase_token
from app.services.recommender_service import (
    generate_conversational_learning_plan,
    explain_recommendation_item,
    adapt_learning_roadmap,
    milestone_ai_chat,
    generate_diagnostic_quiz,
    generate_project_spec,
    validate_checkpoint_submission,
)
from app.services.storage_service import save_active_roadmap

router = APIRouter(prefix="/api/v1/recommend", tags=["AI Learning Path Recommender"])


class ConversationalPlanRequest(BaseModel):
    goal: str = Field(..., description="Natural language goal from learner")
    profile: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ExplainRequest(BaseModel):
    item_type: str = Field(default="milestone", description="course|project|milestone|resource")
    item_title: str
    goal: Optional[str] = ""
    learner_profile: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AdaptRoadmapRequest(BaseModel):
    current_roadmap: Dict[str, Any]
    feedback_type: str = Field(..., description="too_hard|too_easy|already_known|more_projects|accelerate")
    target_milestone_id: Optional[str] = None
    user_notes: Optional[str] = None


class MilestoneChatRequest(BaseModel):
    milestone_context: Dict[str, Any]
    chat_history: List[Dict[str, str]] = Field(default_factory=list)
    user_query: str


class DiagnosticQuizRequest(BaseModel):
    skill_name: str
    difficulty: Optional[str] = "intermediate"


class GenerateProjectRequest(BaseModel):
    domain: str
    milestone_title: str
    skills: List[str] = Field(default_factory=list)
    experience_level: Optional[str] = "Intermediate"


class CheckpointValidateRequest(BaseModel):
    milestone_title: str
    checkpoint_goal: str
    submission_text: str


class AdoptRoadmapRequest(BaseModel):
    roadmap: Dict[str, Any]
    user_id: Optional[str] = None


@router.post("/conversational-plan")
async def route_conversational_plan(
    body: ConversationalPlanRequest,
    user_id: Optional[str] = Depends(get_optional_firebase_token),
):
    result = await generate_conversational_learning_plan(body.goal, body.profile)
    return {"status": "success", "plan": result, "user_id": user_id}


@router.post("/explain")
async def route_explain_recommendation(body: ExplainRequest):
    result = await explain_recommendation_item(
        body.item_type,
        body.item_title,
        body.goal,
        body.learner_profile,
    )
    return {"status": "success", "explanation": result}


@router.post("/adapt")
async def route_adapt_roadmap(body: AdaptRoadmapRequest):
    result = await adapt_learning_roadmap(
        body.current_roadmap,
        body.feedback_type,
        body.target_milestone_id,
        body.user_notes,
    )
    return {"status": "success", **result}


@router.post("/chat")
async def route_milestone_chat(body: MilestoneChatRequest):
    result = await milestone_ai_chat(
        body.milestone_context,
        body.chat_history,
        body.user_query,
    )
    return {"status": "success", **result}


@router.post("/diagnostic-quiz")
async def route_diagnostic_quiz(body: DiagnosticQuizRequest):
    result = await generate_diagnostic_quiz(body.skill_name, body.difficulty)
    return {"status": "success", "quiz": result}


@router.post("/generate-project")
async def route_generate_project(body: GenerateProjectRequest):
    result = await generate_project_spec(
        body.domain,
        body.milestone_title,
        body.skills,
        body.experience_level,
    )
    return {"status": "success", "project": result}


@router.post("/validate-checkpoint")
async def route_validate_checkpoint(body: CheckpointValidateRequest):
    result = await validate_checkpoint_submission(
        body.milestone_title,
        body.checkpoint_goal,
        body.submission_text,
    )
    return {"status": "success", "evaluation": result}


@router.post("/adopt")
async def route_adopt_roadmap(
    body: AdoptRoadmapRequest,
    user_id: Optional[str] = Depends(get_optional_firebase_token),
):
    target_uid = body.user_id or user_id
    if target_uid:
        try:
            await save_active_roadmap(target_uid, body.roadmap)
        except Exception:
            pass
    return {"status": "success", "message": "Roadmap adopted successfully", "user_id": target_uid}
