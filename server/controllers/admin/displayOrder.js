import Order from "../../models/order.js";


// ─── Helper: Build createdAt date filter from period query params ──────────────
// createdAt is a proper Date object in MongoDB — so we use Date comparison directly
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