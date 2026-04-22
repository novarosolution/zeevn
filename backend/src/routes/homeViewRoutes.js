const express = require("express");
const { getPublicHomeViewConfig } = require("../controllers/homeViewController");

const router = express.Router();

router.get("/", getPublicHomeViewConfig);

module.exports = router;
