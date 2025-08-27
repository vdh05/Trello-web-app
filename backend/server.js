const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));

// Routes
const userRoutes = require('./api/user');
const boardRoutes = require('./api/board');

app.use('/api', userRoutes);
app.use('/api', boardRoutes);

// Start reminder scheduler
const { startReminderScheduler } = require('./utils/reminderScheduler');
startReminderScheduler();

app.listen(4000, () => console.log('Backend running on 4000'));