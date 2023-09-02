const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

let Exercise = require("./helper").Exercise;
let User = require("./helper").User;
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});


/** ****users endpoint */
// GET /api/users - Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, { username: 1, _id: 1 }); // Retrieve all users from the database
    res.json(users); // Return the users as a JSON response
  } catch (err) {
    console.error('Error retrieving users:', err);
    res.status(500).json({ error: 'Error retrieving users' });
  }
});

app.post('/api/users', async (req, res) => {
  const { username } = req.body;

  try {
    // Check if the user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      // If the user exists, return the user's information in JSON form
      return res.json({ username: existingUser.username, _id: existingUser._id });
    }

    // If the user doesn't exist, create a new user and save it to the database
    const newUser = new User({ username });
    await newUser.save()

    // Return the newly created user's information
    res.json({ username: newUser.username, _id: newUser._id });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ error: 'Error saving user' });
  }
});

/** **************************************** */
// POST /api/users/:_id/exercises - Create a new exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If date is not provided, use the current date
    const exerciseDate = date ? new Date(date) : new Date();

    // Ensure exerciseDate is a Date object
    if (!(exerciseDate instanceof Date) || isNaN(exerciseDate)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Create a new exercise
    const exercise = new Exercise({ userId, description, duration, date: exerciseDate });
    await exercise.save();
    
    // Add the exercise to the user's log
    user.log.push(exercise);
    await user.save();
    // Return the user object with the exercise fields added
    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id,
    });
  } catch (err) {
    console.error('Error saving exercise:', err);
    res.status(500).json({ error: 'Error saving exercise' });
  }
});
/** ******************* */
app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Retrieve the user's exercise log
    let log = user.log.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    }));

    // Filter log entries based on 'from' and 'to' dates if provided
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      log = log.filter((exercise) => {
        const exerciseDate = new Date(exercise.date);
        return exerciseDate >= fromDate && exerciseDate <= toDate;
      });
    }

    // Apply 'limit' to the log entries
    if (limit) {
      const limitValue = parseInt(limit);
      log = log.slice(0, limitValue);
    }

    // Return the user object with the filtered exercise log and count
    res.json({
      username: user.username,
      _id: user._id,
      log,
      count: log.length, // Count based on the filtered log
    });
  } catch (err) {
    console.error("Error retrieving exercise log:", err);
    res.status(500).json({ error: "Error retrieving exercise log" });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
