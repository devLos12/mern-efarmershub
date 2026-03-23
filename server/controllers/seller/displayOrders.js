import Order from "../../models/order.js";


// ─── Helper: same as adminOrderController ─────────────────────────────────────
// createdAt is a proper Date object — direct Date comparison works
const getDateFilter = (period, startDate, endDate) => {
    const now = new Date();

    // ── Helper: get today's boundaries in PHT (UTC+8) ──────────────────────
    const getPHTDayBounds = () => {
        const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;
        const nowPHT = new Date(now.getTime() + PHT_OFFSET_MS);

        const todayStart = new Date(Date.UTC(
            nowPHT.getUTCFullYear(),
            nowPHT.getUTCMonth(),
            nowPHT.getUTCDate(),
            0, 0, 0, 0
        ) - PHT_OFFSET_MS);  // convert back to UTC for MongoDB

        const todayEnd = new Date(Date.UTC(
            nowPHT.getUTCFullYear(),
            nowPHT.getUTCMonth(),
            nowPHT.getUTCDate(),
            23, 59, 59, 999
        ) - PHT_OFFSET_MS);

        return { todayStart, todayEnd };
    };
    // ───────────────────────────────────────────────────────────────────────

    switch (period) {
        case "today":
        case undefined:
        case null:
        case "": {
            const { todayStart, todayEnd } = getPHTDayBounds();
            return { $gte: todayStart, $lte: todayEnd };
        }

        case "thisweek": {
            const { todayStart } = getPHTDayBounds();
            const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;
            const nowPHT = new Date(now.getTime() + PHT_OFFSET_MS);
            const dayOfWeek = nowPHT.getUTCDay();
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const weekStart = new Date(todayStart.getTime() - daysFromMonday * 86400000);
            return { $gte: weekStart, $lte: now };
        }

        case "thismonth": {
            const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;
            const nowPHT = new Date(now.getTime() + PHT_OFFSET_MS);
            const monthStart = new Date(Date.UTC(
                nowPHT.getUTCFullYear(),
                nowPHT.getUTCMonth(),
                1, 0, 0, 0, 0
            ) - PHT_OFFSET_MS);
            return { $gte: monthStart, $lte: now };
        }

        case "thisyear": {
            const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;
            const nowPHT = new Date(now.getTime() + PHT_OFFSET_MS);
            const yearStart = new Date(Date.UTC(
                nowPHT.getUTCFullYear(),
                0, 1, 0, 0, 0, 0
            ) - PHT_OFFSET_MS);
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
            return null;
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