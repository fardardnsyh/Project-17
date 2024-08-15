require("dotenv").config();
const Job = require("./models/Job");
const jobsData = require("./mock-data.json");
const mongoose = require("mongoose")

const populateJobs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    await Job.create(jobsData);
    console.log("successs added jobs into database");
  } catch (err) {
    console.log(err);
  }
};

populateJobs();
