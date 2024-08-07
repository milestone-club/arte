const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  token: { type: String },
  profile: { type: mongoose.Schema.Types.ObjectId, ref: "ProfileInfo" },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  profilePicture: { type: String },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
