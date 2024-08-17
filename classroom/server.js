const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const { name } = require("ejs");
const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// app.use(cookieParser("secretcode"));
const sessionOption = {
  secret: "mysecretstring",
  resave: false,
  saveUninitialized: true,
};

app.use(session(sessionOption));
app.use(flash());

app.use((req, res, next) => {
  res.locals.messages = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  next();
});

app.get("/register", (req, res) => {
  let { name = "anonymous" } = req.query;
  req.session.name = name;
  if (name == "anonymous") {
    req.flash("error", "some error occured");
  } else {
    req.flash("success", "user saved!");
  }
  res.redirect("/hello");
});

app.get("/hello", (req, res) => {
  res.render("page.ejs", { name: req.session.name });
});
app.listen(3000, () => {
  console.log("listening on 3000");
});
