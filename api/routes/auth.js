const express = require("express");
const rateLimiter = require("express-rate-limit");

const router = express.Router();
const { register, login, updateUser } = require("../controllers/auth");
const auth = require("../middleware/authentication");
const testUserAuth = require("../middleware/testUserAuth");

const apiLimiter = rateLimiter({
  windowMs: 2 * 60 * 1000,
  max: 5,
  message: {
    msg: "Too many accounts created from this IP, please try again after an hour",
  },
});

router.post("/register", apiLimiter, register);
router.post("/login", apiLimiter, login);
router.patch("/updateuser", auth, testUserAuth, updateUser);
module.exports = router;
