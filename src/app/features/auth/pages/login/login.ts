import { isPlatformBrowser } from '@angular/common';
import { Component, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);

  readonly loading = this.authService.loading;
  readonly error = this.authService.error;
  readonly resetNotice = signal<string | null>(null);

  readonly rememberDevice = signal(true);
  readonly showPassword = signal(false);
  readonly submitted = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    this.authService.clearStatus();

    if (isPlatformBrowser(this.platformId)) {
      const state = history.state as { resetSuccess?: string } | null;
      if (state?.resetSuccess) {
        this.resetNotice.set(state.resetSuccess);
        history.replaceState({ ...history.state, resetSuccess: undefined }, '');
      }
    }

    effect(() => {
      if (this.authService.isAuthenticated()) {
        void this.router.navigateByUrl('/');
      }
    });
  }

  showError(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  fieldError(controlName: 'email' | 'password'): string {
    const control = this.form.controls[controlName];
    if (control.hasError('required')) {
      return controlName === 'email' ? 'Email address is required.' : 'Password is required.';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 6 characters.';
    }
    return '';
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.authService.signIn({ email: email.trim(), password }, this.rememberDevice());
  }
}
