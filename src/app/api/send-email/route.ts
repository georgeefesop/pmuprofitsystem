import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';

// Create a test account for development
let testAccount: any = null;

// Initialize the transporter
const getTransporter = async () => {
  if (!testAccount) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    testAccount = await nodemailer.createTestAccount();
    console.log('Created test email account:', testAccount);
  }

  // Create a transporter using the test account
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, text } = body;
    
    // Validate required fields
    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, text' },
        { status: 400 }
      );
    }
    
    // Log the email details
    console.log('Email details:', { to, subject, text });
    
    // Store the email in Supabase for logging/auditing
    const supabase = getServiceSupabase();
    
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient: to,
        subject: subject,
        content: text,
        sent_at: new Date().toISOString()
      });
      
    if (logError) {
      console.error('Error logging email:', logError);
    }
    
    // Send the email using Nodemailer
    try {
      const transporter = await getTransporter();
      
      // Send mail with defined transport object
      const info = await transporter.sendMail({
        from: '"PMU Profit System" <noreply@pmuprofitsystem.com>',
        to,
        subject,
        text,
        html: text.replace(/\n/g, '<br>'),
      });
      
      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      
      return NextResponse.json({ 
        success: true,
        message: 'Email sent successfully',
        previewUrl: nodemailer.getTestMessageUrl(info)
      });
    } catch (emailError) {
      console.error('Error sending email via Nodemailer:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailError },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 