import DamageLog from '../models/damageLog.js'; // adjust path ng model mo


// Get all damage logs
export const getDamageLogs = async (req, res) => {
    try {
        const damageLogs = await DamageLog.find()
            .populate('rider', 'firstname lastname email') // populate rider info
            .sort({ createdAt: -1 }); // latest first


        
        res.status(200).json({
            success: true,
            damageLogs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create damage log
export const createDamageLog = async (req, res) => {
    try {
        const { rider, order, itemDamaged, damageValue, riderLiability, status, notes } = req.body;

        const damageLog = await DamageLog.create({
            rider,
            order,
            itemDamaged,
            damageValue,
            riderLiability,
            status,
            notes
        });

        res.status(201).json({
            success: true,
            message: 'Damage log created successfully',
            damageLog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update damage log
export const updateDamageLog = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const damageLog = await DamageLog.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!damageLog) {
            return res.status(404).json({
                success: false,
                message: 'Damage log not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Damage log updated successfully',
            damageLog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// Delete damage logs
export const deleteDamageLogs = async (req, res) => {
    try {
        const { items } = req.body; // array of IDs

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items to delete'
            });
        }

        await DamageLog.deleteMany({ _id: { $in: items } });

        res.status(200).json({
            success: true,
            message: `${items.length} damage log(s) deleted successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};