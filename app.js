require('dotenv').config()
const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static("public"));
const mongoose = require("mongoose");
const md5 = require("md5");


mongoose.connect("mongodb+srv://sandeepthadiparthi:Sandeep%401@cluster0.gjiu1s8.mongodb.net/userDB");
const userSchema = new mongoose.Schema({
    username:String,
    password:String
});



const User = new mongoose.model("User",userSchema);


app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    const newUser = new User ({
        username:req.body.username,
        password:md5(req.body.password)
    });
    newUser.save().then(() => {
        res.render("secrets");
    })
    .catch((err) => {
        console.log(err);
    });
});

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);
    User.findOne({username:username}).then( (founduser) => {
        if (!founduser){
            console.log("no user found");
        }
        if (founduser) {
            if (founduser.password === password) {
                res.render("secrets");
            }
            else {
                console.error("Wrong Password");
            }
        }
    })
    .catch((err)=> {
        res.send(err);
    })

});





app.listen(3000,function(req,res){
    console.log("Server is up at 3000..!");
})