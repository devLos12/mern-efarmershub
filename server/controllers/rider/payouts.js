import RiderPayout from "../../models/riderPayout.js";



export const deleteRiderPayout = async (req, res) => {
    try {
        const { items } = req.body;
        const { id, role } = req.account;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid items array." });
        }

        // STEP 1: Soft delete (add deletedBy)
        await RiderPayout.updateMany(
            { _id: { $in: items }},
            {
                $addToSet: {
                    deletedBy: { id, role }
                }
            }
        );

        // STEP 2: Find items where BOTH admin & seller have deleted
        const doubleDeleted = await RiderPayout.find({
            _id: { $in: items },
            "deletedBy.role": { $all: ["admin", "rider"] }
        });

        // STEP 3: Hard delete kapag complete delete na
        if (doubleDeleted.length > 0) {
            const idsToRemove = doubleDeleted.map(item => item._id);
            await RiderPayout.deleteMany({ _id: { $in: idsToRemove } });
        }

        return res.status(200).json({
            message: "Deleted Successfully.",
            hardDeletedIds: doubleDeleted.map(item => item._id)
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};



export const riderPayout = async (req, res) => {
    try {
        const { id, role } = req.account; // Get both id and role from auth middleware

        if (!id) {
            return res.status(401).json({ message: "Unauthorized - Rider not found" });
        }

        // Fetch all payouts for this rider, sorted by date (newest first)
        const payouts = await RiderPayout.find({ riderId: id })
            .sort({ createdAt: -1 })
            .lean();

        if (!payouts || payouts.length === 0) {
            return res.status(200).json([]);
        }

        // Filter out payouts that were deleted by this rider
        const filteredPayouts = payouts.filter((payout) => {
            const deleted = payout.deletedBy?.find(
                (e) => e.id.toString() === id.toString() && e.role === role
            );
            return !deleted; // kung wala sa deletedBy, ipakita
        });

        // Format the response data
        const formattedPayouts = filteredPayouts.map(payout => ({
            _id: payout._id,
            riderName: payout.riderName,
            riderEmail: payout.riderEmail,
            totalDelivery: payout.totalDelivery || 0,
            totalAmount: payout.totalAmount || 0,
            taxAmount: payout.taxAmount || 0, 
            netAmount: payout.netAmount || 0,
            e_WalletAcc: {
                type: payout.e_WalletAcc?.type || "N/A",
                number: payout.e_WalletAcc?.number || "N/A"
            },
            status: payout.status || "pending",
            date: payout.date || new Date(payout.createdAt).toLocaleDateString(),
            imageFile: payout.imageFile || null
        }));

        return res.status(200).json(formattedPayouts);

    } catch (error) {
        console.error("Error fetching rider payouts:", error);
        return res.status(500).json({ 
            message: "Failed to fetch payouts",
            error: error.message 
        });
    }
};