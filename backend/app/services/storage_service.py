from app.utils.firebase import db
from datetime import datetime
import re
import uuid


def _slugify(text: str) -> str:
    s = str(text or '').lower().strip()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-') or 'roadmap'


def save_career_analysis(
    user_id: str,
    profile: dict,
    career_decision: dict,
    roadmap: dict
):
    data = {
        "profile": profile,
        "career_decision": career_decision,
        "roadmap": roadmap,
        "created_at": datetime.utcnow()
    }

    db.collection("users") \
      .document(user_id) \
      .collection("analyses") \
      .add(data)

    save_active_roadmap(user_id, career_decision, roadmap)

    return True


def save_roadmap_to_library(
    user_id: str,
    career_decision: dict,
    roadmap: dict,
    roadmap_id: str = None,
    title: str = None,
    is_active: bool = True,
    preserve_progress: bool = False
) -> str:
    """
    Saves a roadmap into the user's multi-roadmap collection (users/{user_id}/roadmaps/{roadmap_id})
    and synchronizes users/{user_id}/active_roadmap/current if marked active.
    """
    try:
        title = title or career_decision.get("career") or "Learning Roadmap"
        if not roadmap_id:
            slug = _slugify(title)
            roadmap_id = f"rm_{slug}_{int(datetime.utcnow().timestamp())}"

        existing_data = None
        if preserve_progress:
            # Check if this specific roadmap exists
            rm_doc = db.collection("users").document(user_id).collection("roadmaps").document(roadmap_id).get()
            if rm_doc.exists:
                existing_data = rm_doc.to_dict()
            else:
                existing_data = get_active_roadmap(user_id)

        # Ensure all phases have status
        if "roadmap" in roadmap:
            for idx, phase in enumerate(roadmap["roadmap"]):
                if existing_data and preserve_progress:
                    old_roadmap = existing_data.get("learning_roadmap", {}).get("roadmap", [])
                    if idx < len(old_roadmap):
                        old_phase = old_roadmap[idx]
                        if old_phase.get("status") == "completed":
                            phase["status"] = "completed"
                            phase["completed_at"] = old_phase.get("completed_at")
                        else:
                            phase["status"] = "pending"
                            phase["completed_at"] = None
                    else:
                        phase["status"] = "pending"
                        phase["completed_at"] = None
                else:
                    if not phase.get("status"):
                        phase["status"] = "pending"
                        phase["completed_at"] = None

        # Build progress tracking
        if existing_data and preserve_progress:
            completed_count = sum(1 for p in roadmap.get("roadmap", []) if p.get("status") == "completed")
            progress_data = {
                "completed_phases": completed_count,
                "total_phases": len(roadmap.get("roadmap", [])),
                "streak_days": existing_data.get("progress", {}).get("streak_days", 0),
                "last_activity_date": existing_data.get("progress", {}).get("last_activity_date")
            }
        else:
            progress_data = {
                "completed_phases": sum(1 for p in roadmap.get("roadmap", []) if p.get("status") == "completed"),
                "total_phases": len(roadmap.get("roadmap", [])),
                "streak_days": 0,
                "last_activity_date": None
            }

        now = datetime.utcnow()
        doc_data = {
            "id": roadmap_id,
            "title": title,
            "career_decision": career_decision,
            "learning_roadmap": roadmap,
            "progress": progress_data,
            "is_active": is_active,
            "created_at": existing_data.get("created_at") if existing_data else now,
            "updated_at": now
        }

        # If this is active, set other roadmaps to inactive
        if is_active:
            try:
                all_rms = db.collection("users").document(user_id).collection("roadmaps").stream()
                for rm in all_rms:
                    if rm.id != roadmap_id and rm.to_dict().get("is_active"):
                        rm.reference.update({"is_active": False, "updated_at": now})
            except Exception as e:
                print(f"Warning updating active flags: {e}")

        # Save to roadmaps collection
        db.collection("users").document(user_id).collection("roadmaps").document(roadmap_id).set(doc_data)

        # Also sync to active_roadmap/current for backwards compatibility
        if is_active:
            db.collection("users").document(user_id).collection("active_roadmap").document("current").set(doc_data)

        print(f"Roadmap '{title}' saved to library (ID: {roadmap_id}) for user {user_id}")
        return roadmap_id

    except Exception as e:
        print(f"Error in save_roadmap_to_library: {e}")
        raise


def save_active_roadmap(user_id: str, career_decision: dict, roadmap: dict, preserve_progress: bool = False):
    return save_roadmap_to_library(
        user_id=user_id,
        career_decision=career_decision,
        roadmap=roadmap,
        roadmap_id=None,
        title=career_decision.get("career"),
        is_active=True,
        preserve_progress=preserve_progress
    )


def list_user_roadmaps(user_id: str) -> list:
    """
    Returns list of all roadmaps saved by user in users/{user_id}/roadmaps.
    Migrates legacy users/{user_id}/active_roadmap/current if roadmaps collection is empty.
    """
    try:
        roadmaps_ref = db.collection("users").document(user_id).collection("roadmaps")
        docs = list(roadmaps_ref.order_by("updated_at", direction="DESCENDING").stream())

        if not docs:
            # Fallback: check legacy single active roadmap doc
            legacy = db.collection("users").document(user_id).collection("active_roadmap").document("current").get()
            if legacy.exists:
                data = legacy.to_dict()
                legacy_id = f"rm_default_{int(datetime.utcnow().timestamp())}"
                data["id"] = legacy_id
                data["is_active"] = True
                if not data.get("title"):
                    data["title"] = data.get("career_decision", {}).get("career", "Active Roadmap")
                roadmaps_ref.document(legacy_id).set(data)
                return [data]
            return []

        result = []
        for d in docs:
            item = d.to_dict()
            item["id"] = d.id
            result.append(item)
        return result

    except Exception as e:
        print(f"Error listing user roadmaps: {e}")
        # Fallback to single doc
        single = get_active_roadmap(user_id)
        return [single] if single else []


def switch_active_roadmap(user_id: str, roadmap_id: str) -> dict:
    """
    Marks target roadmap_id as active in library and syncs active_roadmap/current.
    """
    now = datetime.utcnow()
    target_ref = db.collection("users").document(user_id).collection("roadmaps").document(roadmap_id)
    target_doc = target_ref.get()

    if not target_doc.exists:
        raise Exception(f"Roadmap {roadmap_id} not found")

    target_data = target_doc.to_dict()
    target_data["id"] = roadmap_id
    target_data["is_active"] = True
    target_data["updated_at"] = now

    # Update active flag across collection
    all_rms = db.collection("users").document(user_id).collection("roadmaps").stream()
    for rm in all_rms:
        if rm.id == roadmap_id:
            rm.reference.update({"is_active": True, "updated_at": now})
        elif rm.to_dict().get("is_active"):
            rm.reference.update({"is_active": False, "updated_at": now})

    # Update active_roadmap/current
    db.collection("users").document(user_id).collection("active_roadmap").document("current").set(target_data)
    return target_data


def delete_roadmap_from_library(user_id: str, roadmap_id: str) -> bool:
    """
    Deletes a specific roadmap from library. If it was active, sets next available roadmap active.
    """
    try:
        ref = db.collection("users").document(user_id).collection("roadmaps").document(roadmap_id)
        doc = ref.get()
        if not doc.exists:
            return False

        was_active = doc.to_dict().get("is_active", False)
        ref.delete()

        # If deleted roadmap was active, promote another one
        if was_active:
            remaining = list_user_roadmaps(user_id)
            if remaining:
                switch_active_roadmap(user_id, remaining[0]["id"])
            else:
                delete_active_roadmap(user_id)

        return True
    except Exception as e:
        print(f"Error deleting roadmap: {e}")
        raise


def get_active_roadmap(user_id: str):
    doc = db.collection("users").document(user_id).collection("active_roadmap").document("current").get()
    if doc.exists:
        return doc.to_dict()
    # Fallback to roadmaps library
    rms = list_user_roadmaps(user_id)
    if rms:
        active = next((r for r in rms if r.get("is_active")), rms[0])
        return active
    return None


def update_phase_status(user_id: str, phase_index: int, status: str, roadmap_id: str = None):
    if status not in {"pending", "completed"}:
        return False

    current_data = get_active_roadmap(user_id)
    if not current_data:
        return False

    roadmap = current_data.get("learning_roadmap", {}).get("roadmap", [])
    if 0 <= phase_index < len(roadmap):
        roadmap[phase_index]["status"] = status
        if status == "completed":
            roadmap[phase_index]["completed_at"] = datetime.utcnow().isoformat()
        else:
            roadmap[phase_index]["completed_at"] = None

        completed_count = sum(1 for p in roadmap if p.get("status") == "completed")
        current_data["progress"]["completed_phases"] = completed_count
        update_streak(current_data["progress"])

        target_id = roadmap_id or current_data.get("id") or "current"
        now = datetime.utcnow()

        # Update in roadmaps collection if id is specific
        if target_id != "current":
            db.collection("users").document(user_id).collection("roadmaps").document(target_id).update({
                "learning_roadmap.roadmap": roadmap,
                "progress": current_data["progress"],
                "updated_at": now
            })

        # Update active_roadmap/current
        db.collection("users").document(user_id).collection("active_roadmap").document("current").update({
            "learning_roadmap.roadmap": roadmap,
            "progress": current_data["progress"],
            "updated_at": now
        })
        return True

    return False


def update_streak(progress_data: dict):
    now = datetime.utcnow()
    last_active = progress_data.get("last_activity_date")
    
    if last_active:
        last_date = datetime.fromisoformat(last_active).date()
        today = now.date()
        diff = (today - last_date).days
        
        if diff == 1:
            progress_data["streak_days"] += 1
        elif diff > 1:
            progress_data["streak_days"] = 1
    else:
        progress_data["streak_days"] = 1
        
    progress_data["last_activity_date"] = now.isoformat()


def get_student_profile(user_id: str):
    doc = db.collection("users").document(user_id).get()
    if doc.exists:
        data = doc.to_dict()
        return data.get("profile")
    return None


def save_student_profile(user_id: str, profile: dict):
    try:
        db.collection("users").document(user_id).set({
            "profile": profile,
            "updated_at": datetime.utcnow()
        }, merge=True)
        return True
    except Exception as e:
        raise Exception(f"Database error: {str(e)}")


def delete_active_roadmap(user_id: str):
    try:
        ref = db.collection("users").document(user_id).collection("active_roadmap").document("current")
        doc = ref.get()
        
        if doc.exists:
            ref.delete()
            return True
        else:
            return False
    except Exception as e:
        raise Exception(f"Failed to delete roadmap: {str(e)}")

