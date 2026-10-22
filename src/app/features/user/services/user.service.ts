import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Subject, catchError, finalize, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { AuthService } from '../../auth/services/auth.service';
import {
  UpdateLoggedUserPasswordPayload,
  UpdateLoggedUserPasswordResponse,
  User,
  UserResponse,
} from '../models/user.model';

const USER_COOKIE = 'user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);

  private readonly changePasswordUrl = `${environment.apiUrl}${API_ENDPOINTS.users.changePassword}`;

  private readonly _user = signal<User | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _message = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly message = this._message.asReadonly();

  private readonly changePasswordRequest$ = new Subject<UpdateLoggedUserPasswordPayload>();
  private readonly meRequest$ = new Subject<string>();
  private changePasswordRequestId = 0;
  private meRequestId = 0;

  constructor() {
    this.deleteCookie(USER_COOKIE);
    this.bindChangePassword();
    this.bindMe();
    this.authService.sessionUserId.subscribe((id) => {
      if (!id) {
        this.meRequestId++;
        this._user.set(null);
        return;
      }
      this.getMe(id);
    });
  }

  getMe(id: string): void {
    if (!id) {
      return;
    }
    this.meRequest$.next(id);
  }

  updateLoggedUserPassword(payload: UpdateLoggedUserPasswordPayload): void {
    this.changePasswordRequest$.next(payload);
  }

  private bindChangePassword(): void {
    this.changePasswordRequest$
      .pipe(
        switchMap((payload) => {
          const requestId = ++this.changePasswordRequestId;
          this._loading.set(true);
          this._error.set(null);
          this._message.set(null);

          return this.http
            .put<UpdateLoggedUserPasswordResponse>(this.changePasswordUrl, payload, {
              headers: new HttpHeaders({ token: this.authService.token() ?? '' }),
            })
            .pipe(
              catchError((err: unknown) => {
                if (requestId === this.changePasswordRequestId) {
                  this._error.set(this.readError(err, 'Failed to update password'));
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.changePasswordRequestId) {
                  this._loading.set(false);
                }
              }),
            );
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        if (response.token) {
          this.authService.applyToken(response.token);
        }
        this._message.set(response.message ?? 'Password updated successfully');
      });
  }

  private bindMe(): void {
    this.meRequest$
      .pipe(
        switchMap((id) => {
          const requestId = ++this.meRequestId;

          return this.http
            .get<UserResponse>(`${environment.apiUrl}${API_ENDPOINTS.users.me(id)}`, {
              headers: new HttpHeaders({ token: this.authService.token() ?? '' }),
            })
            .pipe(
              map((response) => ({ response, requestId })),
              catchError(() => of({ response: null, requestId })),
            );
        }),
      )
      .subscribe((result) => {
        if (result.requestId !== this.meRequestId) {
          return;
        }
        this._user.set(result.response?.data ?? null);
      });
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

  private deleteCookie(name: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}
