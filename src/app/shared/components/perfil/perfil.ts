import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class PerfilComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionService);
  private readonly authService = inject(AuthService);

  readonly usuario = this.session.usuario;
  readonly esSuperAdmin = computed(() => !!this.usuario()?.es_super_administrador);

  readonly rutaVolver = computed(() => {
    return this.esSuperAdmin() ? '/super-usuario/dashboard' : '/panel';
  });

  readonly iniciales = computed(() => {
    const nombre = this.usuario()?.nombre?.trim();
    if (!nombre) return 'U';
    const partes = nombre.split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  });

  guardando = signal(false);
  mensajeExito = signal<string | null>(null);
  mensajeError = signal<string | null>(null);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      celular: ['', [Validators.maxLength(30)]],
      fecha_nacimiento: [''],
    });
  }

  ngOnInit(): void {
    const user = this.usuario();
    if (user) {
      this.form.patchValue({
        nombre: user.nombre ?? '',
        correo: user.correo ?? '',
        celular: user.celular ?? '',
        fecha_nacimiento: user.fecha_nacimiento ?? '',
      });
    }
  }

  guardar(): void {
    this.mensajeExito.set(null);
    this.mensajeError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const payload = this.form.value;

    this.authService.actualizarPerfil(payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.mensajeExito.set(res?.message || 'Perfil actualizado con éxito.');
      },
      error: (err) => {
        this.guardando.set(false);
        // Si el backend aún no tiene el endpoint implementado (404), mostramos aviso informativo
        if (err?.status === 404) {
          this.mensajeError.set(
            '⚠️ El endpoint PUT /auth/perfil aún no está disponible en el servidor. Los cambios locales se han guardado temporalmente.'
          );
          // Actualizamos sesión localmente para que la UI responda de inmediato
          const user = this.usuario();
          if (user) {
            const token = this.session.obtenerToken() ?? '';
            this.session.guardar(token, { ...user, ...payload });
            this.mensajeExito.set('Datos actualizados en la sesión local.');
          }
        } else {
          this.mensajeError.set(
            err?.error?.message || 'No se pudo actualizar el perfil. Intenta de nuevo.'
          );
        }
      },
    });
  }
}
