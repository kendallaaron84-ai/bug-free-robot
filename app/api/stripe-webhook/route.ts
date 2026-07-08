import { NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') as string;
    
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const userId = session.client_reference_id;
        const metadata = session.metadata || {};
        const purchaseType = metadata.purchaseType; // 'core_plugin' or 'addon_social_video'

        if (!userId) {
            console.error("Missing client_reference_id in checkout session");
            return NextResponse.json({ error: "Missing client_reference_id" }, { status: 400 });
        }

        try {
            if (purchaseType === 'core_plugin') {
                // Mint permanent software license for the WordPress plugin (Zero-Commission)
                await adminDb.collection('licenses').add({
                    userId,
                    status: 'active',
                    type: 'permanent',
                    key: `KOBA-STUDIO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                    purchasedAt: new Date(),
                    features: ['core']
                });

                // Update user profile to reflect the one-time purchase
                await adminDb.collection('users').doc(userId).collection('profile').doc('subscription').set({
                    hasCorePlugin: true,
                    tier: 'one_time_owner'
                }, { merge: true });

            } else if (purchaseType === 'addon_social_video') {
                // Upsell gate unlock for premium modules
                await adminDb.collection('users').doc(userId).collection('profile').doc('subscription').set({
                    hasSocialVideoEngine: true
                }, { merge: true });
            }
            
            console.log(`[Stripe Webhook] Successfully processed purchase: ${purchaseType} for user ${userId}`);

        } catch (error) {
            console.error("[Stripe Webhook] DB Error:", error);
            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
