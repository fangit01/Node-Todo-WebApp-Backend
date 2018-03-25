const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const jwt = require('jsonwebtoken');
const path = require('path');
const bodyParser = require("body-parser");


const User = require('./models/user.js');


app.use(morgan("tiny"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/todos/users/:username', checkToken, (req, res) => {
  User.findOne({ username: req.params.username }, (err, foundUser) => {
    res.send([foundUser.tasks, foundUser.completedTask]);
  })
})


app.post('/todos/users/:username/tasks/new', checkToken, (req, res) => {
  User.findOne({ username: req.params.username }, (err, foundUser) => {
    foundUser.tasks.push({ name: req.body.taskname });
    foundUser.save();
    res.send(foundUser.tasks[foundUser.tasks.length - 1]);
  })
})

app.post('/todos/users/:username/tasks/:id/movetocompleted', checkToken, (req, res) => {
  User.findOne({ username: req.params.username }, (err, foundUser) => {
    if (err) { console.log(err) } else {
      var item = foundUser.tasks.find(obj => obj._id == req.params.id);
      foundUser.tasks = foundUser.tasks.filter(item => { return item._id != req.params.id }); // cannot use !== because tyoeof item._id is an object
      foundUser.completedTask.push(item);
      foundUser.save(); // must use foundUser to save
      res.send(foundUser.completedTask[foundUser.completedTask.length - 1]);
    }
  })
})

app.post('/todos/users/:username/tasks/:id/movebacktotodo', checkToken, (req, res) => {
  User.findOne({ username: req.params.username }, (err, foundUser) => {
    if (err) { console.log(err) } else {
      var item = foundUser.completedTask.find(obj => obj._id == req.params.id);
      foundUser.completedTask = foundUser.completedTask.filter(item => { return item._id != req.params.id }); // cannot use !== because tyoeof item._id is an object
      foundUser.tasks.push(item);
      foundUser.save(); // must use foundUser to save
      res.send(foundUser.tasks[foundUser.tasks.length - 1]);
    }
  })
})




app.delete('/todos/users/:username/tasks/:id', checkToken, (req, res) => {
  User.findOne({ username: req.params.username }, (err, foundUser) => {
    if (err) { console.log(err) } else {
      foundUser.tasks = foundUser.tasks.filter(item => { return item._id != req.params.id }); // cannot use !== because tyoeof item._id is an object
      foundUser.save(); // must use foundUser to save
      res.send(`deleted item with id: ${req.params.id}`);
    }
  })
})

app.delete('/todos/users/:username/tasks/completed/:id', checkToken, (req, res) => {
  User.findOne({ username: req.params.username }, (err, foundUser) => {
    if (err) { console.log(err) } else {
      foundUser.completedTask = foundUser.completedTask.filter(item => { return item._id != req.params.id }); // cannot use !== because tyoeof item._id is an object
      foundUser.save(); // must use foundUser to save
      res.send(`deleted completedTask item with id: ${req.params.id}`);
    }
  })
})


app.post('/signup', (req, res) => {
  // for personal testing only, so no password hashing/encryption implemented here. 
  User.create({ "username": req.body.username, "password": req.body.password }, (err, data) => {
    if (err) { res.send('there is an error creating your account') } else {
      res.send('acct created')
    };
  })
})


app.post('/login', function (req, res) {
  console.log(req.body.username);
  console.log(req.body.password);
  // find the user
  User.findOne({ username: req.body.username }, (err, foundUser) => {
    // console.log(foundUser);  
    if (err) throw err;
    if (foundUser === null) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (foundUser) {

      // check if password matches
      if (foundUser.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {
        // if user is found and password is right
        // create a token with only our given payload
        // we don't want to pass in the entire user since that has the password
        const payload = {
          username: foundUser.username
        };
        var token = jwt.sign(payload, 'this-is-my-jwt-secret-hello-world', {
          expiresIn: 3600 // expires in 1 hours
        });
        // return the information including token as JSON
        res.json({
          username: foundUser.username,
          id: foundUser._id,
          token: token,
          tokenExpiresIn: 3600,
          success: true, message: 'Welcome back!'
        });
      }

    }
  });
});



// route middleware to verify a token
function checkToken(req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.body.headers['x-access-token'];// use headers, others might not work.
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, 'this-is-my-jwt-secret-hello-world', function (err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'Please Login First. No token provided.'
    });

  }
};



app.listen(5000, function () {
  console.log("Server starting on port 5000");
});
