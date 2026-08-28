"""
POST /api/v1/analyze-gap
POST /api/v1/adopt-roadmap

Accepts a resume file (PDF / DOCX / TXT) + job-description text and returns
a skill-gap analysis with a velocity-based learning roadmap.

Processing pipeline
───────────────────
1. Parse resume bytes → plain text  (in-memory, no disk I/O)
2. Extract skills from resume & JD  (CPU-bound → runs in thread pool)
3. Calculate semantic match score
4. Build learning-velocity roadmap (with curated resources per skill)
5. Return full JSON response immediately
6. Persist result to Firestore       (BackgroundTask – non-blocking)
"""

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Tuple

from app.utils.auth import get_optional_firebase_token
from app.services.analyzer.parser import extract_text_from_file
from app.services.analyzer.extractor import SkillExtractor
from app.services.analyzer.matcher import calculate_semantic_match, build_learning_velocity
from app.services.analyzer.storage import save_gap_analysis
from app.services.storage_service import save_active_roadmap, save_student_profile
from app.config import ENV

router = APIRouter(prefix="/api/v1", tags=["Skill Gap Analyzer"])


# ─── Response Schema ──────────────────────────────────────────────────────────

class SkillResource(BaseModel):
    title:    str
    url:      str
    type:     str   # docs | course | video | article | project
    duration: str


class SkillDetail(BaseModel):
    name:      str
    category:  str
    hours:     int
    resources: List[SkillResource]


class RoadmapPhase(BaseModel):
    phase:           str
    skills:          List[str]
    skill_details:   Optional[List[SkillDetail]] = []
    estimated_hours: int
    timeline:        str


class LearningVelocity(BaseModel):
    total_estimated_hours: int
    weeks_to_readiness:    float
    roadmap:               List[RoadmapPhase]


class GapAnalysisResponse(BaseModel):
    match_percentage:    float = Field(..., example=62.5)
    job_readiness_score: float = Field(..., example=73.0)
    matched_skills:      List[str]
    missing_skills:      List[str]
    learning_velocity:   LearningVelocity


class AdoptRoadmapRequest(BaseModel):
    gap_analysis: Dict[str, Any]    # full GapAnalysisResponse payload
    roadmap_title: str = "Skill Gap Roadmap"
    user_id: Optional[str] = None


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post(
    "/analyze-gap",
    response_model=GapAnalysisResponse,
    summary="Adaptive Skill Gap Analyzer",
    description=(
        "Upload a resume (PDF/DOCX/TXT) and paste a job description. "
        "Receive a match score, skill gaps, and a personalised learning roadmap "
        "calibrated to your available hours per week."
    ),
)
async def analyze_skill_gap(
    background_tasks: BackgroundTasks,
    # ── Form inputs (multipart/form-data – required when mixing UploadFile + fields)
    resume_file:    UploadFile = File(...,      description="Resume in PDF, DOCX, or TXT format"),
    jd_text:        str        = Form(...,      description="Full job description text"),
    hours_per_week: int        = Form(default=10, ge=1, le=80,
                                       description="Study hours available per week"),
    # ── Auth: extracts user_id from Bearer token (no Firebase Storage needed)
    user_id: Optional[str] = Depends(get_optional_firebase_token),
):
    # ── 1. Validate inputs ────────────────────────────────────────────────────
    if not jd_text.strip():
        raise HTTPException(status_code=422, detail="jd_text must not be empty.")

    # ── 2. Parse resume in-memory (async I/O read + sync CPU parse) ───────────
    resume_text = await extract_text_from_file(resume_file)
    if not resume_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from the resume file. "
                   "Ensure the PDF/DOCX is not image-only or password-protected.",
        )

    # ── 3. Extract skills (CPU-bound NLP → thread pool, keeps event loop free) ─
    extractor = SkillExtractor()
    resume_skills, jd_skills = await run_in_threadpool(
        _extract_skills_sync, extractor, resume_text, jd_text
    )

    # ── 3b. Role-keyword fallback when JD is a short title (e.g. "game developer") ─
    if not jd_skills:
        jd_skills = extractor.infer_skills_from_role(jd_text)

    # Still nothing? Return a graceful empty result instead of a hard error.
    if not jd_skills:
        return {
            "match_percentage":    0.0,
            "job_readiness_score": 0.0,
            "matched_skills":      [],
            "missing_skills":      [],
            "learning_velocity":   {"total_estimated_hours": 0, "weeks_to_readiness": 0.0, "roadmap": []},
        }

    # ── 4. Semantic match ─────────────────────────────────────────────────────
    match_result = calculate_semantic_match(resume_skills, jd_skills)

    # ── 5. Velocity-based learning roadmap ────────────────────────────────────
    velocity = build_learning_velocity(
        missing_skills=match_result["missing_skills"],
        extractor=extractor,
        hours_per_week=hours_per_week,
    )

    # ── 6. Compose response ───────────────────────────────────────────────────
    response_payload = {
        "match_percentage":    match_result["match_percentage"],
        "job_readiness_score": match_result["job_readiness_score"],
        "matched_skills":      match_result["matched_skills"],
        "missing_skills":      match_result["missing_skills"],
        "learning_velocity":   velocity,
    }

    # ── 7. Persist to Firestore asynchronously (non-blocking BackgroundTask) ──
    if user_id:
        background_tasks.add_task(save_gap_analysis, user_id, response_payload)

    return response_payload


# ─── Thread-pool helper ───────────────────────────────────────────────────────
# Defined at module level (not as a closure) so it is safely picklable.

def _extract_skills_sync(
    extractor: SkillExtractor,
    resume_text: str,
    jd_text: str,
) -> Tuple[List[str], List[str]]:
    """Runs synchronous NLP extraction for both texts in a single thread call."""
    resume_skills = extractor.extract_flat(resume_text)
    jd_skills     = extractor.extract_flat(jd_text)
    return resume_skills, jd_skills


# ─── Adopt roadmap as main dashboard roadmap ──────────────────────────────────

@router.post(
    "/adopt-roadmap",
    summary="Adopt a gap analysis result as the user's main roadmap",
)
async def adopt_gap_roadmap(
    body:    AdoptRoadmapRequest,
    auth_user_id: Optional[str] = Depends(get_optional_firebase_token),
):
    """
    Converts a gap-analysis result into the user's active roadmap structure
    that powers the Dashboard progress tracker.
    
    This endpoint:
    1. Validates the gap analysis data
    2. Converts it to the Dashboard roadmap format
    3. Saves to Firestore (user's active_roadmap collection)
    4. Returns confirmation with skill count
    """
    print(f"DEBUG: Received adopt-roadmap request for user: {body.user_id}")
    try:
        user_id = auth_user_id or body.user_id

        if not user_id:
            raise HTTPException(status_code=401, detail="Please sign in to adopt roadmap")

        # Extract and validate gap analysis
        ga = body.gap_analysis
        if not ga:
            raise HTTPException(status_code=400, detail="gap_analysis cannot be empty")
        
        lv = ga.get("learning_velocity", {})
        if not lv:
            raise HTTPException(status_code=400, detail="learning_velocity is required")
            
        phases = lv.get("roadmap", [])
        missing_count = len(ga.get("missing_skills", []))
        matched_count = len(ga.get("matched_skills", []))

        # Build career_decision stub (Dashboard expects this shape)
        career_decision = {
            "career":              body.roadmap_title,
            "reasoning":           f"Adopted from Skill Gap Analyzer – {ga.get('match_percentage', 0):.0f}% match",
            "confidence":          int(ga.get("job_readiness_score", 0)),
            "skill_match_percentage": int(ga.get("match_percentage", 0)),
            "market_readiness":    int(ga.get("job_readiness_score", 0)),
            "industry_demand":     "trending" if int(ga.get("match_percentage", 0)) > 60 else "stable",
            "key_strengths":       ga.get("matched_skills", [])[:5],
            "skill_gaps":          ga.get("missing_skills", [])[:5],
            "time_to_job_ready":   f"~{lv.get('weeks_to_readiness', 0):.0f} weeks",
            "alternatives":        [],
            "source":              "skill_gap_analyzer",
            "created_at":          __import__('datetime').datetime.utcnow().isoformat(),
        }

        # Convert gap phases into the roadmap phase shape Dashboard uses
        converted_phases = []
        total_hours = 0
        all_skills = []
        
        for phase_idx, p in enumerate(phases):
            skill_details = p.get("skill_details", [])
            milestones = []
            phase_hours = 0
            
            for sd in skill_details:
                hours = sd.get("hours", 0)
                phase_hours += hours
                total_hours += hours
                s_name = sd.get("name", "")
                if s_name and s_name not in all_skills:
                    all_skills.append(s_name)
                
                milestones.append({
                    "name":            s_name,
                    "description":     f"Learn {s_name} ({sd.get('category','')}) – ~{hours}h",
                    "estimated_hours": hours,
                    "resources":       sd.get("resources", []),
                    "status":          "pending",
                })

            for s in p.get("skills", []):
                if s not in all_skills:
                    all_skills.append(s)

            converted_phases.append({
                "phase":        p["phase"],
                "duration":     p.get("timeline", ""),
                "difficulty":   "intermediate",
                "focus_skills": p.get("skills", []),
                "outcomes":     [f"Be proficient in {s}" for s in p.get("skills", [])[:4]],
                "milestones":   milestones,
                "prerequisites": [],
                "status":       "pending",
                "completed_at": None,
                "estimated_hours": phase_hours,
            })

        roadmap_obj = {
            "duration_months":     max(round(lv.get("weeks_to_readiness", 4) / 4), 1),
            "roadmap":             converted_phases,
            "total_estimated_hours": total_hours,
            "weeks_to_readiness":  lv.get("weeks_to_readiness", 0),
        }

        # Save to Firestore asynchronously
        await run_in_threadpool(
            save_active_roadmap, 
            user_id, 
            career_decision, 
            roadmap_obj,
            preserve_progress=False
        )

        # Update student profile in Firestore
        profile_data = {
            "name": "LevelUP Learner",
            "goals": body.roadmap_title,
            "skills": ", ".join(all_skills[:12]) if all_skills else "Fullstack Engineering",
            "interests": body.roadmap_title,
            "experience": f"Skill Gap Readiness: {ga.get('job_readiness_score', 70):.0f}%"
        }
        await run_in_threadpool(save_student_profile, user_id, profile_data)

        return {
            "status": "ok",
            "message": f"Roadmap adopted successfully",
            "details": {
                "title": body.roadmap_title,
                "matched_skills": matched_count,
                "missing_skills": missing_count,
                "phases": len(converted_phases),
                "total_hours": total_hours,
                "weeks_to_readiness": lv.get("weeks_to_readiness", 0),
                "user_id": user_id,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in adopt_gap_roadmap: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to adopt roadmap: {str(e)}"
        )
