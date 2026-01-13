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



// Resend version - ACTIVE
const sendVerificationEmail = async (email, code) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Password Reset <onboarding@resend.dev>',
            to: ['carlosloyola095@gmail.com'],
            subject: 'Password Reset Verification Code',
            html: `
                <h2>Password Reset Request</h2>
                <p>Your verification code is:</p>
                <h1 style="color: #28a745; font-size: 32px;">${code}</h1>
                <p>This code will expire in 5 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            return { success: false };
        }

        return { success: true };
    } catch (error) {
        console.error('Send email error:', error);
        return { success: false };
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