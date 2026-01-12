import Order from "../../models/order.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatTime = () =>
    new Date().toLocaleTimeString("en-PH", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

const getRandomDelay = (minHours, maxHours) => {
    const minMs = minHours * 60 * 100;
    const maxMs = maxHours * 60 * 100;
    return Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
}

const getRandomLocation = () => {
    const locations = [
        "Dasmariñas",
        "Bacoor",
        "Imus",
        "Tagaytay",
        "Trece Martires",
        "General Trias",
        "Cavite City",
        "Tanza",
        "Naic",
        "Indang",
        "Silang",
        "Amadeo",
        "Alfonso",
        "Maragondon",
        "Ternate",
        "GMA",
        "Carmona",
        "Magallanes",
        "Mendez",
        "Noveleta",
        "Rosario",
        "Kawit"
    ];
    const randomIndex = Math.floor(Math.random() * locations.length);
    return locations[randomIndex];
};


const updateStatus = async(orderId, prevStatus, newStatus, newDescription, location, waitTime) =>{
    await delay(waitTime);

    const order = await Order.findOne({_id : orderId});

    if(order.statusDelivery.toLowerCase() === prevStatus.toLowerCase()){    
        order.statusDelivery = newStatus

        order.statusHistory.push({
            status : newStatus,
            description : newDescription,
            location : location,
            timestamp : formatTime()
        })
        // await order.save();
    }
}


const updateOrderStatus = async(req, res)=> {
    try{
        const { orderId, newStatus } = req.body;
        

        const randomLoc  = getRandomLocation();

        const description = [
            {desc : "Order is being pack.",                 loc : "Dasmariñas"},
            {desc : "Your package is in transit now.",      loc : `${randomLoc}`},  
            {desc : "Your package has been delivered.",     loc : `${randomLoc}`},
        ]

        
        const order = await Order.findOne({_id : orderId});
        order.statusDelivery =  newStatus;
        order.statusHistory.push({
            status : newStatus,
            description : description[0].desc,
            location : description[0].loc,
            timestamp : formatTime()
        })
        // await order.save();
        
        if(newStatus.toLowerCase() === "packing"){
          
            await updateStatus(orderId, "packing", "In Transit", description[1].desc, description[1].loc ,getRandomDelay(1, 2));
            await updateStatus(orderId, "in transit", "Delivered", description[2].desc, description[2].loc,getRandomDelay(1, 2));
        }

        res.status(200).json({message : order.statusDelivery});
    }catch(error){
        res.status(500).json({message : error.message})
    }
}

export default updateOrderStatus;

