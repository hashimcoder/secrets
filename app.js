//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyPrser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();
console.log(process.env.API_KEY);


app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyPrser.urlencoded({extended:true}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true});

const schema = mongoose.Schema;

const userSchema = new schema({
    email:String,
    password:String
});

userSchema.plugin(encrypt, { secret:process.env.SECRET, encryptedFields: ["password"] });


const User = mongoose.model('User',userSchema );

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login",(req, res) => {
    res.render("login");
});

app.get("/register",(req, res)=>{
    res.render("register");
});


app.post("/register",(req,res)=>{
    
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    });

    newUser.save().then(()=>{
       
    res.render("secrets");
    
}).catch((err)=>{
    console.log(err);
});
});

app.post("/login",(req ,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username})
    .then(function(foundUser){
      if(foundUser){
        if(foundUser.password === password){
            res.render("secrets");
        }
      }
    }).catch(function(err){
        console.log(err);
    });

});




app.listen(3000,()=>{
 console.log("Server is starting on port 3000");
});