const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { CronJob } = require("cron");
const fetch = require("node-fetch");
require("dotenv").config();

const User = require("./models/User");

const app = express();

app.use(cors({
  origin: ['http://localhost:4200', 'https://poetic-kashata-afaf70.netlify.app'],
  credentials: true
}));

app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb+srv://shafic:1111@cluster0.nkqmbrr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  family: 4,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// API Routes
app.post('/api/users', async (req, res) => {
  const { name, email, birthday } = req.body;
  const user = new User({ name, email, birthday });
  await user.save();
  res.json({ message: "User saved successfully" });
});

app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.put('/api/users/:id', async (req, res) => {
  const { name, email, birthday } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { name, email, birthday }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Cron job at 12 AM IST
const job = new CronJob('0 0 * * *', async () => {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  console.log("⏰ Cron running at:", now.toLocaleString());

  const users = await User.find();
  users.forEach(user => {
    const birth = new Date(user.birthday);
    const birthMonthDay = `${(birth.getMonth() + 1).toString().padStart(2, '0')}-${birth.getDate().toString().padStart(2, '0')}`;
    const nowMonthDay = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    console.log(`Checking ${user.name}: ${birthMonthDay} === ${nowMonthDay}`);
    if (birthMonthDay === nowMonthDay) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '🎉 Wishing You the Happiest Birthday!!',
        text: `Dear ${user.name},\n
Wishing you a day filled with love, laughter, and everything that makes you smile. 🎂✨

May your birthday be as amazing as you are, and may the year ahead bring you endless joy, success, and beautiful memories. 💫

You’re not just a year older, but a year wiser and more wonderful! 💖

Have a fantastic birthday celebration! 🎈🎁

With warm wishes,
Your Shafic 🎉
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("❌ Email error:", error);
        } else {
          console.log(`✅ Birthday email sent to ${user.email}:`, info.response);
        }
      });
    }
  });
}, null, true, 'Asia/Kolkata');

job.start();

// Keep Render app awake (Free tier workaround)
setInterval(() => {
  fetch("https://your-api-name.onrender.com")
    .then(() => console.log("🌐 Self-ping to keep alive"))
    .catch(err => console.log("Ping error", err));
}, 14 * 60 * 1000); // every 14 minutes

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
