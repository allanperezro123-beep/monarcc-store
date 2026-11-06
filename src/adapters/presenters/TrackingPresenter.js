/**
 * Presenter: TrackingPresenter
 * Converts TrackShipmentUseCase output into View Model.
 */
export class TrackingPresenter {
  static toViewModel(trackResult) {
    if (!trackResult.success) {
      return {
        success: false,
        error: trackResult.error
      };
    }

    return {
      success: true,
      guideNumber: trackResult.guideNumber,
      carrier: trackResult.carrier,
      origin: trackResult.origin,
      status: trackResult.status,
      currentStepIndex: trackResult.currentStepIndex,
      eta: trackResult.eta,
      steps: trackResult.steps.map(s => ({
        key: s.key,
        name: s.name,
        desc: s.desc,
        isDone: s.isDone,
        isCurrent: s.isCurrent
      }))
    };
  }
}

