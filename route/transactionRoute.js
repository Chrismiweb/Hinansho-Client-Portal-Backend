const express = require('express');
const { getAllTransactions, getSingleTransaction } = require('../controller/transactionCtrl');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

const transactionRouter = express.Router();

transactionRouter.use(authenticateUser);

transactionRouter.get('/', getAllTransactions);
transactionRouter.get('/:id', getSingleTransaction);

module.exports = transactionRouter;
