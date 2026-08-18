import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IdentityService } from '../services/identity.service';

// Attaches the current local "owner" identity to every request going to our
// own API, so individual services never have to remember to do it. The
// server uses this header to authorize PUT/DELETE (see spec 4.8).
export const ownerIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const identity = inject(IdentityService);
  const cloned = req.clone({
    setHeaders: { 'X-Owner-Id': identity.ownerId() },
  });
  return next(cloned);
};
