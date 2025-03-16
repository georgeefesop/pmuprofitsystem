#!/usr/bin/env node

/**
 * Script to test the auto-create-entitlements API directly
 * 
 * This script:
 * 1. Takes a user ID, product ID, and optional payment intent ID as parameters
 * 2. Makes a direct call to the auto-create-entitlements API
 * 3. Logs the response
 */

require('dotenv').config();
const fetch = require('node-fetch');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Product ID mapping
const PRODUCT_IDS = {
  'pmu-profit-system': '4a554622-d759-42b7-b830-79c9136d2f96',
  'pmu-ad-generator': '4ba5c775-a8e4-449e-828f-19f938e3710b',
  'consultation-success-blueprint': 'e5749058-500d-4333-8938-c8a19b16cd65',
  'pricing-template': 'f2a8c6b1-9d3e-4c7f-b5a2-1e8d7f9b6c3a'
};

// Function to normalize product ID
function normalizeProductId(productId) {
  // If it's already a UUID, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
    return productId;
  }
  
  // Otherwise, look up the UUID from the mapping
  return PRODUCT_IDS[productId] || productId;
}

// Main function
async function main() {
  try {
    // Get user ID
    const userId = await new Promise((resolve) => {
      rl.question('Enter user ID (default: 57e5a1a4-150d-4185-afd5-983363d608d9): ', (answer) => {
        resolve(answer.trim() || '57e5a1a4-150d-4185-afd5-983363d608d9');
      });
    });
    
    // Get product ID
    const productIdInput = await new Promise((resolve) => {
      rl.question('Enter product ID (e.g., consultation-success-blueprint): ', (answer) => {
        resolve(answer.trim() || 'consultation-success-blueprint');
      });
    });
    
    const productId = normalizeProductId(productIdInput);
    
    // Get payment intent ID (optional)
    const paymentIntentId = await new Promise((resolve) => {
      rl.question('Enter payment intent ID (optional): ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    // Get purchase ID (optional)
    const purchaseId = await new Promise((resolve) => {
      rl.question('Enter purchase ID (optional): ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    console.log('\nCalling auto-create-entitlements API with:');
    console.log(`User ID: ${userId}`);
    console.log(`Product ID: ${productId}`);
    if (paymentIntentId) console.log(`Payment Intent ID: ${paymentIntentId}`);
    if (purchaseId) console.log(`Purchase ID: ${purchaseId}`);
    
    // Determine the API URL
    const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const endpoint = `${apiUrl}/api/auto-create-entitlements`;
    
    console.log(`\nAPI Endpoint: ${endpoint}`);
    
    // Call the API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        productId,
        paymentIntentId: paymentIntentId || undefined,
        purchaseId: purchaseId || undefined
      }),
    });
    
    const responseText = await response.text();
    
    console.log(`\nResponse Status: ${response.status}`);
    
    try {
      // Try to parse as JSON
      const responseJson = JSON.parse(responseText);
      console.log('Response Body:');
      console.log(JSON.stringify(responseJson, null, 2));
      
      if (responseJson.success) {
        console.log('\nSuccess! Entitlements created or found.');
        
        if (responseJson.purchases) {
          console.log(`\nPurchases (${responseJson.purchases.length}):`);
          responseJson.purchases.forEach((purchase, index) => {
            console.log(`${index + 1}. ID: ${purchase.id}`);
            console.log(`   Product ID: ${purchase.product_id}`);
            console.log(`   Status: ${purchase.status}`);
            console.log(`   Created At: ${purchase.created_at}`);
          });
        }
        
        if (responseJson.entitlements) {
          console.log(`\nEntitlements (${responseJson.entitlements.length}):`);
          responseJson.entitlements.forEach((entitlement, index) => {
            console.log(`${index + 1}. ID: ${entitlement.id}`);
            console.log(`   Product ID: ${entitlement.product_id}`);
            console.log(`   Is Active: ${entitlement.is_active}`);
            console.log(`   Created At: ${entitlement.created_at}`);
          });
        }
      } else {
        console.log('\nAPI call failed:');
        console.log(responseJson.error || 'Unknown error');
      }
    } catch (e) {
      // Not JSON, just log the text
      console.log('Response Body (not JSON):');
      console.log(responseText);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main(); 