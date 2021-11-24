const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const Level = require('../models/level');
const Class = require('../models/class');

const localErrorHandler = (message, code) => {
	return new HttpError(message, code);
};

const getLevel = async (req, res, next) => {
	const levelId = req.params.lid;
	let level;
	try {
		level = await Level.findById(levelId).populate('classes');
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not find a level.',
				500
			)
		);
	}

	if (!level) {
		return next(
			localErrorHandler(
				'Could not find a level for the provided id.',
				404
			)
		);
	}

	res.json({ level: level.toObject({ getters: true }) });
};

const getLevels = async (req, res, next) => {
	let levels;
	try {
		levels = await Level.find({});
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching levels failed, please try again later.',
				500
			)
		);
	}
	res.json({
		levels: levels.map((level) => level.toObject({ getters: true })),
	});
};

const postLevel = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		console.log(errors);
		return next(
			localErrorHandler(
				'Invalid inputs passed, please check your data.',
				422
			)
		);
	}

	const {
		designation,
		registration_fee,
		tuition_fee,
		tuition_payment_division,
		// classes,
	} = req.body;

	const createLevel = new Level({
		designation,
		registration_fee,
		tuition_fee,
		tuition_payment_division,
		// classes,
	});

	try {
		await createLevel.save();
	} catch (err) {
		return next(
			localErrorHandler('Creating Level failed, please try again.', 500)
		);
	}

	res.status(201).json({ level: createLevel });
};

const patchLevel = async (req, res, next) => {
	const errors = validationResult(req);
	const levelId = req.params.lid;

	if (!errors.isEmpty()) {
		console.log(errors);
		return next(
			localErrorHandler(
				'Invalid inputs passed, please check your data.',
				422
			)
		);
	}

	const {
		designation,
		registration_fee,
		tuition_fee,
		tuition_payment_division,
		// classes,
	} = req.body;

	let level;

	try {
		level = await Level.findById(levelId);
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not update this level.',
				500
			)
		);
	}

	level.designation = designation;
	level.registration_fee = registration_fee;
	level.tuition_fee = tuition_fee;
	level.tuition_payment_division = tuition_payment_division;
	// level.classes = classes;

	try {
		await level.save();
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not update this level.',
				500
			)
		);
	}

	res.status(200).json({ level: level.toObject({ getters: true }) });
};

const deleteLevel = async (req, res, next) => {
	const levelId = req.params.lid;

	let level;
	try {
		level = await Level.findById(levelId);
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not delete this level.',
				500
			)
		);
	}

	if (!level) {
		return next(
			localErrorHandler('Could not find a level for this id.', 404)
		);
	}

	let isCommited = false;
	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		// await Class.updateMany(
		// 	{ _id: { $in: level.classes } },
		// 	{
		// 		$set: {
		// 			level: null,
		// 		},
		// 	},
		// 	{ session: sess }
		// );
		await level.remove({ session: sess });
		await sess.commitTransaction();
		isCommited = true;
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not delete this level.',
				500
			)
		);
	}

	res.status(200).json({
		level: level,
		message: isCommited ? 'Deleted level.' : 'Level not deleted.',
	});
};

exports.getLevel = getLevel;
exports.getLevels = getLevels;
exports.postLevel = postLevel;
exports.patchLevel = patchLevel;
exports.deleteLevel = deleteLevel;
