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
//view engine ejs as views folder
app.set('view engine', 'ejs');
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
        const volunteerResponse = await axios.get(`https://volunteer-backend.dmckpcc.in/api/admin/login-from-dcc`, {
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
        if (district === "Thrissur") { // corrected comparison
            const tokenRes = await axios.get('https://dcctcr-backend.plusitpark.com/api/admin/login-from-dcc', {
                headers: {
                    'x-access-token': jwt.sign({ id: admin._id }, process.env.VOLUNTEER_SERVER_SECRET, { expiresIn: '365d' })
                }
            })
            return res.status(200).json({ token: tokenRes.data, district: "Thrissur" ,url:`https://dcctcr-backend.plusitpark.com`});
        }else if (district === "Ernakulam") { // corrected comparison
            const tokenRes = await axios.get('https://dccekm-backend.plusitpark.com/api/admin/login-from-dcc', {
                headers: {
                    'x-access-token': jwt.sign({ id: admin._id }, process.env.VOLUNTEER_SERVER_SECRET, { expiresIn: '365d' })
                }
            })
            return res.status(200).json({ token: tokenRes.data, district: "Ernakulam" ,url:`https://dccekm-backend.plusitpark.com`});
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
})

app.get('/api/admin/history', (req, res) => {
    let para = `The Indian National Congress (INC Congress) is one of the two major political parties in India. It is one of the oldest and largest democratic political parties in the world [1] [2]. It was formed in 1885 during the British rule under the leadership of Alan Octavian Hume, Dadabhai Naoroji and Dinshaw Edulji Vacha by representatives from around fifty different countries. Central to the Indian freedom struggle in the late 19th and mid-20th centuries, the Congress led the struggle against the then British colonial rule in India with 1.5 crore active members and 7 crore fighters.\n\n After Independence in 1947, Congress became the undisputed political force in India. Out of the 15 Lok Sabha elections held since independence, the Congress came to power six times with a clear majority and four times came to power with a front system. From Jawaharlal Nehru to Manmohan Singh, seven Congress Prime Ministers have ruled the country`
        res.status(200).json({ history: "sanjay" });
});
app.get('/api/video-page', async (req, res) => {
    try {
            const {url}=req.query;
         
         const response = await axios.get(`${url}/api/admin/videogallery`)
        let data = response.data
        res.render('videos', { data })
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})
app.get('/api/sound-page', async (req, res) => {
    try {
        const {url}=req.query; 
         const response = await axios.get(`${url}/api/admin/sound-cloud`)
        let data = response.data
        res.render('sound', { data })
    } catch (error) {
                res.status(500).json({ message: 'Internal server error' });
    }
})
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})