from string import Template

TEMPLATES = {
    ("SMS","TABLE_READY","el"): Template("Γεια σου $name! Το τραπέζι $table είναι έτοιμο. Έλα στο desk σε $mins λεπτά.")
}

def render(channel: str, key: str, locale: str = "en", **kwargs) -> str:
    return TEMPLATES[(channel, key, locale)].substitute(**kwargs)
