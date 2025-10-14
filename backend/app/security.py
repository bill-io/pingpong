"""Utilities for hashing and verifying agent passwords."""

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Return a secure hash for the given password."""

    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """Check whether the provided password matches the stored hash."""

    return pwd_context.verify(password, hashed)

