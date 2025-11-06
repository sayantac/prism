from typing import Optional

from fastapi import Request


def get_client_ip(request: Request) -> Optional[str]:
    """
    Extract client IP address from request, considering proxy headers.
    """

    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    if hasattr(request, "client") and request.client:
        return request.client.host

    return None


def get_user_agent(request: Request) -> Optional[str]:
    """
    Extract User-Agent from request headers.
    """
    return request.headers.get("User-Agent")


def get_session_id(request: Request) -> Optional[str]:
    """
    Extract session ID from request (if available).
    """

    return request.cookies.get("session_id") or request.headers.get("X-Session-ID")


def get_request_id(request: Request) -> Optional[str]:
    """
    Extract request ID for tracing (if available).
    """
    return request.headers.get("X-Request-ID") or request.headers.get("X-Trace-ID")
