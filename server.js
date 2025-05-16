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
  origin: '*' // or '*' for all origins (not recommended for production)
}));
app.use(bodyParser.json());


// DB connection
// mongoose.connect("mongodb://localhost:27017/birthdayApp")
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch(err => console.error("❌ MongoDB connection error:", err));
mongoose.connect('mongodb+srv://shafic:1111@cluster0.nkqmbrr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',{
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    family: 4,
})

// Routes
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

// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Cron Job: every day at 9 AM
cron.schedule('* * * * *', async () => {
    const today = new Date();
    const users = await User.find();

    users.forEach(user => {
        const birthDate = new Date(user.birthday);
        if (birthDate.getDate() === today.getDate() && birthDate.getMonth() === today.getMonth()) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Happy Birthday!',
                text: `Happy Birthday ${user.name}! 🎉`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.log("❌ Email error:", error);
                else console.log("✅ Email sent:", info.response);
            });
        }
    });
});

app.listen(3000, () => console.log("🚀 Server running on port: 3000"));
