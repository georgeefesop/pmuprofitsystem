import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { productId, userId, amount } = await request.json();
    
    // Validate inputs
    if (!productId || !userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // In a real app, you would process payment with Stripe/PayPal here
    // For now, we'll just create a purchase record
    
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_id: productId,
        amount: amount,
        status: 'completed'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating purchase:', error);
      return NextResponse.json(
        { error: 'Failed to create purchase' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, purchase: data });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 