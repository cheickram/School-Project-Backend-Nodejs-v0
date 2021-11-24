const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const Class = require('../models/class');
const Level = require('../models/level');
const Student = require('../models/student');
const Subject = require('../models/subject');
const Teacher = require('../models/teacher');

const localErrorHandler = (message, code) => {
	return new HttpError(message, code);
};

// =================================================================================
const getClass = async (req, res, next) => {
	const classId = req.params.cid;

	let classe;
	try {
		classe = await (
			await Class.findById(classId)
		).populate([
			'level',
			{
				path: 'subjects',
				populate: {
					path: 'teachers',
				},
			},
			// {
			// 	path: 'academicYearObject',
			// 	populate: {
			// 		path: 'students',
			// 	},
			// },
			{
				path: 'academicYearObject',
				populate: {
					path: 'teachers',
					populate: {
						path: 'teacher',
					},
				},
			},
		]);
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not find a class.',
				500
			)
		);
	}

	if (!classe) {
		return next(
			localErrorHandler(
				'Could not find a class for the provided id.',
				404
			)
		);
	}

	res.json({ class: classe.toObject({ getters: true }) });
};

// =================================================================================
const getClasses = async (req, res, next) => {
	let classes;
	try {
		classes = await Class.find({}).populate('level');
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching classes failed, please try again later.',
				500
			)
		);
	}

	if (!classes) {
		return next(localErrorHandler('Could not find any class.', 404));
	}

	res.json({
		classes: classes.map((cls) => cls.toObject({ getters: true })),
	});
};

// =================================================================================
const postClass = async (req, res, next) => {
	const errors = validationResult(req);
	const { designation, level } = req.body;

	if (!errors.isEmpty()) {
		console.log(errors);
		return next(
			localErrorHandler(
				'Invalid inputs passed, please check your data.',
				422
			)
		);
	}

	let fetchedLevel;
	try {
		fetchedLevel = await Level.findById(level);
	} catch (err) {
		return next(
			localErrorHandler(
				'Could not find a level for the provided level id.',
				404
			)
		);
	}

	if (!fetchedLevel) {
		return next(
			new HttpError(
				'Could not find level for the provided level id.',
				404
			)
		); // next is used for async or sync code
	}

	let classes;
	try {
		classes = await Class.find({});
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching classes failed, please try again later.',
				500
			)
		);
	}

	if (!classes) {
		return next(localErrorHandler('Could not find any class.', 404));
	}

	let createClass;
	if (classes.academicYearObject === 0) {
		createClass = new Class({
			designation,
			level: fetchedLevel,
		});
	} else {
		createClass = new Class({
			designation,
			level: fetchedLevel,
			academicYearObject: {
				year: classes[classes.length - 1].academicYearObject[
					classes[classes.length - 1].academicYearObject.length - 1
				].year,
			},
		});
	}

	let isCommited = false;
	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		const cls = await createClass.save({ session: sess });
		fetchedLevel.classes.push(cls._id);
		await fetchedLevel.save({ session: sess });

		await sess.commitTransaction();
		isCommited = true;
	} catch (err) {
		return next(
			localErrorHandler('Creating Class failed, please try again.', 500)
		);
	}

	res.status(201).json({
		class: isCommited ? createClass : 'class not created!',
	});
};

// =================================================================================
const patchAddSubject = async (req, res, next) => {
	const classId = req.params.cid;
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

	let classe;
	try {
		classe = await Class.findById(classId);
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not find a class.',
				500
			)
		);
	}

	if (!classe) {
		return next(
			localErrorHandler(
				'Could not find a class for the provided id.',
				404
			)
		);
	}

	const { subjects } = req.body;

	for (let s of subjects) {
		let sub;
		try {
			sub = await Subject.findById(s);
		} catch (err) {
			return next(
				localErrorHandler(
					'Something went wrong, could not find the subject.',
					500
				)
			);
		}

		if (!sub) {
			return next(
				localErrorHandler(
					'Could not find a subject for the provided id.',
					404
				)
			);
		}
	}

	let isCommited = false;
	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await Class.updateOne(
			{ _id: classId },
			{
				$set: { subjects: subjects },
			},
			{ session: sess }
		);

		await sess.commitTransaction();
		isCommited = true;
	} catch (err) {
		sess.abortTransaction();
		return next(
			localErrorHandler('Adding Subjects failed, please try again.', 500)
		);
	}

	res.status(201).json({
		addedSubjects: isCommited ? subjects : 'Subjects not added!',
	});
};

// =================================================================================
const patchAssignTeacherToASubject = async (req, res, next) => {
	// This middleware is responsable to assign a teacher to a subject in on class
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

	const { classId, subjectId, academicYearId, teacherId } = req.body;

	let classe;
	try {
		classe = await Class.findById(classId);

		let academicYear;
		try {
			academicYear = classe.academicYearObject.find(
				(ayr) => ayr._id.toString() === academicYearId
			);
		} catch (err) {
			return next(
				localErrorHandler(
					'Fetching academic year failed, please try again later1.',
					500
				)
			);
		}

		if (!academicYear) {
			return next(
				new HttpError(
					'No academic year with this id found in the database.',
					404
				)
			);
		}

		let isSubofClass;
		try {
			isSubofClass = classe.subjects.find(
				(cls) => cls._id.toString() === subjectId
			);
		} catch (err) {
			return next(
				localErrorHandler(
					'This subject does not belong to this class, please try again later.',
					500
				)
			);
		}
		// console.log(isSubofClass);
		if (!isSubofClass) {
			return next(
				new HttpError(
					'No subject with this id found in the database.',
					404
				)
			);
		}
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching class failed, please try again later.',
				500
			)
		);
	}

	if (!classe) {
		return next(
			new HttpError('No classe with this id found in the database.', 404)
		);
	}

	let subject;
	try {
		subject = await Subject.findById(subjectId);
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching subject failed, please try again later.',
				500
			)
		);
	}

	if (!subject) {
		return next(
			new HttpError('No subject with this id found in the database.', 404)
		);
	}

	let teacher;
	if (teacherId !== 'empty') {
		try {
			teacher = await Teacher.findById(teacherId);
		} catch (err) {
			return next(
				localErrorHandler(
					'Fetching teacher failed, please try again later.',
					500
				)
			);
		}

		if (!teacher) {
			return next(
				new HttpError(
					'No teacher with this id found in the database.',
					404
				)
			);
		}
	}

	let isCommited = false;
	try {
		// classId, subjectId, academicYearId, teacherId
		const sess = await mongoose.startSession();
		sess.startTransaction();

		const cls = await Class.findById(classId);
		// Checks if the subject field already exist
		if (
			!!cls.academicYearObject
				.find((ayr) => ayr._id.toString() === academicYearId)
				.teachers.find((t) => t.subject._id.toString() === subjectId)
		) {
			cls.academicYearObject
				.find((ayr) => ayr._id.toString() === academicYearId)
				.teachers.find(
					(t) => t.subject._id.toString() === subjectId
				).teacher = teacherId !== 'empty' ? teacher : null;
		} else {
			const teachersMatch = {
				teacher: teacherId !== 'empty' ? teacher : null,
				subject: subject,
				isClassTeacher: false,
			};
			cls.academicYearObject
				.find((ayr) => ayr._id.toString() === academicYearId)
				.teachers.push(teachersMatch);
		}

		// console.log(cls);
		cls.save({ session: sess });

		await sess.commitTransaction();
		isCommited = true;
	} catch (err) {
		// sess.abortTransaction();
		return next(
			localErrorHandler(
				'Creating new accademic year failed for this class, please try again.',
				500
			)
		);
	}

	res.status(201).json({
		newAccademicYear: isCommited
			? 'newAcademicYear'
			: 'New accademic year not added!',
	});
};

// =================================================================================
const patchGenerateNewYearForOneClass = async (req, res, next) => {
	// This middleware is responsable to add a new academic year to
	// a specific classe and also remove the class id of all students
	// of the previous academic year

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

	const { newAcademicYear } = req.body;
	const classId = req.params.cid;

	// let students;
	// try {
	// 	students = await Student.find({});
	// } catch (err) {
	// 	return next(
	// 		localErrorHandler(
	// 			'Fetching students failed, please try again later.',
	// 			500
	// 		)
	// 	);
	// }

	// if (!students) {
	// 	return next(
	// 		new HttpError(
	// 			'Something went wrong with fetching students from the database.',
	// 			404
	// 		)
	// 	);
	// }

	let classe;
	try {
		classe = await Class.findById(classId);
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching classes failed, please try again later.',
				500
			)
		);
	}

	if (!classe) {
		return next(
			new HttpError('No classe with this id found in the database.', 404)
		);
	}

	for (let acc_yr of classe.academicYearObject) {
		if (acc_yr.year === newAcademicYear.year) {
			return next(
				new HttpError(
					'This accademic year already exists in the database.',
					404
				)
			);
		}
	}

	let isCommited = false;
	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();

		await Class.updateMany(
			{ _id: { $eq: classId } },
			{ $push: { academicYearObject: newAcademicYear } },
			{ session: sess }
		);

		await Student.updateMany(
			{
				classe: { $exists: true },
				_academicYearId: { $exists: true },
				classe: { $eq: classId },
			},
			{
				$set: {
					classe: null,
					_academicYearId: null,
				},
			},
			{ session: sess }
		);

		await sess.commitTransaction();
		isCommited = true;
	} catch (err) {
		// sess.abortTransaction();
		return next(
			localErrorHandler(
				'Creating new accademic year failed for this class, please try again.',
				500
			)
		);
	}

	res.status(201).json({
		newAccademicYear: isCommited
			? newAcademicYear
			: 'New accademic year not added!',
	});
};

// =================================================================================
const patchGenerateClassYear = async (req, res, next) => {
	// This middleware is responsable to add a new academic year to
	// all classes and also remove the class ids of all students

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

	const { newAcademicYear } = req.body;

	let classes;
	try {
		classes = await Class.find({});
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching classes failed, please try again later.',
				500
			)
		);
	}

	if (!classes || classes.length === 0) {
		return next(new HttpError('No classes found in the database.', 404));
	}

	for (let classe of classes) {
		for (let acc_yr of classe.academicYearObject) {
			if (acc_yr.year === newAcademicYear.year) {
				return next(
					new HttpError(
						`This accademic year already exists in the the class:: "${classe.designation}".`,
						404
					)
				);
			}
		}
	}

	let isCommited = false;
	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();

		await Class.updateMany(
			{},
			{ $push: { academicYearObject: newAcademicYear } },
			{ session: sess }
		);

		await Student.updateMany(
			{ classe: { $exists: true }, _academicYearId: { $exists: true } },
			{
				$set: {
					classe: null,
					_academicYearId: null,
				},
			},
			{ session: sess }
		);

		await sess.commitTransaction();
		isCommited = true;
	} catch (err) {
		sess.abortTransaction();
		return next(
			localErrorHandler(
				'Creating new accademic year failed, please try again.',
				500
			)
		);
	}

	res.status(201).json({
		newAccademicYear: isCommited
			? newAcademicYear
			: 'New accademic year not added!',
	});
};

// =================================================================================
const patchGenerateClassTimeTable = async (req, res, next) => {
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

	const { timeTable } = req.body;
	const classId = req.params.cid;
	let classe;
	try {
		classe = await Class.findById(classId);
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching classes failed, please try again later.',
				500
			)
		);
	}

	if (!classe) {
		return next(
			new HttpError('No classe with this id found in the database.', 404)
		);
	}

	// if (classe.academicYearObject) {
	// 	if (
	// 		!classe.academicYearObject[classe.academicYearObject.length - 1]
	// 			.teachers
	// 	) {
	// 		return next(
	// 			new HttpError(
	// 				'No teacher found, we cannot create a new time table.',
	// 				404
	// 			)
	// 		);
	// 	} else {
	// 		if (
	// 			classe.academicYearObject[classe.academicYearObject.length - 1]
	// 				.teachers.length != classe.subjects.length
	// 		) {
	// 			return next(
	// 				new HttpError(
	// 					'Some subjects do not have a teacher, we cannot create a new time table.',
	// 					404
	// 				)
	// 			);
	// 		}
	// 	}
	// } else {
	// 	return next(
	// 		new HttpError(
	// 			'No year found, we cannot create a new time table.',
	// 			404
	// 		)
	// 	);
	// }

	let isCommited = false;
	let resClass;
	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();

		resClass = await Class.updateOne(
			{ _id: { $eq: classId } },
			{ $set: { timeTable: timeTable } },
			{ session: sess }
		);

		await sess.commitTransaction();
		isCommited = true;
	} catch (err) {
		// sess.abortTransaction();
		return next(
			localErrorHandler(
				`Creating new time table for ${classe.designation} failed, please try again.`,
				500
			)
		);
	}

	res.status(201).json({
		timeTable: isCommited ? resClass : 'New time table not added!',
	});
};

// =================================================================================

const patchClass = async (req, res, next) => {
	const errors = validationResult(req);
	const classId = req.params.cid;
	const { designation, level } = req.body;

	if (!errors.isEmpty()) {
		console.log(errors);
		return next(
			localErrorHandler(
				'Invalid inputs passed, please check your data.',
				422
			)
		);
	}

	let classe;
	try {
		classe = await Class.findById(classId);
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching classes failed, please try again later.',
				500
			)
		);
	}

	if (!classe) {
		return next(
			new HttpError('No classe with this id found in the database.', 404)
		);
	}

	let newLevel;
	try {
		newLevel = await Level.findById(level);
		// console.log('newLevel', newLevel);
	} catch (err) {
		return next(
			localErrorHandler(
				'Could not find a level for the provided level id.',
				404
			)
		);
	}

	if (!newLevel) {
		return next(
			new HttpError(
				'Could not find level for the provided level id.',
				404
			)
		);
	}

	let oldLevel;
	try {
		oldLevel = await Level.findById(classe.level._id);
		// console.log('oldLevel', oldLevel);
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching oldLevels failed, please try again later.',
				500
			)
		);
	}

	if (!oldLevel) {
		return next(
			new HttpError('No classe with this id found in the database.', 404)
		);
	}

	let isCommited = false;
	let updatedClass;
	if (newLevel._id === oldLevel._id) {
		try {
			classe.designation = designation;
			updatedClass = await classe.save();
			isCommited = true;
		} catch (err) {
			return next(
				localErrorHandler(
					'Updating class failed, please try again.',
					500
				)
			);
		}
	} else {
		try {
			const sess = await mongoose.startSession();
			sess.startTransaction();
			await Level.updateOne(
				{ _id: { $eq: oldLevel._id } },
				{ $pull: { classes: classe._id } },
				{ session: sess }
			);
			await Level.updateOne(
				{ _id: { $eq: newLevel._id } },
				{ $push: { classes: classe._id } },
				{ session: sess }
			);
			classe.designation = designation;
			classe.level = newLevel;
			updatedClass = await classe.save({ session: sess });
			await sess.commitTransaction();
			isCommited = true;
		} catch (err) {
			return next(
				localErrorHandler(
					'Updating class failed, please try again.',
					500
				)
			);
		}
	}

	res.status(201).json({
		class: isCommited ? updatedClass : 'class not updated!',
	});
};

// =================================================================================

const deleteClass = async (req, res, next) => {
	const classId = req.params.cid;

	let classe;
	try {
		classe = await Class.findById(classId).populate('level');
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not delete this class.',
				404
			)
		);
	}

	if (!classe) {
		return next(
			localErrorHandler('Could not find a class for this id.', 404)
		);
	}

	let isDeleted = false;
	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await classe.remove({ session: sess });
		classe.level.classes.pull(classe);
		await classe.level.save({ session: sess });
		await sess.commitTransaction();
		isDeleted = true;
	} catch (e) {
		const error = new HttpError(
			'Something went wrong, could not delete this place.',
			500
		);
		return next(error);
	}

	res.status(201).json({
		Deletedclass: isDeleted ? classe : 'class not Deleted!',
	});
};

exports.getClass = getClass;
exports.getClasses = getClasses;
exports.postClass = postClass;
exports.patchAddSubject = patchAddSubject;
exports.patchAssignTeacherToASubject = patchAssignTeacherToASubject; //226
exports.patchGenerateNewYearForOneClass = patchGenerateNewYearForOneClass; //342
exports.patchGenerateClassYear = patchGenerateClassYear;
exports.patchGenerateClassTimeTable = patchGenerateClassTimeTable;
exports.patchClass = patchClass;
exports.deleteClass = deleteClass;
