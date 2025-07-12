const express = require("express");

const cors = require("cors");

const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const nodemailer = require("nodemailer");

const cron = require("node-cron");

require("dotenv").config();

const User = require("./models/User");

const app = express();

app.use(cors({

origin: ['http://localhost:4200', 'https://poetic-kashata-afaf70.netlify.app','https://projectwish.netlify.app'],

credentials: true // optional: only if you use cookies or auth headers

}));

app.use(bodyParser.json());

uri='mongodb+srv://shafic:1111@cluster0.nkqmbrr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

// DB connection

// mongoose.connect("mongodb://localhost:27017/birthdayApp")

// .then(() => console.log("✅ MongoDB connected"))

// .catch(err => console.error("❌ MongoDB connection error:", err));

mongoose.connect('mongodb+srv://shafic:1111@cluster0.nkqmbrr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',{

useNewUrlParser: true, useUnifiedTopology: true, tls: true, family: 4, 

})

// mongoose.connect(uri, {

// ssl: true,

// sslValidate: true,

// tlsAllowInvalidCertificates: false,

// })

// Routes

app.post('/api/users', async (req, res) => {

const { name, email, birthday } = req.body; const user = new User({ name, email, birthday }); await user.save(); res.json({ message: "User saved successfully" }); 

});

app.get('/api/users', async (req, res) => {

const users = await User.find(); res.json(users); 

});

// Update user by ID

app.put('/api/users/:id', async (req, res) => {

const { name, email, birthday } = req.body; try { const user = await User.findByIdAndUpdate(req.params.id, { name, email, birthday }, { new: true }); res.json(user); } catch (err) { res.status(500).json({ error: 'Update failed' }); } 

});

// Delete user by ID

app.delete('/api/users/:id', async (req, res) => {

try { await User.findByIdAndDelete(req.params.id); res.json({ message: 'User deleted' }); } catch (err) { res.status(500).json({ error: 'Delete failed' }); } 

});

// Email setup

const transporter = nodemailer.createTransport({

service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS, }, 

});


// cron.schedule('* * * * *', async () => {
//   console.log("Cron running at:", new Date().toLocaleString());
// });

// Cron Job: every day at 12 AM


cron.schedule('30 18 * * *', async () => {
console.log("Cron running at:", new Date().toLocaleString());
const today = new Date(); const users = await User.find(); users.forEach(user => { const birthDate = new Date(user.birthday); if (birthDate.getDate() === today.getDate() && birthDate.getMonth() === today.getMonth()) { const mailOptions = { from: process.env.EMAIL_USER, to: user.email, subject: '🎉 Wishing You the Happiest Birthday!!', text: `Dear ${user.name},\n 

Wishing you a day filled with love, laughter, and everything that makes you smile. 🎂✨

May your birthday be as amazing as you are, and may the year ahead bring you endless joy, success, and beautiful memories. 💫

You’re not just a year older, but a year wiser and more wonderful! 💖

Have a fantastic birthday celebration! 🎈🎁

With warm wishes,

Your Shafic 🎉

`, }; transporter.sendMail(mailOptions, (error, info) => { if (error) console.log("❌ Email error:", error); else console.log("✅ Email sent:", info.response,user.name); }); } }); 

});

app.post('/api/sendWish', async (req, res) => {
  const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  console.log("📬 /api/sendWish endpoint HIT at:", istNow);
   console.log("🚀 API triggered via GitHub Action at:", new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const users = await User.find();

  users.forEach(user => {
    const birthDate = new Date(user.birthday);
    console.log("Checking user:", user.name, "-", birthDate);

    if (
      birthDate.getDate() === istNow.getDate() &&
      birthDate.getMonth() === istNow.getMonth()
    ) {
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
`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log("❌ Email error:", error);
        else console.log("✅ Email sent:", info.response, user.name);
      });
    }
  });

  res.json({ message: "Wishes sent (if any birthdays matched)." });
});


app.listen(3000, () => console.log("🚀 Server running on port: 3000"));

