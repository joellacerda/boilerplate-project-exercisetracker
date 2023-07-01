const express = require("express");
const connectDB = require("./src/database");
const { User, Exercise } = require("./src/models");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

connectDB();
const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  try {
    // Retrieve all users from the User model
    const users = await User.find({}, { username: 1, _id: 1 });

    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
});

app.post("/api/users", async (req, res) => {
  const { username } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Create a new user using the User model
    const user = await User.create({ username });

    res.json({
      username: user.username,
      _id: user._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  try {
    // Create a new exercise using the Exercise model
    const exercise = await Exercise.create({
      userId: _id,
      description,
      duration,
      date: date ? new Date(date) : undefined,
    });

    // Find the user by _id using the User model
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.save(); // Save the updated user object

    // Return the user object with the exercise added
    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    // Find the user by _id using the User model
    const user = await User.findById(_id);

    // Find the exercise logs for the user using the Exercise model
    let query = Exercise.find({ userId: _id });

    // Apply optional query parameters if provided
    if (from) query = query.where("date").gte(new Date(from));
    if (to) query = query.where("date").lte(new Date(to));
    if (limit) query = query.limit(parseInt(limit));

    const logs = await query.exec();

    const response = {
      username: user.username,
      count: logs.length,
      _id: user._id,
      log: logs.map((log) => ({
        description: log.description,
        duration: log.duration,
        date: log.date.toDateString(),
      })),
    };

    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
