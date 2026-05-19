import User from "../../models/user.js";
import Seller from "../../models/seller.js";
import Rider from "../../models/rider.js";
import Product from "../../models/products.js";
import Admin from "../../models/admin.js";
import { Resend } from 'resend';
import cloudinary from "../../config/cloudinary.js";
import multer from "multer";
import OfflineFarmer from "../../models/offline-farmer.js";
import { createActivityLog} from "./activity-log.js";



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

                                ${accountType === 'seller' ? `
                                    <tr>
                                        <td align="center">
                                            <a href="https://www.efarmershub.com/" style="display: inline-block; background-color: #28a745; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                                Login to Your Account
                                            </a>
                                        </td>
                                    </tr>
                                ` : `
                                    <tr>
                                        <td style="padding-top: 15px;">
                                            
                                            <!-- Step by step instructions -->
                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0faf3; border-radius: 8px; margin-bottom: 15px;">
                                                <tr>
                                                    <td style="padding: 20px;">
                                                        <p style="color: #333333; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;"> How to Install the Rider App:</p>
                                                        <p style="color: #555555; font-size: 13px; line-height: 1.8; margin: 0 0 6px 0;">
                                                            <strong>Step 1:</strong> Tap the <strong>"Download Rider App"</strong> button below.
                                                        </p>
                                                        <p style="color: #555555; font-size: 13px; line-height: 1.8; margin: 0 0 6px 0;">
                                                            <strong>Step 2:</strong> If Chrome shows a warning, don't worry — the app is safe. Tap <strong>"Download anyway"</strong> to continue.
                                                        </p>
                                                        <p style="color: #555555; font-size: 13px; line-height: 1.8; margin: 0;">
                                                            <strong>Step 3:</strong> Once downloaded, open the file to install. You're all set! 
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Download Button -->
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${process.env.DOWNLOAD_RIDER_APP_LINK}"
                                                        target="_blank" 
                                                        style="display: inline-block; background-color: #ffffff; color: #28a745; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; border: 2px solid #28a745;">
                                                            📱 Download Rider App
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                `}

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
// CONTROLLER FUNCTIONS
// ============================================
export const getAccounts = async (req, res) => {
    try {
        // ── DATE FILTER ────────────────────────────────────
        const { period, startDate, endDate } = req.query;
        let dateFilter = {};

        if (period && period !== 'all') {
            const now = new Date();

            if (period === 'today') {
                const start = new Date(now); start.setHours(0, 0, 0, 0);
                const end   = new Date(now); end.setHours(23, 59, 59, 999);
                dateFilter = { createdAt: { $gte: start, $lte: end } };

            } else if (period === 'thisweek') {
                const dayOfWeek = now.getDay();
                const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - daysFromMonday);
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(now); weekEnd.setHours(23, 59, 59, 999);
                dateFilter = { createdAt: { $gte: weekStart, $lte: weekEnd } };

            } else if (period === 'thismonth') {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                const monthEnd   = new Date(now); monthEnd.setHours(23, 59, 59, 999);
                dateFilter = { createdAt: { $gte: monthStart, $lte: monthEnd } };

            } else if (period === 'thisyear') {
                const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                const yearEnd   = new Date(now); yearEnd.setHours(23, 59, 59, 999);
                dateFilter = { createdAt: { $gte: yearStart, $lte: yearEnd } };

            } else if (period === 'custom' && startDate && endDate) {
                const start = new Date(startDate); start.setHours(0, 0, 0, 0);
                const end   = new Date(endDate);   end.setHours(23, 59, 59, 999);
                dateFilter = { createdAt: { $gte: start, $lte: end } };
            }
        }
        // ──────────────────────────────────────────────────

        const [retrieveUsers, retrieveSellers, retrieveRider, retrieveAdmin, retrieveOfflineFarmers] = await Promise.all([
            User.find(dateFilter),
            Seller.find(dateFilter),
            Rider.find(dateFilter),
            Admin.find({ adminType: { $ne: "main" }, ...dateFilter }),
            OfflineFarmer.find(dateFilter),

        ]);

        const allEmpty =
            retrieveUsers.length === 0 &&
            retrieveSellers.length === 0 &&
            retrieveRider.length === 0 &&
            retrieveAdmin.length === 0;

        if (allEmpty) return res.status(404).json({ message: "No accounts" });

        res.status(200).json({
            user:   retrieveUsers,
            seller: retrieveSellers,
            rider:  retrieveRider,
            admin:  retrieveAdmin,
            offlineFarmer:  retrieveOfflineFarmers
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};







export const removeAccount = async (req, res) => {
    try {
        const id = req.params.id;

        // Find which model this account belongs to
        const user = await User.findById(id).select('accountId firstname lastname');
        const seller = await Seller.findById(id).select('accountId firstname lastname');
        const rider = await Rider.findById(id).select('accountId firstname lastname');
        const admin = await Admin.findById(id).select('accountId firstname lastname');

        const account = user || seller || rider || admin;
        const accountType = user ? 'User' : seller ? 'Seller' : rider ? 'Rider' : 'Admin';

        // Delete logic
        await User.deleteOne({ _id: id });
        const sellerDelete = await Seller.deleteOne({ _id: id });
        await Rider.deleteOne({ _id: id });
        await Admin.deleteOne({ _id: id });

        if (sellerDelete.deletedCount > 0) {
            await Product.deleteMany({ "seller.id": id });
        }

        await createActivityLog(
            req.account.id,
            'DELETE ACCOUNT',
            `Deleted ${accountType} account: ${account?.firstname} ${account?.lastname} (${account?.accountId})`,
            req
        );

        res.status(201).json({ message: "Account Deleted Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}







export const viewProfile = async(req, res) => {
    try {
        const accountId = req.params.id;

        const [userAccount, sellerAccount, riderAccount, adminAccount, offlineFarmerAccount] = await Promise.all([
            User.findById(accountId).select('-password').catch(() => null),
            Seller.findById(accountId).select('-password').catch(() => null),
            Rider.findById(accountId).select('-password').catch(() => null),
            Admin.findById(accountId).select('-password').catch(() => null),
            OfflineFarmer.findById(accountId).catch(() => null), // ✅ walang password field
        ]);

        if (userAccount) return res.status(200).json({ success: true, accountType: 'user', profile: userAccount });
        if (sellerAccount) return res.status(200).json({ success: true, accountType: 'seller', profile: sellerAccount });
        if (riderAccount) return res.status(200).json({ success: true, accountType: 'rider', profile: riderAccount });
        if (adminAccount) return res.status(200).json({ success: true, accountType: 'admin', profile: adminAccount });
        
        // ✅ OfflineFarmer — sariling accountType para makilala sa frontend
        if (offlineFarmerAccount) return res.status(200).json({ success: true, accountType: 'offlineFarmer', profile: offlineFarmerAccount });

        return res.status(404).json({ success: false, message: "Account not found" });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}




// ── Upload buffer to Cloudinary ───────────────────────────────────────────────
const uploadToCloudinary = async (file, folder) => {
    const base64  = file.buffer.toString("base64");
    const dataURI = `data:${file.mimetype};base64,${base64}`;
    const result  = await cloudinary.uploader.upload(dataURI, { folder });
    return result.secure_url;
};

// ── Build explicit $set fields per source ─────────────────────────────────────
const buildUpdateFields = (source, profileData) => {


    if (source === "offlineFarmer") {
        return {
            firstname:  profileData.firstname,
            lastname:   profileData.lastname,
            middlename: profileData.middlename,
            contact:    profileData.contact,
        };
    }


    
    if (source === "user") {
        return {
            firstname:                      profileData.firstname,
            lastname:                       profileData.lastname,
            middlename:                     profileData.middlename,
            email:                          profileData.email,
            "billingAddress.firstname":     profileData.billingAddress?.firstname,
            "billingAddress.lastname":      profileData.billingAddress?.lastname,
            "billingAddress.email":         profileData.billingAddress?.email,
            "billingAddress.contact":       profileData.billingAddress?.contact,
            "billingAddress.province":      profileData.billingAddress?.province,
            "billingAddress.city":          profileData.billingAddress?.city,
            "billingAddress.barangay":      profileData.billingAddress?.barangay,
            "billingAddress.detailAddress": profileData.billingAddress?.detailAddress,
            "billingAddress.zipCode":       profileData.billingAddress?.zipCode,
        };
    }

    if (source === "seller") {
        return {
            firstname:                      profileData.firstname,
            lastname:                       profileData.lastname,
            middlename:                     profileData.middlename, 
            email:                          profileData.email,
            contact:                        profileData.contact,
            "e_WalletAcc.type":             profileData.e_WalletAcc?.type,
            "e_WalletAcc.number":           profileData.e_WalletAcc?.number,
            "sellerAddress.province":       profileData.sellerAddress?.province,
            "sellerAddress.city":           profileData.sellerAddress?.city,
            "sellerAddress.barangay":       profileData.sellerAddress?.barangay,
            "sellerAddress.detailAddress":  profileData.sellerAddress?.detailAddress,
            "sellerAddress.zipCode":        profileData.sellerAddress?.zipCode,
        };
    }

    if (source === "rider") {
        return {
            firstname:                      profileData.firstname,
            lastname:                       profileData.lastname,
            middlename:                     profileData.middlename, 
            email:                          profileData.email,
            contact:                        profileData.contact,
            plateNumber:                    profileData.plateNumber,
            "e_WalletAcc.type":             profileData.e_WalletAcc?.type,
            "e_WalletAcc.number":           profileData.e_WalletAcc?.number,
            "riderAddress.province":        profileData.riderAddress?.province,
            "riderAddress.city":            profileData.riderAddress?.city,
            "riderAddress.barangay":        profileData.riderAddress?.barangay,
            "riderAddress.detailAddress":   profileData.riderAddress?.detailAddress,
            "riderAddress.zipCode":         profileData.riderAddress?.zipCode,
        };
    }

    if (source === "admin") {
        return {
            firstname:                       profileData.firstname,
            lastname:                        profileData.lastname,
            middlename:                      profileData.middlename,
            suffix:                          profileData.suffix,
            email:                           profileData.email,
            contact:                         profileData.contact,
            "adminAddress.province":         profileData.adminAddress?.province,
            "adminAddress.city":             profileData.adminAddress?.city,
            "adminAddress.barangay":         profileData.adminAddress?.barangay,
            "adminAddress.detailAddress":    profileData.adminAddress?.detailAddress,
            "adminAddress.zipCode":          profileData.adminAddress?.zipCode,
        };
    }

    return null;
};


export const upload  = multer({ storage: multer.memoryStorage() });


// ── Controller ────────────────────────────────────────────────────────────────
export const adminUpdateProfile = async (req, res) => {
    try {
        const { accountId } = req.params;

        // Supports both multipart/form-data (with files) and application/json (no files)
        const source      = req.body.source;
        const profileData = typeof req.body.profileData === "string"
            ? JSON.parse(req.body.profileData)
            : req.body.profileData;
        


        if (!source || !profileData) {
            return res.status(400).json({ message: "Missing source or profileData." });
        }

        // ── Pick model ────────────────────────────────────────────────
        

        const modelMap = { 
            user: User, 
            seller: Seller, 
            rider: Rider, 
            admin: Admin,
            offlineFarmer: OfflineFarmer  // ✅
        };


        const Model = modelMap[source];

        if (!Model) {
            return res.status(400).json({ message: `Invalid source: ${source}` });
        }

        // ── Build explicit $set fields based on source ────────────────
        const updateFields = buildUpdateFields(source, profileData);
        



        if (!updateFields) {
            return res.status(400).json({ message: "Could not build update fields." });
        }

        // ── Upload images to Cloudinary if provided (rider only) ──────
        if (req.files?.imagePlateNumber?.[0]) {
            try {
                updateFields.imagePlateNumber = await uploadToCloudinary(
                    req.files.imagePlateNumber[0],
                    "rider-plates"
                );
            } catch {
                return res.status(400).json({ message: "Failed to upload plate number image." });
            }
        }
        
        if (req.files?.licenseImage?.[0]) {
            try {
                updateFields.licenseImage = await uploadToCloudinary(
                    req.files.licenseImage[0],
                    "rider-licenses"
                );
            } catch {
                return res.status(400).json({ message: "Failed to upload license image." });
            }
        }

        // ── Remove undefined values para hindi ma-overwrite ng undefined ──
        Object.keys(updateFields).forEach(
            (key) => updateFields[key] === undefined && delete updateFields[key]
        );


        if (profileData.email) {
            const existingEmail = await Model.findOne({ 
                email: profileData.email,
                _id: { $ne: accountId }  // ibang account lang, hindi yung sarili niya
            });
            
            if (existingEmail) {
                return res.status(400).json({ message: "Email is already in use by another account." });
            }
        }


        // ── Persist ───────────────────────────────────────────────────
        const updated = await Model.findOneAndUpdate(
            { _id: accountId },
            { $set: updateFields },
            { new: true, runValidators: true }
        );


        if (!updated) {
            return res.status(404).json({ message: "Account not found." });
        }


        await createActivityLog(
            req.account.id,
            'UPDATE ACCOUNT PROFILE',
            `Updated ${source} profile: ${updated.firstname} ${updated.lastname} (${updated.accountId})`,
            req
        );


        return res.status(200).json({ message: "Profile updated successfully." });

    } catch (err) {
        console.error("[adminUpdateProfile]", err);
        return res.status(500).json({ message: err.message || "Server error." });
    }
};







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
            
            await createActivityLog(
                req.account.id,
                'UPDATE VERIFICATION',
                `Set seller verification to '${verification}': ${sellerUpdate.firstname} ${sellerUpdate.lastname} (${sellerUpdate.accountId})`,
                req
            );


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
            
            await createActivityLog(
                req.account.id,
                'UPDATE VERIFICATION',
                `Set rider verification to '${verification}': ${riderUpdate.firstname} ${riderUpdate.lastname} (${riderUpdate.accountId})`,
                req
            );

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