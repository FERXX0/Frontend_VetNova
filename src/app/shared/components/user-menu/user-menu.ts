import { Component, ElementRef, HostListener, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
})
export class UserMenuComponent {
  private readonly session = inject(SessionService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  /** URL opcional de foto de perfil (preparada para cuando backend la implemente) */
  @Input() fotoUrl?: string;

  readonly abierto = signal(false);
  readonly usuario = this.session.usuario;

  readonly esSuperAdmin = computed(() => !!this.usuario()?.es_super_administrador);

  readonly iniciales = computed(() => {
    const nombre = this.usuario()?.nombre?.trim();
    if (!nombre) return 'U';
    const partes = nombre.split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  });

  readonly perfilRuta = computed(() => {
    return this.esSuperAdmin() ? '/super-usuario/perfil' : '/panel/perfil';
  });

  toggleDropdown(): void {
    this.abierto.update((v) => !v);
  }

  cerrarDropdown(): void {
    this.abierto.set(false);
  }

  irAPerfil(): void {
    this.cerrarDropdown();
    this.router.navigate([this.perfilRuta()]);
  }

  cerrarSesion(): void {
    this.cerrarDropdown();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.cerrarDropdown();
    }
  }
}
