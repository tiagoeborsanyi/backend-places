const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.aplit(' ')[1];
    if (!token) {
      throw new HttpError('Authentication failed.', 401);
    }
    const decodedToken = jwt.verify(token, 'supersecret');
    req.userData = {userId: decodedToken.userId};
    next();
  } catch (error) {
    const err = new HttpError('Authentication failed.', 401);
    return next(err);
  }
}
