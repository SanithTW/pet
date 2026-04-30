require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const seedAdminUser = require('./seeds/adminSeed');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use('/uploads', express.static(uploadsPath));

// Middleware
app.use(cors());
app.use(express.json()); // Body parser

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/pets', require('./routes/petRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/vets', require('./routes/vetRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/vaccines', require('./routes/vaccineRoutes'));
app.use('/api/grooming', require('./routes/groomingRoutes'));
app.use('/api/boarding', require('./routes/boardingRoutes'));
app.use('/api/diet', require('./routes/dietRoutes'));
app.use('/api/medications', require('./routes/medicationRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedAdminUser();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Server failed to start:', error.message);
  process.exit(1);
});
