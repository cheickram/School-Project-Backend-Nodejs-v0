const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const teacherSchema = new Schema({
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
	salary: {
		type: Number,
		required: true,
	},
	subjects: [
		{
			type: mongoose.Types.ObjectId,
			required: true,
			ref: 'Subject',
		},
	],
	// classes: [
	// 	{
	// 		class: {
	// 			type: mongoose.Types.ObjectId,
	// 			required: true,
	// 			ref: 'Classe',
	// 		},
	// 		subject: {
	// 			type: mongoose.Types.ObjectId,
	// 			required: true,
	// 			ref: 'Subject',
	// 		},
	// 	},
	// ],
});

teacherSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Teacher', teacherSchema);
