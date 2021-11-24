const express = require('express');
const { check } = require('express-validator');

const subjectControllers = require('../controllers/subject-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.use(checkAuth);

router.get('/:sid', subjectControllers.getSubject);

router.get('/', subjectControllers.getSubjects);

router.post(
	'/',
	[
		check('designation').not().isEmpty(),
		check('code').not().isEmpty(),
		check('coef').isNumeric(),
	],
	subjectControllers.postSubject
);

router.patch(
	'/:sid',
	[
		check('designation').not().isEmpty(),
		check('code').not().isEmpty(),
		check('coef').isNumeric(),
	],
	subjectControllers.patchLevel
);

router.patch('/:sid/:tid', subjectControllers.patchPullTeacher);

router.delete('/:sid', subjectControllers.deleteSubject);

module.exports = router;
