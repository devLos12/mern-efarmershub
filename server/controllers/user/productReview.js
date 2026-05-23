import Product from "../../models/products.js";
import Order from "../../models/order.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import User from "../../models/user.js";
import mongoose from "mongoose";


const storage = multer.memoryStorage();

export const uploadImgReview = multer({ storage: storage });


export const productReview = async (req, res) => {
  try {
    const userId = req.account.id;
    const { prodId, orderId, rate, comment } = req.body;


    
    // Upload image to Cloudinary
    let imageFileUrl = null;
    if (req.file) {
      try {
        const base64Image = req.file.buffer.toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: "product-reviews",
        });
        imageFileUrl = uploadResult.secure_url;
      } catch (uploadError) {
        return res.status(400).json({ message: "Failed to upload review image to Cloudinary!" });
      }
    }

    const user = await User.findOne({ _id: userId });
    const product = await Product.findOne({ _id: prodId });

    if (!product) return res.status(404).json({ message: "Product not found!" });

    // Verify muna na hindi pa reviewed yung specific order item
    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      userId,
      orderItems: {
        $elemMatch: {
          prodId: new mongoose.Types.ObjectId(prodId),
          isReviewed: false,
        },
      },
    });

    if (!order) {
      return res.status(400).json({ message: "Already reviewed or order not found." });
    }



    // // Add review to product
    const newReview = {
      user: {
        id: userId,
        name: `${user.firstname} ${user.lastname}`,
        imageFile: user.imageFile,
      },
      rate,
      comment,
      imageFile: imageFileUrl,
    };

    product.reviews.push(newReview);
    const totalRatings = product.reviews.reduce((acc, review) => acc + review.rate, 0);
    product.totalRatings = totalRatings;
    product.numOfReviews = product.reviews.length;
    product.averageRating = totalRatings / product.reviews.length;
    await product.save();
    
    
    const isUpdate = await Order.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(orderId),
        userId,
        orderItems: {
          $elemMatch: {
            prodId: new mongoose.Types.ObjectId(prodId),
            isReviewed: false,
          },
        },
      },
      {
        $set: { "orderItems.$.isReviewed": true },
      },
      { new: true }
    );



    res.status(200).json({ message: "Review sent successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
