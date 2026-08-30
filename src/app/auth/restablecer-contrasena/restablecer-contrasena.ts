import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

function contrasenasCoincidenValidator(control: AbstractControl): ValidationErrors | null {
  const contrasena = control.get('contrasena')?.value;
  const confirmacion = control.get('contrasena_confirmation')?.value;
  return contrasena && confirmacion && contrasena !== confirmacion
    ? { contrasenasNoCoinciden: true }
    : null;
}

@Component({
  selector: 'app-restablecer-contrasena',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './restablecer-contrasena.html',
  styleUrl: './restablecer-contrasena.scss',
})
export class RestablecerContrasenaComponent {
  form: FormGroup;

  showPassword = signal(false);
  showPasswordConfirm = signal(false);
  isSubmitting = signal(false);
  exito = signal(false);
  error = signal<string | null>(null);

  enlaceInvalido = signal(false);

  private correo = '';
  private token = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {
    this.form = this.fb.group(
      {
        contrasena: ['', [Validators.required, Validators.minLength(8)]],
        contrasena_confirmation: ['', [Validators.required]],
      },
      { validators: contrasenasCoincidenValidator },
    );

    this.correo = this.route.snapshot.queryParamMap.get('correo') ?? '';
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.correo || !this.token) {
      this.enlaceInvalido.set(true);
      this.error.set(
        'El enlace no es válido o está incompleto. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".',
      );
    }
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  togglePasswordConfirm(): void {
    this.showPasswordConfirm.update((value) => !value);
  }

  get contrasenaInvalida(): boolean {
    const control = this.form.get('contrasena');
    return !!control && control.invalid && control.touched;
  }

  get confirmacionInvalida(): boolean {
    const control = this.form.get('contrasena_confirmation');
    const noCoinciden = this.form.hasError('contrasenasNoCoinciden');
    return !!control && control.touched && (control.invalid || noCoinciden);
  }

  onSubmit(): void {
    this.error.set(null);

    if (this.enlaceInvalido()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .restablecerContrasena({
        correo: this.correo,
        token: this.token,
        contrasena: this.form.value.contrasena,
        contrasena_confirmation: this.form.value.contrasena_confirmation,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.exito.set(true);
        },
        error: (error: any) => {
          this.isSubmitting.set(false);
          this.error.set(
            error?.error?.message ?? 'No se pudo restablecer la contraseña. Intenta de nuevo.',
          );
        },
      });
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }

  irARecuperar(): void {
    this.router.navigate(['/recuperar-contrasena']);
  }
}
