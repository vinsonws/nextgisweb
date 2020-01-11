# -*- coding: utf-8 -*-
from __future__ import division, unicode_literals, print_function, absolute_import
import re
import six


class OptionType(object):
    OTYPE_MAPPING = {}

    @classmethod
    def normalize(cls, otype):
        if isinstance(otype, OptionType):
            return otype
        elif issubclass(otype, OptionType):
            return otype()
        elif otype in cls.OTYPE_MAPPING:
            return cls.OTYPE_MAPPING[otype]
        else:
            raise TypeError("Invalid option type!")

    def __str__(self):
        return 'unknown'

    def loads(self, value):
        raise NotImplemented()

    def dumps(self, value):
        raise NotImplemented()


class Text(OptionType):

    def __str__(self):
        return 'text'

    def loads(self, value):
        return value

    def dumps(self, value):
        return value if value is not None else ''


class Boolean(OptionType):

    def __str__(self):
        return 'boolean'

    def loads(self, value):
        lw = value.lower()
        if lw in ('true', 'yes'):
            return True
        elif lw in ('false', 'no'):
            return False
        else:
            raise ValueError("Invalid boolean value!")

    def dumps(self, value):
        return {True: 'true', False: 'false', None: ''}[value] \
            if value is not None else ''


class Integer(OptionType):

    def __str__(self):
        return 'integer'

    def loads(self, value):
        return int(value)

    def dumps(self, value):
        return str(value) if value is not None else ''


class List(OptionType):

    def __init__(self, otype=str, separator=r'\s*\,\s*'):
        self._otype = OptionType.normalize(otype)
        self._separator = separator

    def __str__(self):
        return "list<{}>".format(self._otype)

    def loads(self, value):
        return [self._otype.loads(v) for v in re.split(self._separator, value)]

    def dumps(self, value):
        return ', '.join(value) if value is not None else ''


OptionType.OTYPE_MAPPING[six.text_type] = Text()
OptionType.OTYPE_MAPPING[bool] = Boolean()
OptionType.OTYPE_MAPPING[int] = Integer()
OptionType.OTYPE_MAPPING[list] = List()
