import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';

/**
 * API route to fetch all active products
 */
export async function GET(req: NextRequest) {
  console.log('API: Fetching all products');
  
  try {
    // Use the service role client to bypass RLS
    const serviceClient = await createServiceClient();
    
    // Get all active products
    const { data: products, error } = await serviceClient
      .from('products')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true });
    
    if (error) {
      console.error('API: Error getting products:', error);
      return NextResponse.json({ 
        error: 'Error getting products',
        details: error.message
      }, { status: 500 });
    }
    
    console.log(`API: Found ${products?.length || 0} products`);
    
    // Return the products
    return NextResponse.json({
      products: products || [],
      count: products?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('API: Unexpected error in products route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 