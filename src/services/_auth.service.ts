// import { isEmail } from "validator";
// import crypto from "crypto";

// import { userRepository } from "@/repositories/user.repository";
// import { otpRepository } from "@/repositories/otp.repository";

// import { authConfig } from "@/configs/auth.config";
// import { sendEmailOtp } from "@/lib/send-email-otp";
// import { createToken } from "@/lib/jwt";

// export const authService = {
// 	sendOtp: async ({ email }: { email: string }): Promise<void> => {
// 		// 1. validate email
// 		if (!isEmail(email)) {
// 			console.error("Invalid email format");
// 			throw new Error("Invalid email format.");
// 		}

// 		const now = new Date();
// 		const test = new Date(now);
// 		test.setMinutes(test.getMinutes() + 5);

// 		// 2. find user
// 		const user = await userRepository.findOneUser({
// 			findBy: "email",
// 			key: email,
// 		});

// 		// always return success to avoid email enumeration
// 		if (!user) {
// 			console.error("Email not found ", email);
// 			return;
// 		}

// 		// 3. check block (30 min rule)
// 		if (
// 			user.otpResendBlockedUntil &&
// 			new Date(user.otpResendBlockedUntil) > now
// 		) {
// 			console.error("Too many requests. try again later : ", email);
// 			throw new Error("Too many requests. Try again later.");
// 		}

// 		// 4. reset resend count if block already expired
// 		let resendCount = user.otpResendCount ?? 0;

// 		if (
// 			user.otpResendBlockedUntil &&
// 			new Date(user.otpResendBlockedUntil) <= now
// 		) {
// 			resendCount = 0;
// 		}

// 		// 5. cooldown check (avoid spam clicking)
// 		if (
// 			user.otpLastSentAt &&
// 			now.getTime() - new Date(user.otpLastSentAt).getTime() <
// 				authConfig.OTP_RESEND_COOLDOWN * 1000
// 		) {
// 			console.error("Resend cooldown is not over yet : ", email);
// 			throw new Error("Please wait before requesting another OTP.");
// 		}

// 		// 6. increase resend count
// 		resendCount += 1;

// 		// 7. block if limit exceeded
// 		if (resendCount > authConfig.OTP_MAX_RESEND) {
// 			await userRepository.updateUser({
// 				findBy: "id",
// 				key: user.id,
// 				data: {
// 					otpResendCount: resendCount,
// 					otpResendBlockedUntil: new Date(
// 						Date.now() + authConfig.OTP_BLOCK_TIME * 60 * 1000,
// 					),
// 					otpLastSentAt: user.otpLastSentAt,
// 				},
// 			});

// 			console.error("Resend block time not over yet : ", email);
// 			throw new Error(
// 				`Too many requests. Try again in ${authConfig.OTP_BLOCK_TIME} minutes.`,
// 			);
// 		}

// 		// 8. invalidate old OTPs
// 		await otpRepository.updateOtp({
// 			findBy: "userId",
// 			key: user.id,
// 			data: { userId: user.id },
// 		});

// 		// 9. generate OTP
// 		const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

// 		// 10. hash OTP (use crypto instead of bcrypt)
// 		const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");

// 		// 11. save OTP
// 		await otpRepository.createOtp({
// 			userId: user.id,
// 			codeHash: otpHash,
// 			expiresAt: new Date(Date.now() + authConfig.OTP_EXPIRES_IN * 60 * 1000),
// 		});

// 		// 12. update user tracking
// 		await userRepository.updateUser({
// 			findBy: "id",
// 			key: user.id,
// 			data: {
// 				otpResendCount: resendCount,
// 				otpResendBlockedUntil: user.otpResendBlockedUntil,
// 				otpLastSentAt: now,
// 			},
// 		});

// 		// 13. send email
// 		await sendEmailOtp({ to: email, otp: otpCode });
// 		console.log("otp successfully sent to : ", email);

// 		return;
// 	},

// 	verifyOtp: async ({ email, otp }: { email: string; otp: string }) => {
// 		// 1. validate email
// 		if (!isEmail(email)) {
// 			throw new Error("Invalid email format.");
// 		}

// 		// 2. find user
// 		const user = await userRepository.findOneUser({
// 			findBy: "email",
// 			key: email,
// 		});
// 		if (!user) {
// 			console.error("user not found: ", email);
// 			throw new Error("Invalid OTP");
// 		}

// 		// 3. get latest OTP
// 		const lastOtp = await otpRepository.findLatestUserOtp({
// 			findBy: "userId",
// 			key: user.id,
// 		});

// 		if (!lastOtp) {
// 			console.error("otp for the current user not found, ", email);
// 			throw new Error("Invalid OTP");
// 		}

// 		// 4. check if already used
// 		if (lastOtp.isActive) {
// 			console.error("otp is inactive: ", email);
// 			throw new Error("Invalid OTP");
// 		}

// 		// 5. check expiry
// 		if (lastOtp.expiresAt < new Date()) {
// 			console.error("otp expired:", email);
// 			throw new Error("OTP expired");
// 		}

// 		// 6. hash input OTP
// 		const hashedInput = crypto.createHash("sha256").update(otp).digest("hex");

// 		// 7. compare OTP
// 		if (hashedInput !== lastOtp.codeHash) {
// 			// WRONG OTP → increase attempt count

// 			const newCount = lastOtp.attemptCount + 1;

// 			await otpRepository.updateOtp({
// 				findBy: "otpId",
// 				key: lastOtp.id,
// 				data: {
// 					attemptCount: newCount,
// 				},
// 			});

// 			// if too many attempts → lock it
// 			if (newCount >= authConfig.OTP_FAILED_ATTEMPTS_LIMIT) {
// 				await otpRepository.updateOtp({
// 					findBy: "otpId",
// 					key: lastOtp.id,
// 					data: {
// 						isActive: true,
// 					},
// 				});
// 				console.error("too many failed attempts for otp:", email);
// 			} else {
// 				console.error("Otp is incorrect");
// 			}

// 			throw new Error("Invalid OTP");
// 		}

// 		// 8. SUCCESS OTP

// 		await otpRepository.updateOtp({
// 			findBy: "otpId",
// 			key: lastOtp.id,
// 			data: {
// 				isActive: true,
// 			},
// 		});

// 		// 9. update user login info
// 		await userRepository.updateUser({
// 			findBy: "id",
// 			key: user.id,
// 			data: {
// 				lastLoginAt: new Date(),
// 			},
// 		});

// 		// 10. create session / JWT
// 		const token = await createToken({
// 			userId: user.id,
// 		});

// 		console.log("token created successfully");
// 		return token;
// 	},
// };
