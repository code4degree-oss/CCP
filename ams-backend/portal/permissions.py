from rest_framework import permissions


def _get_role_slug(user):
    """Safely get role slug — returns None for anonymous or unassigned users."""
    if not hasattr(user, 'role') or user.role is None:
        return None
    return user.role.slug


class IsBranchAdminOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return _get_role_slug(request.user) in ['branch-admin', 'super-admin']


class CanCreateAdmission(permissions.BasePermission):
    """Only Employee and Branch Admin can create admissions (POST). All other methods allowed."""
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        slug = _get_role_slug(request.user)
        return slug in ('employee', 'branch-admin')


class CanCreateEnquiry(permissions.BasePermission):
    """Only Employee and Branch Admin can create enquiries (POST). All other methods allowed."""
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        slug = _get_role_slug(request.user)
        return slug in ('employee', 'branch-admin')


class CanDeleteStudent(permissions.BasePermission):
    """Only Branch Admin and Super Admin can delete students. All other methods allowed."""
    def has_permission(self, request, view):
        if request.method != 'DELETE':
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return _get_role_slug(request.user) in ['branch-admin', 'super-admin']


class CanEditFinalizedAdmission(permissions.BasePermission):
    """Once an admission is finalized, only Branch Admin / Super Admin can edit it."""
    def has_object_permission(self, request, view, obj):
        if request.method not in ('PUT', 'PATCH'):
            return True
        if not getattr(obj, 'is_finalized', False):
            return True
        # Finalized — only admins can edit
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return _get_role_slug(request.user) in ['branch-admin', 'super-admin']
