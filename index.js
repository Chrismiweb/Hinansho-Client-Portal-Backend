require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const router = require("./route/handler");
const bcrypt = require("bcryptjs");
const {isLoggedIn} = require("./middleware/auth");
const routers = require('./route/admin')
const mongoose = require('mongoose');
const helmet = require('helmet')
const cors = require('cors')
const session = require('express-session');
const passport = require('./config/passport')
const authRouter = require("./route/authHandler");
const connectDB = require("./connectDB/connect.js");
const transactionRouter = require("./route/transactionRoute.js");
const User = require("./model/user.js");
const crypto = require('crypto');
// const checkRole = require("./middleware/checkRole.js");
// const tokRouter = require('./route/token.js')
const path = require('path');
const allowRoles = require("./middleware/checkRole.js");
const tenantRouters = require("./route/tenantHandler.js");
const investorRouters = require("./route/investorHandler.js");

const port = process.env.PORT || 7500;
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use(helmet());
app.use(express.json({limit: '600mb'}));
app.use(express.urlencoded({ extended: true, limit: '600mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.use('/user', isLoggedIn, router);
app.use('/admin', isLoggedIn, allowRoles('Admin'), routers);
app.use('/tenant', isLoggedIn, allowRoles('Tenant'), tenantRouters);
app.use('/investor', isLoggedIn, allowRoles('Investor'), investorRouters);
app.use('/transactions',transactionRouter);

// Connect DB
mongoose.connect(process.env.connection_String)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('DB Error:', err));

app.get('/', (req, res) => {
  res.send('✅ Hinansho Backend is Live and Running!');
});

app.listen(port, () => {
    connectDB();
    console.log(`server connected on ${port}`)
});

app.all('*', (req, res) => {
	res
		.status(404)
		.json(
			`${req.method} - route '${req.originalUrl}' isn't available on Hinansho WebApp`
		);
});