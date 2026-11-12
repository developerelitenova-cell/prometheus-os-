"""
Servicio de recordatorios de vencimiento (Req. 2.1):
Programa alertas exactas 48h, 24h y 2h antes de `due_date` en zona horaria America/Bogota (UTC-5).
Maneja cancelación al completar, recalculo al reprogramar y disparo inmediato si falta < 2h.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

try:
    from zoneinfo import ZoneInfo
    BOGOTA_TZ = ZoneInfo("America/Bogota")
except Exception:
    BOGOTA_TZ = timezone(timedelta(hours=-5))

REMINDER_OFFSETS: List[Tuple[str, timedelta]] = [
    ("48h", timedelta(hours=48)),
    ("24h", timedelta(hours=24)),
    ("2h", timedelta(hours=2)),
]

REMINDER_LABELS = {
    "48h": "en 48 horas",
    "24h": "en 24 horas",
    "2h": "en 2 horas",
    "immediate": "en menos de 2 horas",
}


def get_bogota_now(now: Optional[datetime] = None) -> datetime:
    if now is None:
        return datetime.now(BOGOTA_TZ)
    if now.tzinfo is None:
        return now.replace(tzinfo=BOGOTA_TZ)
    return now.astimezone(BOGOTA_TZ)


def parse_due_datetime_bogota(due_date: Any, due_time: Optional[str] = None) -> Optional[datetime]:
    """Convierte `due_date` (+ `due_time` opcional) a datetime aware en America/Bogota."""
    if not due_date:
        return None
    if isinstance(due_date, datetime):
        if due_date.tzinfo is None:
            return due_date.replace(tzinfo=BOGOTA_TZ)
        return due_date.astimezone(BOGOTA_TZ)

    raw = str(due_date).strip()
    if not raw:
        return None

    # Caso fecha sin hora (YYYY-MM-DD)
    if len(raw) == 10 and "T" not in raw and " " not in raw:
        time_part = (due_time or "23:59:59").strip()
        if len(time_part) == 5:
            time_part = f"{time_part}:00"
        dt = datetime.fromisoformat(f"{raw}T{time_part}")
        return dt.replace(tzinfo=BOGOTA_TZ)

    # ISO con sufijo Z o offset
    normalized = raw.replace("Z", "+00:00")
    dt = datetime.fromisoformat(normalized)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=BOGOTA_TZ)
    return dt.astimezone(BOGOTA_TZ)


def compute_reminder_triggers(
    due_dt: datetime,
    now: Optional[datetime] = None,
) -> List[Tuple[str, datetime, bool]]:
    """
    Calcula los momentos exactos de disparo en UTC.
    Retorna lista de (reminder_type, trigger_at_utc, is_immediate).
    - Programa 48h, 24h y 2h si cada trigger > now.
    - Si falta > 0 y < 2 horas para `due_dt`, dispara un recordatorio inmediato.
    - Si `due_dt <= now`, no programa recordatorios futuros.
    """
    now_bogota = get_bogota_now(now)
    due_bogota = get_bogota_now(due_dt)

    if due_bogota <= now_bogota:
        return []

    triggers: List[Tuple[str, datetime, bool]] = []
    remaining = due_bogota - now_bogota

    for label, delta in REMINDER_OFFSETS:
        trigger_bogota = due_bogota - delta
        if trigger_bogota > now_bogota:
            triggers.append((label, trigger_bogota.astimezone(timezone.utc), False))

    if remaining < timedelta(hours=2):
        triggers.append(("immediate", now_bogota.astimezone(timezone.utc), True))

    return triggers


class ReminderService:
    """Orquesta programación, cancelación, recalculo y procesamiento de recordatorios."""

    def __init__(self, supabase_client=None, notifier=None):
        self.supabase = supabase_client
        self.notifier = notifier

    def initialize_clients(self, supabase_client, notifier=None):
        self.supabase = supabase_client
        if notifier is not None:
            self.notifier = notifier

    def cancel_pending_reminders(self, task_id: str, now: Optional[datetime] = None) -> int:
        if not self.supabase or not task_id:
            return 0
        now_utc = get_bogota_now(now).astimezone(timezone.utc).isoformat()
        try:
            res = (
                self.supabase.table("task_reminders")
                .update({"status": "cancelled", "cancelled_at": now_utc, "updated_at": now_utc})
                .eq("task_id", task_id)
                .eq("status", "pending")
                .execute()
            )
            return len(res.data or [])
        except Exception as exc:
            print(f"[ReminderService] Error cancelando recordatorios de {task_id}: {exc}")
            return 0

    def schedule_task_reminders(
        self,
        task_id: str,
        assigned_to: Optional[str],
        due_date: Any,
        title: str,
        due_time: Optional[str] = None,
        status: str = "pending",
        now: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Recalcula y guarda la cola de recordatorios de una tarea.
        Cancela los pendientes anteriores antes de generar los nuevos.
        """
        if not task_id:
            return {"scheduled": [], "immediate_sent": False, "cancelled": 0}

        cancelled_count = self.cancel_pending_reminders(task_id, now=now)

        if status in ("completed", "cancelled") or not assigned_to or not due_date:
            return {"scheduled": [], "immediate_sent": False, "cancelled": cancelled_count}

        due_dt = parse_due_datetime_bogota(due_date, due_time)
        if not due_dt:
            return {"scheduled": [], "immediate_sent": False, "cancelled": cancelled_count}

        triggers = compute_reminder_triggers(due_dt, now=now)
        if not triggers:
            return {"scheduled": [], "immediate_sent": False, "cancelled": cancelled_count}

        scheduled_rows: List[Dict[str, Any]] = []
        immediate_sent = False
        now_utc_iso = get_bogota_now(now).astimezone(timezone.utc).isoformat()
        due_str_bogota = due_dt.strftime("%Y-%m-%d %H:%M (%Z)")

        for r_type, trigger_utc, is_immediate in triggers:
            row = {
                "task_id": task_id,
                "profile_id": assigned_to,
                "reminder_type": r_type,
                "trigger_at": trigger_utc.isoformat(),
                "status": "sent" if is_immediate else "pending",
                "sent_at": now_utc_iso if is_immediate else None,
                "cancelled_at": None,
                "updated_at": now_utc_iso,
            }
            if self.supabase:
                try:
                    self.supabase.table("task_reminders").upsert(
                        row, on_conflict="task_id,reminder_type"
                    ).execute()
                except Exception as exc:
                    print(f"[ReminderService] Error guardando trigger {r_type} para {task_id}: {exc}")

            if is_immediate and self.notifier:
                msg = (
                    f'Recordatorio urgente: La tarea "{title}" vence {REMINDER_LABELS["immediate"]} '
                    f'({due_str_bogota}).'
                )
                self.notifier.notify_user(
                    profile_id=assigned_to,
                    notif_type="due_reminder",
                    message=msg,
                    action_url="/workspace",
                    metadata={"task_id": task_id, "reminder_type": "immediate", "due_date": due_str_bogota},
                    email_subject=f"Recordatorio inmediato: {title}",
                )
                immediate_sent = True

            scheduled_rows.append(row)

        return {
            "scheduled": scheduled_rows,
            "immediate_sent": immediate_sent,
            "cancelled": cancelled_count,
        }

    def process_due_reminders(self, now: Optional[datetime] = None) -> Dict[str, int]:
        """
        Ejecutado por el job periódico / endpoint cron.
        Busca recordatorios `pending` cuyo `trigger_at <= now` y los envía si la tarea sigue abierta.
        """
        if not self.supabase:
            return {"processed": 0, "sent": 0, "cancelled": 0}

        now_bogota = get_bogota_now(now)
        now_utc_iso = now_bogota.astimezone(timezone.utc).isoformat()

        try:
            res = (
                self.supabase.table("task_reminders")
                .select("id, task_id, profile_id, reminder_type, trigger_at")
                .eq("status", "pending")
                .lte("trigger_at", now_utc_iso)
                .execute()
            )
            pending = res.data or []
        except Exception as exc:
            print(f"[ReminderService] Error consultando recordatorios pendientes: {exc}")
            return {"processed": 0, "sent": 0, "cancelled": 0}

        sent_count = 0
        cancelled_count = 0

        for rem in pending:
            task_id = rem["task_id"]
            rem_id = rem["id"]
            r_type = rem["reminder_type"]

            try:
                task_res = (
                    self.supabase.table("tasks")
                    .select("id, title, status, due_date, due_time, assigned_to")
                    .eq("id", task_id)
                    .single()
                    .execute()
                )
                task = task_res.data
            except Exception:
                task = None

            if not task or task.get("status") in ("completed", "cancelled"):
                self.supabase.table("task_reminders").update(
                    {"status": "cancelled", "cancelled_at": now_utc_iso, "updated_at": now_utc_iso}
                ).eq("id", rem_id).execute()
                cancelled_count += 1
                continue

            recipient = task.get("assigned_to") or rem["profile_id"]
            due_dt = parse_due_datetime_bogota(task.get("due_date"), task.get("due_time"))
            due_label = due_dt.strftime("%Y-%m-%d %H:%M") if due_dt else str(task.get("due_date") or "")
            time_phrase = REMINDER_LABELS.get(r_type, r_type)
            msg = f'Recordatorio de vencimiento: La tarea "{task["title"]}" vence {time_phrase} ({due_label} America/Bogota).'

            if self.notifier and recipient:
                self.notifier.notify_user(
                    profile_id=recipient,
                    notif_type="due_reminder",
                    message=msg,
                    action_url="/workspace",
                    metadata={"task_id": task_id, "reminder_type": r_type, "due_date": due_label},
                    email_subject=f"Recordatorio ({r_type}): {task['title']}",
                )

            self.supabase.table("task_reminders").update(
                {"status": "sent", "sent_at": now_utc_iso, "updated_at": now_utc_iso}
            ).eq("id", rem_id).execute()
            sent_count += 1

        return {"processed": len(pending), "sent": sent_count, "cancelled": cancelled_count}


reminder_service = ReminderService()

