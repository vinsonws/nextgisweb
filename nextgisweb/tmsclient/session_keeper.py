import requests


_sessions = dict()  # TODO: clear session objects


__all__ = ['get_session']


def get_session(key, scheme, username, password):
    if key in _sessions:
        return _sessions[key]

    session = requests.Session()

    adapter = requests.adapters.HTTPAdapter(
        pool_connections=500,
        pool_maxsize=500
    )
    session.mount(scheme + '://', adapter)

    if username is not None:
        session.auth = (username, password)

    _sessions[key] = session

    return session
