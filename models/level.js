const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const levelSchema = new Schema({
	designation: {
		type: String,
		required: true,
		unique: true,
	},
	registration_fee: {
		type: Number,
		required: true,
	},
	tuition_fee: {
		type: Number,
		required: true,
	},
	tuition_payment_division: [
		{
			type: Number,
			required: true,
		},
	],
	classes: [
		{
			type: mongoose.Types.ObjectId,
			required: true,
			ref: 'Classe',
		},
	],
});

levelSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Level', levelSchema);
