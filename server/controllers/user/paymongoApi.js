
// const onlinePaymentReq = async(req, res) => {
//   try{
//     const userId = req.params.userId;
//     const { totalPrice }  = req.body;

//     const paymongoRequest = await paymongo(totalPrice); 

//     res.status(200).json({
//        message : "successfully request!", 
//        checkout_url : paymongoRequest.data.attributes.checkout_url
//       })

//   }catch(error){
//     res.status(500).json({ message : error.message});
//   }
// }
// export default onlinePaymentReq;

