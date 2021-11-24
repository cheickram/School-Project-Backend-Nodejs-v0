const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const subjectSchema = new Schema({
	designation: {
		type: String,
		required: true,
		unique: true,
	},
	code: {
		type: String,
		required: true,
		unique: true,
	},
	coef: {
		type: Number,
		required: true,
	},
	teachers: [
		{
			type: mongoose.Types.ObjectId,
			required: true,
			ref: 'Teacher',
		},
	],
});

subjectSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Subject', subjectSchema);
