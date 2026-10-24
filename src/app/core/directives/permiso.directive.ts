import { Directive, ElementRef, effect, inject, input, Renderer2 } from '@angular/core';
import { SessionService } from '../services/session.service';

/** Hides unauthorized actions and blocks their clicks; backend remains authoritative. */
@Directive({ selector: '[appPermiso]', standalone: true })
export class PermisoDirective {
  readonly appPermiso = input.required<string>();
  private readonly session = inject(SessionService);
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  constructor() {
    effect(() => {
      const allowed = this.session.tienePermiso(this.appPermiso());
      this.renderer.setStyle(this.element.nativeElement, 'display', allowed ? '' : 'none');

    });
  }
}
