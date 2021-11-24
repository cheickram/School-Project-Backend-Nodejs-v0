const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const studentSchema = new Schema({
	first_name: {
		type: String,
		required: true,
	},
	last_name: {
		type: String,
		required: true,
	},
	pin_number: {
		type: String,
		required: true,
		unique: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	phone: {
		type: String,
		required: true,
	},
	dob: {
		type: Date,
		required: true,
	},
	pob: {
		type: String,
		required: true,
	},
	address: {
		type: String,
		required: true,
	},
	classe: {
		type: mongoose.Types.ObjectId,
		required: false,
		ref: 'Classe',
	},
	_academicYearId: {
		type: mongoose.Types.ObjectId,
		required: false,
	},
	parent: {
		first_name: {
			type: String,
			required: true,
		},
		last_name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		phone: {
			type: String,
			required: true,
		},
		address: {
			type: String,
			required: true,
		},
	},
});

studentSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Student', studentSchema);
