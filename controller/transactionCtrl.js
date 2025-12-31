const Transaction = require("../model/transaction")

//Get all transactions + dashboard totals
const getAllTransactions = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        // Query filters
        const { type, status, chain, asset } = req.query;
        const filters = { userId };

        if (type) filters.type = type;
        if (status) filters.status = status;
        if (chain) filters.chain = chain;
        if (asset) filters.asset = { $regex: asset, $options: "i" };

        // Fetch transactions sorted by latest
        const transactions = await Transaction.find(filters).sort({ createdAt: -1 });

        // Calculate dashboard stats
        const totalTransactions = transactions.length;
        const totalVolume = transactions.reduce((sum, tx) => sum + (tx.value || 0), 0);
        const totalFees = transactions.reduce((sum, tx) => sum + (tx.fee || 0), 0);

        res.status(200).json({
            success: true,
            message: "Transactions fetched successfully",
            data: {
                totalTransactions,
                totalVolume,
                totalFees,
                transactions,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error fetching transactions: ${error.message}`,
        });
    }
};

//Get a single transaction by ID
const getSingleTransaction = async (req, res) => {
    try {
        const userId = req.user?._id;
        const transactionId = req.params.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const transaction = await Transaction.findOne({
            _id: transactionId,
            userId,
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Transaction fetched successfully",
            transaction,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error fetching transaction: ${error.message}`,
        });
    }
};

//Filter transactions by type with optional status and chain filters
const filterByTypeTransactions = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { type } = req.params;
        const { status, chain } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        // Base query for current user
        const filters = { userId };

        // Type filter (from params, e.g. Buy, Sell, Deposit, Withdrawal)
        if (type && type.toLowerCase() !== "all") {
            filters.type = type;
        }

        // Optional status filter (e.g. Completed, Pending, Failed)
        if (status) {
            filters.status = status;
        }

        // Optional chain filter (e.g. ETH, BNB, SOL)
        if (chain) {
            filters.chain = chain;
        }

        // Fetch user transactions matching filters
        const transactions = await Transaction.find(filters).sort({ createdAt: -1 });

        // Calculate totals for dashboard UI
        const totalTransactions = transactions.length;
        const totalVolume = transactions.reduce((sum, tx) => sum + (tx.value || 0), 0);
        const totalFees = transactions.reduce((sum, tx) => sum + (tx.fee || 0), 0);

        res.status(200).json({
            success: true,
            message: `${type || "All"} transactions fetched successfully`,
            data: {
                totalTransactions,
                totalVolume,
                totalFees,
                transactions,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error filtering transactions: ${error.message}`,
        });
    }
};

module.exports = {
    getAllTransactions,
    getSingleTransaction,
    filterByTypeTransactions,
};
