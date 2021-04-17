require("dotenv").config();

const express = require("express");
const app = express();
const port = 4000;
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const _ = require("lodash");
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(session({
   secret: process.env.SECRET,
   resave: false,
   saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const mongoose = require("mongoose");
const { request } = require("express");

const mongoAcc = process.env.MONGO_ACC;
const mongoPwd = process.env.MONGO_PWD;
const mongoUrl = `mongodb+srv://${mongoAcc}:${mongoPwd}@cluster0.1eajp.mongodb.net/userDB?retryWrites=true&w=majority`

mongoose.connect(mongoUrl, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   useCreateIndex: true
});

const userSchema = mongoose.Schema({
   userName: String,
   password: String,
   googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
   done(null, user.id);
 });
 
 passport.deserializeUser(function(id, done) {
   User.findById(id, function(err, user) {
     done(err, user);
   });
 });

passport.use(new GoogleStrategy({
   clientID: process.env.GOOGLE_CLIENT_ID,
   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
   callbackURL: "http://localhost:4000/auth/google/secret"
 },
 function(accessToken, refreshToken, profile, cb) {
   User.findOrCreate({ googleId: profile.id }, function (err, user) {
     return cb(err, user);
   });
 }
));

app.get("/", (req, res) => {
   res.render("home");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile"]}));

app.get("/auth/google/secret", 
   passport.authenticate("google", { failureRedirect: "/login" }),
   (req, res) => {
     // Successful authentication, redirect home.
     res.redirect('/secrets');
   });

app.route("/register")
   .get((req, res) => {
      res.render("register");
   })
   .post(async (req, res) => {
      const body = req.body;
      const userName = body.username;
      const password = body.password;
      User.register({username: userName, active: false}, password, (err, user) => {
         if (err) {
            console.log(err);
         };
         passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets");
         });
      });
   });

app.route("/login")
   .get((req, res) => {
      res.render("login");
   })
   .post(async (req, res) => {
      const body = req.body;
      const userName = body.username;
      const password = body.password;
      const user = new User({
         username: userName,
         password: password
      });
      req.login(user, (err) => {
         if (err) {
            console.log(err); 
         } else {
            passport.authenticate("local")(req, res, () => {
               res.redirect("/secrets");
            });
         };
      });
   });

app.route("/secrets")
   .get((req, res) => {
      if (req.isAuthenticated()) {
         res.render("secrets");
      } else {
         res.redirect("/login");
      };
   });

app.route("/logout")
   .get((req, res) => {
      req.logout();
      res.redirect("/");
   });

app.listen(port, () => {
   console.log(`Server running at port ${port}.`);
});