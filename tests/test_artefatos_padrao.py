"""Guard do padrão das páginas publicadas como artefato (docs/artefatos).

Fonte da verdade: docs/artefatos/template/componentes.json e pagina-base.html.
Registo das páginas: docs/artefatos/paginas.json.

O HTML é lido pelo DOM (html.parser): só texto, atributos e comentários da página
contam, nunca o texto cru deste ficheiro. O CSS dos <style> é partido em blocos por
contagem de chavetas. Nasce com prova negativa: tests/fixtures/artefatos/pagina-ruim.html
TEM de reprovar em cada verificação (TestProvaNegativa).

Correr:  python -m unittest tests.test_artefatos_padrao -v
"""
import hashlib
import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ARTEFATOS = RAIZ / 'docs' / 'artefatos'
REGISTO = json.loads((ARTEFATOS / 'paginas.json').read_text(encoding='utf-8'))
REGRAS = json.loads((RAIZ / REGISTO['template']['componentes']).read_text(encoding='utf-8'))
TEMPLATE = RAIZ / REGISTO['template']['pagina']
PAGINA_RUIM = RAIZ / 'tests' / 'fixtures' / 'artefatos' / 'pagina-ruim.html'

VERIFICACOES = ('titulo', 'secoes_presentes', 'secoes_ordem', 'ids_unicos', 'navegacao', 'classes',
                'estados', 'tokens_claro', 'tokens_escuro', 'proibidas', 'tamanho')


class Dom(HTMLParser):
    """Recolhe do DOM o que o guard precisa; nada é procurado no texto cru."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.elementos = []      # (tag, {attr: valor})
        self.textos = []         # nós de texto, incluindo <script> e <style>
        self.comentarios = []
        self.css = []
        self.titulo = None
        self.chips = []          # [classes, texto]
        self._tag_texto = None
        self._spans = []         # pilha de spans: índice em self.chips ou None
        self.tem_nav = False
        self.nav_alvos = []      # hrefs '#id' dentro de nav.toc
        self._em_nav = False
        self._svg = 0

    def handle_starttag(self, tag, attrs):
        a = {k: (v or '') for k, v in attrs}
        self.elementos.append((tag, a))
        if tag == 'nav' and 'toc' in a.get('class', '').split():
            self.tem_nav = self._em_nav = True
        if tag == 'a' and self._em_nav and a.get('href', '').startswith('#'):
            self.nav_alvos.append(a['href'][1:])
        if tag == 'svg':
            self._svg += 1
        if tag == 'style' or (tag == 'title' and not self._svg and self.titulo is None):
            self._tag_texto = tag  # <title> de <svg> é tooltip, não o título da página
            if tag == 'title':
                self.titulo = ''
        if tag == 'span':
            classes = a.get('class', '').split()
            if 'chip' in classes:
                self.chips.append([classes, ''])
                self._spans.append(len(self.chips) - 1)
            else:
                self._spans.append(None)

    def handle_startendtag(self, tag, attrs):
        self.elementos.append((tag, {k: (v or '') for k, v in attrs}))

    def handle_endtag(self, tag):
        if tag == self._tag_texto:
            self._tag_texto = None
        if tag == 'nav':
            self._em_nav = False
        if tag == 'svg' and self._svg:
            self._svg -= 1
        if tag == 'span' and self._spans:
            self._spans.pop()

    def handle_data(self, data):
        self.textos.append(data)
        if self._tag_texto == 'title':
            self.titulo += data
        elif self._tag_texto == 'style':
            self.css.append(data)
        for i in self._spans:
            if i is not None:
                self.chips[i][1] += data

    def handle_comment(self, data):
        self.comentarios.append(data)


def blocos_css(css, contexto=()):
    """Devolve (contexto @media, seletor, corpo) de cada regra, sem regex."""
    while '/*' in css:
        i = css.index('/*')
        j = css.find('*/', i + 2)
        css = css[:i] + (css[j + 2:] if j >= 0 else '')
    saida, i, n = [], 0, len(css)
    while i < n:
        a = css.find('{', i)
        if a < 0:
            break
        prelude = css[i:a].strip().split(';')[-1].strip()
        prof, j = 1, a + 1
        while j < n and prof:
            prof += {'{': 1, '}': -1}.get(css[j], 0)
            j += 1
        corpo = css[a + 1:j - 1]
        if prelude.startswith('@'):
            saida.extend(blocos_css(corpo, contexto + (prelude,)))
        else:
            saida.append((contexto, prelude, corpo))
        i = j
    return saida


def tokens_por_bloco(css):
    """Tokens (--x) definidos em :root claro, no @media escuro e em [data-theme=dark]."""
    norm = lambda s: ''.join(s.split()).replace("'", '"').lower()
    claro, media_escuro, attr_escuro = set(), set(), set()
    for contexto, prelude, corpo in blocos_css(css):
        nomes = {d.split(':', 1)[0].strip() for d in corpo.split(';') if ':' in d}
        nomes = {x for x in nomes if x.startswith('--')}
        escuro = any('prefers-color-scheme:dark' in norm(c) for c in contexto)
        for sel in (norm(s) for s in prelude.split(',')):
            if not contexto and sel == ':root':
                claro |= nomes
            elif escuro and sel == ':root:not([data-theme="light"])':
                media_escuro |= nomes
            elif not contexto and sel == ':root[data-theme="dark"]':
                attr_escuro |= nomes
    return claro, media_escuro, attr_escuro


def comparar_com_divida(achados, declarados, rotulo):
    """Dívida conhecida: o conjunto encontrado tem de ser EXATAMENTE o declarado.
    Achado novo reprova; dívida declarada que já não existe também (a dívida só encolhe)."""
    novos = sorted(set(achados) - set(declarados))
    caducos = sorted(set(declarados) - set(achados))
    saida = [f'{rotulo}: {novos}'] if novos else []
    if caducos:
        saida.append(f'dívida declarada já não existe, remova de paginas.json: {caducos}')
    return saida


def verificar(html, regras=REGRAS, tamanho_bytes=None, divida=None):
    """Corre todas as verificações; devolve {verificação: [falhas]} (lista vazia = passou).
    `divida` é o `divida_conhecida` da página em paginas.json."""
    divida = divida or {}
    dom = Dom()
    dom.feed(html)
    dom.close()
    f = {k: [] for k in VERIFICACOES}

    prefixo = regras['titulo']['prefixo']
    titulo = (dom.titulo or '').strip()
    if not titulo:
        f['titulo'].append('sem <title>')
    elif not (titulo == prefixo or titulo.startswith(prefixo + ' · ')):
        f['titulo'].append(f'título {titulo!r} não começa por {prefixo!r}')

    obrigatorias = regras['secoes_obrigatorias']['ids']
    blocos = []
    for tag, a in dom.elementos:
        if tag in ('section', 'details') and a.get('id') and a['id'] not in blocos:
            blocos.append(a['id'])
    faltam = [s for s in obrigatorias if s not in blocos]
    if faltam:
        f['secoes_presentes'].append(f'faltam secções: {faltam}')
    presentes = [s for s in blocos if s in obrigatorias]
    esperada = [s for s in obrigatorias if s in presentes]
    if presentes != esperada:
        f['secoes_ordem'].append(f'ordem {presentes} difere do template {esperada}')

    ids = [a['id'] for _, a in dom.elementos if a.get('id')]
    duplicados = {i for i in ids if ids.count(i) > 1}
    f['ids_unicos'] += comparar_com_divida(duplicados, divida.get('ids_duplicados', ()), 'ids repetidos')

    if not dom.tem_nav:
        f['navegacao'].append('sem nav.toc')
    else:
        orfaos = sorted(set(dom.nav_alvos) - set(ids))
        if orfaos:
            f['navegacao'].append(f'links do nav sem alvo: {orfaos}')

    comps = {c['raiz']: c for c in regras['componentes']}
    prefixos = {k: set(v) for k, v in regras['prefixos_controlados'].items() if k != 'nota'}
    for tag, a in dom.elementos:
        classes = a.get('class', '').split()
        for raiz in (c for c in classes if c in comps):
            comp = comps[raiz]
            extra = sorted(set(classes) - set(comp['classes']))
            if extra:
                f['classes'].append(f'{tag}.{raiz} ({comp["nome"]}) com classes fora do template: {extra}')
            if tag not in comp['tags']:
                f['classes'].append(f'{comp["nome"]} em <{tag}>, template usa {comp["tags"]}')
        for c in classes:
            for p, permitidas in prefixos.items():
                if c.startswith(p) and c not in permitidas:
                    f['classes'].append(f'classe {c!r} fora de {sorted(permitidas)}')

    estados = {k: v for k, v in regras['estados'].items() if k != 'nota'}
    fora = set()
    for classes, texto in dom.chips:
        esperado = estados.get(texto.strip())
        if esperado and esperado not in classes:
            fora.add(texto.strip() + ':' + ' '.join(c for c in classes if c != 'chip'))
    f['estados'] += comparar_com_divida(fora, divida.get('chips_de_estado_fora_do_padrao', ()),
                                        'chip de estado com a classe errada (estado:classe)')

    claro, media_escuro, attr_escuro = tokens_por_bloco('\n'.join(dom.css))
    tema = regras['tokens_css']['tema']
    em_falta = [t for t in tema + regras['tokens_css']['so_claro'] if t not in claro]
    if em_falta:
        f['tokens_claro'].append(f':root sem {em_falta}')
    for nome, bloco in (('@media dark :root:not([data-theme=light])', media_escuro),
                        (':root[data-theme=dark]', attr_escuro)):
        em_falta = [t for t in tema if t not in bloco]
        if em_falta:
            f['tokens_escuro'].append(f'{nome} sem {em_falta}')

    alvos = dom.textos + dom.comentarios + [v for _, a in dom.elementos for v in a.values()]
    literais = [s.lower() for s in regras['proibidas']['literais']]
    padroes = [re.compile(p) for p in regras['proibidas']['padroes']]
    achados = set()
    for s in alvos:
        baixo = s.lower()
        achados |= {lit for lit in literais if lit in baixo}
        achados |= {p.pattern for p in padroes if p.search(s)}
    if achados:
        f['proibidas'].append(f'proibidas presentes: {sorted(achados)}')  # nunca imprime o valor

    tamanho = len(html.encode('utf-8')) if tamanho_bytes is None else tamanho_bytes
    if tamanho > regras['limites']['tamanho_max_bytes']:
        f['tamanho'].append(f'{tamanho} bytes > {regras["limites"]["tamanho_max_bytes"]}')
    return f


def falhas_grupos_iguais(registo):
    """Páginas de um grupo 'iguais': mesma fonte (sha) e mesmo conteúdo publicado registado."""
    por_id = {p['id']: p for p in registo['paginas']}
    falhas = []
    for grupo in registo['grupos_iguais']:
        membros = [por_id[i] for i in grupo['paginas']]
        fontes = {hashlib.sha256((RAIZ / m['fonte']).read_bytes()).hexdigest() for m in membros}
        if len(fontes) != 1:
            falhas.append(f'{grupo["nome"]}: fontes com sha256 diferentes')
        referencia = membros[0]['sha256_conteudo_publicado']
        for m in membros[1:]:
            difere = m['sha256_conteudo_publicado'] != referencia
            declarado = 'conteudo_publicado_difere' in m.get('divida_conhecida', {})
            if difere and not declarado:
                falhas.append(f'{grupo["nome"]}: {m["id"]} publicado difere de {membros[0]["id"]}')
            if declarado and not difere:
                falhas.append(f'{grupo["nome"]}: {m["id"]} já é igual; remova conteudo_publicado_difere')
    return falhas


def ler(caminho):
    return Path(caminho).read_bytes().decode('utf-8')


class TestTemplate(unittest.TestCase):
    """O template é a fonte da verdade: tem de passar no próprio guard."""

    def test_template_passa_em_todas_as_verificacoes(self):
        falhas = verificar(ler(TEMPLATE))
        for nome in VERIFICACOES:
            with self.subTest(verificacao=nome):
                self.assertEqual(falhas[nome], [])

    def test_template_sem_imagens_embutidas(self):
        dom = Dom()
        dom.feed(ler(TEMPLATE))
        valores = [v for _, a in dom.elementos for v in a.values()]
        for proibido in REGRAS['limites']['template_sem']:
            self.assertFalse([v for v in valores if proibido in v], proibido)

    def test_template_tem_um_exemplo_de_cada_componente(self):
        dom = Dom()
        dom.feed(ler(TEMPLATE))
        usadas = {c for _, a in dom.elementos for c in a.get('class', '').split()}
        for comp in REGRAS['componentes']:
            with self.subTest(componente=comp['nome']):
                self.assertIn(comp['raiz'], usadas)
        estados = {k: v for k, v in REGRAS['estados'].items() if k != 'nota'}
        self.assertEqual({t.strip() for _, t in dom.chips} & set(estados), set(estados))

    def test_versao_do_registo_igual_a_do_template(self):
        self.assertEqual(REGISTO['template']['versao'], REGRAS['versao_template'])


class TestPaginasRegistadas(unittest.TestCase):

    def test_registo_completo(self):
        urls = [p['url'] for p in REGISTO['paginas']]
        self.assertEqual(len(urls), len(set(urls)), 'URL repetida no registo')
        for p in REGISTO['paginas']:
            with self.subTest(pagina=p['id']):
                for campo in ('id', 'url', 'fonte', 'versao_template', 'ultima_versao_publicada',
                              'sha256_conteudo_publicado'):
                    self.assertTrue(p.get(campo), campo)
                self.assertTrue(p['url'].startswith('https://claude.ai/artifact/'))
                self.assertEqual(p['versao_template'], REGRAS['versao_template'])
                self.assertTrue((RAIZ / p['fonte']).is_file(), p['fonte'])

    def test_cada_pagina_segue_o_template(self):
        for p in REGISTO['paginas']:
            caminho = RAIZ / p['fonte']
            divida = p.get('divida_conhecida', {})
            falhas = verificar(ler(caminho), tamanho_bytes=caminho.stat().st_size, divida=divida)
            for nome in VERIFICACOES:
                with self.subTest(pagina=p['id'], verificacao=nome):
                    self.assertEqual(falhas[nome], [])

    def test_paginas_iguais_tem_o_mesmo_sha256(self):
        self.assertEqual(falhas_grupos_iguais(REGISTO), [])


class TestProvaNegativa(unittest.TestCase):
    """O guard TEM de reprovar a página ruim sintética, em cada verificação."""

    @classmethod
    def setUpClass(cls):
        cls.falhas = verificar(ler(PAGINA_RUIM))

    def test_pagina_ruim_reprova_em_cada_verificacao_do_dom(self):
        for nome in ('titulo', 'secoes_presentes', 'secoes_ordem', 'ids_unicos', 'navegacao', 'classes',
                     'estados', 'tokens_claro', 'tokens_escuro', 'proibidas'):
            with self.subTest(verificacao=nome):
                self.assertTrue(self.falhas[nome], f'{nome} deveria reprovar a página ruim')

    def test_classe_ad_hoc_e_token_escuro_em_falta_sao_nomeados(self):
        self.assertTrue(any('card-destaque' in x for x in self.falhas['classes']))
        self.assertTrue(any('c-okay' in x for x in self.falhas['classes']))
        self.assertTrue(any('--bad' in x for x in self.falhas['tokens_escuro']))

    def test_chave_de_api_reprova(self):
        chave = 'AI' + 'za' + 'X' * 35  # montada em memória: nenhuma chave no repositório
        html = ler(TEMPLATE).replace('</footer>', f'<span data-k="{chave}"></span></footer>')
        self.assertTrue(verificar(html)['proibidas'])

    def test_tamanho_acima_do_limite_reprova(self):
        limite = REGRAS['limites']['tamanho_max_bytes']
        self.assertTrue(verificar(ler(TEMPLATE), tamanho_bytes=limite + 1)['tamanho'])

    def test_divida_caducada_reprova(self):
        self.assertTrue(verificar(ler(TEMPLATE), divida={'ids_duplicados': ['conclusao']})['ids_unicos'])

    def test_grupo_iguais_com_sha_diferente_reprova(self):
        falso = json.loads(json.dumps(REGISTO))
        for p in falso['paginas']:
            p.pop('divida_conhecida', None)
        falso['paginas'][1]['sha256_conteudo_publicado'] = '0' * 64
        self.assertTrue(falhas_grupos_iguais(falso))


if __name__ == '__main__':
    unittest.main()
