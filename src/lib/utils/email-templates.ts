import { ApplicationStatus } from "@/lib/domains/applications.domain";

export function getEmailTemplate(
  status: ApplicationStatus,
  jobTitle: string,
  candidateName: string,
  companyName: string = "Hiring Team"
): { subject: string; html: string } {
  const baseStyles = `
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;

  const header = `
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px;">
      <h2 style="color: #0f172a; margin: 0;">Application Update</h2>
    </div>
  `;

  const footer = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  `;

  // Status Bar Logic
  const getStatusBar = () => {
    const steps = [
      { label: "Applied", active: true },
      {
        label: "Interview",
        active: [
          ApplicationStatus.INTERVIEW,
          ApplicationStatus.OFFER,
          ApplicationStatus.REJECTED,
        ].includes(status),
      },
      {
        label:
          status === ApplicationStatus.REJECTED
            ? "Rejected"
            : status === ApplicationStatus.CANCELLED
            ? "Cancelled"
            : "Offer",
        active: [
          ApplicationStatus.OFFER,
          ApplicationStatus.REJECTED,
          ApplicationStatus.CANCELLED,
        ].includes(status),
      },
    ];

    const stepHtml = steps
      .map((step) => {
        const color = step.active ? "#0f172a" : "#cbd5e1";
        const weight = step.active ? "bold" : "normal";
        return `
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 12px; font-weight: ${weight}; color: ${color}; margin-bottom: 5px;">${step.label.toUpperCase()}</div>
          <div style="height: 4px; background-color: ${color}; border-radius: 2px;"></div>
        </div>
      `;
      })
      .join(`<div style="width: 10px;"></div>`);

    return `
      <div style="display: flex; justify-content: space-between; margin: 20px 0; padding: 0 10px;">
        ${stepHtml}
      </div>
    `;
  };

  let subject = "";
  let body = "";

  const signature = `<p>Best regards,<br>${companyName}</p>`;

  switch (status) {
    case ApplicationStatus.PENDING:
      subject = `Application Received: ${jobTitle}`;
      body = `
        <p>Dear ${candidateName},</p>
        <p>Thank you for applying for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
        <p>We have received your application and will review it shortly. If your qualifications match our requirements, we will contact you to schedule an interview.</p>
        <p>You can track the status of your application in your dashboard.</p>
        ${signature}
      `;
      break;

    case ApplicationStatus.INTERVIEW:
      subject = `Interview Invitation: ${jobTitle}`;
      body = `
        <p>Dear ${candidateName},</p>
        <p>We are pleased to inform you that your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been reviewed, and we would like to invite you for an interview.</p>
        <p>Our team will be in touch with you shortly to schedule a convenient time.</p>
        ${signature}
      `;
      break;

    case ApplicationStatus.OFFER:
      subject = `Job Offer: ${jobTitle}`;
      body = `
        <p>Dear ${candidateName},</p>
        <p>Congratulations! We are excited to offer you the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
        <p>We were impressed with your qualifications and believe you will be a great addition to our team.</p>
        <p>Please check your application dashboard for more details.</p>
        ${signature}
      `;
      break;

    case ApplicationStatus.REJECTED:
      subject = `Update on your application for ${jobTitle}`;
      body = `
        <p>Dear ${candidateName},</p>
        <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> and for taking the time to apply.</p>
        <p>After careful consideration, we regret to inform you that we have decided to move forward with other candidates who more closely match our current requirements.</p>
        <p>We wish you the best in your job search.</p>
        ${signature}
      `;
      break;

    case ApplicationStatus.CANCELLED:
      subject = `Application Cancelled: ${jobTitle}`;
      body = `
        <p>Dear ${candidateName},</p>
        <p>This email is to confirm that your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been cancelled.</p>
        <p>If you did not request this cancellation, please contact us immediately.</p>
        ${signature}
      `;
      break;

    default:
      subject = `Application Status Update: ${jobTitle}`;
      body = `
        <p>Dear ${candidateName},</p>
        <p>The status of your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated to: <strong>${status}</strong>.</p>
        ${signature}
      `;
  }

  const html = `
    <div style="${baseStyles}">
      ${header}
      ${getStatusBar()}
      <div style="padding: 20px 0;">
        ${body}
      </div>
      ${footer}
    </div>
  `;

  return { subject, html };
}

export function getSubscriptionUpgradeTemplate(
  userName: string,
  planName: string,
  endDate: Date
): { subject: string; html: string } {
  const baseStyles = `
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;

  const header = `
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px;">
      <h2 style="color: #0f172a; margin: 0;">Welcome to Premium!</h2>
    </div>
  `;

  const footer = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  `;

  const formattedDate = endDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `Welcome to ${planName}!`;
  const body = `
    <p>Dear ${userName},</p>
    <p>Congratulations! You have successfully upgraded to the <strong>${planName}</strong>.</p>
    <p>You now have access to exclusive AI features including:</p>
    <ul>
      <li>AI Mock Interviews</li>
      <li>Resume Analysis</li>
      <li>And more!</li>
    </ul>
    <p>Your subscription is active until <strong>${formattedDate}</strong>.</p>
    <p>Thank you for choosing us to help you in your career journey.</p>
    <p>Best regards,<br>RabbitJobs</p>
  `;

  const html = `
    <div style="${baseStyles}">
      ${header}
      <div style="padding: 20px 0;">
        ${body}
      </div>
      ${footer}
    </div>
  `;

  return { subject, html };
}
