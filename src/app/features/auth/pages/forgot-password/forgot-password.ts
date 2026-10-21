import { isPlatformBrowser } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type ResetStep = 1 | 2 | 3;
type PendingReset = 'email' | 'otp' | 'password' | 'resend';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.parent?.get('newPassword')?.value;
  if (!control.value || !password) {
    return null;
  }
  return control.value === password ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly otpInputs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  readonly loading = this.authService.loading;
  readonly error = this.authService.error;

  readonly step = signal<ResetStep>(1);
  readonly email = signal<string | null>(null);
  readonly otpVerified = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly emailSubmitted = signal(false);
  readonly otpSubmitted = signal(false);
  readonly passwordSubmitted = signal(false);
  readonly resendSeconds = signal(0);

  private readonly pending = signal<PendingReset | null>(null);

  readonly steps = [
    { id: 1 as const, label: 'Requested' },
    { id: 2 as const, label: 'Verify OTP' },
    { id: 3 as const, label: 'New Password' },
  ];

  readonly emailForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly otpDigits = this.formBuilder.nonNullable.array(
    Array.from({ length: 6 }, () => this.formBuilder.nonNullable.control('')),
  );

  readonly passwordForm = this.formBuilder.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, passwordsMatch]],
  });

  constructor() {
    this.authService.clearStatus();
    this.clearFlow();

    this.passwordForm.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.passwordForm.controls.confirmPassword.updateValueAndValidity());

    this.destroyRef.onDestroy(() => {
      this.clearResendTimer();
      this.clearFlow();
    });

    effect(() => {
      const message = this.authService.message();
      const pending = this.pending();
      if (message == null || !pending) {
        return;
      }

      this.pending.set(null);
      if (pending === 'email') {
        this.email.set(this.emailForm.getRawValue().email.trim());
        this.step.set(2);
        this.startResendCooldown();
        return;
      }
      if (pending === 'otp') {
        this.otpVerified.set(true);
        this.step.set(3);
        return;
      }
      if (pending === 'resend') {
        this.startResendCooldown();
        return;
      }

      const notice = message;
      this.clearFlow();
      this.authService.logout();
      void this.router.navigate(['/login'], { state: { resetSuccess: notice } });
    });

    effect(() => {
      if (this.authService.error()) {
        this.pending.set(null);
      }
    });

    afterRenderEffect(() => {
      if (this.step() !== 2 || !isPlatformBrowser(this.platformId)) {
        return;
      }
      this.otpInputs()[0]?.nativeElement.focus();
    });
  }

  emailError(): string {
    const control = this.emailForm.controls.email;
    if (!control.invalid || !(control.touched || this.emailSubmitted())) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Email address is required.';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }
    return '';
  }

  otpCode(): string {
    return this.otpDigits.controls.map((control) => control.value).join('');
  }

  otpError(): string {
    if (!this.otpSubmitted()) {
      return '';
    }
    return /^\d{6}$/.test(this.otpCode()) ? '' : 'The code must be 6 numbers.';
  }

  passwordStrength(): { label: string; score: number } {
    const value = this.passwordForm.controls.newPassword.value;
    let score = 0;
    if (value.length >= 8) {
      score += 1;
    }
    if (/[A-Z]/.test(value)) {
      score += 1;
    }
    if (/[0-9]/.test(value)) {
      score += 1;
    }
    if (/[^A-Za-z0-9]/.test(value)) {
      score += 1;
    }

    const labels = ['', 'Weak', 'Fair', 'Strong', 'Excellent'] as const;
    return { label: value ? labels[score] || 'Weak' : '', score };
  }

  passwordsMatch(): boolean {
    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();
    return Boolean(newPassword) && newPassword === confirmPassword;
  }

  passwordError(controlName: 'newPassword' | 'confirmPassword'): string {
    const control = this.passwordForm.controls[controlName];
    if (!control.invalid || !(control.touched || this.passwordSubmitted())) {
      return '';
    }
    if (control.hasError('required')) {
      return controlName === 'newPassword' ? 'Password is required.' : 'Confirm your password.';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 6 characters.';
    }
    if (control.hasError('passwordMismatch')) {
      return 'Passwords do not match.';
    }
    return '';
  }

  verifyEmail(event: Event): void {
    event.preventDefault();
    this.emailSubmitted.set(true);
    if (this.emailForm.invalid || this.step() !== 1) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.authService.clearStatus();
    this.pending.set('email');
    this.authService.forgotPassword({ email: this.emailForm.getRawValue().email.trim() });
  }

  verifyCode(event: Event): void {
    event.preventDefault();
    this.otpSubmitted.set(true);
    if (!/^\d{6}$/.test(this.otpCode()) || this.step() !== 2 || !this.email()) {
      return;
    }

    this.authService.clearStatus();
    this.pending.set('otp');
    this.authService.verifyResetCode({ resetCode: this.otpCode() });
  }

  resendCountdown(): string {
    const seconds = this.resendSeconds();
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  }

  resendCode(): void {
    const savedEmail = this.email();
    if (!savedEmail || this.step() !== 2 || this.resendSeconds() > 0 || this.loading()) {
      return;
    }

    this.authService.clearStatus();
    this.pending.set('resend');
    this.authService.forgotPassword({ email: savedEmail });
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);
    this.otpDigits.at(index).setValue(digit);
    input.value = digit;
    if (!digit || index >= 5) {
      return;
    }
    input.parentElement?.querySelectorAll<HTMLInputElement>('input')[index + 1]?.focus();
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    if (event.key !== 'Backspace' || input.value || index === 0) {
      return;
    }
    input.parentElement?.querySelectorAll<HTMLInputElement>('input')[index - 1]?.focus();
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const chars = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    for (let index = 0; index < 6; index += 1) {
      this.otpDigits.at(index).setValue(chars[index] ?? '');
    }
    const inputs = (event.target as HTMLInputElement).parentElement?.querySelectorAll<HTMLInputElement>(
      'input',
    );
    inputs?.[Math.min(chars.length, 5)]?.focus();
  }

  resetPassword(event: Event): void {
    event.preventDefault();
    this.passwordSubmitted.set(true);
    const savedEmail = this.email();
    if (this.passwordForm.invalid || this.step() !== 3 || !this.otpVerified() || !savedEmail) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.authService.clearStatus();
    this.pending.set('password');
    this.authService.resetPassword({
      email: savedEmail,
      newPassword: this.passwordForm.getRawValue().newPassword,
    });
  }

  changeEmail(): void {
    this.pending.set(null);
    this.authService.clearStatus();
    this.email.set(null);
    this.otpVerified.set(false);
    this.step.set(1);
    this.emailSubmitted.set(false);
    this.otpSubmitted.set(false);
    this.otpDigits.reset();
    this.passwordForm.reset();
    this.clearResendTimer();
    this.resendSeconds.set(0);
  }

  private startResendCooldown(): void {
    this.clearResendTimer();
    this.resendSeconds.set(60);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.resendTimer = setInterval(() => {
      const next = this.resendSeconds() - 1;
      if (next <= 0) {
        this.resendSeconds.set(0);
        this.clearResendTimer();
        return;
      }
      this.resendSeconds.set(next);
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimer == null) {
      return;
    }
    clearInterval(this.resendTimer);
    this.resendTimer = null;
  }

  private clearFlow(): void {
    this.email.set(null);
    this.otpVerified.set(false);
    this.step.set(1);
    this.pending.set(null);
    this.clearResendTimer();
    this.resendSeconds.set(0);
  }
}
