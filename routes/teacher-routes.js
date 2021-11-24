const express = require('express');
const { check } = require('express-validator');

const teacherControllers = require('../controllers/teacher-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.use(checkAuth);

router.get('/:tid', teacherControllers.getTeacher);

router.get('/', teacherControllers.getTeachers);

router.post(
	'/',
	[
		check('first_name').not().isEmpty(),
		check('last_name').not().isEmpty(),
		check('pin_number').isLength({ min: 2 }),
		check('email').normalizeEmail().isEmail(),
		check('phone').not().isEmpty(),
		check('dob').isISO8601().toDate(),
		check('pob').not().isEmpty(),
		check('address').not().isEmpty(),
		check('salary').isNumeric(),
		check('subjects').isArray(),
	],
	teacherControllers.postTeacher
);

router.patch(
	'/:tid',
	[
		check('first_name').not().isEmpty(),
		check('last_name').not().isEmpty(),
		check('pin_number').isLength({ min: 2 }),
		check('email').normalizeEmail().isEmail(),
		check('phone').not().isEmpty(),
		check('dob').isISO8601().toDate(),
		check('pob').not().isEmpty(),
		check('address').not().isEmpty(),
		check('salary').isNumeric(),
		check('subjects').isArray(),
	],
	teacherControllers.patchTeacher
);

module.exports = router;
