const express = require('express');
const { getRentSummary, getRentHistory, getPendingPayments, fetchMyDocuments, investorFinanceSummary } = require('../controller/investorCtrl');



const investorRouters = express.Router();

investorRouters.get('/rent/summary', getRentSummary);
investorRouters.get('/rent/history', getRentHistory);
investorRouters.get('/rent/pending', getPendingPayments);
investorRouters.get('/documents', fetchMyDocuments);
investorRouters.get('/finance/summary', investorFinanceSummary);


module.exports = investorRouters; 