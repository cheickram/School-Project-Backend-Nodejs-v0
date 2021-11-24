const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const Teacher = require('../models/teacher');
const Subject = require('../models/subject');

const localErrorHandler = (message, code) => {
	return new HttpError(message, code);
};

const getTeacher = async (req, res, next) => {
	const teacherId = req.params.tid;

	let teacher;

	try {
		teacher = await Teacher.findById(teacherId).populate('subjects');
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not find a teacher.',
				500
			)
		);
	}

	if (!teacher) {
		return next(
			localErrorHandler(
				'Could not find a teacher for the provided id.',
				404
			)
		);
	}

	res.json({ teacher: teacher.toObject({ getters: true }) });
};

const getTeachers = async (req, res, next) => {
	let teachers;
	try {
		teachers = await Teacher.find({});
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching teachers failed, please try again later.',
				500
			)
		);
	}
	res.json({
		teachers: teachers.map((t) => t.toObject({ getters: true })),
	});
};

const postTeacher = async (req, res, next) => {
	const errors = validationResult(req);
	const {
		first_name,
		last_name,
		pin_number,
		email,
		phone,
		dob,
		pob,
		address,
		salary,
		subjects,
	} = req.body;

	let existingTeacher;

	try {
		existingTeacher = await Teacher.findOne({ email: email });
	} catch (err) {
		const error = new HttpError(
			'An error occured, please try again later.',
			500
		);
		return next(error);
	}

	if (existingTeacher) {
		const error = new HttpError(
			'Teacher with this email address exists already, please use the existing one or user another email instead.',
			422
		);
		return next(error);
	}

	if (!errors.isEmpty()) {
		// console.log(errors);
		return next(
			localErrorHandler(
				'Invalid inputs passed, please check your data.',
				422
			)
		);
	}

	let currentdatetime = new Date(dob);
	const converted_dob =
		currentdatetime.getFullYear() +
		'/' +
		(currentdatetime.getMonth() + 1 < 10 ? '0' : '') +
		(currentdatetime.getMonth() + 1) +
		'/' +
		(currentdatetime.getDate() < 10 ? '0' : '') +
		currentdatetime.getDate();

	let sbj_array = [];
	for (let sbj of [...new Set(subjects)]) {
		try {
			let current_sub;
			current_sub = await Subject.findById(sbj);
			if (current_sub) {
				sbj_array.push(current_sub);
			} else {
				return next(
					localErrorHandler(
						'You should assign a valid subject to a teacher.',
						422
					)
				);
			}
		} catch (err) {
			return next(
				localErrorHandler(
					'You should assign a valid subject to a teacher.',
					422
				)
			);
		}
	}
	// console.log('sbj_array', sbj_array);

	if (sbj_array.length === 0) {
		return next(
			localErrorHandler(
				'You should assign at least one subject to a teacher.',
				422
			)
		);
	}

	const createTeacher = new Teacher({
		first_name,
		last_name,
		pin_number,
		email,
		phone,
		dob: converted_dob,
		pob,
		address,
		salary,
		subjects: sbj_array,
	});

	let isCommited = false;
	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		const tch = await createTeacher.save({ session: sess });
		await Subject.updateMany(
			{ _id: { $in: subjects } },
			{
				$push: {
					teachers: tch,
				},
			},
			{ session: sess }
		);
		await sess.commitTransaction();
		isCommited = true;
	} catch (err) {
		return next(
			localErrorHandler('Creating teacher failed, please try again.', 500)
		);
	}

	res.status(201).json({
		teacher: isCommited ? createTeacher : 'Teacher not created!',
	});
};

const patchTeacher = async (req, res, next) => {
	const teacherId = req.params.tid;
	const errors = validationResult(req);
	const {
		first_name,
		last_name,
		pin_number,
		email,
		phone,
		dob,
		pob,
		address,
		salary,
		subjects,
	} = req.body;

	if (!errors.isEmpty()) {
		return next(
			localErrorHandler(
				'Invalid inputs passed, please check your data.',
				422
			)
		);
	}

	let existingTeacher;

	try {
		existingTeacher = await Teacher.findById(teacherId);
	} catch (err) {
		const error = new HttpError(
			'An error occured, please try again later.',
			500
		);
		return next(error);
	}

	if (!existingTeacher) {
		const error = new HttpError(
			'Teacher with this id does not exists, please use an existing user instead.',
			422
		);
		return next(error);
	}

	let currentdatetime = new Date(dob);
	const converted_dob =
		currentdatetime.getFullYear() +
		'/' +
		(currentdatetime.getMonth() + 1 < 10 ? '0' : '') +
		(currentdatetime.getMonth() + 1) +
		'/' +
		(currentdatetime.getDate() < 10 ? '0' : '') +
		currentdatetime.getDate();

	let sbj_array = [];
	for (let sbj of [...new Set(subjects)]) {
		try {
			let current_sub;
			current_sub = await Subject.findById(sbj);
			if (current_sub) {
				sbj_array.push(current_sub);
			} else {
				return next(
					localErrorHandler(
						'You should assign a valid subject to a teacher.',
						422
					)
				);
			}
		} catch (err) {
			return next(
				localErrorHandler(
					'You should assign a valid subject to a teacher.',
					422
				)
			);
		}
	}

	if (sbj_array.length === 0) {
		return next(
			localErrorHandler(
				'You should assign at least one subject to a teacher.',
				422
			)
		);
	}

	let isCommited = false;
	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();

		// const tch = await createTeacher.save({ session: sess });
		await Subject.updateMany(
			{ _id: { $in: existingTeacher.subjects } },
			{
				$pull: {
					teachers: existingTeacher._id,
				},
			},
			{ session: sess }
		);

		await Subject.updateMany(
			{ _id: { $in: subjects } },
			{
				$push: {
					teachers: existingTeacher,
				},
			},
			{ session: sess }
		);

		await Teacher.updateOne(
			{ _id: existingTeacher._id },
			{
				$set: {
					subjects: [],
				},
				$set: {
					subjects: sbj_array,
				},
			},
			{ session: sess }
		);
		await sess.commitTransaction();
		isCommited = true;
	} catch (err) {
		return next(
			localErrorHandler('Updating teacher failed, please try again.', 500)
		);
	}

	res.status(201).json({
		teacher: isCommited
			? existingTeacher
			: 'Teacher not updated Successfully!',
	});
};

// const patchTeacher = async (req, res, next) => {
// 	const stdId = req.params.tid;
// 	const errors = validationResult(req);
// }

exports.getTeacher = getTeacher;
exports.getTeachers = getTeachers;
exports.postTeacher = postTeacher;
exports.patchTeacher = patchTeacher;
