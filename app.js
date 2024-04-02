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
    email: String,
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
app.get('/api/admin/protected', async (req, res) => {
    try {
        const token = req.headers['x-access-token'];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        res.status(200).json({ message: 'Protected data' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '365d' });
        const volunteerResponse = await axios.get(`${process.env.VOLUNTEEER_URL}/api/admin/login-from-dcc`, {
            headers: {
                'x-access-token': jwt.sign({ id: admin._id }, process.env.VOLUNTEER_SERVER_SECRET, { expiresIn: '365d' })
            }
        })
        res.status(200).json({ token, volunteerToken: volunteerResponse.data});
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
})

app.get('/api/admin/get-backend-url/:district', async (req, res) => {
    try {

        const { district } = req.params;
        if (!district) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = req.headers['x-access-token'];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (district = "Thrissur") {
            const tokenRes = await axios.get('https://dcctcr-backend.plusitpark.com/api/admin/login-from-dcc-admin', {
                headers: {
                    'x-access-token': jwt.sign({ id: admin._id }, process.env.VOLUNTEER_SERVER_SECRET, { expiresIn: '365d' })
                }
            })
            return res.status(200).json({ token: tokenRes.data.token, district: "Thrissur" });
        }

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})