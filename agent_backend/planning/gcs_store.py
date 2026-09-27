"""Persist per-session SQLite snapshots as private GCS objects with generation CAS.

SQLite is never mounted on GCS/FUSE. Each operation materializes a bounded private
snapshot, performs its SQL transaction locally, then atomically replaces the object
only if its generation is unchanged. Concurrent stale writes fail, not overwrite.
"""
import hashlib,tempfile
from pathlib import Path
from urllib.parse import quote
from .store import PlanStore,Conflict

class GCSPlanStore:
    def __init__(self,bucket,session=None):
        if session is None:
            import google.auth
            from google.auth.transport.requests import AuthorizedSession
            creds,_=google.auth.default(scopes=['https://www.googleapis.com/auth/devstorage.read_write'])
            session=AuthorizedSession(creds)
        self.bucket=bucket;self.session=session
    def _run(self,method,owner,*args):
        key='plans/'+hashlib.sha256(owner.encode()).hexdigest()+'.sqlite3'
        base=f'https://storage.googleapis.com/storage/v1/b/{quote(self.bucket,safe="")}/o/{quote(key,safe="")}'
        meta=self.session.get(base,timeout=15)
        if meta.status_code not in (200,404):raise RuntimeError('Persistent storage unavailable')
        generation=meta.json()['generation'] if meta.status_code==200 else '0'
        with tempfile.TemporaryDirectory(prefix='iagora-state-') as d:
            p=Path(d)/'state.sqlite3'
            if generation!='0':
                if int(meta.json().get('size',0))>5_000_000:raise RuntimeError('State size budget exceeded')
                r=self.session.get(base,params={'alt':'media','generation':generation},timeout=15)
                if not r.ok:raise RuntimeError('Persistent state read failed')
                p.write_bytes(r.content);p.chmod(0o600)
            store=PlanStore(p);result=getattr(store,method)(owner,*args)
            if method!='get':
                r=self.session.post(f'https://storage.googleapis.com/upload/storage/v1/b/{quote(self.bucket,safe="")}/o',
                    params={'uploadType':'media','name':key,'ifGenerationMatch':generation},
                    headers={'Content-Type':'application/vnd.sqlite3'},data=p.read_bytes(),timeout=15)
                if r.status_code==412:raise Conflict('Alteração concorrente. Recarregue; nenhuma alteração foi sobrescrita.')
                if not r.ok:raise RuntimeError('Persistent state write failed')
            return result
    def get(self,owner):return self._run('get',owner)
    def open(self,owner,state):return self._run('open',owner,state)
    def pick(self,owner,ref):return self._run('pick',owner,ref)
    def repick(self,owner,ref):return self._run('repick',owner,ref)
    def prepare_case(self,owner,version,plan_id,case):return self._run('prepare_case',owner,version,plan_id,case)
    def withdraw_case(self,owner):return self._run('withdraw_case',owner)
    def adjust(self,owner,version,changes):return self._run('adjust',owner,version,changes)
    def confirm(self,owner,rid,version,plan):return self._run('confirm',owner,rid,version,plan)
    def progress(self,owner,version,changes):return self._run('progress',owner,version,changes)
    def reset(self,owner):return self._run('reset',owner)
    def admit_call(self,owner,day,limit):return self._run('admit_call',owner,day,limit)
