import io
import os
import os.path
import fnmatch
from importlib import import_module
from pathlib import Path
from pkg_resources import resource_filename

from babel.support import Translations as BabelTranslations

from ..lib.logging import logger
from ..package import pkginfo


class Translations(BabelTranslations):
    def scandir(self, directory, locale):
        mofiles = []
        for root, dirnames, filenames in os.walk(directory):
            for fn in fnmatch.filter(filenames, '*.mo'):
                mofiles.append(os.path.join(root, fn)[len(directory) + 1:])

        for mofile in mofiles:
            flocale = mofile.split(os.sep, 1)[0]
            fdomain = os.path.split(mofile)[1][:-3]
            if flocale != locale:
                continue
            with open(os.path.join(directory, mofile), 'rb') as fp:
                dtrans = Translations(fp=fp, domain=fdomain)
            self.add(dtrans)

    def load_envcomp(self, env, locale):
        self.locale = locale
        for comp_id, comp in env._components.items():
            package_path = Path(resource_filename(pkginfo.comp_pkg(comp_id), '')).parent

            mod = import_module(pkginfo.comp_mod(comp_id))
            locale_path = Path(mod.__path__[0]) / 'locale'
            mo_path = locale_path / '{}.mo'.format(locale)

            if mo_path.is_file():
                logger.debug(
                    "Loading component [%s] translations for locale [%s] from [%s]",
                    comp_id, locale, str(mo_path.relative_to(package_path)))
                with io.open(mo_path, 'rb') as fp:
                    self.add(Translations(fp=fp, domain=comp_id))

    def translate(self, msg, *, domain, context):
        return self.dugettext(domain, msg)


class Localizer(object):
    def __init__(self, locale, translations):
        self.locale_name = locale
        self.translations = translations
        self.pluralizer = None
        self.translator = None

    def translate(self, value):
        if trmeth := getattr(value, '__translate__', None):
            return trmeth(self.translations)
        return value
