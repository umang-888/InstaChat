const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const User = require('./models/User');

dotenv.config();
// mongoose.connect(process.env.MONGO_URL, (err)=>{
//     if (err) throw err;
// }); 
mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log('Connected to the database');
}).catch((error) => {
    console.error('Error connecting to the database: ', error);
});
// console.log(process.env.MONGO_URL);
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));


app.get('/test', (req,res)=>{
    res.json('test ok');
});

app.get('/profile', (req,res)=>{
    const token = req.cookies?.token;
    if (token){
        jwt.verify(token,jwtSecret,{},(err,userData)=>{
            if (err) throw err;
            res.json(userData);
        });
    }else{
        res.status(422).json('no token');
    }
    
});

app.post('/login', async (req,res) =>{
    const {username,password} =req.body;
    const foundUser = await User.findOne({username});
    if (foundUser){
        const passOk = bcrypt.compareSync(password,foundUser.password);
        if (passOk){
            jwt.sign({userId:foundUser._id,username}, jwtSecret, {}, (err,token) => {
                if (err) throw err;
                res.cookie('token',token,{sameSite:'none',secure: true}).json({
                    id: foundUser._id,
                    
                });
            });
        }
    }
});
//creating the user
app.post('/register', async (req,res)=>{
    const {username,password} = req.body;
    try{
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt); 
        const createdUser = await User.create({
            username:username,
            password:hashedPassword,
        });
        jwt.sign({userId:createdUser._id,username}, jwtSecret, {}, (err,token) => {
            if (err) throw err;
            res.cookie('token',token, {sameSite:'none',secure: true}).status(201).json({
                id: createdUser._id,
                
            });
        });
    } catch(err){
        if (err) throw err;
        res.status(500).json('error');
    }
    
     
});
app.listen(4000);

//ChengrueChat