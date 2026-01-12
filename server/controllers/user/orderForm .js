import Order from "../../models/order.js";

const submitOrder = async(req, res)=>{
    try{
        const {userId, orderItems, firstname, 
             lastname, email, contact, address, totalPrice, payment } = req.body;

        if(payment === "online payment"){

            const paymongoRequest = await paymongo(totalPrice, userId);

            const reference_number = paymongoRequest.data.attributes.reference_number;
            
            const newOrder = new Order({
              ...req.body, 
              paymentType : "pending",
              paymentStatus : "pending",
              reference_number
            });
            
            await newOrder.save();

            res.status(200).json({
                type : paymongoRequest.data.type,
                checkout_url : paymongoRequest.data.attributes.checkout_url
            });

        }else{
            const newOrder = new Order({
                userId, orderItems, firstname, lastname, email,
                contact, address, totalPrice,
                paymentType : payment,
                paymentStatus : "paid"
            });

            await newOrder.save();

            res.status(200).json({message : "order placed succesfully"})
        }
    }catch(error){
        res.status(500).json({message : error.message})
    }
}
export default submitOrder;



const paymongo = async (totalPrice, userId) => {
  try {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: 'Basic c2tfdGVzdF95YTFrTVVWaDhKVTIxM2VqcWo1ek5YRWc6' // palitan mo ng actual key mo
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: totalPrice * 100, // example: 500.00 PHP
            description: "Order from E-Farmers Hub",
            remarks: "Online Payment",
            currency: "PHP",
            metadata: {
              userId: userId  // dito mo isasama yung order ID mo
            },
            redirect: {
              success: "https://your-site.com/success",
              failed: "https://your-site.com/failed"
            }
          }
        }
      })
    };

    const res = await fetch('https://api.paymongo.com/v1/links', options);
    const data = await res.json();
    return data;

  } catch (error) {
    console.log("Error ", error.message);
  }
}
