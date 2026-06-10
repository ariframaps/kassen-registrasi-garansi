import nodemailer from "nodemailer";
import { envServer } from "./env-server";

export const transporter = nodemailer.createTransport({
	host: envServer.SMTP_HOST,
	port: Number(envServer.SMTP_PORT),
	secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
	auth: {
	  user: envServer.SMTP_USER,
	  pass: envServer.SMTP_PASS,
	},  
});
