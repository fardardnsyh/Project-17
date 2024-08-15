const Job = require("../models/Job");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const { default: mongoose } = require("mongoose");
const moment = require("moment");

const getAllJobs = async (req, res) => {
  // lookin for the jobs related to user logged in!
  const queryObject = {
    createdBy: req.user.userId,
  };

  // req.query to access query paramters from request
  const { search, status, jobType, sort } = req.query;

  if (search) {
    queryObject.position = { $regex: search, $options: "i" };
  }

  if (status && status !== "all") {
    queryObject.status = status;
  }

  if (jobType && jobType !== "all") {
    queryObject.jobType = jobType;
  }

  let results = Job.find(queryObject);

  if (sort && sort === "latest") {
    results = results.sort("-createdAt");
  } else if (sort === "oldest") {
    results = results.sort("createdAt");
  } else if (sort === "a-z") {
    results = results.sort("position");
  } else {
    results = results.sort("-position");
  }

  // pagination logic
  const pages = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (pages - 1) * limit;

  results = results.skip(skip).limit(limit);

  const jobs = await results;

  // helpful to setup pagination setup on frontend
  const totalJobs = await Job.countDocuments(queryObject);
  //Math.ceil to get the maximum integer value
  const numOfPages = Math.ceil(totalJobs / limit);

  res.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages });
};
const getJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId,
  });
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).json({ job });
};

const createJob = async (req, res) => {
  req.body.createdBy = req.user.userId;
  const job = await Job.create(req.body);
  res.status(StatusCodes.CREATED).json({ job });
};

const updateJob = async (req, res) => {
  const {
    body: { company, position },
    user: { userId },
    params: { id: jobId },
  } = req;

  if (company === "" || position === "") {
    throw new BadRequestError("Company or Position fields cannot be empty");
  }
  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).json({ job });
};

const deleteJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findByIdAndRemove({
    _id: jobId,
    createdBy: userId,
  });
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).send();
};

const showStats = async (req, res) => {
  let stats = await Job.aggregate([
    {
      $match: { createdBy: new mongoose.Types.ObjectId(req.user.userId) },
    },
    {
      $group: { _id: "$status", count: { $sum: 1 } },
    },
  ]);

  // console.log(stats)

  // reducing over it to return one object with key being status and values being count
  // {
  //   declined:number,
  //   interview:number,
  //   pending:number
  // }
  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    return acc;
  }, {});

  // checks for cases where declined interview and pending are null, means no jobs for current user
  const defaultStats = {
    declined: stats.declined || 0,
    interview: stats.interview || 0,
    pending: stats.pending || 0,
  };

  // console.log(defaultStats)

  let monthlyApplications = await Job.aggregate([
    {
      $match: { createdBy: new mongoose.Types.ObjectId(req.user.userId) },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": -1, id_month: -1 },
    },
    {
      $limit: 6,
    },
  ]);

  // console.log(monthlyApplications);

  monthlyApplications = monthlyApplications.map((item) => {
    const {
      _id: { year, month },
      count,
    } = item;
    const date = moment().month(month-1).year(year).format("MMM Y");
    return { count, date };
  });

  // console.log(monthlyApplications);


  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications });
};

module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats,
};
