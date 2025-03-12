const mongoose = require('mongoose');
const config = require("../config/config");

mongoose.set("strictQuery", false);

mongoose.connect(config.dbconnection)
.then()
.catch(err => console.error('MongoDB connection error:', err));
