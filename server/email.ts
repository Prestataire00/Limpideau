import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER || "gerardtahye@gmail.com",
    pass: process.env.SMTP_PASS || "",
  },
});

export async function sendReportEmail({
  to,
  subject,
  text,
  pdfBuffer,
  pdfFilename,
}: {
  to: string;
  subject: string;
  text: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}) {
  const from = process.env.SMTP_USER || "gerardtahye@gmail.com";

  await transporter.sendMail({
    from: `"Limpid'EAU" <${from}>`,
    to,
    subject,
    text,
    attachments: [
      {
        filename: pdfFilename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
