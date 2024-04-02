require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('Connected to MongoDB');
})

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const adminSchema = new mongoose.Schema({
    username: String,
    password: String,
    loginDates: [
        {
            type: Date,
            default: Date.now
        }
    ],

});

const Admin = mongoose.model('Admin', adminSchema);

app.get('/', (req, res) => {
    res.send('Hello World!');
})
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '365d' });
        const volunteerResponse = await axios.get(`${VOLUNTEEER_URL}/api/admin/login-from-dcc-admin`, {
            headers: {
                'x-access-token': jwt.sign({ id: admin._id }, process.env.VOLUNTEER_SERVER_SECRET, { expiresIn: '365d' })
            }
        })
        res.status(200).json({ token, volunteerToken: volunteerResponse.data.token });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

app.get('/api/admin/get-backend-url', (req, res) => {
    try {
            const {district}= req.params;
            if(!district){
                return res.status(401).json({ message: 'Invalid credentials' });
            }

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})