import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { RestablecerContrasenaComponent } from './restablecer-contrasena';

describe('RestablecerContrasenaComponent', () => {
  let component: RestablecerContrasenaComponent;
  let fixture: ComponentFixture<RestablecerContrasenaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestablecerContrasenaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RestablecerContrasenaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
