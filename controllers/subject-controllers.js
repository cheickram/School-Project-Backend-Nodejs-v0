const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const Subject = require('../models/subject');
const Teacher = require('../models/teacher');

const localErrorHandler = (message, code) => {
	return new HttpError(message, code);
};

const getSubject = async (req, res, next) => {
	const subId = req.params.sid;
	let subject;
	try {
		subject = await Subject.findById(subId).populate('teachers');
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not find a subject.',
				500
			)
		);
	}

	if (!subject) {
		return next(
			localErrorHandler(
				'Could not find a subject for the provided id.',
				404
			)
		);
	}

	res.json({ subject: subject.toObject({ getters: true }) });
};

const getSubjects = async (req, res, next) => {
	let subjects;
	try {
		subjects = await Subject.find({});
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching subjects failed, please try again later.',
				500
			)
		);
	}

	if (!subjects) {
		return next(localErrorHandler('Could not find any subjects.', 404));
	}

	res.json({
		subjects: subjects.map((sub) => sub.toObject({ getters: true })),
	});
};

const postSubject = async (req, res, next) => {
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

	const { designation, code, coef } = req.body;

	const createSubject = new Subject({
		designation,
		coef,
		code,
	});

	try {
		await createSubject.save();
	} catch (err) {
		return next(
			localErrorHandler('Creating Subject failed, please try again.', 500)
		);
	}
	res.status(201).json({ createSubject });
};

const patchLevel = async (req, res, next) => {
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

	const { designation, code, coef } = req.body;

	const subId = req.params.sid;
	let fetchedSubject;
	try {
		fetchedSubject = await Subject.findById(subId);
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not find a subject.',
				500
			)
		);
	}

	if (!fetchedSubject) {
		return next(
			localErrorHandler(
				'Could not find a subject for the provided id.',
				404
			)
		);
	}

	let isCommited = false;
	try {
		fetchedSubject.designation = designation;
		fetchedSubject.code = code;
		fetchedSubject.coef = coef;
		await fetchedSubject.save();
		isCommited = true;
	} catch (err) {
		return next(
			localErrorHandler('Updating subject failed, please try again.', 500)
		);
	}
	res.status(201).json({
		updatedSubject: isCommited
			? fetchedSubject
			: 'Could not update the subject',
	});
};

const patchPullTeacher = async (req, res, next) => {
	const subId = req.params.sid;
	const teacherId = req.params.tid;

	let fetchedSubject;
	try {
		fetchedSubject = await Subject.findById(subId);
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not find a subject.',
				500
			)
		);
	}

	if (!fetchedSubject) {
		return next(
			localErrorHandler(
				'Could not find a subject for the provided id.',
				404
			)
		);
	}

	let doesTeacherExist = true;
	let fetchedTeacher;
	try {
		fetchedTeacher = await Teacher.findById(teacherId);
	} catch (err) {
		doesTeacherExist = false;
	}

	if (!fetchedTeacher) {
		doesTeacherExist = false;
	}

	let isCommited = false;
	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();

		await Subject.updateOne(
			{ _id: fetchedSubject._id },
			{
				$pull: {
					teachers: teacherId,
				},
			},
			{ session: sess }
		);

		if (doesTeacherExist) {
			await Teacher.updateOne(
				{ _id: fetchedTeacher._id },
				{
					$pull: {
						subjects: fetchedSubject._id,
					},
				},
				{ session: sess }
			);
		}
		await sess.commitTransaction();
		isCommited = true;
	} catch (err) {
		return next(
			localErrorHandler('Removing teacher failed, please try again.', 500)
		);
	}
	res.status(201).json({
		updatedSubject: isCommited
			? fetchedSubject
			: 'Could not update the subject and remove teacher.',
	});
};

const deleteSubject = async (req, res, next) => {
	const subId = req.params.sid;

	let subject;
	try {
		subject = await Subject.findById(subId);
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not delete this subject.',
				500
			)
		);
	}

	if (!subject) {
		return next(
			localErrorHandler('Could not find a subject for this id.', 404)
		);
	}

	let isCommited = false;
	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await Teacher.updateMany(
			{
				_id: {
					$in: subject.teachers,
				},
			},
			{
				$pull: {
					subjects: subject._id,
				},
			},
			{ session: sess }
		);
		await subject.remove({ session: sess });
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
		deletedSubject: subject,
		message: isCommited ? 'Deleted subject.' : 'Subject not deleted.',
	});
};

exports.getSubject = getSubject;
exports.getSubjects = getSubjects;
exports.postSubject = postSubject;
exports.patchLevel = patchLevel;
exports.patchPullTeacher = patchPullTeacher;
exports.deleteSubject = deleteSubject;
