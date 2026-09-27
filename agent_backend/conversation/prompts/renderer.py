"""Only checked-in templates; no user-supplied template names or variables."""
import hashlib
from datetime import date
from pathlib import Path
from liquid import DictLoader, Environment, StrictUndefined

ROOT = Path(__file__).parent
NAMES = ('system', 'input_guard', 'output_guard')
PARTIALS = ('capabilities', 'financial_distinctions', 'institutional_policy', 'spending_projection')


def render_prompt(name, *, reference_date):
    if name not in NAMES:
        raise ValueError('Template not allowed')
    date.fromisoformat(reference_date)
    # DictLoader exposes only a fixed list: filesystem traversal is not possible.
    templates = {n: (ROOT / f'{n}.liquid').read_text() for n in NAMES}
    templates.update({f'partials/{n}': (ROOT / 'partials' / f'{n}.liquid').read_text() for n in PARTIALS})
    env = Environment(loader=DictLoader(templates), undefined=StrictUndefined, strict_filters=True)
    env.loop_iteration_limit = 100
    env.output_stream_limit = 16000
    text = env.get_template(name).render(policy_version='1.0', reference_date=reference_date)
    if len(text) > 16000:
        raise ValueError('Prompt budget exceeded')
    return text, hashlib.sha256(text.encode()).hexdigest()
