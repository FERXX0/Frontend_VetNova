import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss' ,
})
export class LoginComponent {
  form: FormGroup;

  // Estado de la UI
  showPassword = signal(false);
  isSubmitting = signal(false);
  loginError = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {
    // El campo se llama "usuario" para no tocar el HTML/mockup existente,
    // pero en este backend el usuario se identifica por su correo: se
    // valida como tal y así se envía en el payload de login.
    this.form = this.fb.group({
      usuario: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required]],
    });
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  get usuarioInvalido(): boolean {
    const control = this.form.get('usuario');
    return !!control && control.invalid && control.touched;
  }

  get contrasenaInvalida(): boolean {
    const control = this.form.get('contrasena');
    return !!control && control.invalid && control.touched;
  }

  onSubmit(): void {
    this.loginError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const { usuario, contrasena } = this.form.value;

    this.authService.login({ correo: usuario, contrasena }).subscribe({
      next: (respuesta) => {
        this.isSubmitting.set(false);

        if (respuesta.usuario.es_super_administrador) {
          this.router.navigate(['/super-usuario/dashboard']);
        } else {
          const modulos = respuesta.usuario.modulos || [];
          if (modulos.length === 0) {
            this.router.navigate(['/panel/sin-modulos']);
          } else {
            this.router.navigate(['/panel/dashboard']);
          }
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.loginError.set(
          error?.error?.message ?? 'No se pudo iniciar sesión. Intenta de nuevo.',
        );
      },
    });
  }

  onForgotPassword(): void {
    this.router.navigate(['/recuperar-contrasena']);
  }
}
