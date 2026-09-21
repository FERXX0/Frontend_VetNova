import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const LAST_ACTIVITY_KEY = 'vetnova_last_activity';
const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000; // 2 horas
const CHECK_INTERVAL_MS = 60 * 1000;             // revisa cada minuto
const WRITE_THROTTLE_MS = 15 * 1000;             // guarda actividad como máximo cada 15 s

const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

/**
 * Controla la inactividad de la sesión.
 *
 * - markActive(): llamar justo después de un login exitoso.
 * - clear():      llamar al cerrar sesión.
 * - start(cb):    llamar una vez al iniciar la app; cb se ejecuta cuando
 *                 se cumplen 2 horas sin actividad (debe cerrar la sesión).
 * - isExpired():  para usarlo en los guards.
 *
 * La marca de actividad vive en localStorage, así que se comparte entre
 * pestañas y sobrevive a recargas y a cerrar el navegador.
 */
@Injectable({ providedIn: 'root' })
export class InactivityService {
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private started = false;
  private lastWrite = 0;
  private onExpire?: () => void;

  private readonly onActivity = () => this.touch();

  start(onExpire: () => void): void {
    if (!this.isBrowser || this.started) return;
    this.started = true;
    this.onExpire = onExpire;

    // Si la marca ya venció (p. ej. el usuario volvió después de 3 horas), cierra ya.
    this.check();

    // Fuera de la zona de Angular para no disparar detección de cambios en cada movimiento.
    this.zone.runOutsideAngular(() => {
      ACTIVITY_EVENTS.forEach((evento) =>
        window.addEventListener(evento, this.onActivity, { passive: true }),
      );
      document.addEventListener('visibilitychange', () => this.check());
      setInterval(() => this.check(), CHECK_INTERVAL_MS);
    });
  }

  /** Registra actividad ahora mismo (usar tras el login). */
  markActive(): void {
    if (!this.isBrowser) return;
    this.touch(true);
  }

  /** Elimina la marca (usar al cerrar sesión). */
  clear(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch {
      /* localStorage no disponible */
    }
  }

  /** true solo si hay una sesión rastreada y ya pasaron más de 2 h sin actividad. */
  isExpired(): boolean {
    if (!this.isBrowser) return false;
    try {
      const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (raw === null) return false;
      const last = Number(raw);
      return !Number.isFinite(last) || Date.now() - last > INACTIVITY_LIMIT_MS;
    } catch {
      return false;
    }
  }

  private touch(force = false): void {
    try {
      // Sin marca = no hay sesión rastreada (p. ej. estás en el login): no crear una.
      if (!force && localStorage.getItem(LAST_ACTIVITY_KEY) === null) return;

      const now = Date.now();
      if (!force && now - this.lastWrite < WRITE_THROTTLE_MS) return;

      this.lastWrite = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    } catch {
      /* localStorage no disponible */
    }
  }

  private check(): void {
    if (!this.isExpired()) return;
    this.clear();
    this.zone.run(() => this.onExpire?.());
  }
}