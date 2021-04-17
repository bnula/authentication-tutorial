require("dotenv").config();

const express = require("express");
const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
const port = 4000;

const _ = require("lodash");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const mongoose = require("mongoose");

const mongoAcc = process.env.MONGO_ACC;
const mongoPwd = process.env.MONGO_PWD;
const mongoUrl = `mongodb+srv://${mongoAcc}:${mongoPwd}@cluster0.1eajp.mongodb.net/userDB?retryWrites=true&w=majority`

mongoose.connect(mongoUrl, {
   useNewUrlParser: true,
   useUnifiedTopology: true
});

const userSchema = mongoose.Schema({
   userName: String,
   password: String
});

const secret = process.env.SECRET;

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
   res.render("home");
});

app.route("/register")
   .get((req, res) => {
      res.render("register");
   })
   .post(async (req, res) => {
      const body = req.body;
      const userName = (body.username).toUpperCase();
      bcrypt.hash(body.password, saltRounds, async (err, hash) => {
         if (err) {
            console.log(err);
         } else {
            const newUser = new User ({
               userName: userName,
               password: hash
            });
            await newUser.save((err) => {
               if(err) {
                  console.log(err)
               };
            });
         };
      });
      res.render("secrets");
   });

app.route("/login")
   .get((req, res) => {
      res.render("login");
   })
   .post(async (req, res) => {
      const body = req.body;
      const userName = (body.username).toUpperCase();
      const password = body.password;
      await User.findOne({userName: userName}, (err, user) => {
         if (err) {
            console.log(err);
         } else {
            if (user) {
               bcrypt.compare(password, user.password, (err, result) => {
                  if (err) {
                     console.log(err);
                  } else {
                     if (result) {
                        res.render("secrets");
                     } else {
                        res.redirect("login");
                     };
                  };
               });
            }
            else {
               res.redirect("login");
            };
         };
      });
   });

app.listen(port, () => {
   console.log(`Server running at port ${port}.`);
});