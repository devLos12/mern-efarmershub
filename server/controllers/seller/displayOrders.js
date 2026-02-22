import Order from "../../models/order.js";


// ─── Helper: same as adminOrderController ─────────────────────────────────────
// createdAt is a proper Date object — direct Date comparison works
const getDateFilter = (period, startDate, endDate) => {
    const now = new Date();

    switch (period) {
        case "thisweek": {
            const dayOfWeek = now.getDay();
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday-based
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - daysFromMonday);
            weekStart.setHours(0, 0, 0, 0);
            return { $gte: weekStart, $lte: now };
        }
        case "thismonth": {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { $gte: monthStart, $lte: now };
        }
        case "thisyear": {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return { $gte: yearStart, $lte: now };
        }
        case "custom": {
            if (startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return { $gte: start, $lte: end };
            }
            return null;
        }
        default:
            return null; // "all" or undefined — no date filter
    }
};
// ─────────────────────────────────────────────────────────────────────────────


export const displayOrders = async (req, res) => {
    try {
        const sellerId = req.account.id;

        // ── Date filter from query params ─────────────────────────────────────
        const { period, startDate, endDate } = req.query;
        const dateFilter = getDateFilter(period, startDate, endDate);
        // ─────────────────────────────────────────────────────────────────────

        const query = {
            "orderItems.seller.id": sellerId,
            ...(dateFilter && { createdAt: dateFilter })
        };

        const sellerOrders = await Order.find(query);

        if (!sellerOrders || sellerOrders.length === 0) {
            return res.status(404).json({ message: "No order yet" });
        }

        const orders = sellerOrders.map(order => {
            const sellerItems = order.orderItems.filter(
                (item) => item.seller.id.toString() === sellerId
            );
            const sellerTotalPrice = sellerItems.reduce((total, item) => {
                return total + (item.prodPrice * item.quantity);
            }, 0);
            return {
                ...order.toObject(),
                orderItems: sellerItems,
                totalPrice: sellerTotalPrice
            };
        });

        const filteredOrders = orders.filter((order) => {
            const deleted = order.deletedBy.find((e) => e.id.toString() === sellerId);
            const archived = order.archivedBy.find((e) => e.id.toString() === sellerId);
            return !deleted && !archived;
        });

        res.status(200).json(filteredOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.account;
        const orderId = req.params.id;

        await Order.updateOne({ _id: orderId }, {
            $addToSet: { deletedBy: { id } }
        });

        const order = await Order.findOne({ _id: orderId });
        if (order.deletedBy.length >= 2) {
            await Order.deleteOne({ _id: orderId });
        }

        res.status(200).json({ message: "deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const archiveSellerOrder = async (req, res) => {
    try {
        const sellerId = req.account.id;
        const orderId = req.params.id;

        await Order.updateOne(
            { _id: orderId },
            { $addToSet: { archivedBy: { id: sellerId, archivedAt: new Date() } } }
        );

        res.status(200).json({ message: "Order archived successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const unarchiveSellerOrder = async (req, res) => {
    try {
        const sellerId = req.account.id;
        const orderId = req.params.id;

        await Order.updateOne(
            { _id: orderId },
            { $pull: { archivedBy: { id: sellerId } } }
        );

        res.status(200).json({ message: "Order unarchived successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getArchivedSellerOrders = async (req, res) => {
    try {
        const sellerId = req.account.id;

        // ── Date filter from query params ─────────────────────────────────────
        const { period, startDate, endDate } = req.query;
        const dateFilter = getDateFilter(period, startDate, endDate);
        // ─────────────────────────────────────────────────────────────────────

        const query = {
            "orderItems.seller.id": sellerId,
            "archivedBy.id": sellerId,
            "deletedBy.id": { $ne: sellerId },
            ...(dateFilter && { createdAt: dateFilter })
        };

        const sellerOrders = await Order.find(query);

        if (!sellerOrders || sellerOrders.length === 0) {
            return res.status(404).json({ message: "No archived orders" });
        }

        const orders = sellerOrders.map(order => {
            const sellerItems = order.orderItems.filter(
                (item) => item.seller.id.toString() === sellerId.toString()
            );
            const sellerTotalPrice = sellerItems.reduce((total, item) => {
                return total + (item.prodPrice * item.quantity);
            }, 0);
            return {
                ...order.toObject(),
                orderItems: sellerItems,
                totalPrice: sellerTotalPrice
            };
        });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};