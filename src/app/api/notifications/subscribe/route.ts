import { NextRequest, NextResponse } from 'next/server';

// Store subscriptions in memory (in production, use database)
const subscriptions = new Map<string, PushSubscription>();

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    // Store subscription
    subscriptions.set(subscription.endpoint, subscription);
    
    console.log('New push subscription:', subscription.endpoint);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved successfully' 
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint required' },
        { status: 400 }
      );
    }

    subscriptions.delete(endpoint);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription removed successfully' 
    });
  } catch (error) {
    console.error('Unsubscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    count: subscriptions.size 
  });
}
