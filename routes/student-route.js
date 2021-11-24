const express = require('express');
const { check } = require('express-validator');

const studentControllers = require('../controllers/student-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.use(checkAuth);

router.get('/:sid', studentControllers.getStudent);

router.get('/', studentControllers.getStudents);

router.post(
	'/',
	[
		check('first_name').not().isEmpty(),
		check('last_name').not().isEmpty(),
		check('pin_number').isLength({ min: 2 }),
		check('email').normalizeEmail().isEmail(),
		check('phone').isLength({ min: 2 }),
		check('dob').isISO8601().toDate(),
		check('pob').not().isEmpty(),
		check('address').not().isEmpty(),
		check('parent').isObject(),
	],
	studentControllers.postStudent
);

router.patch(
	'/:sid',
	[
		check('first_name').not().isEmpty(),
		check('last_name').not().isEmpty(),
		check('pin_number').isLength({ min: 2 }),
		check('email').normalizeEmail().isEmail(),
		check('phone').isLength({ min: 2 }),
		check('dob').isISO8601().toDate(),
		check('pob').not().isEmpty(),
		check('address').not().isEmpty(),
		check('parent').isObject(),
	],
	studentControllers.patchStudent
);

module.exports = router;
