const nodemailer = require('nodemailer');
const sharp = require('sharp');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const COLORS = {
  bg: '#FAFAF8',
  panel: '#FFFFFF',
  accent: '#1F4D3D',
  accentSoft: '#EAF1EE',
  steel: '#6B7570',
  text: '#161A18',
  textMuted: '#8A9088',
  border: '#E4E6E2',
};

// --- SVG source strings, same as before ---
const vaultLogoSvg = (stroke) => `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none">
  <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="4" y="10" width="16" height="10" rx="1.5" stroke="${stroke}" stroke-width="1.6"/>
  <circle cx="12" cy="15" r="2.75" stroke="${stroke}" stroke-width="1.1" opacity="0.55"/>
  <path d="M12 12.25V13" stroke="${stroke}" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M12 17V17.75" stroke="${stroke}" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M9.25 15H10" stroke="${stroke}" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M14 15H14.75" stroke="${stroke}" stroke-width="1.1" stroke-linecap="round"/>
  <circle cx="12" cy="15" r="1.1" fill="${stroke}"/>
</svg>`;

const arrowSvg = (stroke) => `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
  <path d="M5 12h14M13 6l6 6-6 6" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// SVG string ko PNG buffer mein convert karta hai (2x scale, crisp retina rendering ke liye)
const svgToPngBuffer = async (svgString, size) => {
  return sharp(Buffer.from(svgString))
    .resize(size * 2, size * 2)
    .png()
    .toBuffer();
};

const sendResetPasswordEmail = async (to, resetUrl) => {
  try {
    // saare icons PNG buffers mein convert karo
    const [lockWhitePng, lockAccentPng, arrowWhitePng] = await Promise.all([
      svgToPngBuffer(vaultLogoSvg('#ffffff'), 24),
      svgToPngBuffer(vaultLogoSvg(COLORS.accent), 24),
      svgToPngBuffer(arrowSvg('#ffffff'), 14),
    ]);

    const info = await transporter.sendMail({
      from: `"Cachet" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Reset your Cachet password',
      text: `Reset your Cachet password\n\nWe received a request to reset the password for your vault. Open this link to set a new one (expires in 30 minutes):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background-color:${COLORS.bg}; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg}; padding:48px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%;">

                <!-- eyebrow -->
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.accent}30; border-radius:999px; background-color:${COLORS.panel};">
                      <tr>
                        <td style="padding:7px 16px;">
                          <span style="display:inline-block; width:6px; height:6px; border-radius:999px; background-color:${COLORS.accent}; margin-right:8px; vertical-align:middle;"></span>
                          <span style="font-family:'Courier New', monospace; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:${COLORS.steel}; vertical-align:middle;">Encrypted &middot; Verified &middot; Yours</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.panel}; border-radius:16px; border:1px solid ${COLORS.border}; overflow:hidden; box-shadow:0 8px 32px rgba(22,26,24,0.06);">

                  <!-- header strip -->
                  <tr>
                    <td style="background-color:${COLORS.accent}; padding:24px 32px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-right:10px; vertical-align:middle;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="30" height="30" style="background-color:rgba(255,255,255,0.14); border-radius:8px;">
                              <tr>
                                <td align="center" valign="middle">
                                  <img src="cid:lockwhite" width="18" height="18" alt="Cachet" style="display:block;" />
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align:middle;">
                            <span style="color:#ffffff; font-size:17px; font-weight:600; letter-spacing:0.4px; font-family:Georgia, 'Times New Roman', serif;">Cachet</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- body -->
                  <tr>
                    <td style="padding:38px 32px 34px 32px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="50" height="50" style="background-color:${COLORS.accentSoft}; border-radius:999px; margin-bottom:22px;">
                        <tr>
                          <td align="center" valign="middle">
                            <img src="cid:lockaccent" width="22" height="22" alt="" style="display:block;" />
                          </td>
                        </tr>
                      </table>

                      <h1 style="margin:0 0 12px 0; font-size:22px; font-weight:600; color:${COLORS.text}; letter-spacing:-0.2px; font-family:Georgia, 'Times New Roman', serif;">
                        Set a new password
                      </h1>

                      <p style="margin:0 0 26px 0; font-size:14px; line-height:1.65; color:${COLORS.steel};">
                        We received a request to reset the password for your Cachet vault. Choose a new one below. This link expires in <strong style="color:${COLORS.text};">30 minutes</strong>.
                      </p>

                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius:9px; background-color:${COLORS.accent};">
                            <a href="${resetUrl}"
                               style="display:inline-block; padding:13px 26px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:9px; letter-spacing:0.2px;">
                              <span style="vertical-align:middle;">Reset Password</span>
                              <img src="cid:arrowwhite" width="12" height="12" alt="" style="vertical-align:middle; margin-left:6px; display:inline-block;" />
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px; border-top:1px solid ${COLORS.border};">
                        <tr><td style="padding-top:22px;">
                          <p style="margin:0 0 6px 0; font-size:12px; color:${COLORS.textMuted};">
                            Button not working? Paste this link into your browser:
                          </p>
                          <p style="margin:0; font-size:12px; word-break:break-all;">
                            <a href="${resetUrl}" style="color:${COLORS.accent};">${resetUrl}</a>
                          </p>
                        </td></tr>
                      </table>

                      <p style="margin:22px 0 0 0; font-size:12px; line-height:1.6; color:${COLORS.textMuted};">
                        Didn't request this? No action needed - your password stays the same.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- footer -->
                <tr>
                  <td align="center" style="padding-top:22px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:6px; vertical-align:middle;">
                          <img src="cid:lockaccent" width="12" height="12" alt="" style="display:block; opacity:0.6;" />
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="font-size:11px; font-family:'Courier New', monospace; letter-spacing:0.3px; color:${COLORS.textMuted};">
                            &copy; ${new Date().getFullYear()} Cachet &middot; Encrypted at rest, always.
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
      attachments: [
        {
          filename: 'lock-white.png',
          content: lockWhitePng,
          cid: 'lockwhite', // html mein src="cid:lockwhite" se match karega
        },
        {
          filename: 'lock-accent.png',
          content: lockAccentPng,
          cid: 'lockaccent',
        },
        {
          filename: 'arrow-white.png',
          content: arrowWhitePng,
          cid: 'arrowwhite',
        },
      ],
    });

    console.log('Message ID:', info.messageId);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
  } catch (err) {
    console.log('Nodemailer send error:', err);
    throw err;
  }
};

module.exports = { transporter, sendResetPasswordEmail };