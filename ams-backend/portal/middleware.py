"""
Security middleware for rate limiting, brute-force protection,
and request-size limiting.

Uses Django's built-in cache framework (LocMemCache by default)
to track request counts — zero external dependencies required.
"""

import time
import logging
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger('portal.security')


def get_client_ip(request):
    """Extract the real client IP, respecting X-Forwarded-For from reverse proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Take the first IP (the original client)
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


# ── Login Brute-Force Protection ─────────────────────────────
# Locks out an IP after N failed login attempts within a time window.

class LoginRateLimitMiddleware:
    """
    Tracks failed login attempts per IP address.
    After MAX_ATTEMPTS failures within WINDOW seconds, the IP is
    locked out for LOCKOUT seconds.

    Configurable via settings:
        LOGIN_RATELIMIT_MAX_ATTEMPTS  (default 5)
        LOGIN_RATELIMIT_WINDOW        (default 300  = 5 minutes)
        LOGIN_RATELIMIT_LOCKOUT       (default 900  = 15 minutes)
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.max_attempts = getattr(settings, 'LOGIN_RATELIMIT_MAX_ATTEMPTS', 5)
        self.window = getattr(settings, 'LOGIN_RATELIMIT_WINDOW', 300)
        self.lockout = getattr(settings, 'LOGIN_RATELIMIT_LOCKOUT', 900)

    def __call__(self, request):
        # Only intercept POST requests to the login endpoint
        if request.path.rstrip('/') == '/api/login' and request.method == 'POST':
            ip = get_client_ip(request)
            lockout_key = f'login_lockout:{ip}'
            attempts_key = f'login_attempts:{ip}'

            # Check if currently locked out
            if cache.get(lockout_key):
                ttl = cache.ttl(lockout_key) if hasattr(cache, 'ttl') else self.lockout
                logger.warning(f'Login blocked for locked-out IP: {ip}')
                return JsonResponse(
                    {
                        'detail': f'Too many failed login attempts. Try again in {self.lockout // 60} minutes.',
                        'retry_after': self.lockout,
                    },
                    status=429,
                )

            # Let the request proceed
            response = self.get_response(request)

            # If the login failed (401), increment the counter
            if response.status_code == 401:
                attempts = cache.get(attempts_key, 0) + 1
                cache.set(attempts_key, attempts, self.window)
                remaining = self.max_attempts - attempts

                if attempts >= self.max_attempts:
                    # Lock out the IP
                    cache.set(lockout_key, True, self.lockout)
                    cache.delete(attempts_key)
                    logger.warning(
                        f'IP {ip} locked out after {attempts} failed login attempts.'
                    )
                    return JsonResponse(
                        {
                            'detail': f'Account locked due to {attempts} failed attempts. Try again in {self.lockout // 60} minutes.',
                            'retry_after': self.lockout,
                        },
                        status=429,
                    )
                else:
                    logger.info(
                        f'Failed login from {ip}: attempt {attempts}/{self.max_attempts}'
                    )

            elif response.status_code == 200:
                # Successful login — clear the counter
                cache.delete(attempts_key)

            return response

        return self.get_response(request)


# ── Request Size Limiter ──────────────────────────────────────
# Rejects requests with bodies larger than MAX_BODY_SIZE to prevent
# bandwidth abuse via oversized payloads.

class RequestSizeLimitMiddleware:
    """
    Rejects requests with a Content-Length exceeding the configured
    maximum. File-upload endpoints can be exempted.

    Configurable via settings:
        MAX_REQUEST_BODY_SIZE       (default 5 * 1024 * 1024 = 5 MB)
        MAX_UPLOAD_BODY_SIZE        (default 20 * 1024 * 1024 = 20 MB)
        UPLOAD_ENDPOINT_PREFIXES    (default ['/api/admissions/'])
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.max_body = getattr(settings, 'MAX_REQUEST_BODY_SIZE', 5 * 1024 * 1024)
        self.max_upload = getattr(settings, 'MAX_UPLOAD_BODY_SIZE', 20 * 1024 * 1024)
        self.upload_prefixes = getattr(
            settings, 'UPLOAD_ENDPOINT_PREFIXES', ['/api/admissions/']
        )

    def __call__(self, request):
        content_length = request.META.get('CONTENT_LENGTH')
        if content_length:
            try:
                length = int(content_length)
            except (ValueError, TypeError):
                length = 0

            # Choose limit based on whether this is a file-upload endpoint
            is_upload = any(request.path.startswith(p) for p in self.upload_prefixes)
            limit = self.max_upload if is_upload else self.max_body

            if length > limit:
                logger.warning(
                    f'Oversized request rejected: {length} bytes from {get_client_ip(request)} '
                    f'to {request.path}'
                )
                return JsonResponse(
                    {
                        'detail': f'Request body too large. Maximum allowed: {limit // (1024 * 1024)} MB.',
                    },
                    status=413,
                )

        return self.get_response(request)


# ── General API Rate Limiter (per-IP) ─────────────────────────
# A simple sliding-window rate limiter for ALL endpoints.
# Works alongside DRF's built-in throttling as an extra safety net.

class GlobalIPRateLimitMiddleware:
    """
    Limits each IP to N requests per WINDOW across all endpoints.
    This catches automated scraping and bot scrolling attacks that
    hit many different URLs rapidly.

    Configurable via settings:
        GLOBAL_RATELIMIT_REQUESTS   (default 200)
        GLOBAL_RATELIMIT_WINDOW     (default 60 = 1 minute)
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.max_requests = getattr(settings, 'GLOBAL_RATELIMIT_REQUESTS', 200)
        self.window = getattr(settings, 'GLOBAL_RATELIMIT_WINDOW', 60)

    def __call__(self, request):
        ip = get_client_ip(request)
        cache_key = f'global_ratelimit:{ip}'

        # Get current request count
        request_count = cache.get(cache_key, 0)

        if request_count >= self.max_requests:
            logger.warning(
                f'Global rate limit exceeded for IP {ip}: '
                f'{request_count}/{self.max_requests} requests in {self.window}s'
            )
            return JsonResponse(
                {
                    'detail': 'Rate limit exceeded. Please slow down.',
                    'retry_after': self.window,
                },
                status=429,
            )

        # Increment counter
        if request_count == 0:
            cache.set(cache_key, 1, self.window)
        else:
            # Use cache.incr for atomic increment; fall back to set if needed
            try:
                cache.incr(cache_key)
            except ValueError:
                cache.set(cache_key, request_count + 1, self.window)

        response = self.get_response(request)

        # Add rate-limit headers so clients can self-regulate
        response['X-RateLimit-Limit'] = str(self.max_requests)
        response['X-RateLimit-Remaining'] = str(
            max(0, self.max_requests - request_count - 1)
        )

        return response
