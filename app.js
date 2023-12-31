//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyPrser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();



app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyPrser.urlencoded({extended:true}));

app.use(session({
secret: "This is our first project.",
resave:false,
saveUninitialized:false

}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true});


const schema = mongoose.Schema;

const userSchema = new schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


const User = mongoose.model('User',userSchema );

passport.use(User.createStrategy());



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.gooleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    // console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", (req, res) => {
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));

  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });


app.get("/login",(req, res) => {
    res.render("login");
});

app.get("/register",(req, res)=>{
    res.render("register");
});

app.get("/secrets", function(req, res){


User.find({"secret":{$ne: null}}).then(function(err, foundUsers) {
    if(err){
        console.log(err);
    } else {
        if(foundUsers){
            res.render("secrets", {usersWithSecrets: foundUsers});
        }
    }
});
});

app.get("/submit", function(req, res){

    if(req.isAuthenticated){
        res.render("submit");
    } else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
   
    User.findById(req.body.id).then(function(err,foundUser){
        if(err){
            console.log(err);
        } else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save().then(function(){
                    res.redirect("/secrets");
                });
                  
            }
        }
    });
});

app.get("/logout", (req, res)=>{

req.logout(function(err){
    if(err){
        console.log(err);
    } else {
    
        res.redirect("/");
    }
});


});


app.post("/register",(req,res)=>{

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
   
   });  
   

app.post("/login",(req ,res)=>{
   
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

});




app.listen(3000,()=>{
 console.log("Server is starting on port 3000");
});