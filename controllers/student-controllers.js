const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const Student = require('../models/student');
const Class = require('../models/class');

const localErrorHandler = (message, code) => {
	return new HttpError(message, code);
};

const getStudent = async (req, res, next) => {
	const stdId = req.params.sid;

	let student;
	try {
		student = await Student.findById(stdId).populate('classe');
	} catch (err) {
		return next(
			localErrorHandler(
				'Something went wrong, could not find a student.',
				500
			)
		);
	}

	if (!student) {
		return next(
			localErrorHandler(
				'Could not find a student for the provided id.',
				404
			)
		);
	}

	res.json({ student: student.toObject({ getters: true }) });
};

const getStudents = async (req, res, next) => {
	let students;
	try {
		students = await Student.find({});
	} catch (err) {
		return next(
			localErrorHandler(
				'Fetching students failed, please try again later.',
				500
			)
		);
	}
	res.json({
		students: students.map((std) => std.toObject({ getters: true })),
	});
};

const postStudent = async (req, res, next) => {
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
		classe,
		parent,
	} = req.body;

	let existingStudent;

	try {
		existingStudent = await Student.findOne({ email: email });
	} catch (err) {
		const error = new HttpError(
			'An error occured, please try again later.',
			500
		);
		return next(error);
	}

	if (existingStudent) {
		const error = new HttpError(
			'Student with this email address exists already, please use the existing one or user another email instead.',
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

	if (!errors.isEmpty()) {
		console.log(errors);
		return next(
			localErrorHandler(
				'Invalid inputs passed, please check your data.',
				422
			)
		);
	}

	let fetchedClass;
	if (classe) {
		try {
			fetchedClass = await Class.findById(classe);
		} catch (err) {
			return next(
				localErrorHandler(
					'Could not find a class for the provided class id.',
					404
				)
			);
		}

		if (!fetchedClass) {
			return next(
				new HttpError(
					'Could not find class for the provided class id.',
					404
				)
			); // next is used for async or sync code
		}
		if (fetchedClass.academicYearObject.length === 0) {
			return next(
				new HttpError(
					'This class does not have any active academic year.',
					404
				)
			);
		}
	}

	let createStudent;
	if (fetchedClass && fetchedClass.academicYearObject.length > 0) {
		createStudent = new Student({
			first_name,
			last_name,
			pin_number,
			email,
			phone,
			dob: converted_dob,
			pob,
			address,
			classe: fetchedClass._id,
			_academicYearId:
				fetchedClass.academicYearObject[
					fetchedClass.academicYearObject.length - 1
				]._id,
			parent,
		});
	} else {
		createStudent = new Student({
			first_name,
			last_name,
			pin_number,
			email,
			phone,
			dob: converted_dob,
			pob,
			address,
			parent,
		});
	}

	let isCommited = false;
	try {
		if (fetchedClass && fetchedClass.academicYearObject.length > 0) {
			const sess = await mongoose.startSession();
			sess.startTransaction();

			const std = await createStudent.save({ session: sess });
			fetchedClass.academicYearObject[
				fetchedClass.academicYearObject.length - 1
			].students.push(std._id);
			await fetchedClass.save({ session: sess });
			await sess.commitTransaction();
		} else {
			await createStudent.save();
		}
		isCommited = true;
	} catch (err) {
		return next(
			localErrorHandler('Creating student failed, please try again.', 500)
		);
	}

	res.status(201).json({
		student: isCommited ? createStudent : 'student not created!',
	});
};

const patchStudent = async (req, res, next) => {
	const stdId = req.params.sid;
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
		classe,
		parent,
	} = req.body;

	let currentdatetime = new Date(dob);
	const converted_dob =
		currentdatetime.getFullYear() +
		'/' +
		(currentdatetime.getMonth() + 1 < 10 ? '0' : '') +
		(currentdatetime.getMonth() + 1) +
		'/' +
		(currentdatetime.getDate() < 10 ? '0' : '') +
		currentdatetime.getDate();

	if (!errors.isEmpty()) {
		console.log(errors);
		return next(
			localErrorHandler(
				'Invalid inputs passed, please check your data.',
				422
			)
		);
	}

	let student;
	let isStdAlreadyInAClass = false;
	try {
		student = await Student.findById(stdId);
		if (student.classe) {
			student = await Student.findById(stdId).populate('classe');
			isStdAlreadyInAClass = true;
		}
	} catch (e) {
		const error = new HttpError(
			'Something went wrong, could not update this student information.',
			500
		);
		return next(error);
	}

	if (!student) {
		return next(
			new HttpError(
				'Could not find student for the provided student id.',
				404
			)
		); // next is used for async or sync code
	}

	let newClass;
	if (!!classe) {
		try {
			newClass = await Class.findById(classe);
		} catch (err) {
			return next(
				localErrorHandler(
					'Could not find a class for the provided class id.',
					404
				)
			);
		}

		if (!newClass) {
			return next(
				new HttpError(
					'Could not find class for the provided class id.',
					404
				)
			);
		}

		if (newClass.academicYearObject.length === 0) {
			return next(
				new HttpError(
					'The assigned class does not have any active academic year.',
					404
				)
			);
		}
	}

	// console.log('student', student);

	let isCommited = false;

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		if (isStdAlreadyInAClass) {
			const indexOfTheAcademicYear =
				student.classe.academicYearObject.findIndex(
					(obj) =>
						obj._id.toString() ===
						student._academicYearId.toString()
				);
			// console.log('here', indexOfTheAcademicYear);
			try {
				const oldClass = await Class.findById(student.classe);
				await oldClass.academicYearObject[
					indexOfTheAcademicYear
				].students.pull(student._id);
				await oldClass.save({ session: sess });
			} catch (err) {
				return next(
					localErrorHandler(
						"Deleting the student's old class failed, please try again.",
						500
					)
				);
			}
		}

		student.first_name = first_name;
		student.last_name = last_name;
		student.pin_number = pin_number;
		student.email = email;
		student.phone = phone;
		student.dob = converted_dob;
		student.pob = pob;
		student.address = address;
		student.parent = parent;
		if (!!classe) {
			student.classe = newClass._id;
			student._academicYearId =
				newClass.academicYearObject[
					newClass.academicYearObject.length - 1
				]._id;
			newClass.academicYearObject[
				newClass.academicYearObject.length - 1
			].students.push(student._id);
			await newClass.save({ session: sess });
			await student.save({ session: sess });
			await sess.commitTransaction();
		} else {
			await student.save();
		}
		isCommited = true;
	} catch (err) {
		return next(
			localErrorHandler('Updating student failed, please try again.', 500)
		);
	}

	res.status(201).json({
		student: isCommited ? student : 'student not updated!',
	});
};

exports.getStudent = getStudent;
exports.getStudents = getStudents;
exports.postStudent = postStudent;
exports.patchStudent = patchStudent;
