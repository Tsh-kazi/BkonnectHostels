const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const hostelRoutes = require('./routes/hostels');
const bookingRoutes = require('./routes/bookings');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Mount Routes
app.use('/auth', authRoutes);
app.use('/hostels', hostelRoutes);
app.use('/bookings', bookingRoutes);
app.use('/owner', require('./routes/owner'));
app.use('/student', require('./routes/student'));
app.use('/admin', require('./routes/admin'));
app.use('/notifications', require('./routes/notifications'));

app.get('/', (req, res) => {
  res.json({ message: 'Hostel Booking API is running.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
