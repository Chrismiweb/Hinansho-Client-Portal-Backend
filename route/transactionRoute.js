const express = require('express');
const { getAllTransactions, getSingleTransaction } = require('../controller/transactionCtrl');
const { isLoggedIn } = require('../middleware/auth');
const router = express.Router();

const transactionRouter = express.Router();

transactionRouter.use(isLoggedIn);

transactionRouter.get('/', getAllTransactions);
transactionRouter.get('/:id', getSingleTransaction);

module.exports = transactionRouter;
