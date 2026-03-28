import multer from "multer";
import Product from "../../models/products.js";
import cloudinary from "../../config/cloudinary.js";
import OfflineFarmer from "../../models/offline-farmer.js";


// Same memory storage as original uploadProducts
const storage = multer.memoryStorage();
export const uploadOfflineFarmer = multer({ storage });


// ─── POST /api/admin/offline-farmer/upload ───
export const adminUploadOfflineFarmerProduct = async (req, res) => {
    try {
        const {
            // Farmer fields
            farmerId,
            firstname,
            middlename,
            lastname,
            suffix,
            contact,
            isNewFarmer,

            // Product fields
            name,
            price,
            category,
            productType,
            stocks,
            kg,
            lifeSpan,
            disc,
        } = req.body;



        // ─── STEP 1: Get or Create OfflineFarmer ───
        let farmer;

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const count = await OfflineFarmer.countDocuments();
        const accountId = `${year}${month}${day}${String(count + 1).padStart(4, '0')}`;



        if (isNewFarmer === "true") {


            // ✅ DITO ILAGAY — bago ang create
            const existingFarmer = await OfflineFarmer.findOne({
                firstname: { $regex: `^${firstname.trim()}$`, $options: "i" },
                lastname:  { $regex: `^${lastname.trim()}$`,  $options: "i" },
            });

            if (existingFarmer) {
                return res.status(400).json({
                    message: `An offline farmer named "${firstname} ${lastname}" already exists. Please search and select them instead.`,
                });
            }


            farmer = await OfflineFarmer.create({
                accountId,
                firstname,
                middlename: middlename || "",
                lastname,
                suffix: suffix || "N/A",
                contact: contact || "",
            });

        } else {
            farmer = await OfflineFarmer.findById(farmerId);
            if (!farmer) {
                return res.status(404).json({ message: "Offline farmer not found." });
            }
        }



        // ─── STEP 2: Check duplicate product name per farmer ───
        const existingProduct = await Product.findOne({
            name,
            "offlineFarmer.id": farmer._id,
        });


        if (existingProduct) {
            return res.status(400).json({
                message: "This farmer already has a product with this name!",
            });
        }

        
        // ─── STEP 3: Upload image to Cloudinary ───
        const base64 = req.file.buffer.toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${base64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: "products",
        });

        // ─── STEP 4: Generate sequential prodId (same logic as original) ───
        const lastProduct = await Product.findOne().sort({ createdAt: -1 });


        let newProdId = "PID0001";
        if (lastProduct && lastProduct.prodId) {
            const lastNumber = parseInt(lastProduct.prodId.replace("PID", ""));
            const nextNumber = lastNumber + 1;
            newProdId = "PID" + nextNumber.toString().padStart(4, "0");
        }
        
        
        // ─── STEP 5: Create Product ───
        const newProduct = new Product({

            prodId: newProdId,
            name,
            price,
            category,
            productType,
            stocks,
            totalStocks: stocks,
            kg,
            lifeSpan,
            disc,
            imageFile: result.secure_url,
            cloudinaryId: result.public_id,

            seller: {
                id: farmer._id,
                sellerType: "OfflineFarmer",   // para sa refPath
                name: `${farmer.firstname} ${farmer.lastname}`,
            },

            // Admin uploaded — auto approved, no need for pending
            statusApprove: "approved",
            farmerType: 'none-device'

        });

        await newProduct.save();

        io.emit("product:uploaded", {
            message: `New product "${name}" uploaded by admin for ${farmer.firstname} ${farmer.lastname}`,
        });

        res.status(201).json({ message: "Product uploaded successfully!" });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error occurred." });
    }
};



// ─── GET /api/offline-farmers/search?name= ───
export const searchOfflineFarmers = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name || !name.trim()) {
            return res.status(200).json([]);
        }

        const farmers = await OfflineFarmer.find({
            $or: [
                { firstname: { $regex: name, $options: "i" } },
                { lastname: { $regex: name, $options: "i" } },
            ],
        }).limit(10);

        res.status(200).json(farmers);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error occurred." });
    }
};