"""
Servicio centralizado de notificaciones internas (Supabase) y despacho de correo
desacoplado (listo para SMTP o Resend cuando se configuren credenciales).
"""

import json
import os
import smtplib
import urllib.request
from email.message import EmailMessage
from typing import Any, Dict, List, Optional


class EmailDispatcher:
    """Adaptador desacoplado para envío de correo electrónico (Resend o SMTP)."""

    def is_configured(self) -> bool:
        return bool(os.getenv("RESEND_API_KEY") or os.getenv("SMTP_HOST"))

    def send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Envía un correo si hay proveedor configurado; de lo contrario retorna False sin fallar."""
        if not to_email:
            return False

        resend_key = os.getenv("RESEND_API_KEY")
        if resend_key:
            return self._send_via_resend(resend_key, to_email, subject, body)

        smtp_host = os.getenv("SMTP_HOST")
        if smtp_host:
            return self._send_via_smtp(smtp_host, to_email, subject, body)

        return False

    def _send_via_resend(self, api_key: str, to_email: str, subject: str, body: str) -> bool:
        sender = os.getenv("EMAIL_FROM", "Nova Work <notificaciones@novawork.local>")
        payload = json.dumps({
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "text": body,
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return 200 <= resp.status < 300
        except Exception as exc:
            print(f"[EmailDispatcher] Error enviando vía Resend a {to_email}: {exc}")
            return False

    def _send_via_smtp(self, smtp_host: str, to_email: str, subject: str, body: str) -> bool:
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_pass = os.getenv("SMTP_PASSWORD", "")
        sender = os.getenv("EMAIL_FROM", smtp_user or "notificaciones@novawork.local")

        msg = EmailMessage()
        msg["From"] = sender
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content(body)

        try:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                if os.getenv("SMTP_USE_TLS", "true").lower() == "true":
                    server.starttls()
                if smtp_user and smtp_pass:
                    server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            return True
        except Exception as exc:
            print(f"[EmailDispatcher] Error enviando vía SMTP a {to_email}: {exc}")
            return False


class NotificationService:
    """Gestiona notificaciones in-app en Supabase y disparo opcional por email."""

    def __init__(self, supabase_client=None, email_dispatcher: Optional[EmailDispatcher] = None):
        self.supabase = supabase_client
        self.email_dispatcher = email_dispatcher or EmailDispatcher()

    def initialize_clients(self, supabase_client):
        self.supabase = supabase_client

    def _get_user_email(self, profile_id: str) -> Optional[str]:
        if not self.supabase or not profile_id:
            return None
        try:
            res = self.supabase.table("profiles").select("email").eq("id", profile_id).single().execute()
            if res.data and res.data.get("email"):
                return res.data["email"]
        except Exception:
            pass
        try:
            auth_user = self.supabase.auth.admin.get_user_by_id(profile_id)
            if auth_user and getattr(auth_user, "user", None):
                return auth_user.user.email
        except Exception:
            pass
        return None

    def _insert_notification(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.supabase:
            return None
        try:
            res = self.supabase.table("notifications").insert(payload).execute()
            return res.data[0] if res.data else payload
        except Exception as exc:
            # Fallback si aún no se ha corrido la migración de columna `metadata` o constraint
            err_str = str(exc)
            fallback_payload = dict(payload)
            if "metadata" in err_str:
                fallback_payload.pop("metadata", None)
            if "notifications_type_check" in err_str:
                fallback_payload["type"] = "system_alert"
            try:
                res = self.supabase.table("notifications").insert(fallback_payload).execute()
                return res.data[0] if res.data else fallback_payload
            except Exception as inner_exc:
                print(f"[NotificationService] Error insertando notificación: {inner_exc}")
                return None

    def notify_user(
        self,
        profile_id: str,
        notif_type: str,
        message: str,
        action_url: str = "/workspace",
        metadata: Optional[Dict[str, Any]] = None,
        email_subject: Optional[str] = None,
        send_email: bool = True,
    ) -> Optional[Dict[str, Any]]:
        if not profile_id or not message:
            return None

        payload: Dict[str, Any] = {
            "profile_id": profile_id,
            "type": notif_type,
            "message": message,
            "action_url": action_url,
            "is_read": False,
        }
        if metadata:
            payload["metadata"] = metadata

        created = self._insert_notification(payload)

        if send_email and self.email_dispatcher.is_configured():
            email = self._get_user_email(profile_id)
            if email:
                self.email_dispatcher.send_email(
                    to_email=email,
                    subject=email_subject or "Notificación Nova Work",
                    body=message,
                )
        return created

    def notify_task_assigned(
        self,
        profile_id: str,
        task_id: str,
        title: str,
        due_date: Optional[str] = None,
        priority: str = "medium",
    ) -> Optional[Dict[str, Any]]:
        due_info = f" Fecha límite: {due_date}." if due_date else ""
        msg = f'Nueva tarea asignada: "{title}" (Prioridad: {priority}).{due_info}'
        return self.notify_user(
            profile_id=profile_id,
            notif_type="task_assigned",
            message=msg,
            action_url="/workspace",
            metadata={"task_id": task_id, "priority": priority, "due_date": due_date},
            email_subject=f"Nueva tarea asignada: {title}",
        )

    def _get_hr_and_master_recipient_ids(self) -> List[str]:
        """Obtiene los IDs de Master Admins y personal de RRHH / Talento Humano."""
        if not self.supabase:
            return []
        recipients: List[str] = []
        try:
            res = (
                self.supabase.table("profiles")
                .select("id, is_master_admin, roles(name, access_level)")
                .execute()
            )
            for row in (res.data or []):
                is_master = bool(row.get("is_master_admin"))
                role_obj = row.get("roles") or {}
                role_name = (role_obj.get("name") or "").lower()
                is_hr = any(
                    kw in role_name
                    for kw in ("rrhh", "recursos humanos", "gestión humana", "gestion humana", "talento humano")
                )
                if is_master or is_hr:
                    recipients.append(row["id"])
        except Exception as exc:
            print(f"[NotificationService] Error consultando RRHH/Admins: {exc}")
        return list(dict.fromkeys(recipients))

    def notify_role_change(
        self,
        affected_profile_id: str,
        employee_name: str,
        changed_fields: Dict[str, Any],
        summary: str,
        changed_by: Optional[str] = None,
        role_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Notifica al colaborador afectado y a RRHH/Master Admin ante cambios en el cargo."""
        if not changed_fields:
            return []

        if self.supabase:
            try:
                self.supabase.table("role_change_audit_logs").insert({
                    "profile_id": affected_profile_id,
                    "role_id": role_id,
                    "changed_by": changed_by,
                    "changed_fields": changed_fields,
                    "summary": summary,
                }).execute()
            except Exception as exc:
                print(f"[NotificationService] Audit log opcional omitido: {exc}")

        results: List[Dict[str, Any]] = []
        emp_msg = f"Actualización en tu cargo/perfil: {summary}"
        res_emp = self.notify_user(
            profile_id=affected_profile_id,
            notif_type="role_updated",
            message=emp_msg,
            action_url="/workspace",
            metadata={"profile_id": affected_profile_id, "changed_fields": changed_fields},
            email_subject="Actualización de información de cargo - Nova Work",
        )
        if res_emp:
            results.append(res_emp)

        hr_ids = self._get_hr_and_master_recipient_ids()
        hr_msg = f"Cambio de cargo registrado para {employee_name}: {summary}"
        for hr_id in hr_ids:
            if hr_id == affected_profile_id:
                continue
            res_hr = self.notify_user(
                profile_id=hr_id,
                notif_type="role_updated",
                message=hr_msg,
                action_url="/rrhh",
                metadata={"profile_id": affected_profile_id, "changed_fields": changed_fields},
                email_subject=f"Auditoría RRHH: Cambio de cargo ({employee_name})",
            )
            if res_hr:
                results.append(res_hr)

        return results

    def resolve_immediate_supervisors(self, employee_profile_id: str) -> List[Dict[str, Any]]:
        """Resuelve candidatos a jefe inmediato: primero líder de la misma área y luego dirección/master."""
        if not self.supabase or not employee_profile_id:
            return []
        try:
            res = (
                self.supabase.table("profiles")
                .select("id, full_name, email, is_master_admin, role_id, roles(id, name, area_id, access_level)")
                .execute()
            )
            rows = res.data or []
        except Exception as exc:
            print(f"[NotificationService] Error consultando supervisores: {exc}")
            return []

        emp_row = next((r for r in rows if r.get("id") == employee_profile_id), None)
        emp_role = (emp_row or {}).get("roles") or {}
        emp_area_id = emp_role.get("area_id")
        emp_access = emp_role.get("access_level")
        if emp_access is None:
            emp_access = 3

        area_leaders: List[Dict[str, Any]] = []
        executives: List[Dict[str, Any]] = []

        for row in rows:
            pid = row.get("id")
            if not pid or pid == employee_profile_id:
                continue
            role_obj = row.get("roles") or {}
            role_area_id = role_obj.get("area_id")
            role_access = role_obj.get("access_level")
            is_master = bool(row.get("is_master_admin"))

            if (
                emp_area_id
                and role_area_id == emp_area_id
                and role_access in (1, 2)
                and role_access < emp_access
            ):
                area_leaders.append(row)
            elif role_access == 1 or is_master:
                executives.append(row)

        area_leaders.sort(key=lambda r: (0 if (r.get("roles") or {}).get("access_level") == 2 else 1))
        return area_leaders if area_leaders else executives

    def notify_supervisor_report(
        self,
        supervisor_profile_id: str,
        employee_id: str,
        employee_name: str,
        role_name: str,
        date_str: str,
        compliance_percentage: float,
        completed_tasks: int,
        total_tasks: int,
        unfulfilled_tasks: int = 0,
        export_format: str = "pdf",
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Envía al jefe inmediato el resumen de cumplimiento operativo vía in-app + correo."""
        fmt_upper = (export_format or "pdf").upper()
        unfulfilled_part = f", {unfulfilled_tasks} no ejecutadas" if unfulfilled_tasks > 0 else ""
        notes_part = f" Observaciones: {notes.strip()}" if notes and notes.strip() else ""
        msg = (
            f"Reporte operativo de {employee_name} ({role_name}) · Jornada {date_str}: "
            f"{compliance_percentage}% de cumplimiento ({completed_tasks}/{total_tasks} completadas{unfulfilled_part}). "
            f"Formato generado: {fmt_upper}.{notes_part}"
        )
        return self.notify_user(
            profile_id=supervisor_profile_id,
            notif_type="message",
            message=msg,
            action_url=f"/workspace?view_as={employee_id}",
            metadata={
                "kind": "supervisor_daily_report",
                "employee_id": employee_id,
                "employee_name": employee_name,
                "role_name": role_name,
                "date_str": date_str,
                "compliance_percentage": compliance_percentage,
                "completed_tasks": completed_tasks,
                "total_tasks": total_tasks,
                "unfulfilled_tasks": unfulfilled_tasks,
                "export_format": export_format,
                "notes": notes,
            },
            email_subject=f"Reporte de Cumplimiento Operativo · {employee_name} ({date_str})",
            send_email=True,
        )


notification_service = NotificationService()

