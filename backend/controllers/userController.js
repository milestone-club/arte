const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const { OAuth2Client } = require("google-auth-library");
const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: `Error getting all users /user ${err}` });
  }
};
//by id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: `Error getting user by id /user/:id ${err}` });
  }
};

// udpdate user

const updateUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.username = req.body.username;
    user.password = req.body.password;
    user.email = req.body.email;
    user.mobile = req.body.mobile;
    user.badges = req.body.badges;
    user.profileInfo = req.body.profileInfo;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res
      .status(500)
      .json({ message: `Error updating user by id /user/update/:id ${err}` });
  }
};

// router.post("/", UserController.createUser);
const createUser = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!(username && password && email)) {
      res.status(400).send("All inputs are required");
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).send("User already exists");
    }

    const encPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: encPassword,
    });
    const token = jwt.sign(
      { id: newUser._id, email },
      "lmao", // jwt secret use from env if needed
      {
        expiresIn: "3h",
      }
    );
    newUser.token = token;
    newUser.password = undefined;
    res.status(200).json(newUser);
  } catch (err) {
    console.log(err);
  }
};
// router.delete("/:id", UserController.deleteUser);

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.remove();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: `Error deleting user /user ${err}` });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!(username && password)) {
      return res.status(400).send("Input all fields");
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const checkPassword = await bcrypt.compare(password, user.password);
    if (user && checkPassword) {
      const token = jwt.sign({ id: user._id }, "lmao", { expiresIn: "2h" });
      return res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json({ token }); // Ensure token is sent back in the response
    }
    return res.status(401).send("Invalid credentials");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const auth = async (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Referrer-Policy", "no-referrer-when-downgrade");

  const redirectUrl = "http://127.0.0.1:3000/oauth";

  const oAuth2Client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    redirectUrl
  );

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope:
      "https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/userinfo.email",
    prompt: "consent",
  });
};

const google = async (req, res) => {
  try {
    const { name, email, photo } = req.body;

    if (!(name && email)) {
      return res.status(400).send("All inputs are required");
    }

    let user = await User.findOne({ email });

    if (user) {
      // User exists, generate token
      const token = jwt.sign({ id: user._id }, "lmao", {
        expiresIn: "2h",
      });
      return res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json({ success: true, user });
    }

    // User doesn't exist, create new user
    const randomPassword = Math.random().toString(36).slice(-8); // Example of generating an 8-character random password

    // Hash the random password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = new User({
      username: name,
      email,
      password: hashedPassword,
      photoURL: photo,
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, "lmao", {
      expiresIn: "2h",
    });

    res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserById,
  createUser,
  deleteUser,
  login,
  auth,
  google,
};
