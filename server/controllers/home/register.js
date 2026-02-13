import bcrypt from "bcrypt";
import User from "../../models/user.js";
import Seller from "../../models/seller.js";
import Rider from "../../models/rider.js";
import Admin from "../../models/admin.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const storage = multer.memoryStorage();

export const registrationFile = multer({ storage: storage });

const register = async (req, res) => {
    try {
        const { 
            firstname, 
            middlename,
            lastname, 
            contact, 
            email, 
            password, 
            role, 
            wallet_number, 
            wallet_type, 
            plateNumber,
            province,
            city,
            barangay,
            detailAddress,
            zipCode
        } = req.body;


        if(contact && !/^\d{11}$/.test(contact)) {
            return res.status(400).json({ message: "Invalid contact number format! Must be 11 digits." });
        }


        // Validate role
        const validRoles = ['buyer', 'farmer', 'rider'];
        if (!role || !validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({ message: "Invalid role. Must be buyer, farmer, or rider." });
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

        // Check if email already exists
        const existingSeller = await Seller.findOne({ email });
        const existingUser = await User.findOne({ email });
        const existingRider = await Rider.findOne({ email });
        const existingAdmin = await Admin.findOne({ email });

        if (existingSeller || existingUser || existingRider || existingAdmin) {
            return res.status(409).json({ message: `${email} Already Exist!` });
        }

        // Register Farmer
        if (role.toLowerCase() === "farmer") {
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

            const saltRounds = 10;
            const hashpass = await bcrypt.hash(password, saltRounds);
            
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const count = await Seller.countDocuments();
            const accountId = `${year}${month}${day}${String(count + 1).padStart(4, '0')}`;

            const newSeller = new Seller({
                accountId,
                firstname,
                middlename, 
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
                }
            });

            await newSeller.save();
            
            return res.status(201).json({ message: "Successfully Registered!" });
        }

        // Register Buyer
        if (role.toLowerCase() === "buyer") {
            if (!firstname || !firstname.trim()) {
                return res.status(400).json({ message: "First name is required!" });
            }
            if (!lastname || !lastname.trim()) {
                return res.status(400).json({ message: "Last name is required!" });
            }
            if (!contact || !contact.trim()) {
                return res.status(400).json({ message: "Contact number is required!" });
            }

            const saltRounds = 10;
            const hashpass = await bcrypt.hash(password, saltRounds);
            
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const count = await User.countDocuments();
            const accountId = `${year}${month}${day}${String(count + 1).padStart(4, '0')}`;

            const newUser = new User({
                accountId,
                firstname,
                middlename, 
                lastname, 
                contact, 
                email, 
                password: hashpass, 
                billingAddress: { 
                    firstname, 
                    lastname, 
                    email, 
                    contact 
                }
            });
            
            await newUser.save();

            return res.status(201).json({ message: "Successfully Registered!" });
        }

        // Register Rider
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

            const saltRounds = 10;
            const hashpass = await bcrypt.hash(password, saltRounds);
            
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const count = await Rider.countDocuments();
            const accountId = `${year}${month}${day}${String(count + 1).padStart(4, '0')}`;

            // ✅ CHANGE: Upload images to Cloudinary instead of saving locally
            let imagePlateNumberUrl = null;
            let licenseImageUrl = null;

            try {
                // Upload plate image to Cloudinary
                if (req.files.plateImage && req.files.plateImage[0]) {
                    const plateBuffer = req.files.plateImage[0].buffer;
                    const base64Plate = plateBuffer.toString('base64');
                    const dataURIPlate = `data:${req.files.plateImage[0].mimetype};base64,${base64Plate}`;
                    
                    const plateResult = await cloudinary.uploader.upload(dataURIPlate, {
                        folder: "rider-documents/plate-images"
                    });
                    imagePlateNumberUrl = plateResult.secure_url;
                }

                // Upload license image to Cloudinary
                if (req.files.licenseImage && req.files.licenseImage[0]) {
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
                middlename,  // Optional field
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
                imagePlateNumber: imagePlateNumberUrl,  // ✅ Store Cloudinary URL
                licenseImage: licenseImageUrl            // ✅ Store Cloudinary URL
            });

            await newRider.save();

            return res.status(201).json({ message: "Successfully Registered!" });
        }
        
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Failed to register!" });
    }
};

export default register;