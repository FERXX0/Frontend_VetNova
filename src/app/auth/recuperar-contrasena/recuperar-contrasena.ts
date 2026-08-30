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
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.scss',
})
export class RecuperarContrasenaComponent {
  form: FormGroup;

  isSubmitting = signal(false);
  enviado = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
    });
  }

  get correoInvalido(): boolean {
    const control = this.form.get('correo');
    return !!control && control.invalid && control.touched;
  }

  onSubmit(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService.solicitarRecuperacion(this.form.value).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.enviado.set(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.error.set('No se pudo procesar la solicitud. Intenta de nuevo.');
      },
    });
  }

  volverAlInicio(): void {
    this.router.navigate(['/login']);
  }
}
