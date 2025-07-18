const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
require("dotenv").config();

const User = require("./models/User");

const app = express();

// CORS setup
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://poetic-kashata-afaf70.netlify.app',
    'https://projectwish.netlify.app'
  ],
  credentials: true
}));

app.use(bodyParser.json());

// MongoDB connection
const uri = 'mongodb+srv://shafic:1111@cluster0.nkqmbrr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  family: 4,
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ROUTES

// Create user
app.post('/api/users', async (req, res) => {
  const { name, email, birthday } = req.body;
  const user = new User({ name, email, birthday });
  await user.save();
  res.json({ message: "User saved successfully" });
});

// Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  const { name, email, birthday } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { name, email, birthday }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Birthday Wish API
app.post('/api/sendWish', async (req, res) => {
  // 🔐 Optional API key protection (uncomment if needed)
  // const apiKey = req.headers['x-api-key'];
  // if (apiKey !== process.env.CRON_SECRET) {
  //   return res.status(403).json({ error: 'Unauthorized' });
  // }

  const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  console.log("📬 /api/sendWish HIT at:", istNow);

  const users = await User.find();
  let matchCount = 0;

  users.forEach((user, index) => {
    const birthDate = new Date(user.birthday);
    console.log(`👤 Checking ${user.name}: ${birthDate.toDateString()}`);

    if (
      birthDate.getDate() === istNow.getDate() &&
      birthDate.getMonth() === istNow.getMonth()
    ) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '🎉 Wishing You the Happiest Birthday!!',
        text: `Dear ${user.name},\n\nWishing you a day filled with love, laughter, and everything that makes you smile. 🎂✨

May your birthday be as amazing as you are, and may the year ahead bring you endless joy, success, and beautiful memories. 💫

You’re not just a year older, but a year wiser and more wonderful! 💖

Have a fantastic birthday celebration! 🎈🎁

With warm wishes,
Your Shafic 🎉`
      };

      // ⏳ Delay each email by 1 second per user to avoid 429
      setTimeout(() => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(`❌ Failed to send to ${user.email}:`, error);
          } else {
            console.log(`✅ Birthday wish sent to ${user.email}:`, info.response);
          }
        });
      }, index * 1000);

      matchCount++;
    }
  });

  res.json({ message: `🎈 Birthday check done. ${matchCount} user(s) matched.` });
});

// Start server
app.listen(3000, () => console.log("🚀 Server running on port 3000"));
