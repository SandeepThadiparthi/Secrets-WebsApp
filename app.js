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

app.use(session({
    secret:"This is my Secret",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://sandeepthadiparthi:Sandeep%401@cluster0.gjiu1s8.mongodb.net/userDB");
const userSchema = new mongoose.Schema({
    username:String,
    password:String
});


userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


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
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
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
    const user = new User ({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user, function(err) {
        if (err) { return next(err); }
        return res.redirect("/secrets");
      });

});






app.listen(3000,function(req,res){
    console.log("Server is up at 3000..!");
})