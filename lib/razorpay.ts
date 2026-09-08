// ============================================================
// LEARNSPHERE — Razorpay Script Loader & Client Types
// ============================================================

export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
}

export interface RazorpayOptions {
    key: string;
    amount: number; // in paise
    currency: string;
    name: string;
    description: string;
    image?: string;
    order_id?: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
        color?: string;
    };
    handler?: (response: RazorpaySuccessResponse) => void;
    modal?: {
        ondismiss?: () => void;
        escape?: boolean;
        backdropclose?: boolean;
    };
}

export interface RazorpayInstance {
    open: () => void;
    on: (event: string, handler: (response: any) => void) => void;
    close: () => void;
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

/**
 * Safely load the Razorpay Checkout script on the frontend.
 * Resolves true when window.Razorpay is available, false otherwise.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve(false);
            return;
        }

        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const existingScript = document.getElementById('razorpay-checkout-script');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(true));
            existingScript.addEventListener('error', () => resolve(false));
            return;
        }

        const script = document.createElement('script');
        script.id = 'razorpay-checkout-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;

        script.onload = () => {
            resolve(true);
        };

        script.onerror = () => {
            console.error('[Razorpay] Failed to load checkout script');
            resolve(false);
        };

        document.body.appendChild(script);
    });
};
