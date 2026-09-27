import os,mimetypes
from pathlib import Path
from django.http import FileResponse,JsonResponse,HttpResponseNotFound
from django.urls import path,re_path,include
BASE=Path(os.environ.get('IAGORA_FRONT_DIST','/app/front_dist')).resolve()
def health(request):return JsonResponse({'status':'ok','release':os.environ.get('IAGORA_RELEASE','local'),'hosting':'gcp-cloud-run' if os.environ.get('K_SERVICE') else 'local-validation','storage':'gcs-cas' if os.environ.get('IAGORA_STATE_BUCKET') else 'local','model':'gemini-3.5-flash-lite','datasetNature':'synthetic'})
def static(request,asset=''):
    if request.method not in ('GET','HEAD'):return HttpResponseNotFound()
    p=(BASE/(asset or 'index.html')).resolve()
    if not p.is_relative_to(BASE) or not p.is_file():return HttpResponseNotFound()
    r=FileResponse(p.open('rb'),content_type=mimetypes.guess_type(str(p))[0] or 'application/octet-stream')
    r['Cache-Control']='no-store' if p.name=='index.html' else 'public,max-age=3600'
    return r
urlpatterns=[path('api/health/',health),path('api/v1/context-agent/conversas/',include('agent_backend.conversation.urls')),path('api/v1/context-agent/i-agora/',include('agent_backend.planning.urls')),re_path(r'^(?P<asset>.*)$',static)]
