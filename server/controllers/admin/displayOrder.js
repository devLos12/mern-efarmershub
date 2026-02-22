import Order from "../../models/order.js";



// ─── Helper: Build createdAt date filter from period query params ──────────────
// createdAt is a proper Date object in MongoDB — so we use Date comparison directly
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


export const getOrders = async (req, res) => {
    try {
        const { id } = req.account;

        // ── Date filter from query params ─────────────────────────────────────
        const { period, startDate, endDate } = req.query;
        const dateFilter = getDateFilter(period, startDate, endDate);
        // ─────────────────────────────────────────────────────────────────────

        // Build query — add createdAt filter only if period is set
        const query = dateFilter ? { createdAt: dateFilter } : {};

        const orders = await Order.find(query);

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No Order Yet." });
        }

        const filteredOrders = orders.filter((order) => {
            const deleted = order.deletedBy.some((e) => e.id.toString() === id);
            const archived = order.archivedBy.some((e) => e.id.toString() === id);
            return !deleted && !archived;
        });

        res.status(200).json(filteredOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const removeOrders = async (req, res) => {
    try {
        const { id } = req.account;
        const orderId = req.params.id;

        await Order.updateOne({ _id: orderId }, {
            $addToSet: { deletedBy: { id } }
        });

        res.status(200).json({ message: "Successfully deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const archiveOrder = async (req, res) => {
    try {
        const { id } = req.account;
        const orderId = req.params.id;

        await Order.updateOne(
            { _id: orderId },
            { $addToSet: { archivedBy: { id, archivedAt: new Date() } } }
        );

        res.status(200).json({ message: "Order archived successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const unarchiveOrder = async (req, res) => {
    try {
        const { id } = req.account;
        const orderId = req.params.id;

        await Order.updateOne(
            { _id: orderId },
            { $pull: { archivedBy: { id } } }
        );

        res.status(200).json({ message: "Order unarchived successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getArchivedOrders = async (req, res) => {
    try {
        const { id } = req.account;

        // ── Date filter from query params ─────────────────────────────────────
        const { period, startDate, endDate } = req.query;
        const dateFilter = getDateFilter(period, startDate, endDate);
        // ─────────────────────────────────────────────────────────────────────

        const query = {
            "archivedBy.id": id,
            ...(dateFilter && { createdAt: dateFilter })
        };

        const orders = await Order.find(query);

        const filteredOrders = orders.filter((order) => {
            const deleted = order.deletedBy.some((e) => e.id.toString() === id);
            return !deleted;
        });

        if (filteredOrders.length === 0) {
            return res.status(404).json({ message: "No archived orders" });
        }

        res.status(200).json(filteredOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};