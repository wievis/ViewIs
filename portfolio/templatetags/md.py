from django import template
from django.utils.html import escape
from django.utils.safestring import mark_safe

register = template.Library()


@register.filter
def markdown(text):
    try:
        import markdown as md
    except ImportError:
        return mark_safe('<pre>%s</pre>' % escape(text or ''))
    html = md.markdown(
        text or '',
        extensions=['fenced_code', 'codehilite', 'tables', 'sane_lists'],
        extension_configs={'codehilite': {
            'guess_lang': False, 'noclasses': True, 'pygments_style': 'monokai',
        }},
    )
    return mark_safe(html)
