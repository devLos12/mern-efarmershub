import Product from "../../models/products.js";
import Notification from "../../models/notification.js";
import ActivityLog from "../../models/activityLogs.js";
import Admin from "../../models/admin.js";



const statusApprove = async(req, res) => {
    try{
        const { id , role } = req.account;
        const prodId = req.params.id;
        const { newStatus } = req.body;

        const product = await Product.findOne({_id : prodId})
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        product.statusApprove = newStatus;


        await Notification.create({
            sender : {
                id : id,
                role : role,
            },

            recipient : {
                id : product.seller.id,
                role : "seller",
            },
            message : `your product #${product?.prodId} has been ${newStatus}`,
            meta : { 
                prodId,  
                imageFile: product.imageFile
            },
            type : "statusApprove",
            link : "productdetails"
        });
        
        
        
        if (role === "admin") {
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                              req.ip || 
                              req.connection?.remoteAddress;
            const userAgent = req.get('user-agent');


            const admin = await Admin.findOne({_id: id});

            await ActivityLog.create({
                performedBy: id,
                adminType: admin.adminType,
                action: newStatus === 'approved' ? 'APPROVE_PRODUCT' : 'REJECT_PRODUCT',
                description: `${newStatus === 'approved' ? 'Approved' : 'Rejected'} product #${product._id.toString().slice(0,12)} `,
                targetId: prodId,
                ipAddress: ipAddress,
                userAgent: userAgent,
                status: 'success'
            });
        }

        await product.save();

        io.emit("product:updateStatus", { message: `product ${newStatus} successfully.`});
        io.emit("to seller", { message : "new notif"});
        res.status(200).json({ message : `product ${newStatus} successfully.`});
    }catch(err){
        res.status(500).json({ message : err.message});
    }

}
export default statusApprove