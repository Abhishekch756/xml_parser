// authController.js
const passport = require("passport");

exports.login = (req, res) => {
  res.send('Login with GitHub: <a href="/auth/github">Login</a>');
};

exports.githubCallback = passport.authenticate("github", { failureRedirect: "/" }),
(req, res) => {
  res.redirect("/");
};
