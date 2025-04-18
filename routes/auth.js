const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const multer = require('multer');
const path = require('path');
// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ msg: "No token provided" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // create this folder if not exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });


router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Old password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ msg: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});
// PUT /api/auth/admin-change-password/:userId
router.put('/admin-change-password/:userId', verifyToken, async (req, res) => {
  try {
    const admin = await User.findById(req.userId);
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error("Admin password change error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
});
router.put('/change-admin-password', verifyToken, async (req, res) => {
  try {
    const admin = await User.findById(req.userId);
    if (!admin || !admin.isAdmin) return res.status(403).json({ msg: "Access denied" });

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ message: "Admin password updated successfully" });
  } catch (err) {
    console.error("Error changing admin password:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// router.post('/admin/register-user', verifyToken, async (req, res) => {
//   try {
//     const admin = await User.findById(req.userId);
//     if (!admin || !admin.isAdmin) {
//       return res.status(403).json({ msg: "Access denied" });
//     }

//     const {
//       name,
//       lastName,
//       fatherName,
//       passportNumber,
//       password,
//       visaCountry,
//       age,
//       phoneNumber,

//     } = req.body;

//     if (!passportNumber || !password || !name || !fatherName || !lastName || !visaCountry || !phoneNumber || !age) {
//       return res.status(400).json({ msg: "Please provide all required fields" });
//     }

//     const existing = await User.findOne({ passportNumber });
//     if (existing) return res.status(400).json({ msg: "User with this passport number already exists" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = new User({
//       name,
//       lastName,
//       fatherName,
//       passportNumber,
//       password: hashedPassword,
//       visaCountry,
//       age,
//       phoneNumber,
//       isAdmin: false // force to be regular user
//     });

//     await user.save();

//     res.json({ msg: "User registered successfully", userId: user._id });
//   } catch (err) {
//     console.error("Admin user registration error:", err);
//     res.status(500).json({ msg: "Server error" });
//   }
// });



router.post('/upload-visa/:id', verifyToken, upload.single('visa'), async (req, res) => {
  const admin = await User.findById(req.userId);
  if (!admin || !admin.isAdmin) return res.status(403).json({ msg: "Access denied" });

  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const visaPath = req.file.path;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { visaURL: visaPath },
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    console.error("Visa upload error:", err);
    res.status(500).json({ msg: "Failed to upload visa", error: err.message });
  }
});
// GET /me - Get current logged-in user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password'); // hide password
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error("Fetch user error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/user/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ msg: "User not found" });

  res.json({
    id: user.id,
    name: user.name,
    passportNumber: user.passportNumber,
    status: user.status,
    visaURL: user.visaURL,
    isAdmin: user.isAdmin
  });
});




// Register (initial setup)
router.post('/admin/register-user', verifyToken, upload.single('visa'), async (req, res) => {
  try {
    const admin = await User.findById(req.userId);
    if (!admin || !admin.isAdmin) return res.status(403).json({ msg: "Access denied" });

    const {
      name,
      lastName,
      fatherName,
      passportNumber,
      password,
      visaCountry,
      age,
      phoneNumber,
      status
    } = req.body;

    const existing = await User.findOne({ passportNumber });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      lastName,
      fatherName,
      passportNumber,
      password: hashedPassword,
      visaCountry,
      age,
      phoneNumber,
      status,
      visaURL: req.file ? req.file.path : null
    });

    await newUser.save();

    res.json({ msg: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { passportNumber, password } = req.body;

  try {
    const user = await User.findOne({ passportNumber });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Send only the required user fields (secure and sufficient for frontend)
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        passportNumber: user.passportNumber,
        status: user.status,
        visaURL: user.visaURL,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Route to get all users (only for admin)
router.get('/users', verifyToken, async (req, res) => {
  const admin = await User.findById(req.userId);
  if (!admin || !admin.isAdmin) return res.status(403).json({ msg: "Access denied" });

  const users = await User.find({ isAdmin: false }).select('-password');
  res.json(users);
});
router.put('/update-status/:id', verifyToken, async (req, res) => {
  const admin = await User.findById(req.userId);
  if (!admin || !admin.isAdmin) return res.status(403).json({ msg: "Access denied" });

  const { status } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: "Failed to update status" });
  }
});
router.delete('/admin/clear-users', verifyToken, async (req, res) => {
  try {
    const admin = await User.findById(req.userId);
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ msg: "Access denied" });
    }

    await User.deleteMany({ isAdmin: false });
    res.json({ msg: "All non-admin users deleted successfully" });
  } catch (err) {
    console.error("Error clearing users:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.delete('/admin/delete-user/:id', verifyToken, async (req, res) => {
  try {
    const admin = await User.findById(req.userId);
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ msg: "Server error" });
  }
});




module.exports = router;
