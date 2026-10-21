import { Component, effect, inject, signal } from '@angular/core';
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

type RegisterField = 'name' | 'email' | 'phone' | 'password' | 'rePassword';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.parent?.get('password')?.value;
  if (!control.value || !password) {
    return null;
  }
  return control.value === password ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.html',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = this.authService.loading;
  readonly error = this.authService.error;

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly submitted = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^01[0125]\d{8}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rePassword: ['', [Validators.required, passwordsMatch]],
  });

  constructor() {
    this.authService.clearStatus();

    this.form.controls.password.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.form.controls.rePassword.updateValueAndValidity();
    });

    effect(() => {
      if (this.authService.isAuthenticated()) {
        void this.router.navigateByUrl('/');
      }
    });
  }

  showError(controlName: RegisterField): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  fieldError(controlName: RegisterField): string {
    const control = this.form.controls[controlName];
    if (control.hasError('required')) {
      const labels: Record<RegisterField, string> = {
        name: 'Name is required.',
        email: 'Email address is required.',
        phone: 'Phone number is required.',
        password: 'Password is required.',
        rePassword: 'Confirm your password.',
      };
      return labels[controlName];
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }
    if (control.hasError('minlength') && controlName === 'name') {
      return 'Name must be at least 3 characters.';
    }
    if (control.hasError('minlength') && controlName === 'password') {
      return 'Password must be at least 6 characters.';
    }
    if (control.hasError('pattern')) {
      return 'Enter an Egyptian phone number, like 01012345678.';
    }
    if (control.hasError('passwordMismatch')) {
      return 'Passwords do not match.';
    }
    return '';
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((visible) => !visible);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, phone, password, rePassword } = this.form.getRawValue();
    this.authService.signUp({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      rePassword,
    });
  }
}
