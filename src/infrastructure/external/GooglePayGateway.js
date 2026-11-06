/**
 * Infrastructure (External Service): GooglePayGateway
 * Simulates integration with Google Pay and card payments.
 */
export class GooglePayGateway {
  async processGooglePay(cart) {
    if (cart.length === 0) {
      return { success: false, error: 'La bolsa está vacía.' };
    }

    // Simulate 1.1s network tokenization & payment authorization
    await new Promise(resolve => setTimeout(resolve, 1100));
    return {
      success: true,
      orderNumber: '#MNC-' + Math.floor(1000 + Math.random() * 9000),
      guideNumber: '982041' + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString()
    };
  }

  async processCardPayment(cart, cardDetails) {
    if (cart.length === 0) {
      return { success: false, error: 'La bolsa está vacía.' };
    }

    // Simulate 1.2s 256-bit encrypted card gateway authorization
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      success: true,
      orderNumber: '#MNC-' + Math.floor(1000 + Math.random() * 9000),
      guideNumber: '982041' + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString()
    };
  }
}

