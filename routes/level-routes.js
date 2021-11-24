const express = require('express');
const { check } = require('express-validator');

const levelControllers = require('../controllers/level-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.use(checkAuth);

router.get('/:lid', levelControllers.getLevel);

router.get('/', levelControllers.getLevels);

router.post(
	'/',
	[
		check('designation').isLength({ min: 2 }),
		check('registration_fee').isNumeric(),
		check('tuition_fee').isNumeric(),
		check('tuition_payment_division').isArray(),
	],
	levelControllers.postLevel
);

router.patch(
	'/:lid',
	[
		check('designation').isLength({ min: 2 }),
		check('registration_fee').isNumeric(),
		check('tuition_fee').isNumeric(),
		check('tuition_payment_division').isArray(),
	],
	levelControllers.patchLevel
);

router.delete('/:lid', levelControllers.deleteLevel);

module.exports = router;
