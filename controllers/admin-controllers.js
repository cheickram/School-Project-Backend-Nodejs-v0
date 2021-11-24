// const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const Admin = require('../models/admin');
const Teacher = require('../models/teacher');
const Student = require('../models/student');

const localErrorHandler = (message, code) => {
	return new HttpError(message, code);
};

// const getUsers = async (req, res, next) => {
// 	let users;
// 	try {
// 		users = await User.find({}, '-password'); // or use 'email name'
// 	} catch (err) {
// 		const error = new HttpError(
// 			'Fetching users failed, please try again later.',
// 			500
// 		);
// 		return next(error);
// 	}
// 	res.json({
// 		users: users.map((user) => user.toObject({ getters: true })),
// 	});
// };

const signup = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		// console.log(errors);
		return next(
			new HttpError('Invalid inputs passed, please check your data.', 422)
		);
	}

	const { name, email, password, isAdmin } = req.body;

	let existingAdmin;

	try {
		existingAdmin = await Admin.findOne({ email: email });
	} catch (err) {
		const error = new HttpError(
			'Signing up failed, please try again later.',
			500
		);
		return next(error);
	}

	if (existingAdmin) {
		const error = new HttpError(
			'User exists already, please login instead.',
			422
		);
		return next(error);
	}

	let hashedPassword;
	try {
		hashedPassword = await bcrypt.hash(password, 12);
	} catch (err) {
		const error = new HttpError(
			'Could not create user, please try again.',
			500
		);
		return next(error);
	}

	const createdAdmin = new Admin({
		name,
		email,
		password: hashedPassword,
		isAdmin: !!isAdmin,
	});

	try {
		await createdAdmin.save();
	} catch (err) {
		const error = new HttpError(
			'Signing up failed, please try again later.',
			500
		);
		return next(error);
	}

	let token;
	try {
		token = jwt.sign(
			{ userId: createdAdmin.id, email: createdAdmin.email },
			'supersecret_dont_share',
			{ expiresIn: '1h' }
		);
	} catch (err) {
		const error = new HttpError(
			'Signing up failed, please try again later.',
			500
		);
		return next(error);
	}

	res.status(201).json({
		userId: createdAdmin.id,
		email: createdAdmin.email,
		isAdmin: createdAdmin.isAdmin,
		token: token,
	});
};

const login = async (req, res, next) => {
	const { email, password, userType } = req.body;

	if (userType === 'administrateur') {
		let existingAdmin;
		try {
			existingAdmin = await Admin.findOne({ email: email });
		} catch (err) {
			const error = new HttpError(
				'Logging in failed, please try again later.',
				500
			);
			return next(error);
		}

		if (!existingAdmin) {
			const error = new HttpError(
				'Invalid credentials, could not log you in.',
				403
			);
			return next(error);
		}

		let isValidPassword = false;

		try {
			isValidPassword = await bcrypt.compare(
				password,
				existingAdmin.password
			);
		} catch (err) {
			const error = new HttpError(
				'Could not log you in, please check your credentials and try again.',
				500
			);
			return next(error);
		}

		if (!isValidPassword) {
			const error = new HttpError(
				'Invalid credentials, could not log you in.',
				403
			);
			return next(error);
		}

		let token;
		try {
			token = jwt.sign(
				{ userId: existingAdmin.id, email: existingAdmin.email },
				'supersecret_dont_share', // private key
				{ expiresIn: '1h' }
			);
		} catch (err) {
			const error = new HttpError(
				'Logging in failed, please try again later.',
				500
			);
			return next(error);
		}
		res.json({
			userId: existingAdmin.id,
			email: existingAdmin.email,
			isAdmin: existingAdmin.isAdmin,
			name: existingAdmin.name,
			token: token,
			userType,
		});
	} else if (userType === 'professeur') {
		let existingTeacher;
		try {
			existingTeacher = await Teacher.findOne({ email: email });
		} catch (err) {
			const error = new HttpError(
				'Logging in failed, please try again later.',
				500
			);
			return next(error);
		}

		if (!existingTeacher) {
			const error = new HttpError(
				'Invalid credentials, could not log you in.',
				403
			);
			return next(error);
		}

		let isValidPassword = false;

		try {
			isValidPassword =
				existingTeacher.pin_number.toLowerCase() ===
				password.toLowerCase();
		} catch (err) {
			const error = new HttpError(
				'Could not log you in, please check your credentials and try again.',
				500
			);
			return next(error);
		}

		if (!isValidPassword) {
			const error = new HttpError(
				'Invalid credentials, could not log you in.',
				403
			);
			return next(error);
		}

		let token;
		try {
			token = jwt.sign(
				{ userId: existingTeacher._id, email: existingTeacher.email },
				'supersecret_dont_share', // private key
				{ expiresIn: '1h' }
			);
		} catch (err) {
			const error = new HttpError(
				'Logging in failed, please try again later.',
				500
			);
			return next(error);
		}
		res.json({
			userId: existingTeacher.id,
			email: existingTeacher.email,
			name: existingTeacher.first_name,
			token: token,
			userType,
		});
	} else {
		let existingStudent;
		try {
			existingStudent = await Student.findOne({ email: email });
		} catch (err) {
			const error = new HttpError(
				'Logging in failed, please try again later.',
				500
			);
			return next(error);
		}

		if (!existingStudent) {
			const error = new HttpError(
				'Invalid credentials, could not log you in.',
				403
			);
			return next(error);
		}

		let isValidPassword = false;

		try {
			isValidPassword =
				existingStudent.pin_number.toLowerCase() ===
				password.toLowerCase();
		} catch (err) {
			const error = new HttpError(
				'Could not log you in, please check your credentials and try again.',
				500
			);
			return next(error);
		}

		if (!isValidPassword) {
			const error = new HttpError(
				'Invalid credentials, could not log you in1.',
				403
			);
			return next(error);
		}
		let token;
		try {
			token = jwt.sign(
				{ userId: existingStudent._id, email: existingStudent.email },
				'supersecret_dont_share', // private key
				{ expiresIn: '1h' }
			);
		} catch (err) {
			const error = new HttpError(
				'Logging in failed, please try again later.',
				500
			);
			return next(error);
		}
		res.json({
			userId: existingStudent._id,
			email: existingStudent.email,
			name: existingStudent.first_name,
			token: token,
			userType,
		});
	}
};

// exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
