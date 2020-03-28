const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');


const getPlaceById = async (req, res, next) => {
	const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    const err = new HttpError('Something whent weong, could not find a place.', 500);
    return next(err);
  }

	if (!place) {
    const err = HttpError('Could not find a place for the provided id.', 404);
    return next(err);
	}
	res.json({ place: place.toObject( {getters: true} ) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (error) {
    const err = new HttpError('Fetching places failed, please try again later', 500);
    return next(err);
  }

	if (!userWithPlaces || userWithPlaces.length === 0) {
		return next(new HttpError('Could not find places for the provided user id.', 404));
  }

	res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordForAddress();
  } catch (error) {
    next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    const err = new HttpError('Creating place failed, please try again.', 500);
    return next(err);
  }

  if (!user) {
    const err = new HttpError('Could not find user for provider id', 404);
    return next(err);
  }

  console.log(user);

  try {

    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();

  } catch (error) {
    const err = new HttpError('Creating place failed, please try again.', 500);
    return next(err);
  }

  res.status(201).json({place: createdPlace});
}

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    const err = new HttpError('Something went, could not update place', 500);
    return next(err);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (error) {
    const err = new HttpError('Something went, could not update place', 500);
    return next(err);
  }

  res.status(200).json({place: place.toObject({ getters: true })});
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (error) {
    const err = new HttpError('Something went wrong, could not delete place.', 500);
    return next(err);
  }

  if (!place) {
    const err = new HttpError('COuld not find place for this id', 404);
    return next(err);
  }

	const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({session: sess});
    place.creator.places.pull(place);
    await place.creator.save({session: sess});
    await sess.commitTransaction();
  } catch (error) {
    const err = new HttpError('Something went wrong, could not delete place.', 500);
    return next(err);
  }

	fs.unlink(imagePath, err => {
		console.log(err);
	});

  res.status(200).json({message: 'Deleted place.'});
};


exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
