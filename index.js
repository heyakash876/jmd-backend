const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const cors = require('cors');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
const PORT = process.env.PORT || 5000;

dotenv.config();

const app = express();
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');

  // Create Admin only once
  // createAdmin();

  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('MongoDB connection failed:', err);
});

// Create admin user once
// async function createAdmin() {
//   const existing = await User.findOne({ passportNumber: 'admin' });
//   if (!existing) {
//     const hashed = await bcrypt.hash('admin123', 10);
//     const admin = new User({
//       name: 'Admin',
//       passportNumber: 'admin',
//       password: hashed,
//       isAdmin: true
//     });
//     await admin.save();
//     console.log('✅ Admin user created!');
//   } else {
//     console.log('✅ Admin already exists');
//   }
// }
