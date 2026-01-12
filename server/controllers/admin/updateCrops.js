import multer from "multer";
import Product from "../../models/products.js";
import ActivityLog from "../../models/activityLogs.js";
import Admin from "../../models/admin.js";





const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()} - ${file.originalname}`;
        cb(null, uniqueName)
    }
})

export const update = multer({ storage: storage });

export const updateCrops = async (req, res) => {
    try {
        const { id, name, category, disc, image, kg, lifeSpan } = req.body;
        
        // ✅ FIX: Convert to numbers para mag-match yung comparison
        const price = Number(req.body.price);
        const stocks = Number(req.body.stocks);
        
        const imageFile = req.file ? req.file.filename : null;

        // Get old product data
        const oldProduct = await Product.findById(id);

        // Update product
        await Product.findByIdAndUpdate(id,
            { name, price, stocks, kg, lifeSpan, category, disc, imageFile: imageFile ?? image },
        )

        if(stocks > oldProduct.totalStocks){
            await Product.findByIdAndUpdate(id, { totalStocks: stocks } )   
        }



        // Log each specific change
        if (req.account?.role === "admin") {
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                              req.ip || req.connection?.remoteAddress;
            const userAgent = req.get('user-agent');

            const admin = await Admin.findOne({_id: req.account.id})

            // Check what changed and log accordingly
            if (oldProduct.name !== name) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product name from "${oldProduct.name}" to "${name}"`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }

            if (oldProduct.price !== price) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product price from ₱${oldProduct.price} to ₱${price}`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }

            if (oldProduct.stocks !== stocks) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product stocks from ${oldProduct.stocks} to ${stocks}`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }

            if (oldProduct.category !== category) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product category from "${oldProduct.category}" to "${category}"`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }

            if (imageFile) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product image`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }

            // If walang changes at all
            if (oldProduct.name === name && oldProduct.price === price && 
                oldProduct.stocks === stocks && oldProduct.category === category && !imageFile) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product "${name}" (no changes detected)`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }
        }

        io.emit('product:updated');
        res.status(200).json({ message: `Product  Succesfully Updated.` });

    } catch (error) {
        // Log error
        res.status(500).json({ message: error.message });
    }
}