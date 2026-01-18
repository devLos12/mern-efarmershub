import bcrypt from "bcrypt";
import Seller from "../../models/seller.js";
import Rider from "../../models/rider.js";
import Admin from "../../models/admin.js";
import User from "../../models/user.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// ✅ CHANGE: Use memoryStorage instead of diskStorage
const storage = multer.memoryStorage();
export const addAccountFile = multer({ storage: storage });

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
            
            // ✅ CHANGE: Upload to Cloudinary instead of saving locally
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

            await newRider.save();
            return res.status(201).json({ message: "Rider account created successfully!" });
        }

        return res.status(400).json({ message: "Invalid role specified!" });

    } catch (error) {
        console.error("Add account error:", error);
        res.status(500).json({ message: "Failed to create account!" });
    }
};

export default addAccount;