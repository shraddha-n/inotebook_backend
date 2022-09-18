const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'shraddhaisagood$girl';
const fetchUser = require('../middleware/fetchUser');

//Route 1: create/register user by email id path =/api/auth/createUser
router.post('/createUser', [
  body('name', 'Enter a valid name').isLength({ min: 3 }),
  body('email', 'Enter a valid email').isEmail(),
  body('password').isLength({ min: 5 }),
], async (req, res) => {
  // If error occured ,return bad request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    //check whether user with this email exists
    let user = await User.findOne({ email: req.body.email })
    if (user) {
      return res.status(400).json({ errors: 'User with this email already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);
    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: secPass
    })
    //user data for create jwt token
    const data = {
      user: {
        id: user.id
      }
    }
    //create new jwt token for user
    const authToken = jwt.sign(data, JWT_SECRET);
    res.json({ authToken })
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
})

//Route 2: login user by email id and password path =/api/auth/login
router.post('/login', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Enter a valid password').exists(),
], async (req, res) => {
  // If error occured ,return bad request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ errors: 'Try login with correct credentials' });
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    console.log(comparePassword);
    if (!comparePassword) {
      return res.status(400).json({ errors: 'Try login with correct credentials' });
    }
    //user data for create jwt token
    const data = {
      user: {
        id: user.id
      }
    }
    //create new jwt token for user
    const authToken = jwt.sign(data, JWT_SECRET);
    res.json({ authToken })
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
})

//Route 3: get user by id  path =/api/auth/getuser
router.post('/getuser', fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId).select('-password');
    res.send(user)

  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
})

module.exports = router