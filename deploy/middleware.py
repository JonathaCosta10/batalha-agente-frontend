class SecurityHeaders:
    def __init__(self,get_response):self.get_response=get_response
    def __call__(self,request):
        request.get_host()
        r=self.get_response(request)
        r['X-Content-Type-Options']='nosniff';r['X-Frame-Options']='DENY'
        r['Referrer-Policy']='same-origin';r['X-Robots-Tag']='noindex, nofollow, noarchive'
        r['Permissions-Policy']='camera=(), microphone=(), geolocation=()'
        r['Content-Security-Policy']="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
        if request.is_secure():r['Strict-Transport-Security']='max-age=31536000'
        return r
