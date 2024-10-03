const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const crypto = require('crypto');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const sendResetEmail = require('./sendmail');

const app = express().use(express.json());
app.use(express.static('public'));

const sequelize = new Sequelize("mydb", "mamad", "mamad123", { host: 'localhost', dialect: 'mysql' });
const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    resetToken: { type: DataTypes.STRING },
    resetTokenExpiration: { type: DataTypes.DATE, allowNull: true }
});

sequelize.sync({ force: true }).then(async () => {
    const adminUser = await User.findOne({ where: { email: 'admin@reddit.com' } });

    if (!adminUser) {
        const hashedPassword = await bcrypt.hash("Admin_Password_Very_Secure", 10);
        await User.create({ username:'Maverick' ,email: 'admin@reddit.com', password: hashedPassword });
    }
})

app.post('/forgot-password', async (req, res) => {
    const { error } = Joi.object({ email: Joi.string().required().min(1) }).validate(req.body, { presence: 'required' });
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
        const user = await User.findOne({ where: { email: req.body.email } });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const [resetToken, resetTokenExpiration] = [crypto.randomBytes(20).toString('hex'), Date.now() + 180000];
        [user.resetToken, user.resetTokenExpiration] = [resetToken, resetTokenExpiration];
        await user.save();

        sendResetEmail(req.body.email, resetToken); // Basic email sending function
        
        res.json({ message: `Reset email sent to ${req.body.email}`});
        // res.json({ message: `
        // You entered this email -> ${req.body.email}<br>
        // This user found -> Email : ${user.email} - Username : ${user.username}<br>
        // Reset password token sent to -> ${req.body.email}<br>
        // `});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));