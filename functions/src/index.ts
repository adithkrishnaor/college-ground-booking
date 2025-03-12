import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

admin.initializeApp();

// Configure nodemailer with your email service
const transporter = nodemailer.createTransport({
  service: "gmail", // or another email service
  auth: {
    user: "adthkrshna@gmail.com",
    pass: "uwxf ypsk jlwx xild", // Use app password for Gmail
  },
});

export const sendBookingConfirmation = onDocumentUpdated(
  "bookings/{bookingId}",
  async (event) => {
    const beforeData = event.data?.before?.data() || {};
    const afterData = event.data?.after?.data() || {};

    // Only send email when status changes to "approved"
    if (beforeData.status !== "approved" && afterData.status === "approved") {
      const { email, name, date, timeSlot, groundType } = afterData;

      const mailOptions = {
        from: '"Ground Booking App" <adthkrshna@gmail.com>',
        to: email,
        subject: "Your Booking has been Approved!",
        html: `
        <h1>Booking Confirmation</h1>
        <p>Hello ${name},</p>
        <p>We're pleased to inform you that your booking has been approved!</p>
        <h2>Booking Details:</h2>
        <ul>
          <li><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${timeSlot}</li>
          <li><strong>Ground:</strong> ${groundType}</li>
        </ul>
        <p>Thank you for using our service!</p>
      `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
        return null;
      } catch (error) {
        console.error("Error sending email:", error);
        return null;
      }
    }

    return null;
  }
);
