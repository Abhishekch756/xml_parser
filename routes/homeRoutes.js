// homeRoutes.js
const express = require("express");
const mainController = require("../controllers/maincontroller");
const router = express.Router();

router.get("/", mainController.home);

module.exports = router;