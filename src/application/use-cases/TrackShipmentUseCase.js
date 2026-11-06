import { TrackingGuide } from '../../domain/entities/TrackingGuide.js';

/**
 * Use Case: TrackShipment
 * Application business rule: Validates guide and produces tracking step DTO.
 */
export class TrackShipmentUseCase {
  execute({ rawGuideNumber }) {
    const guide = new TrackingGuide(rawGuideNumber);

    if (!guide.isValid) {
      return {
        success: false,
        error: 'El número de guía debe contener exactamente 12 dígitos numéricos.',
        guideNumber: guide.guideNumber
      };
    }

    const currentStepIdx = guide.getCurrentStepIndex();
    const steps = TrackingGuide.STEPS.map((s, idx) => ({
      ...s,
      isDone: idx <= currentStepIdx,
      isCurrent: idx === currentStepIdx
    }));

    return {
      success: true,
      guideNumber: guide.guideNumber,
      carrier: 'Inter Rapidísimo',
      origin: 'Soacha, Cundinamarca',
      status: steps[currentStepIdx].name,
      currentStepIndex: currentStepIdx,
      steps,
      eta: guide.getEtaDays()
    };
  }
}

