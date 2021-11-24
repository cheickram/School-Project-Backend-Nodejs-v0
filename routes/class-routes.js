const express = require('express');
const { check } = require('express-validator');

const classControllers = require('../controllers/class-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.use(checkAuth);

router.get('/:cid', classControllers.getClass);

router.get('/', classControllers.getClasses);

router.post(
	'/',
	[
		check('designation').not().isEmpty(),
		check('level').not().isEmpty(),
		// check('academicYearObject').isObject(),
	],
	classControllers.postClass
);

router.patch(
	'/add-subjects/:cid',
	[check('subjects').isArray()],
	classControllers.patchAddSubject
);

router.patch(
	'/assign-teacher-to-a-subject',
	[
		check('classId').not().isEmpty(),
		check('subjectId').not().isEmpty(),
		check('academicYearId').not().isEmpty(),
		check('teacherId').not().isEmpty(),
	],
	classControllers.patchAssignTeacherToASubject
);

router.patch(
	'/generate-new-year-for-one-class/:cid',
	[
		check('newAcademicYear').isObject(),
		check('newAcademicYear.year').isLength({ min: 6 }),
	],
	classControllers.patchGenerateNewYearForOneClass
);

router.patch(
	'/generate-time-table/:cid',
	[check('timeTable').isArray()],
	classControllers.patchGenerateClassTimeTable
);

router.patch(
	'/generate-new-year-for-classes',
	[
		check('newAcademicYear').isObject(),
		check('newAcademicYear.year').isLength({ min: 6 }),
	],
	classControllers.patchGenerateClassYear
);

router.patch(
	'/:cid',
	[check('designation').not().isEmpty(), check('level').not().isEmpty()],
	classControllers.patchClass
);

router.delete('/:cid', classControllers.deleteClass);

module.exports = router;
