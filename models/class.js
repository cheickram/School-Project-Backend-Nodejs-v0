const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const classSchema = new Schema({
	designation: {
		type: String,
		required: true,
		unique: true,
	},
	subjects: [
		{
			type: mongoose.Types.ObjectId,
			required: true, // true
			ref: 'Subject',
		},
	],
	level: {
		type: mongoose.Types.ObjectId,
		required: false,
		ref: 'Level',
	},
	timeTable: {
		type: Array,
		required: true,
		default: [],
	},
	academicYearObject: [
		{
			year: {
				type: String,
				required: false,
			},
			students: [
				{
					type: mongoose.Types.ObjectId,
					required: true, // true
					ref: 'Student',
				},
			],
			teachers: [
				{
					teacher: {
						type: mongoose.Types.ObjectId,
						required: false, // true
						ref: 'Teacher',
					},
					subject: {
						type: mongoose.Types.ObjectId,
						required: true, // true
						ref: 'Subject',
					},
					isClassTeacher: {
						type: Boolean,
						required: true,
						default: false,
					},
				},
			],
		},
	],
});

classSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Classe', classSchema);
