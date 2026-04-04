import { NextRequest, NextResponse } from 'next/server';

// Notification types
interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    url?: string;
    semester?: number;
    year?: number;
    program?: string;
    changeType?: string;
    courseCode?: string;
    teacherName?: string;
  };
}

// This endpoint is called when a schedule change occurs
export async function POST(request: NextRequest) {
  try {
    const notification: NotificationPayload = await request.json();
    
    if (!notification.title || !notification.body) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // In production, you would send push notifications to all subscribed clients
    // using a service like Firebase Cloud Messaging or Web Push Protocol
    
    // For now, we'll just log and return success
    console.log('📢 Notification to send:', notification);
    
    // The notification will be sent to clients via:
    // 1. Firebase Cloud Messaging (FCM)
    // 2. Web Push API
    // 3. In-app real-time notifications
    
    // Simulate notification broadcast
    // In production: await sendPushNotificationsToAll(notification);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification queued successfully',
      notification
    });
  } catch (error) {
    console.error('Notification send error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// Helper function to format schedule change notification
export function formatScheduleChangeNotification(data: {
  changeType: 'cancelled' | 'rescheduled' | 'room_changed' | 'time_changed' | 'extra_class';
  courseCode: string;
  courseName: string;
  teacherName: string;
  semester: number;
  year: number;
  program: string;
  oldTime?: string;
  newTime?: string;
  oldRoom?: string;
  newRoom?: string;
  reason?: string;
}): NotificationPayload {
  const { changeType, courseCode, courseName, teacherName, semester, year, program, oldTime, newTime, oldRoom, newRoom, reason } = data;
  
  let title = '';
  let body = '';
  
  switch (changeType) {
    case 'cancelled':
      title = '❌ Class Cancelled';
      body = `${courseCode} (${courseName}) has been cancelled. ${reason || ''}`;
      break;
    case 'rescheduled':
      title = '📅 Class Rescheduled';
      body = `${courseCode} moved from ${oldTime} to ${newTime}. ${reason || ''}`;
      break;
    case 'room_changed':
      title = '🚪 Room Changed';
      body = `${courseCode} moved from ${oldRoom} to ${newRoom}. ${reason || ''}`;
      break;
    case 'time_changed':
      title = '⏰ Time Changed';
      body = `${courseCode} time changed from ${oldTime} to ${newTime}. ${reason || ''}`;
      break;
    case 'extra_class':
      title = '📚 Extra Class Added';
      body = `Extra class of ${courseCode} scheduled at ${newTime} in ${newRoom}.`;
      break;
  }

  // Add semester/year info
  body += `\n${program} - ${year}${getOrdinalSuffix(year)} Year, ${semester}${getOrdinalSuffix(semester)} Semester`;
  body += `\nTeacher: ${teacherName}`;

  return {
    title,
    body,
    data: {
      url: `/?view=student&program=${program}&semester=${semester}`,
      semester,
      year,
      program,
      changeType,
      courseCode,
      teacherName
    }
  };
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
}

// GET endpoint to retrieve recent notifications
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  
  // In production, fetch from database
  // For now, return empty array
  return NextResponse.json({
    success: true,
    notifications: [],
    count: 0
  });
}
