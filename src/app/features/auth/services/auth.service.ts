import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, finalize, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import {
  AuthMessageResponse,
  AuthSessionResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  SignInPayload,
  SignUpPayload,
  VerifyResetCodePayload,
  VerifyTokenResponse,
} from '../models/auth.model';

const TOKEN_COOKIE = 'token';
const COOKIE_MAX_AGE_30_DAYS = 60 * 60 * 24 * 30;
const COOKIE_MAX_AGE_1_DAY = 60 * 60 * 24;

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
  private readonly verifyTokenUrl = `${environment.apiUrl}${API_ENDPOINTS.auth.verifyToken}`;

  private readonly _token = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _message = signal<string | null>(null);

  readonly token = this._token.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly message = this._message.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this._token()));

  private readonly signUpRequest$ = new Subject<SignUpPayload>();
  private readonly signInRequest$ = new Subject<{ payload: SignInPayload; maxAge: number }>();
  private readonly forgotPasswordRequest$ = new Subject<ForgotPasswordPayload>();
  private readonly verifyResetCodeRequest$ = new Subject<VerifyResetCodePayload>();
  private readonly resetPasswordRequest$ = new Subject<ResetPasswordPayload>();
  private readonly verifyTokenRequest$ = new Subject<string>();
  private readonly sessionUserId$ = new Subject<string | null>();

  readonly sessionUserId: Observable<string | null> = this.sessionUserId$.asObservable();

  private signUpRequestId = 0;
  private signInRequestId = 0;
  private forgotPasswordRequestId = 0;
  private verifyResetCodeRequestId = 0;
  private resetPasswordRequestId = 0;
  private verifyTokenRequestId = 0;

  constructor() {
    this.restoreSession();
    this.bindSignUp();
    this.bindSignIn();
    this.bindForgotPassword();
    this.bindVerifyResetCode();
    this.bindResetPassword();
    this.bindVerifyToken();
    this.verifyToken();
  }

  signUp(payload: SignUpPayload): void {
    this.signUpRequest$.next(payload);
  }

  signIn(payload: SignInPayload, rememberDevice = true): void {
    this.signInRequest$.next({
      payload,
      maxAge: rememberDevice ? COOKIE_MAX_AGE_30_DAYS : COOKIE_MAX_AGE_1_DAY,
    });
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

  verifyToken(): void {
    const token = this._token();
    if (!token || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.verifyTokenRequest$.next(token);
  }

  applyToken(token: string, maxAge = COOKIE_MAX_AGE_30_DAYS): void {
    this.setToken(token, maxAge);
  }

  logout(): void {
    this.clearSession();
    this.clearStatus();
  }

  clearStatus(): void {
    this.signUpRequestId++;
    this.signInRequestId++;
    this.forgotPasswordRequestId++;
    this.verifyResetCodeRequestId++;
    this.resetPasswordRequestId++;
    this.verifyTokenRequestId++;
    this._loading.set(false);
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
            catchError((err) =>
              this.handleError(err, requestId, this.signUpRequestId, 'Failed to create account'),
            ),
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
        switchMap(({ payload, maxAge }) => {
          const requestId = ++this.signInRequestId;
          this.startRequest();

          return this.http.post<AuthSessionResponse>(this.signinUrl, payload).pipe(
            map((response) => ({ response, maxAge })),
            catchError((err) =>
              this.handleError(err, requestId, this.signInRequestId, 'Failed to sign in'),
            ),
            finalize(() => this.finishRequest(requestId, this.signInRequestId)),
          );
        }),
      )
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.setSession(result.response, result.maxAge);
        this._message.set(result.response.message ?? 'Signed in successfully');
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
              this.handleError(
                err,
                requestId,
                this.forgotPasswordRequestId,
                'Failed to send reset code',
              ),
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
              this.handleError(
                err,
                requestId,
                this.resetPasswordRequestId,
                'Failed to reset password',
              ),
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
          this.setToken(response.token);
        }
        this._message.set(response.message ?? 'Password reset successfully');
      });
  }

  private bindVerifyToken(): void {
    this.verifyTokenRequest$
      .pipe(
        switchMap((token) => {
          const requestId = ++this.verifyTokenRequestId;

          return this.http
            .get<VerifyTokenResponse>(this.verifyTokenUrl, {
              headers: new HttpHeaders({ token }),
            })
            .pipe(
              map((response) => ({
                requestId,
                token,
                invalid: response.message !== 'verified',
                userId: response.decoded?.id ?? null,
              })),
              catchError((err: unknown) =>
                of({
                  requestId,
                  token,
                  invalid: this.isRejectedToken(err),
                  userId: null,
                }),
              ),
            );
        }),
      )
      .subscribe((result) => {
        if (result.requestId !== this.verifyTokenRequestId || this._token() !== result.token) {
          return;
        }
        if (result.invalid) {
          this.clearSession();
          return;
        }
        if (result.userId) {
          this.publishUserId(result.userId);
        }
      });
  }

  private isRejectedToken(err: unknown): boolean {
    if (!(err instanceof HttpErrorResponse)) {
      return false;
    }

    const body = err.error as { statusMsg?: string } | null;
    return body?.statusMsg === 'fail' || err.status === 401 || err.status === 403;
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

  private setSession(response: AuthSessionResponse, maxAge = COOKIE_MAX_AGE_30_DAYS): void {
    this.setToken(response.token, maxAge);
    if (response.user?._id) {
      this.publishUserId(response.user._id);
    }
  }

  private publishUserId(id: string | null): void {
    this.sessionUserId$.next(id);
  }

  private setToken(token: string, maxAge = COOKIE_MAX_AGE_30_DAYS): void {
    this._token.set(token);
    this.writeCookie(TOKEN_COOKIE, token, maxAge);
  }

  private restoreSession(): void {
    const token = this.readCookie(TOKEN_COOKIE);
    if (token) {
      this._token.set(token);
    }
  }

  private clearSession(): void {
    this._token.set(null);
    this.deleteCookie(TOKEN_COOKIE);
    this.publishUserId(null);
  }

  private readCookie(name: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  private writeCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE_30_DAYS): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }

  private deleteCookie(name: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}
