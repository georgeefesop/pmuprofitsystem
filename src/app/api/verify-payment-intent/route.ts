import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment has not been completed' },
        { status: 400 }
      );
    }

    // Extract metadata from the payment intent
    const { email, name, includeAdGenerator, includeBlueprint } = paymentIntent.metadata as {
      email: string;
      name: string;
      includeAdGenerator: string;
      includeBlueprint: string;
    };

    // Return the purchase details
    return NextResponse.json({
      success: true,
      email,
      name,
      includesAdGenerator: includeAdGenerator === 'true',
      includesBlueprint: includeBlueprint === 'true',
      amount: paymentIntent.amount / 100, // Convert from cents to euros
    });
  } catch (error) {
    console.error('Error verifying payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment intent' },
      { status: 500 }
    );
  }
} 