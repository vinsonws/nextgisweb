from collections import OrderedDict

from geoalchemy2.shape import to_shape
from pyramid.httpexceptions import HTTPBadRequest, HTTPNotFound

from .model import (
    WebMap,
    WebMapScope,
    WebMapAnnotation,
    WM_SETTINGS,
)
from ..env import env
from ..models import DBSession
from ..resource import resource_factory


def annotation_to_dict(obj, request, with_user_info=False):
    result = OrderedDict()

    keys = ('id', 'description', 'style', 'geom', 'public')
    if with_user_info and (obj.public is False):
        keys = keys + ('user_id', 'user',)

    user_id = request.user.id
    result['own'] = user_id == obj.user_id

    for k in keys:
        v = getattr(obj, k)
        if k == 'geom':
            v = to_shape(v).wkt
        if k == 'user' and (v is not None):
            v = v.display_name
        if v is not None:
            result[k] = v
    return result


def annotation_from_dict(obj, data):
    for k in ('description', 'style', 'geom', 'public'):
        if k in data:
            v = data[k]
            if k == 'geom':
                v = 'SRID=3857;' + v
            setattr(obj, k, v)


def check_annotation_enabled(request):
    if not request.env.webmap.options['annotation']:
        raise HTTPNotFound()


def annotation_cget(resource, request):
    check_annotation_enabled(request)
    request.resource_permission(WebMapScope.annotation_read)

    if resource.has_permission(WebMapScope.annotation_manage, request.user):
        return [annotation_to_dict(a, request, with_user_info=True) for a in resource.annotations]

    return [annotation_to_dict(a, request) for a in resource.annotations
            if a.public or (not a.public and a.user_id == request.user.id)]


def annotation_cpost(resource, request):
    check_annotation_enabled(request)
    request.resource_permission(WebMapScope.annotation_write)
    obj = WebMapAnnotation()
    annotation_from_dict(obj, request.json_body)
    if not obj.public:
        obj.user_id = request.user.id
    resource.annotations.append(obj)
    DBSession.flush()
    return dict(id=obj.id)


def annotation_iget(resource, request):
    check_annotation_enabled(request)
    request.resource_permission(WebMapScope.annotation_read)
    obj = WebMapAnnotation.filter_by(webmap_id=resource.id, id=int(
        request.matchdict['annotation_id'])).one()
    with_user_info = resource.has_permission(WebMapScope.annotation_manage, request.user)
    return annotation_to_dict(obj, request, with_user_info)


def annotation_iput(resource, request):
    check_annotation_enabled(request)
    request.resource_permission(WebMapScope.annotation_write)
    obj = WebMapAnnotation.filter_by(webmap_id=resource.id, id=int(
        request.matchdict['annotation_id'])).one()
    annotation_from_dict(obj, request.json_body)
    return dict(id=obj.id)


def annotation_idelete(resource, request):
    check_annotation_enabled(request)
    request.resource_permission(WebMapScope.annotation_write)
    obj = WebMapAnnotation.filter_by(webmap_id=resource.id, id=int(
        request.matchdict['annotation_id'])).one()
    DBSession.delete(obj)
    return None


def settings_get(request):
    result = dict()
    for k, default in WM_SETTINGS.items():
        try:
            v = env.core.settings_get('webmap', k)
            if v is not None:
                result[k] = v
        except KeyError:
            result[k] = default

    return result


def settings_put(request):
    request.require_administrator()

    body = request.json_body
    for k, v in body.items():
        if k in WM_SETTINGS.keys():
            env.core.settings_set('webmap', k, v)
        else:
            raise HTTPBadRequest(explanation="Invalid key '%s'" % k)


def setup_pyramid(comp, config):
    setup_annotations(config)

    comp.settings_view = settings_get

    config.add_route('webmap.settings',
                     '/api/component/webmap/settings') \
        .add_view(settings_get, request_method='GET', renderer='json') \
        .add_view(settings_put, request_method='PUT', renderer='json')


def setup_annotations(config):
    config.add_route(
        'webmap.annotation.collection', r'/api/resource/{id:\d+}/annotation/',
        factory=resource_factory
    ) \
        .add_view(annotation_cget, context=WebMap, request_method='GET', renderer='json') \
        .add_view(annotation_cpost, context=WebMap, request_method='POST', renderer='json')

    config.add_route(
        'webmap.annotation.item', r'/api/resource/{id:\d+}/annotation/{annotation_id:\d+}',
        factory=resource_factory
    ) \
        .add_view(annotation_iget, context=WebMap, request_method='GET', renderer='json') \
        .add_view(annotation_iput, context=WebMap, request_method='PUT', renderer='json') \
        .add_view(annotation_idelete, context=WebMap, request_method='DELETE', renderer='json')
