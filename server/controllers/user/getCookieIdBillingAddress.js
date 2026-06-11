import jwt from "jsonwebtoken";
import User from "../../models/user.js";


const getCookieIdBillingAddress = async (req, res) => {
  try {
    const decoded = jwt.verify(req.cookies.accessToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    const isEmptyBillingAddress =
      !user.billingAddress ||
      Object.values(user.billingAddress).every((val) => !val);

    // Always return user base info for prefilling
    const prefill = {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      contact: user.billingAddress?.contact
    };

        
    if (isEmptyBillingAddress) {
      return res.status(202).json({
        id: decoded.id,
        message: "add address",
        prefill,
      });
    }

    // Merge billingAddress on top of base prefill (billingAddress values take priority)
    return res.status(200).json({
      id: decoded.id,
      message: "change address",
      prefill: { ...prefill, ...user.billingAddress.toObject() },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export default getCookieIdBillingAddress;