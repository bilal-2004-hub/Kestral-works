const nodemailer = require('nodemailer');
const { mail, env } = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!mail.host || !mail.user) return null;
  transporter = nodemailer.createTransport({
    host: mail.host,
    port: mail.port,
    secure: mail.port === 465,
    auth: { user: mail.user, pass: mail.pass },
  });
  return transporter;
}

/* In development without SMTP configured, mail is logged instead of sent so
   password-reset flows stay testable. */
async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    if (env !== 'production') logger.warn(`[mail:dev] to=${to} subject="${subject}"\n${text || html}`);
    return { queued: false };
  }
  await t.sendMail({ from: mail.from, to, subject, html, text });
  return { queued: true };
}

const passwordResetEmail = (name, url) => ({
  subject: 'Reset your password',
  text: `Hi ${name}, open this link to choose a new password: ${url} (valid for 30 minutes).`,
  html: `<p>Hi ${name},</p><p>Open this link to choose a new password:</p>
         <p><a href="${url}">${url}</a></p><p>The link is valid for 30 minutes.</p>`,
});

module.exports = { sendMail, passwordResetEmail };
