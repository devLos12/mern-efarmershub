import Order from "../../models/order.js";


const handlePaymongoWebhook = async (req, res) => {
  try {
    
    const event = req.body;
    
    if (event?.data?.attributes?.type === 'payment.paid') {
      const reference_number = event.data.attributes.data.attributes.external_reference_number;
      const paymentType = event.data.attributes.data.attributes.source.type;
      
      const order = await Order.findOne({reference_number});
      order.paymentType = paymentType;
      order.paymentStatus = "paid";
      
      await order.save();

    }
  } catch (error) {
    console.error(error);
  }
}
export default handlePaymongoWebhook;