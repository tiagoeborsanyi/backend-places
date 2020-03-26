const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');


const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (error) {
    const err = new HttpError('Fetching users failed, please try again later.', 500);
    return next(err);
  }

  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    const err = new HttpError('Signing up failed, please try again later.', 500);
    return next(err);
  }

  if (existingUser) {
    const err = new HttpError('USer exists already, please login instead.', 422);
    return next(err);
  }

  const createdUser = new User({
    name,
    email,
    image: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Ficonscout.com%2Ficon%2Favatar-367&psig=AOvVaw1vanAgmPCVEbcKNV2BaSCv&ust=1585334056437000&source=images&cd=vfe&ved=0CAIQjRxqFwoTCLDl6OLjuOgCFQAAAAAdAAAAABAD',
    password,
    places: []
  });

  try {
    await createdUser.save();
  } catch (error) {
    const err = new HttpError('Create User failed.', 500);
    return next(err);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    const err = new HttpError('Logging in failed, please try again later.', 500);
    return next(err);
  }

  if (!existingUser || existingUser.password !== password) {
    const err = new HttpError('Invalid credentials, could not log you in.', 401);
    return next(err);
  }

  res.json({message: 'Logged in!'});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
