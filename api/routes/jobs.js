const express = require("express");
const mongoose = require("mongoose")
const moment = require("moment")

const router = express.Router();
const {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats,
} = require("../controllers/jobs");
const testUserAuth = require("../middleware/testUserAuth");

router.route("/").post(testUserAuth, createJob).get(getAllJobs);
router.route("/stats").get(showStats)

router
  .route("/:id")
  .get(getJob)
  .delete(testUserAuth, deleteJob)
  .patch(testUserAuth, updateJob);

module.exports = router;
