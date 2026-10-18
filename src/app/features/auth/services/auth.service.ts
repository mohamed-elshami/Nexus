import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Subject, catchError, finalize, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import {
  AuthMessageResponse,
  AuthSessionResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  SignInPayload,
  SignUpPayload,
  AuthUser,
  UpdateLoggedUserPasswordPayload,
  VerifyResetCodePayload,
} from '../models/auth.model';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly signupUrl = `${environment.apiUrl}${API_ENDPOINTS.auth.signup}`;
  private readonly signinUrl = `${environment.apiUrl}${API_ENDPOINTS.auth.signin}`;
  private readonly forgotPasswordUrl = `${environment.apiUrl}${API_ENDPOINTS.auth.forgotPassword}`;
  private readonly verifyResetCodeUrl = `${environment.apiUrl}${API_ENDPOINTS.auth.verifyResetCode}`;
  private readonly resetPasswordUrl = `${environment.apiUrl}${API_ENDPOINTS.auth.resetPassword}`;
  private readonly changePasswordUrl = `${environment.apiUrl}${API_ENDPOINTS.users.changePassword}`;

  private readonly _user = signal<AuthUser | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _message = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly message = this._message.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this._token()));

  private readonly signUpRequest$ = new Subject<SignUpPayload>();
  private readonly signInRequest$ = new Subject<SignInPayload>();
  private readonly forgotPasswordRequest$ = new Subject<ForgotPasswordPayload>();
  private readonly verifyResetCodeRequest$ = new Subject<VerifyResetCodePayload>();
  private readonly resetPasswordRequest$ = new Subject<ResetPasswordPayload>();
  private readonly changePasswordRequest$ = new Subject<UpdateLoggedUserPasswordPayload>();

  private signUpRequestId = 0;
  private signInRequestId = 0;
  private forgotPasswordRequestId = 0;
  private verifyResetCodeRequestId = 0;
  private resetPasswordRequestId = 0;
  private changePasswordRequestId = 0;

  constructor() {
    this.restoreSession();
    this.bindSignUp();
    this.bindSignIn();
    this.bindForgotPassword();
    this.bindVerifyResetCode();
    this.bindResetPassword();
    this.bindChangePassword();
  }

  signUp(payload: SignUpPayload): void {
    this.signUpRequest$.next(payload);
  }

  signIn(payload: SignInPayload): void {
    this.signInRequest$.next(payload);
  }

  forgotPassword(payload: ForgotPasswordPayload): void {
    this.forgotPasswordRequest$.next(payload);
  }

  verifyResetCode(payload: VerifyResetCodePayload): void {
    this.verifyResetCodeRequest$.next(payload);
  }

  resetPassword(payload: ResetPasswordPayload): void {
    this.resetPasswordRequest$.next(payload);
  }

  updateLoggedUserPassword(payload: UpdateLoggedUserPasswordPayload): void {
    this.changePasswordRequest$.next(payload);
  }

  logout(): void {
    this.clearSession();
    this._error.set(null);
    this._message.set(null);
  }

  private bindSignUp(): void {
    this.signUpRequest$
      .pipe(
        switchMap((payload) => {
          const requestId = ++this.signUpRequestId;
          this.startRequest();

          return this.http.post<AuthSessionResponse>(this.signupUrl, payload).pipe(
            catchError((err) => this.handleError(err, requestId, this.signUpRequestId, 'Failed to create account')),
            finalize(() => this.finishRequest(requestId, this.signUpRequestId)),
          );
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        this.setSession(response);
        this._message.set(response.message ?? 'Account created successfully');
      });
  }

  private bindSignIn(): void {
    this.signInRequest$
      .pipe(
        switchMap((payload) => {
          const requestId = ++this.signInRequestId;
          this.startRequest();

          return this.http.post<AuthSessionResponse>(this.signinUrl, payload).pipe(
            catchError((err) => this.handleError(err, requestId, this.signInRequestId, 'Failed to sign in')),
            finalize(() => this.finishRequest(requestId, this.signInRequestId)),
          );
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        this.setSession(response);
        this._message.set(response.message ?? 'Signed in successfully');
      });
  }

  private bindForgotPassword(): void {
    this.forgotPasswordRequest$
      .pipe(
        switchMap((payload) => {
          const requestId = ++this.forgotPasswordRequestId;
          this.startRequest();

          return this.http.post<AuthMessageResponse>(this.forgotPasswordUrl, payload).pipe(
            catchError((err) =>
              this.handleError(err, requestId, this.forgotPasswordRequestId, 'Failed to send reset code'),
            ),
            finalize(() => this.finishRequest(requestId, this.forgotPasswordRequestId)),
          );
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        this._message.set(response.message);
      });
  }

  private bindVerifyResetCode(): void {
    this.verifyResetCodeRequest$
      .pipe(
        switchMap((payload) => {
          const requestId = ++this.verifyResetCodeRequestId;
          this.startRequest();

          return this.http.post<AuthMessageResponse>(this.verifyResetCodeUrl, payload).pipe(
            catchError((err) =>
              this.handleError(err, requestId, this.verifyResetCodeRequestId, 'Invalid reset code'),
            ),
            finalize(() => this.finishRequest(requestId, this.verifyResetCodeRequestId)),
          );
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        this._message.set(response.message ?? 'Reset code verified');
      });
  }

  private bindResetPassword(): void {
    this.resetPasswordRequest$
      .pipe(
        switchMap((payload) => {
          const requestId = ++this.resetPasswordRequestId;
          this.startRequest();

          return this.http.put<AuthSessionResponse>(this.resetPasswordUrl, payload).pipe(
            catchError((err) =>
              this.handleError(err, requestId, this.resetPasswordRequestId, 'Failed to reset password'),
            ),
            finalize(() => this.finishRequest(requestId, this.resetPasswordRequestId)),
          );
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        if (response.token) {
          this._token.set(response.token);
          this.persistToken(response.token);
        }
        if (response.user) {
          this._user.set(response.user);
          this.persistUser(response.user);
        }
        this._message.set(response.message ?? 'Password reset successfully');
      });
  }

  private bindChangePassword(): void {
    this.changePasswordRequest$
      .pipe(
        switchMap((payload) => {
          const requestId = ++this.changePasswordRequestId;
          this.startRequest();

          return this.http
            .put<AuthSessionResponse>(this.changePasswordUrl, payload, {
              headers: this.authHeaders(),
            })
            .pipe(
              catchError((err) =>
                this.handleError(
                  err,
                  requestId,
                  this.changePasswordRequestId,
                  'Failed to update password',
                ),
              ),
              finalize(() => this.finishRequest(requestId, this.changePasswordRequestId)),
            );
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        if (response.token) {
          this._token.set(response.token);
          this.persistToken(response.token);
        }
        if (response.user) {
          this._user.set(response.user);
          this.persistUser(response.user);
        }
        this._message.set(response.message ?? 'Password updated successfully');
      });
  }

  private authHeaders(): HttpHeaders {
    const token = this._token() ?? '';
    return new HttpHeaders({ token });
  }

  private startRequest(): void {
    this._loading.set(true);
    this._error.set(null);
    this._message.set(null);
  }

  private finishRequest(requestId: number, currentId: number): void {
    if (requestId === currentId) {
      this._loading.set(false);
    }
  }

  private handleError(err: unknown, requestId: number, currentId: number, fallback: string) {
    if (requestId === currentId) {
      this._error.set(this.readError(err, fallback));
    }
    return of(null);
  }

  private readError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string; errors?: { msg?: string } } | string | null;
      if (typeof body === 'string' && body.trim()) {
        return body;
      }
      if (body && typeof body === 'object') {
        return body.message ?? body.errors?.msg ?? fallback;
      }
      return err.message || fallback;
    }

    return fallback;
  }

  private setSession(response: AuthSessionResponse): void {
    this._token.set(response.token);
    this._user.set(response.user);
    this.persistToken(response.token);
    this.persistUser(response.user);
  }

  private restoreSession(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);

    if (token) {
      this._token.set(token);
    }

    if (!rawUser) {
      return;
    }

    try {
      this._user.set(JSON.parse(rawUser) as AuthUser);
    } catch {
      localStorage.removeItem(USER_KEY);
    }
  }

  private persistToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  private persistUser(user: AuthUser): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  private clearSession(): void {
    this._token.set(null);
    this._user.set(null);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
