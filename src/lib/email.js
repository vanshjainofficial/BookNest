import nodemailer from 'nodemailer';


const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};


const emailTemplates = {
  exchangeRequest: (requesterName, bookTitle, ownerName) => ({
    subject: `New Book Exchange Request - ${bookTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">New Book Exchange Request</h2>
        <p>Hello ${ownerName},</p>
        <p><strong>${requesterName}</strong> has requested to exchange your book:</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0; color: #1F2937;">${bookTitle}</h3>
        </div>
        <p>Please log in to your account to approve or reject this request.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/exchanges" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Exchange Requests
        </a>
        <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
          Best regards,<br>
          Book Trading Club Team
        </p>
      </div>
    `
  }),

  exchangeApproved: (ownerName, bookTitle, requesterName) => ({
    subject: `Exchange Request Approved - ${bookTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Exchange Request Approved! 🎉</h2>
        <p>Hello ${requesterName},</p>
        <p>Great news! <strong>${ownerName}</strong> has approved your exchange request for:</p>
        <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin: 0; color: #1F2937;">${bookTitle}</h3>
        </div>
        <p>You can now start chatting with ${ownerName} to arrange the exchange details.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/exchanges" 
           style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Exchange Details
        </a>
        <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
          Happy reading!<br>
          Book Trading Club Team
        </p>
      </div>
    `
  }),

  exchangeRejected: (ownerName, bookTitle, requesterName) => ({
    subject: `Exchange Request Update - ${bookTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">Exchange Request Update</h2>
        <p>Hello ${requesterName},</p>
        <p>Unfortunately, <strong>${ownerName}</strong> has declined your exchange request for:</p>
        <div style="background-color: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
          <h3 style="margin: 0; color: #1F2937;">${bookTitle}</h3>
        </div>
        <p>Don't worry! There are many other great books available for exchange.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/books" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Browse More Books
        </a>
        <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
          Keep exploring!<br>
          Book Trading Club Team
        </p>
      </div>
    `
  }),

  newMessage: (senderName, receiverName, bookTitle) => ({
    subject: `New Message from ${senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">New Message Received</h2>
        <p>Hello ${receiverName},</p>
        <p>You have received a new message from <strong>${senderName}</strong> regarding your book exchange:</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0; color: #1F2937;">${bookTitle}</h3>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/exchanges" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Message
        </a>
        <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
          Best regards,<br>
          Book Trading Club Team
        </p>
      </div>
    `
  }),

  newRating: (raterName, ratedName, rating, bookTitle) => ({
    subject: `You received a ${rating}-star rating!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">New Rating Received! ⭐</h2>
        <p>Hello ${ratedName},</p>
        <p><strong>${raterName}</strong> has rated you <strong>${rating}/5 stars</strong> for your book exchange:</p>
        <div style="background-color: #FFFBEB; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <h3 style="margin: 0; color: #1F2937;">${bookTitle}</h3>
          <div style="margin-top: 10px;">
            ${'⭐'.repeat(rating)}${'☆'.repeat(5 - rating)}
          </div>
        </div>
        <p>Thank you for being a great member of our book trading community!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" 
           style="background-color: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Your Profile
        </a>
        <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
          Keep up the great work!<br>
          Book Trading Club Team
        </p>
      </div>
    `
  }),

  bookOwnershipTransferred: (ownerName, bookTitle, message) => ({
    subject: `Book Ownership Transferred - ${bookTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7C3AED;">Book Ownership Transferred! 📚</h2>
        <p>Hello,</p>
        <p><strong>${message}</strong></p>
        <div style="background-color: #F3E8FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7C3AED;">
          <h3 style="margin: 0; color: #1F2937;">${bookTitle}</h3>
          <p style="margin: 10px 0 0 0; color: #6B7280;">by ${ownerName}</p>
        </div>
        <p>The book exchange has been completed successfully and ownership has been transferred.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-books" 
           style="background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View My Books
        </a>
        <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
          Thank you for using Book Trading Club!<br>
          Book Trading Club Team
        </p>
      </div>
    `
  })
};


export const sendEmail = async (to, templateName, data) => {
  try {
    
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
      
      return { success: true, message: 'Email skipped in development' };
    }

    const transporter = createTransporter();
    const template = emailTemplates[templateName];
    
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const emailContent = typeof template === 'function' ? template(...data) : template;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('📧 Email sending failed:', error);
    return { success: false, error: error.message };
  }
};


export const getUserEmail = async (userId) => {
  try {
    const User = (await import('@/models/User')).default;
    const user = await User.findById(userId).select('email');
    return user ? user.email : null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
};
