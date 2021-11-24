const express = require('express');
const mongoose = require('mongoose');

const HttpError = require('./models/http-error');
const adminRoutes = require('./routes//admin-routes');
const levelRoutes = require('./routes/level-routes');
const classRoutes = require('./routes/class-routes');
const studentRoutes = require('./routes/student-route');
const subjectRoutes = require('./routes/subject-routes');
const teacherRoutes = require('./routes/teacher-routes');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
	next();
});

// Routes middlewares
app.use('/api/admin', adminRoutes);
app.use('/api/level', levelRoutes);
app.use('/api/class', classRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/subject', subjectRoutes);
app.use('/api/teacher', teacherRoutes);
// End Routes middlewares

// Route not found middleware
app.use((req, res, next) => {
	const error = new HttpError('Could not find this route.', 404);
	throw error;
});
// End Route not found middleware

// Error handling middleware
app.use((error, req, res, next) => {
	if (req.file) {
		fs.unlink(req.file.path, (err) => {
			console.log(err);
		});
	}
	if (res.headerSent) {
		return next(error);
	}
	res.status(error.code || 500);
	res.json({
		message: error.message || 'An unknown error occured!',
	});
});
// End error handling middleware

// Main
mongoose
	.connect(
		'mongodb+srv://rai:tester1234@cluster0.irapu.mongodb.net/schoolOne?retryWrites=true&w=majority'
	)
	.then(() => {
		app.listen(5000);
	})
	.catch((error) => {
		console.log(error);
	});
// End main

{
	/*
/api/level
    GET /:lid
    POST /
    PATCH /lid
    
/api/courses
    GET /:cid
    POST /
    PATCH /cid

/api/students
    GET /:cid
    POST /
    PATCH /cid

*/
}
