// authRoutes.js
const express = require("express");
const mainController = require("../controllers/maincontroller");
const passport = require("passport");

const router = express.Router();

router.get("/login", mainController.login);
router.get("/github", passport.authenticate("github"));
router.get("/github/callback", passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/");
  });

module.exports = router;