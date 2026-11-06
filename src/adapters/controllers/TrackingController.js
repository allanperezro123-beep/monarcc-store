import { TrackingPresenter } from '../presenters/TrackingPresenter.js';

/**
 * Controller: TrackingController
 * Handles guide search requests and coordinates tracking presentation.
 */
export class TrackingController {
  constructor({ trackShipmentUseCase, domRenderer }) {
    this.trackShipmentUseCase = trackShipmentUseCase;
    this.domRenderer = domRenderer;
  }

  track(rawGuideNumber) {
    const res = this.trackShipmentUseCase.execute({ rawGuideNumber });
    const vm = TrackingPresenter.toViewModel(res);

    if (this.domRenderer) {
      this.domRenderer.renderTrackingResult(vm);
    }
    return vm;
  }
}

