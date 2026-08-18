import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

interface ApiErrorBody {
  error?: string;
  details?: Record<string, string[]>;
}

// Central place that turns any failed HTTP call to our API into a readable
// Hebrew toast, so individual components don't each need their own copy of
// this fallback logic (spec 9.4). Components can still catch the rethrown
// error for field-level handling in forms.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        snackBar.open(describeError(err), 'סגור', { duration: 5000, direction: 'rtl' });
      }
      return throwError(() => err);
    }),
  );
};

function describeError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'לא ניתן להתחבר לשרת. בדקו את חיבור הרשת ונסו שוב.';
  }

  const body = err.error as ApiErrorBody | undefined;
  if (err.status === 403) {
    return 'אין לכם הרשאה לבצע פעולה זו על מודעה זו.';
  }
  if (err.status === 404) {
    return 'המודעה המבוקשת לא נמצאה (ייתכן שנמחקה).';
  }
  if (err.status === 400 && body?.error) {
    return body.error;
  }
  return 'אירעה שגיאה בלתי צפויה. נסו שוב מאוחר יותר.';
}
