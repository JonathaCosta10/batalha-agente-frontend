import time
from agent_backend.planning.bigquery import BigQuerySource

MAPPING={'customer':'id_usuario','period':'anomes','period_type':'INTEGER','amount':'vlr','category':'nom_cate_macro','direction':'tipo','outflow_labels':['s'],'inflow_labels':['e'],'location':'us-central1','subcategory':'nom_cate_micro','description':'descr','date':'anomesdia','installment_current':'parcela_atual','installment_total':'parcela_total'}

def test_details_are_scoped_parameterized_and_explicitly_not_item_receipts():
 class Source(BigQuerySource):
  def mapping(self):return MAPPING
  def query(self,sql,params,location):
   self.calls.append((sql,params));assert 'subject-private-a' not in sql
   assert params['customer']=='subject-private-a' and params['period']=='2025-12'
   if 'GROUP BY' in sql:return [{'category':'Lojas e sites','subcategory':'Vestuário','amount':'100.00','n':'2','installments':'1','invalid':'0'}],{'source':'TEST_FIXTURE'}
   return [{'category':'Lojas e sites','subcategory':'Vestuário','description':'loja roupa','date':'2025-12-10','amount':'70.00','installment_current':'2','installment_total':'4'}],{'source':'TEST_FIXTURE'}
 source=Source();source.calls=[]
 result=source.details('subject-private-a','2025-12')
 assert result['status']=='available'
 assert result['summaries'][0]['amount']=='100.00'
 assert result['samples'][0]['description']=='loja roupa'
 assert result['merchant_names_verified'] is False
 assert result['purchased_items_available'] is False
 assert source.details('subject-private-a','2025-12')==result and len(source.calls)==2


def test_initial_profile_is_selected_from_actual_catalog(monkeypatch):
 import secrets
 class Source(BigQuerySource):
  def customers(self):self.cache['mapping']=MAPPING;return ['a','b']
  def query(self,sql,params,location):
   self.selected=params['customer']
   return [{'period':'2025-12','category':'Lojas e sites','inflows':'1000.00','outflows':'500.00','invalid':'0'}],{'source':'TEST_FIXTURE'}
 # Merge 2026-09-27: the session's id_usuario is drawn in planning/http.py (session_ref) and loaded by
 # load_ref; the snapshot carries no display alias (the name is the one generated for the id, sealed).
 s=Source();p=s.load_ref('b')
 assert s.selected=='b' and p['client_ref']=='b' and p['index']==2
 assert 'alias' not in p
