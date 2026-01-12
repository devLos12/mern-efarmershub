    import Product from "../../models/products.js";
    import Order from "../../models/order.js";
    import multer from "multer";
    import User from "../../models/user.js";



    const storage = multer.diskStorage({
        destination : "./uploads",
        filename :  (req, file, cb) =>{
            const uniqueName = `${Date.now()} - ${file.originalname}`;
            cb(null, uniqueName);
        }
    })

    export const uploadImgReview = multer({ storage : storage});


    export const productReview  =  async(req, res) => {
        try{  
            const userId = req.account.id;

            const {prodId, rate, comment} = req.body;
            const imageFile = req.file ? req.file.filename : null;

            const user = await User.findOne({_id: userId}) ?? null;
            const product = await Product.findOne({_id : prodId});

                    
            if(!product) {
                return res.status(404).json({ message : "Product not found!"});
            }
            
            // const alreadyReviewed = product.reviews.find((review) => review.user.id.toString() === userId);

            // if (alreadyReviewed) {
            // return res.status(400).json({ message: "You already reviewed this product." });
            // }


            //update review from product
            const newReview = {
                user: {
                    id: userId,
                    name: `${user.firstname} ${user.lastname}`,
                    imageFile: user.imageFile,
                },
                rate,
                comment,
                imageFile,
            };

            product.reviews.push(newReview);

            const totalRatings = product.reviews.reduce((acc, review) => acc + review.rate, 0);

            product.totalRatings = totalRatings;
            product.numOfReviews = product.reviews.length;
            product.averageRating = totalRatings / product.reviews.length;
            await product.save();

            //find order and orderItem key to update as reviewed.
            
            const order = await Order.findOne({
                userId,
                orderItems: {
                    $elemMatch: {
                        prodId,
                        isReviewed: false
                    }
                }
            });
            

            const item = order.orderItems.find((item) => item.prodId.toString() === prodId);

            item.isReviewed = true;
            await order.save();

            
            res.status(200).json({ message : "Review sent successfully. "});
        }catch(error){
            res.status(500).json({ message : error.message});
        }
    }
