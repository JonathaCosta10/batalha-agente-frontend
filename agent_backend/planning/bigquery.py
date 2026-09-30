"""Read-only BigQuery adapter. Fixed table, verified columns, parameters, dry-run and cost cap.

No built-in invented dataset or credential. Schema mapping is explicit because
transaction sign/direction semantics must be verified against the event table.
"""
import json,os,re,time,secrets
from .names import demo_name
from datetime import datetime,timezone
from decimal import Decimal
from pathlib import Path

TABLE='batalha-time-02-lxof.hackathon_dados.extrato_sintetico'
PROJECT,DATASET,NAME=TABLE.split('.')
class SourceUnavailable(RuntimeError): pass

class BigQuerySource:
    def __init__(self, mapping_path=None, session=None):
        self.mapping_path=mapping_path or os.environ.get('IAGORA_BQ_MAPPING') or str(Path(__file__).with_name('bq_mapping.json'))
        self.session=session;self.cache={}
        self.max_bytes=min(int(os.environ.get('IAGORA_BQ_MAX_BYTES','100000000')),100000000)
    def _session(self):
        if self.session is None:
            try:
                import google.auth
                from google.auth.transport.requests import AuthorizedSession
                creds,_=google.auth.default(scopes=['https://www.googleapis.com/auth/bigquery'])
                self.session=AuthorizedSession(creds)
            except Exception: raise SourceUnavailable('BigQuery sem autorização ADC. Conclua o login GCP no servidor.') from None
        return self.session
    def _call(self,method,path,**kwargs):
        try:
            r=self._session().request(method,'https://bigquery.googleapis.com/bigquery/v2/'+path,timeout=25,**kwargs)
            if r.status_code>=400:raise SourceUnavailable(f'BigQuery recusou a consulta (HTTP {r.status_code}); verifique IAM, quota e projeto.')
            return r.json()
        except SourceUnavailable:raise
        except Exception:raise SourceUnavailable('BigQuery indisponível; nenhuma base fictícia foi substituída.') from None
    def inspect(self):
        table=self._call('GET',f'projects/{PROJECT}/datasets/{DATASET}/tables/{NAME}')
        dataset=self._call('GET',f'projects/{PROJECT}/datasets/{DATASET}')
        return {'table':TABLE,'columns':table['schema']['fields'],'location':dataset.get('location','US'),'row_count':table.get('numRows')}
    def mapping(self):
        if not self.mapping_path or not Path(self.mapping_path).is_file():
            raise SourceUnavailable('Mapeamento do schema BigQuery ainda não validado. Não é seguro supor nomes ou sinais dos valores.')
        m=json.loads(Path(self.mapping_path).read_text());meta=self.inspect();fields={f['name']:f for f in meta['columns']}
        for role in ('customer','period','amount','category')+tuple(k for k in ('subcategory','description','date','installment_current','installment_total') if m.get(k)):
            value=m.get(role,'')
            if value not in fields or not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*',value):raise SourceUnavailable('Mapeamento de colunas incompatível com a tabela.')
        if m.get('direction'):
            if m['direction'] not in fields or not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*',m['direction']):raise SourceUnavailable('Coluna de direção inválida.')
            if not m.get('inflow_labels') or not m.get('outflow_labels'):raise SourceUnavailable('Sentido de crédito/débito não validado.')
        elif m.get('amount_semantics')!='signed_positive_inflow':raise SourceUnavailable('Semântica de sinal monetário não validada.')
        m['period_type']=fields[m['period']]['type'];m['location']=meta['location'];return m
    def _param(self,name,value):
        if isinstance(value,list):return {'name':name,'parameterType':{'type':'ARRAY','arrayType':{'type':'STRING'}},'parameterValue':{'arrayValues':[{'value':v} for v in value]}}
        return {'name':name,'parameterType':{'type':'STRING'},'parameterValue':{'value':str(value)}}
    def query(self,sql,params,location):
        q={'query':sql,'useLegacySql':False,'parameterMode':'NAMED','queryParameters':[self._param(k,v) for k,v in params.items()],'maximumBytesBilled':str(self.max_bytes),'useQueryCache':True}
        dry=self._call('POST',f'projects/{PROJECT}/jobs',json={'jobReference':{'projectId':PROJECT,'location':location},'configuration':{'dryRun':True,'query':q}})
        estimate=int(dry.get('statistics',{}).get('query',{}).get('totalBytesProcessed','0'))
        if estimate>self.max_bytes:raise SourceUnavailable('Consulta excede o teto de bytes autorizado; refine a leitura.')
        result=self._call('POST',f'projects/{PROJECT}/queries',json={**q,'location':location,'timeoutMs':10000,'maxResults':1000})
        if not result.get('jobComplete'):raise SourceUnavailable('Consulta ainda em processamento. Não foi iniciada outra tentativa automática.')
        if result.get('pageToken'):raise SourceUnavailable('Resultado excedeu o lote permitido; não será truncado silenciosamente.')
        names=[f['name'] for f in result.get('schema',{}).get('fields',[])]
        rows=[dict(zip(names,[f.get('v') for f in row['f']])) for row in result.get('rows',[])]
        return rows,{'source':TABLE,'nature':'sintetica','measuredAt':datetime.now(timezone.utc).isoformat(),'cache':bool(result.get('cacheHit')),'bytesProcessed':result.get('totalBytesProcessed'),'jobId':result.get('jobReference',{}).get('jobId')}
    def _period(self,m):
        col='`'+m['period']+'`'
        if m['period_type'] in ('DATE','TIMESTAMP','DATETIME'):return f"FORMAT_DATE('%Y-%m', DATE({col}))"
        raw=f"REPLACE(CAST({col} AS STRING), '-', '')"
        return f"CONCAT(SUBSTR({raw},1,4),'-',SUBSTR({raw},5,2))"
    def customers(self):
        if self.cache.get('users') and time.monotonic()-self.cache['at']<900:return self.cache['users']
        m=self.mapping();period=self._period(m)
        cutoff=datetime.now(timezone.utc).strftime('%Y-%m')
        sql=f'SELECT DISTINCT CAST(`{m["customer"]}` AS STRING) AS ref FROM `{TABLE}` WHERE {period} < @cutoff ORDER BY ref LIMIT 1001'
        rows,_=self.query(sql,{'cutoff':cutoff},m['location'])
        if len(rows)>1000:raise SourceUnavailable('Catálogo excede 1000 clientes; defina um recorte explícito.')
        self.cache.update(users=[r['ref'] for r in rows],at=time.monotonic(),mapping=m)
        return self.cache['users']
    def load(self,index=1):
        users=self.customers()
        if not users:raise SourceUnavailable('Nenhum cliente em mês encerrado foi encontrado.')
        index=(index-1)%len(users)+1
        return self.load_ref(users[index-1])
    def load_ref(self,ref):
        """Load by the real id_usuario (@customer); no display label is derived from it."""
        users=self.customers()
        if ref not in users:raise SourceUnavailable('Cliente sorteado não está no catálogo de meses encerrados.')
        index=users.index(ref)+1
        key=('profile',ref)
        if key in self.cache and time.monotonic()-self.cache[key][0]<900:return self.cache[key][1]
        m=self.cache['mapping'];period=self._period(m);params={'customer':ref,'cutoff':datetime.now(timezone.utc).strftime('%Y-%m')}
        value=f'SAFE_CAST(`{m["amount"]}` AS NUMERIC)'
        if m.get('direction'):
            direction=f'LOWER(CAST(`{m["direction"]}` AS STRING))'
            inc=f'{direction} IN UNNEST(@inflow)';out=f'{direction} IN UNNEST(@outflow)'
            params.update(inflow=m['inflow_labels'],outflow=m['outflow_labels'])
        else:inc=f'{value} > 0';out=f'{value} <= 0'
        sql=f'''WITH movements AS (SELECT {period} AS period, CAST(`{m['category']}` AS STRING) AS category,
            {value} AS amount, ({inc}) AS is_in, ({out}) AS is_out
            FROM `{TABLE}` WHERE CAST(`{m['customer']}` AS STRING)=@customer AND {period}<@cutoff)
            SELECT period,category,CAST(SUM(IF(is_in,ABS(amount),0)) AS STRING) AS inflows,
            CAST(SUM(IF(is_out,ABS(amount),0)) AS STRING) AS outflows,
            COUNTIF(amount IS NULL OR NOT(COALESCE(is_in,FALSE) OR COALESCE(is_out,FALSE))) AS invalid
            FROM movements WHERE period=(SELECT MAX(period) FROM movements) GROUP BY period,category'''
        rows,seal=self.query(sql,params,m['location'])
        if not rows or any(int(r['invalid']) for r in rows):raise SourceUnavailable('Dados ausentes ou movimentos sem direção/valor válidos.')
        periods={r['period'] for r in rows}
        if len(periods)!=1:raise SourceUnavailable('Períodos não reconciliados.')
        # Categories are preserved; semantic grouping is declared by the domain adapter.
        result={'client_ref':ref,'index':index,'reference_month':next(iter(periods)),
                'inflows':str(sum((Decimal(r['inflows']) for r in rows),Decimal(0)).quantize(Decimal('.01'))),
                'outflows':str(sum((Decimal(r['outflows']) for r in rows),Decimal(0)).quantize(Decimal('.01'))),
                'categories':{r['category'] or 'Sem categoria':r['outflows'] for r in rows},'seal':seal}
        self.cache[key]=(time.monotonic(),result);return result

    def details(self,client_ref,reference_month):
        from agent_backend.conversation.rules import minimize
        if not re.fullmatch(r'20\d{2}-(0[1-9]|1[0-2])',reference_month):raise SourceUnavailable('Período inválido.')
        key=('details',client_ref,reference_month)
        if key in self.cache and time.monotonic()-self.cache[key][0]<900:return self.cache[key][1]
        m=self.mapping();required=('subcategory','description','date','installment_current','installment_total')
        if any(not m.get(k) for k in required):raise SourceUnavailable('Detalhamento não configurado.')
        period=self._period(m);value=f'SAFE_CAST(`{m["amount"]}` AS NUMERIC)'
        params={'customer':client_ref,'period':reference_month,'categories':['Lojas e sites','Delivery','Restaurantes'],'outflow':m['outflow_labels']}
        where=f'CAST(`{m["customer"]}` AS STRING)=@customer AND {period}=@period AND `{m["category"]}` IN UNNEST(@categories) AND LOWER(CAST(`{m["direction"]}` AS STRING)) IN UNNEST(@outflow)'
        sql=f'''SELECT `{m['category']}` AS category, `{m['subcategory']}` AS subcategory,
          CAST(SUM(ABS({value})) AS STRING) AS amount, COUNT(*) AS n,
          COUNTIF(SAFE_CAST(`{m['installment_total']}` AS NUMERIC)>1) AS installments,
          COUNTIF({value} IS NULL) AS invalid
          FROM `{TABLE}` WHERE {where} GROUP BY category,subcategory ORDER BY SUM(ABS({value})) DESC'''
        rows,seal=self.query(sql,params,m['location'])
        if any(int(r['invalid']) for r in rows):raise SourceUnavailable('Detalhamento contém valores inválidos.')
        sql=f'''SELECT `{m['category']}` AS category, `{m['subcategory']}` AS subcategory,
          `{m['description']}` AS description, CAST(DATE(`{m['date']}`) AS STRING) AS date,
          CAST(ABS({value}) AS STRING) AS amount,
          CAST(`{m['installment_current']}` AS STRING) AS installment_current,
          CAST(`{m['installment_total']}` AS STRING) AS installment_total
          FROM `{TABLE}` WHERE {where} ORDER BY ABS({value}) DESC, `{m['date']}` DESC LIMIT 12'''
        samples,_=self.query(sql,params,m['location'])
        for row in rows+samples:
            for field in ('category','subcategory','description'):
                if field in row:row[field]=minimize(str(row[field] or 'Não informado'))[:160]
        result={'status':'available','period':reference_month,'summaries':rows,'samples':samples,
                'samples_limit':12,'samples_order':'largest_amount_first','covered_categories':params['categories'],
                'merchant_names_verified':False,'purchased_items_available':False,
                'limitations':'Descrições bancárias genéricas, não notas fiscais. Parcelas são lançamentos do período; não inferir valor total da compra nem possibilidade de cancelar parcelas. Amostra não é o extrato completo.',
                'seal':seal}
        self.cache[key]=(time.monotonic(),result);return result
