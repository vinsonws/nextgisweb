# -*- coding: utf-8 -*-
from __future__ import division, absolute_import, print_function, unicode_literals

import pytest
from pyramid.config import Configurator
from zope.interface import implementer

from nextgisweb.core.exception import IUserException
from nextgisweb.pyramid import exception


@implementer(IUserException)
class ErrorTest(Exception):
    title = "Test title"
    message = "Test message"
    detail = "Test detail"
    data = dict()
    http_status_code = 418


class ExceptionTest(Exception):
    pass


@pytest.fixture(scope='module')
def app():
    from webtest import TestApp

    settings = dict()
    settings['error.err_response'] = exception.json_error_response
    settings['error.exc_response'] = exception.json_error_response

    config = Configurator(settings=settings)
    config.include(exception)

    config.add_tween(
        'nextgisweb.pyramid.util.header_encoding_tween_factory',
        over=('nextgisweb.pyramid.exception.unhandled_exception_tween_factory', ))

    def view_error(request):
        raise ErrorTest()

    config.add_route('error', '/error')
    config.add_view(view_error, route_name='error')

    def view_exception(request):
        raise ExceptionTest()

    config.add_route('exception', '/exception')
    config.add_view(view_exception, route_name='exception')

    yield TestApp(config.make_wsgi_app())


def test_error(app):
    resp = app.get('/error', status=418)
    rjson = resp.json

    del rjson['guru_meditation']
    del rjson['traceback']

    assert rjson == dict(
        title="Test title", message="Test message", detail="Test detail",
        exception='nextgisweb.pyramid.test.test_exception.ErrorTest',
        status_code=418)


def test_exception(app):
    resp = app.get('/exception', status=500)
    rjson = resp.json

    del rjson['guru_meditation']
    del rjson['traceback']

    assert rjson.get('message', None) is not None
    del rjson['message']

    assert rjson == dict(
        title="Internal server error", status_code=500,
        exception='nextgisweb.pyramid.exception.InternalServerError')
