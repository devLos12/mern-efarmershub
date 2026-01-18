import mongoose, { Schema } from "mongoose";

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    orderItems : [
        {
            seller: {   
                id: { 
                    type: mongoose.Schema.Types.ObjectId, 
                    ref : "Seller",
                    required : true     
                },  
                name: { type: String, required: true}
            },
            prodId : {type : mongoose.Schema.Types.ObjectId, ref : "Product", required : true},
            pid    : {type : String, required : true},
            prodName  : {type : String, required : true},
            prodDisc  : {type : String, required : true},
            quantity  : {type : Number, required : true},
            prodPrice : {type : Number, required : true},         
            imageFile : {type : String, required : true},
            isReviewed: {type : Boolean, required : true, default : false},
            
            replacement: {
                isRequested: { type: Boolean, default: false },
                reason: { 
                    type: String, 
                    required: false 
                },
                description: { type: String, required: false },
                images: [{ type: String, required: false }],
                requestedAt: { type: Date, required: false },
                status: { 
                    type: String, 
                    enum: ["pending", "approved", "rejected", "completed"],
                    required: false 
                },

                fault: {
                    assignedTo: {
                        type: String,
                        enum: ["seller", "rider", "none"],
                        required: false
                    },
                    details: { type: String, required: false }
                },

                reviewedBy: { 
                    type: mongoose.Schema.Types.ObjectId, 
                    ref: "Admin",
                    required: false 
                },
                reviewedAt: { type: Date, required: false },
                notes: { type: String, required: false }
            }
        }
    ],
    
    firstname  : {type : String, required : true},
    lastname   : {type : String, required : true},
    email      : {type : String, required : true },
    contact    : {type : String, required : true}, 
    address    : {type : String, required : true},     
    totalPrice : {type : Number, required : true},
    paymentType : {type : String, required : true},
    paymentStatus : {type : String, required : true},
    proofOfPayment : {
        image : { type : String, default : "pending"},
        textMessage : { type : String, default : ""},
        cloudinaryId: { type: String }, 

    },

    orderMethod: {
        type: String,
        enum: ["delivery", "pick up"]
    },
    
    statusDelivery : {
        type: String , 
        enum : [ 
            "cancelled", 
            "pending", 
            "confirm", 
            "packing", 
            "ready to deliver",
            "in transit",
            "delivered", 
            "ready for pick up", 
            "completed", 
            "complete",
            "replacement requested",
            "replacement confirmed",
            "replacement rejected",
            "refund requested", 
            "refund processing", 
            "refund completed", 
            "refund rejected"
        ],
        default : "pending" 
    },

    statusHistory: {
        type: [{
            status: { type: String, required: true},
            description: { type: String, required: true}, 
            location: { type: String, required: true},
            
            affectedItem: {
                prodId: { 
                    type: mongoose.Schema.Types.ObjectId, 
                    ref: "Product",
                    required: false 
                },
                prodName: { type: String, required: false }
            },
            
            date: { type: String, 
                default: () => new Date().toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric"
                })
            },
            timestamp: { type: String,   
                default: () => new Date().toLocaleTimeString("en-PH", {
                    timeZone: "Asia/Manila",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                })
            },
            imageFile: { type: String, required: false, default: "" },
            
            performedBy: {
                id: { 
                    type: mongoose.Schema.Types.ObjectId,
                    required: false
                },
                role: {
                    type: String,
                    enum: ['User', 'Admin', 'Rider', 'Seller', 'System'],
                    required: false
                },
                name: { type: String, required: false }
            }
        }],
        
        default: () => [
            {  
                status: "pending",
                description: "order received, waiting for confirmation.",
                location: "unknown",
                date: new Date().toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric"
                }),
                timestamp: new Date().toLocaleTimeString("en-PH", {
                    timeZone: "Asia/Manila",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                }),
            }
        ]
    },
    
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    
    riderName: {
        type: String,
        default: "",
        required: false
    },
    
    createdAt: { 
        type: Date, 
        default: Date.now
    },
    
    refNo: {type: String, required: true },
    reference_number: { type: String, unique: true, sparse: true, required: false },
    
    
    archivedBy: [{
        id: {
            type: mongoose.Schema.Types.ObjectId, 
            required: false
        },
        archivedAt: {
            type: Date,
            default: Date.now
        }
    }],


    deletedBy: [{
        id: {
            type: mongoose.Schema.Types.ObjectId, 
            required: false
        }
    }],
    
    cancellation: {
        isCancelled: { type: Boolean, default: false },
        reason: { type: String, required: false },
        cancelledBy: { 
            type: String, 
            enum: ["buyer", "seller", "admin"],
            required: false 
        },
        cancelledAt: { type: Date, required: false },
        
        refund: {
            isEligible: { type: Boolean, default: false },
            amount: { type: Number, required: false },
            method: { 
                type: String, 
                enum: ["GCash", "Maya"],
                required: false 
            },
            accountName: { type: String, required: false },
            accountNumber: { type: String, required: false },
            qrCode: { type: String, required: false },
            status: { 
                type: String, 
                enum: ["pending", "processing", "completed", "rejected", "not_applicable"],
                default: "not_applicable"
            },
            processedAt: { type: Date, required: false },
            processedBy: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: "Admin",
                required: false 
            },
        }
    },

    refundHistory: [{
        itemId: { 
            type: mongoose.Schema.Types.ObjectId,
            required: true 
        },
        itemName: { type: String, required: true },
        pid: { type: String, required: true },
        
        amount: { type: Number, required: true },
        reason: { type: String, required: true },
        
        triggerEvent: {
            type: String,
            required: true
        },
        
        faultParty: {
            type: String,
            enum: ["rider", "seller", "buyer", "store", "manufacturer"],
            required: true
        },

        riderLiability: { type: Number, default: 0 },
        requestedAt: { type: Date, default: Date.now },
        notes: { type: String, required: false}
        
    }]
})

const Order = mongoose.model("Order", orderSchema); 
export default Order;