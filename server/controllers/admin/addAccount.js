import bcrypt from "bcrypt";
import Seller from "../../models/seller.js";
import Rider from "../../models/rider.js";
import Admin from "../../models/admin.js";
import User from "../../models/user.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ CHANGE: Use memoryStorage instead of diskStorage
const storage = multer.memoryStorage();
export const addAccountFile = multer({ storage: storage });



const sendRiderAppEmail = async (email, firstname, lastname) => {

    if (!resend) {
        console.warn('Resend client not configured. Skipping email notification.');
        return { success: false, error: 'Email service not configured' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        console.error('Invalid email address:', email);
        return { success: false, error: 'Invalid email address' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'E-Farmers Hub <security@efarmershub.com>',
            to: [email],
            subject: 'Download the Rider App - E-Farmers Hub',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download Rider App - E-Farmers Hub</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                    <!-- Header: Logo Only -->
                    <tr>
                        <td style="padding: 40px 20px 20px 20px; text-align: center;">
                            <img 
                                src="https://res.cloudinary.com/dtelqtkzj/image/upload/v1770440242/image-removebg-preview_sfsot1.png" 
                                alt="E-Farmers Hub Logo" 
                                style="max-width: 150px; height: auto;" 
                            />
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px; text-align: center;">

                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
                                Hello <strong>${firstname} ${lastname}</strong>,
                            </p>

                            <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                                Your rider account is ready. Tap the button below to download the Rider App and start delivering.
                            </p>

                            <!-- Download Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a 
                                            href="https://expo.dev/accounts/buuuu012/projects/rider-app/builds/a14fba15-e02d-40c5-a25b-356230b79ab8" 
                                            style="display: inline-block; background-color: #28a745; color: #ffffff; text-decoration: none; padding: 14px 48px; border-radius: 6px; font-size: 16px; font-weight: 600;"
                                        >
                                            📱 Download Rider App
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
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
            console.error('Failed to send rider app email:', error);
            return { success: false, error: error.message };
        }

        console.log('Rider app email sent successfully to:', email);
        console.log('Message ID:', data.id);
        return { success: true, messageId: data.id };

    } catch (error) {
        console.error('Failed to send rider app email:', error.message);
        return { success: false, error: error.message };
    }
};


const addAccount = async (req, res) => {
    try {
        const { role } = req.params;
        const { 
            firstname, 
            lastname, 
            contact, 
            email, 
            password, 
            wallet_number, 
            wallet_type, 
            adminType, 
            plateNumber,
            province,
            city,
            barangay,
            detailAddress,
            zipCode
        } = req.body;


        
        
        
        

        
        // Validate role
        const validRoles = ['admin', 'seller', 'rider'];
        if (!role || !validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({ message: "Invalid role. Must be admin, seller, or rider." });
        }
        
        // Validate email
        if (!email || !email.trim()) {
            return res.status(400).json({ message: "Email is required!" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format!" });
        }

        // Validate password
        if (!password || password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters!" });
        }

        // Role-specific validations
        if (role.toLowerCase() === "admin") {
            if (!contact || !contact.trim()) {
                return res.status(400).json({ message: "Contact number is required!" });
            }
            if (adminType && !['super', 'sub'].includes(adminType.toLowerCase())) {
                return res.status(400).json({ message: "Admin type must be 'super' or 'sub'!" });
            }
        }

        if (role.toLowerCase() === "seller") {
            if (!firstname || !firstname.trim()) {
                return res.status(400).json({ message: "First name is required!" });
            }
            if (!lastname || !lastname.trim()) {
                return res.status(400).json({ message: "Last name is required!" });
            }
            if (!wallet_number || !wallet_number.trim()) {
                return res.status(400).json({ message: "Wallet number is required!" });
            }
            if (!wallet_type || !wallet_type.trim()) {
                return res.status(400).json({ message: "Wallet type is required!" });
            }
        }

        if (role.toLowerCase() === "rider") {
            if (!firstname || !firstname.trim()) {
                return res.status(400).json({ message: "First name is required!" });
            }
            if (!lastname || !lastname.trim()) {
                return res.status(400).json({ message: "Last name is required!" });
            }
            if (!wallet_number || !wallet_number.trim()) {
                return res.status(400).json({ message: "Wallet number is required!" });
            }
            if (!wallet_type || !wallet_type.trim()) {
                return res.status(400).json({ message: "Wallet type is required!" });
            }
            if (!plateNumber || !plateNumber.trim()) {
                return res.status(400).json({ message: "Plate number is required!" });
            }
            if (!req.files || !req.files.plateImage || !req.files.plateImage[0]) {
                return res.status(400).json({ message: "Plate image is required!" });
            }
            if (!req.files || !req.files.licenseImage || !req.files.licenseImage[0]) {
                return res.status(400).json({ message: "License image is required!" });
            }
        }

        // Check if email already exists in any collection
        const existingAdmin = await Admin.findOne({ email });
        const existingSeller = await Seller.findOne({ email });
        const existingRider = await Rider.findOne({ email });
        const existingUser = await User.findOne({ email });
        
        if (existingAdmin || existingSeller || existingRider || existingUser) {
            return res.status(409).json({ message: `${email} Already Exist!` });
        }

        const saltRounds = 10;
        const hashpass = await bcrypt.hash(password, saltRounds);

        // Helper function to generate unique accountId
        const generateUniqueAccountId = async (Model) => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const datePrefix = `${year}${month}${day}`;

            const latestAccount = await Model.findOne({
                accountId: new RegExp(`^${datePrefix}`)
            }).sort({ accountId: -1 });

            let counter = 1;
            if (latestAccount && latestAccount.accountId) {
                const lastCounter = parseInt(latestAccount.accountId.slice(-4));
                counter = lastCounter + 1;
            }

            return `${datePrefix}${String(counter).padStart(4, '0')}`;
        };
        
        // Add Admin Account
        if (role.toLowerCase() === "admin") {
            const accountId = await generateUniqueAccountId(Admin);

            const newAdmin = new Admin({
                accountId,
                contact,
                email,
                password: hashpass,
                adminType: adminType || 'sub'
            });

            await newAdmin.save();
            return res.status(201).json({ message: "Admin account created successfully!" });
        }

        // Add Seller Account (Farmer)
        if (role.toLowerCase() === "seller") {
            const accountId = await generateUniqueAccountId(Seller);

            const newSeller = new Seller({
                accountId,
                firstname,
                lastname,
                contact: wallet_number,
                email,
                password: hashpass,
                e_WalletAcc: { 
                    type: wallet_type, 
                    number: wallet_number 
                },
                sellerAddress: {
                    province: province || '',
                    city: city || '',
                    barangay: barangay || '',
                    detailAddress: detailAddress || '',
                    zipCode: zipCode || ''
                },
                verification: "verified"
            });

            await newSeller.save();
            return res.status(201).json({ message: "Seller account created successfully!" });
        }

        // Add Rider Account
        if (role.toLowerCase() === "rider") {
            const accountId = await generateUniqueAccountId(Rider);

            let imagePlateNumberUrl = null;
            let licenseImageUrl = null;
            
            try {
                if (req.files && req.files.plateImage && req.files.plateImage[0]) {
                    const plateBuffer = req.files.plateImage[0].buffer;
                    const base64Plate = plateBuffer.toString('base64');
                    const dataURIPlate = `data:${req.files.plateImage[0].mimetype};base64,${base64Plate}`;
                    
                    const plateResult = await cloudinary.uploader.upload(dataURIPlate, {
                        folder: "rider-documents/plate-images"
                    });
                    imagePlateNumberUrl = plateResult.secure_url;
                }

                if (req.files && req.files.licenseImage && req.files.licenseImage[0]) {
                    const licenseBuffer = req.files.licenseImage[0].buffer;
                    const base64License = licenseBuffer.toString('base64');
                    const dataURILicense = `data:${req.files.licenseImage[0].mimetype};base64,${base64License}`;
                    
                    const licenseResult = await cloudinary.uploader.upload(dataURILicense, {
                        folder: "rider-documents/license-images"
                    });
                    licenseImageUrl = licenseResult.secure_url;
                }
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload images to Cloudinary!" });
            }

            const newRider = new Rider({
                accountId,
                firstname,
                lastname,
                contact: wallet_number,
                email,
                password: hashpass,
                e_WalletAcc: { 
                    type: wallet_type, 
                    number: wallet_number 
                },
                riderAddress: {
                    province: province || '',
                    city: city || '',
                    barangay: barangay || '',
                    detailAddress: detailAddress || '',
                    zipCode: zipCode || ''
                },
                plateNumber: plateNumber,
                imagePlateNumber: imagePlateNumberUrl,
                licenseImage: licenseImageUrl,
                verification: "verified"
            });

            // await newRider.save();


            // ✅ NEW: Send rider app download link email (non-blocking)
            sendRiderAppEmail(email, firstname, lastname).catch((emailError) => {
                console.error("Failed to send rider app email:", emailError);
            });

            return res.status(201).json({ message: "Rider account created successfully!" });
        }

        return res.status(400).json({ message: "Invalid role specified!" });

    } catch (error) {
        console.error("Add account error:", error);
        res.status(500).json({ message: "Failed to create account!" });
    }
};

export default addAccount;