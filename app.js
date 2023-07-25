require('dotenv').config()
const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static("public"));
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate')

app.use(session({
    secret:"This is my Secret",
    resave:false,
    saveUninitialized:true
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(process.env.mongodb);
const userSchema = new mongoose.Schema({
    username:String,
    password:String,
    googleId:String,
    secret:String
});

userSchema.plugin(findOrCreate);
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
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
  

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://pear-sore-dog.cyclic.app/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    User.find({"secret":{$ne: null}}).then((foundUsers)=>{
        if (foundUsers){
        res.render("secrets",{secretspage:foundUsers});
        }
    })
    .catch((err)=>{
        console.log(err);
    })
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
})

app.post("/submit",function(req,res){
    const submitedSecret = req.body.secret;
    User.findById(req.user.id).then((foundList)=> {
        if(foundList){
        foundList.secret = submitedSecret;
        foundList.save().then(()=>{
            res.redirect("/secrets");
        })
        
        }
    })
    .catch((err) => {
        console.log(err);
    })

    
})

app.get('/logout', function(req, res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});


app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    // Authenticate the user using passport's local strategy
    passport.authenticate("local", function (err, user, info) {
        if (err) {
            console.log(err);
        }

        // If login fails, display an alert and redirect back to the login page
        if (!user) {
            return res.render("login", {
                message: "Incorrect username or password."
            });
        }

        // If login succeeds, log the user in and redirect to the secrets page
        req.login(user, function (err) {
            if (err) {
                console.log(err);
            }
            return res.redirect("/secrets");
        });
    })(req, res);

});






app.listen(process.env.PORT|| 3000,function(req,res){
    console.log("Server is up at 3000..!");
});