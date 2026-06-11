import nodemailer from "nodemailer";
import { envServer } from "./env-server";

export const transporter = nodemailer.createTransport({
	// host: envServer.SMTP_HOST,
	// port: Number(envServer.SMTP_PORT),
	// secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
	// auth: {
	//   user: envServer.SMTP_USER,
	//   pass: envServer.SMTP_PASS,
	// },  
    service: 'gmail',
  auth: {
      type: 'OAuth2',
      user: envServer.SMTP_USER,
      clientId: envServer.google_drive_client_id,
      clientSecret: envServer.google_drive_client_secret,
      refreshToken: envServer.google_drive_refresh_token
  }
});
