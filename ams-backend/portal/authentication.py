from rest_framework.authentication import SessionAuthentication


# Use standard SessionAuthentication — CSRF is now properly enforced.
# The frontend sends X-CSRFToken header on all unsafe requests.
