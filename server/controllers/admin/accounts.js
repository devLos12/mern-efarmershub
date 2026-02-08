import User from "../../models/user.js";
import Seller from "../../models/seller.js";
import Rider from "../../models/rider.js";
import Product from "../../models/products.js";
import Admin from "../../models/admin.js";
import { Resend } from 'resend';



// ============================================
// RESEND EMAIL CONFIGURATION
// ============================================
const createResendClient = () => {
    try {
        // Validate API key
        if (!process.env.RESEND_API_KEY) {
            console.warn('Resend API key not configured. Email notifications will be disabled.');
            return null;
        }
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        return resend;
    } catch (error) {
        console.error('Failed to create Resend client:', error.message);
        return null;
    }
};

const resend = createResendClient();


// Email sending function using Resend
// Email sending function using Resend
const sendApprovalEmail = async (email, name, accountType) => {
    // Check if Resend client is available
    if (!resend) {
        console.warn('Resend client not configured. Skipping email notification.');
        return { success: false, error: 'Email service not configured' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        console.error('Invalid email address:', email);
        return { success: false, error: 'Invalid email address' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'E-Farmers Hub <security@efarmershub.com>',
            to: [email],
            subject: `Account Approved - ${accountType === 'seller' ? 'Farmer' : 'Rider'} Account`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Approved - E-Farmers Hub</title>
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
                            <!-- Logo Image -->
                            <img src="https://res.cloudinary.com/dtelqtkzj/image/upload/v1770440242/image-removebg-preview_sfsot1.png" alt="E-Farmers Hub Logo" style="max-width: 150px; height: auto; margin-bottom: 15px;" />
                            <h1 style="color: #28a745; margin: 0; font-size: 28px; font-weight: 600;">E-Farmers Hub</h1>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 30px;">

                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; text-align: start; color: #28a745;">Account Approved!</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                Hello <strong>${name}</strong>,
                            </p>

                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                Great news! Your ${accountType === 'seller' ? 'farmer' : 'rider'} account has been successfully verified and approved.
                            </p>

                            <!-- Account Details Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px; margin: 25px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; line-height: 1.8;">
                                            <strong>Account Status:</strong> <span style="color: #28a745;">✓ Verified</span>
                                        </p>
                                        <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; line-height: 1.8;">
                                            <strong>Account Type:</strong> ${accountType === 'seller' ? 'Farmer' : 'Rider'}
                                        </p>
                                        <p style="color: #333333; font-size: 14px; margin: 0; line-height: 1.8;">
                                            <strong>Email:</strong> ${email}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 25px 0 0 0;">
                                You can now access all features available for ${accountType === 'seller' ? 'farmers' : 'riders'}. Log in to your account to get started!
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://www.efarmershub.com/" style="display: inline-block; background-color: #28a745; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                            Login to Your Account
                                        </a>
                                    </td>
                                </tr>
                            </table>
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
            console.error('Error sending approval email:', error);
            return { success: false, error: error.message };
        }

        console.log('Approval email sent successfully to:', email);
        console.log('Message ID:', data.id);
        return { success: true, messageId: data.id };

    } catch (error) {
        console.error('Error sending approval email:', error.message);
        return { success: false, error: error.message };
    }
};








// ============================================
// COMMENTED OUT - NODEMAILER CONFIGURATION
// ============================================
/*
import nodemailer from "nodemailer";

// Email configuration with better error handling
const createTransporter = () => {
    try {
        // Validate environment variables
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.warn('Email credentials not configured. Email notifications will be disabled.');
            return null;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail', // or use custom SMTP for production
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            // For production SMTP (optional)
            // host: process.env.SMTP_HOST,
            // port: process.env.SMTP_PORT || 587,
            // secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        });

        
        // Verify transporter configuration
        transporter.verify((error, success) => {
            if (error) {
                console.error('Email transporter verification failed:', error.message);
            } else {
                console.log('Email server is ready to send messages');
            }
        });

        return transporter;
    } catch (error) {
        console.error('Failed to create email transporter:', error.message);
        return null;
    }
};

const transporter = createTransporter();



// Email sending function with comprehensive error handling
const sendApprovalEmail = async (email, name, accountType) => {
    // Check if transporter is available
    if (!transporter) {
        console.warn('Email transporter not configured. Skipping email notification.');
        return { success: false, error: 'Email service not configured' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        console.error('Invalid email address:', email);
        return { success: false, error: 'Invalid email address' };
    }

    const mailOptions = {
        from: {
            name: "E-Farmers Hub",
            address: process.env.EMAIL_USER
        },
        to: email,
        subject: `Account Approved - ${accountType === 'seller' ? 'Farmer' : 'Rider'} Account Verification`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #28a745; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">Account Approved! ✓</h1>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333;">Hello ${name},</h2>
                    
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        Great news! Your ${accountType === 'seller' ? 'farmer' : 'rider'} account has been successfully verified and approved.
                    </p>
                    
                    <div style="background-color: white; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0;">
                        <p style="margin: 0; color: #333;">
                            <strong>Account Status:</strong> <span style="color: #28a745;">✓ Verified</span><br>
                            <strong>Account Type:</strong> ${accountType === 'seller' ? 'Farmer' : 'Rider'}<br>
                            <strong>Email:</strong> ${email}
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        You can now access all features available for ${accountType === 'seller' ? 'farmers' : 'riders'}. 
                        Log in to your account to get started!
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        This is an automated message, please do not reply to this email.
                    </p>
                </div>
            </div>
        `
    };


    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Approval email sent successfully to:', email);
        console.log('Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending approval email:', error.message);
        
        // Log specific error types
        if (error.code === 'EAUTH') {
            console.error('Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD.');
        } else if (error.code === 'ECONNECTION') {
            console.error('Connection failed. Check your internet connection or SMTP settings.');
        } else if (error.responseCode === 550) {
            console.error('Email address does not exist or is invalid.');
        }
        
        return { success: false, error: error.message };
    }
};
*/





// ============================================
// CONTROLLER FUNCTIONS
// ============================================

export const getAccounts = async(req, res)=>{
    try{
        const retrieveUsers = await User.find();
        const retrieveSellers = await Seller.find();
        const retrieveRider = await Rider.find();
        const retrieveAdmin = await Admin.find({ adminType: { $ne: "main" }});

        const allEmpty = retrieveUsers.length === 0 && 
                 retrieveSellers.length === 0 && 
                 retrieveRider.length === 0 && 
                 retrieveAdmin.length === 0;

        if(allEmpty) {
            return res.status(404).json({message : "No accounts"})
        }

        const accounts = {
            user : retrieveUsers,
            seller : retrieveSellers,
            rider: retrieveRider,
            admin: retrieveAdmin
        }

        res.status(200).json(accounts);
    }catch(error){
        res.status(500).json({message: error.message});
    }    
}

export const removeAccount = async (req, res)=>{
    try{
        const id  = req.params.id;


        

        await User.deleteOne({_id : id});
        const seller = await Seller.deleteOne({_id : id});
        await Rider.deleteOne({_id: id});
        await Admin.deleteOne({_id: id});

        if(seller.deletedCount > 0){
            await Product.deleteMany({ "seller.id": id });
        }

        res.status(201).json({ message : "Account Deleted Successfully"});
    }catch(error){
        res.status(500).json({ message : error.message});
    }
}


export const viewProfile = async(req, res) => {
    try {
        const accountId  = req.params.id;

        const [userAccount, sellerAccount, riderAccount, adminAccount] = await Promise.all([
            User.findById(accountId).select('-password').catch(() => null),
            Seller.findById(accountId).select('-password').catch(() => null),
            Rider.findById(accountId).select('-password').catch(() => null),
            Admin.findById(accountId).select('-password').catch(() => null)
        ]);

        if (userAccount) {
            return res.status(200).json({ 
                success: true,
                accountType: 'user',
                profile: userAccount 
            });
        }

        if (sellerAccount) {
            return res.status(200).json({ 
                success: true,
                accountType: 'seller',
                profile: sellerAccount 
            });
        }

        if (riderAccount) {
            return res.status(200).json({ 
                success: true,
                accountType: 'rider',
                profile: riderAccount 
            });
        }

        if (adminAccount) {
            return res.status(200).json({ 
                success: true,
                accountType: 'admin',
                profile: adminAccount 
            });
        }

        return res.status(404).json({ 
            success: false,
            message: "Account not found" 
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

export const updateVerification = async(req, res) => {
    try {
        const accountId = req.params.id;
        const { verification } = req.body;



        // Validate verification value
        if (!['verified', 'rejected', 'pending'].includes(verification)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid verification status. Must be 'verified', 'rejected', or 'pending'" 
            });
        }

        // Try to update in Seller collection first
        const sellerUpdate = await Seller.findByIdAndUpdate(
            accountId,
            { verification },
            { new: true }
        ).select('-password');

        if (sellerUpdate) {
            // Send email if approved
            if (verification === 'verified') {
                const fullName = `${sellerUpdate.firstname} ${sellerUpdate.lastname}`;
                const emailResult = await sendApprovalEmail(sellerUpdate.email, fullName, 'seller');
                
                // Log email status but don't fail the approval
                if (!emailResult.success) {
                    console.warn('Approval succeeded but email notification failed:', emailResult.error);
                }
            }
            
            return res.status(200).json({ 
                success: true,
                message: "Seller verification updated successfully",
                profile: sellerUpdate,
                emailSent: verification === 'verified' ? true : undefined
            });
        }

        // If not found in Seller, try Rider collection
        const riderUpdate = await Rider.findByIdAndUpdate(
            accountId,
            { verification },
            { new: true }
        ).select('-password');

        if (riderUpdate) {
            // Send email if approved
            if (verification === 'verified') {
                const fullName = `${riderUpdate.firstname} ${riderUpdate.lastname}`;
                const emailResult = await sendApprovalEmail(riderUpdate.email, fullName, 'rider');
                
                // Log email status but don't fail the approval
                if (!emailResult.success) {
                    console.warn('Approval succeeded but email notification failed:', emailResult.error);
                }
            }

            return res.status(200).json({ 
                success: true,
                message: "Rider verification updated successfully",
                profile: riderUpdate,
                emailSent: verification === 'verified' ? true : undefined
            });
        }

        // If not found in either collection
        return res.status(404).json({ 
            success: false,
            message: "Account not found or does not support verification updates" 
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}