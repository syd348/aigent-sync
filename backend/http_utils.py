"""HTTPS helpers for macOS/Python installs missing system CA bundles."""

import ssl
import urllib.request
from typing import Optional

try:
    import certifi
except ImportError:
    certifi = None  # type: ignore


def ssl_context() -> ssl.SSLContext:
    if certifi is not None:
        return ssl.create_default_context(cafile=certifi.where())
    return ssl.create_default_context()


def urlopen(req: urllib.request.Request, timeout: float = 10):
    return urllib.request.urlopen(req, timeout=timeout, context=ssl_context())
