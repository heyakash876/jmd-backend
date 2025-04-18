// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   passportNumber: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ['Pending', 'Approved', 'Rejected'],
//     default: 'Pending',
//   },
//   visaURL: {
//     type: String,
//     default: "",
//   },
//   isAdmin: {
//     type: Boolean,
//     default: false,
//   },
//   visaFile: {
//     type: String,
//     default: '',
//   }
// });

// module.exports = mongoose.model('User', UserSchema);
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastName: { type: String },
  fatherName: { type: String },
  passportNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  visaCountry: { type: String },
  age: { type: Number },
  phoneNumber: { type: String },
  status: { type: String, default: "Pending" },
  visaURL: { type: String },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
