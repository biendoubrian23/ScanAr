"""
Boot-time recovery: any model still in `status='processing'` after a worker
restart is a zombie — the user's progress widget is stuck. We mark them as
`failed` with a clear error so the UI unblocks immediately.

Triggered once at worker startup, before the main job loop begins listening.
"""

import os
from datetime import datetime, timedelta, timezone

from utils.logger import logger
from utils.supabase_client import get_admin_client

STALE_JOB_MINUTES = int(os.getenv("STALE_JOB_MINUTES", "25"))


def recover_stale_jobs() -> int:
    """
    Mark stale `processing` models as `failed`. Returns the number of rows touched.
    Never raises — recovery must not prevent the worker from starting.
    """
    try:
        sb = get_admin_client()
        cutoff = (datetime.now(timezone.utc) - timedelta(minutes=STALE_JOB_MINUTES)).isoformat()

        result = sb.table("models_3d").select("id,name,current_step,updated_at") \
            .eq("status", "processing") \
            .lt("updated_at", cutoff) \
            .execute()

        stale = result.data or []
        if not stale:
            logger.info(f"Recovery: no stale jobs (older than {STALE_JOB_MINUTES} min) found")
            return 0

        logger.warning(f"Recovery: marking {len(stale)} stale job(s) as failed")
        for m in stale:
            step = m.get("current_step") or "unknown"
            err = f"[{step}] Job interrompu (worker redémarré). Réessayez l'upload."
            try:
                sb.table("models_3d").update({
                    "status": "failed",
                    "progress": 0,
                    "error_message": err,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", m["id"]).execute()
                logger.warning(f"Recovery: {m['id']} ({m.get('name')!r}) → failed at step '{step}'")
            except Exception as e:
                logger.error(f"Recovery: failed to update {m['id']}: {e}")

        return len(stale)
    except Exception as e:
        logger.error(f"Recovery: scan failed ({e}) — skipping")
        return 0
