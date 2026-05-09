import nodemailer from 'nodemailer'

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"CodeRush" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  })
}

export default sendEmail
