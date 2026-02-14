import { Resend } from 'resend';
// import nodemailer from "nodemailer";
import crypto from "crypto";
import User from "../../models/user.js";
import Seller from "../../models/seller.js";
import Rider from "../../models/rider.js";
import Admin from "../../models/admin.js";
import bcrypt from "bcrypt";

const verificationCodes = new Map();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);


// Enhanced Email Template with Logo and Professional Design
const sendVerificationEmail = async (email, code) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'E-Farmers Hub <security@efarmershub.com>',
            to: [email],
            subject: 'Password Reset Verification Code - E-Farmers Hub',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - E-Farmers Hub</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header with Logo (No Background) -->
                    <tr>
                        <td style="padding: 40px 20px; text-align: center;">
                            <!-- Logo Image (Upload mo sa Cloudinary) -->
                            <img src="https://res.cloudinary.com/dtelqtkzj/image/upload/v1770440242/image-removebg-preview_sfsot1.png" alt="E-Farmers Hub Logo" style="max-width: 150px; height: auto; margin-bottom: 15px;" />
                            <h1 style="color: #28a745; margin: 0; font-size: 28px; font-weight: 600;">E-Farmers Hub</h1>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Password Reset Request</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                We received a request to reset your password. Use the verification code below to proceed:
                            </p>

                            <!-- Verification Code Box -->
                            
                            <!-- <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center" style="background-color: #f8f9fa; border: 2px dashed #28a745; border-radius: 8px; padding: 25px;">
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                                        <h1 style="color: #28a745; margin: 0; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                            
                                        </h1>
                                    </td>
                                </tr>
                            </table> -->

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                                <tr>
                                    <td align="center">
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 15px 0;">
                                            Having trouble? Click the button below to view your code in a secure page:
                                        </p>
                                        <a href="https://devlos12.github.io/date-proposal/" 
                                           target="_blank" 
                                           style="display: inline-block; 
                                                  background-color: #28a745; 
                                                  color: #ffffff; 
                                                  padding: 14px 35px; 
                                                  text-decoration: none; 
                                                  border-radius: 5px; 
                                                  font-size: 16px; 
                                                  font-weight: 600;
                                                  box-shadow: 0 2px 5px rgba(40, 167, 69, 0.3);">
                                            🔒 View Verification Code
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info Alert -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin: 25px 0;">
                                <tr>
                                    <td style="padding: 15px;">
                                        <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                                            ⏱️ <strong>Important:</strong> This code will expire in <strong>5 minutes</strong> for security reasons.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer - Simple -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="color: #6c757d; font-size: 12px; margin: 0;">
                                © 2026 E-Farmers Hub. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            return { success: false, error };
        }

        console.log('Email sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Send email error:', error);
        return { success: false, error };
    }
};



// Nodemailer version - COMMENTED OUT
/*
const sendVerificationEmail = async (email, code) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Verification Code',
            html: `
                <h2>Password Reset Request</h2>
                <p>Your verification code is:</p>
                <h1 style="color: #28a745; font-size: 32px;">${code}</h1>
                <p>This code will expire in 5 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);    
        return { success: true };
    } catch (error) {
        return { success: false };
    }
};
*/

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        let account = null;

        // Check User first
        account = await User.findOne({ email });

        // Check Seller
        if (!account) {
            account = await Seller.findOne({ email });
        }

        // Check Rider
        if (!account) {
            account = await Rider.findOne({ email });
        }

        // Check Admin
        if (!account) {
            account = await Admin.findOne({ email });
        }

        if (!account) {
            return res.status(404).json({ message: "Account not found!" });
        }

        // Generate 6-digit verification code
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const setOption = {
            code: verificationCode,
            expiresAt: Date.now() + 5 * 60 * 1000  // 5 minutes
        };
        
        verificationCodes.set(email, setOption);
        const sendEmail = await sendVerificationEmail(email, verificationCode);
        
        if (!sendEmail.success) {
            return res.status(400).json({ message: "Failed to send verification email. Please check your email address." });
        }

        const resData = {   
            message: "Verification code sent to your email!",
            cooldown: setOption?.expiresAt
        };
        
        res.status(200).json(resData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyCode = async (req, res) => {
    try {
        const { email, verifyCode } = req.body;

        const stored = verificationCodes.get(email);

        if (!stored) {
            return res.status(400).json({ message: "No verification code found." });
        }

        if (Date.now() > stored.expiresAt) {
            verificationCodes.delete(email);
            return res.status(400).json({ message: "Verification code expired" });
        }

        if (stored.code !== verifyCode) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        res.status(200).json({ message: "Code verified successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        let account = null;

        // Check User
        account = await User.findOne({ email });
        
        // Check Seller
        if (!account) {
            account = await Seller.findOne({ email });
        }

        // Check Rider
        if (!account) {
            account = await Rider.findOne({ email });
        }

        // Check Admin
        if (!account) {
            account = await Admin.findOne({ email });
        }

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        account.password = hashedPassword;
        await account.save();

        // Clear verification code after successful password change
        verificationCodes.delete(email);
        
        res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};