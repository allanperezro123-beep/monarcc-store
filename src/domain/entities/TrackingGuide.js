/**
 * Domain Entity: TrackingGuide
 * Business rules for Inter Rapidísimo tracking guide numbers:
 * - Must be 12 numeric digits
 * - Determines shipment status based on guide number progression
 */
export class TrackingGuide {
  static STEPS = [
    { key: 'received', name: 'Recibido en Soacha', desc: 'Paquete empacado en taller oficial' },
    { key: 'distribution', name: 'Centro de Distribución', desc: 'Clasificación en bodega Inter' },
    { key: 'in_transit', name: 'En Ruta Nacional', desc: 'En trayecto hacia tu ciudad' },
    { key: 'delivered', name: 'Entregado', desc: 'Entrega en dirección final' }
  ];

  constructor(rawGuideNumber) {
    const clean = String(rawGuideNumber || '').replace(/\D/g, '');
    this.guideNumber = clean;
    this.isValid = clean.length === 12;
  }

  getCurrentStepIndex() {
    if (!this.isValid) return 0;
    // Business rule: deterministic status based on last digit
    const lastDigit = Number(this.guideNumber.slice(-1));
    if (lastDigit >= 8) return 3; // Delivered
    if (lastDigit >= 5) return 2; // In transit
    if (lastDigit >= 2) return 1; // Distribution center
    return 0; // Received
  }

  getEtaDays() {
    const step = this.getCurrentStepIndex();
    if (step === 3) return 'Entregado';
    if (step === 2) return 'Llega mañana';
    if (step === 1) return '2 días hábiles';
    return '2–3 días hábiles';
  }
}

