import express from 'express';
import { authenticator } from 'otplib';
import bodyParser from 'body-parser';
import pug from 'pug';
import { 
	insertUser, 
	generateSecretKey, 
	selectSecretKey, 
	generateQrCode, 
	selectAllUsers
} from './modules.mjs';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.render('index', { title: 'Status', message: 'Hello there!' })
});

app.get('/passwd', (req, res) => {
	selectAllUsers().then(rows => {
		res.render('passwd', { users: rows })
	}).catch(() => {
		console.error('Server error while retrieving users from database')	
	})
});

app.get('/useradd', (req, res) => {
	res.render('useradd', { title: 'Add User' })
});

app.get('/userdel', (req, res) => {
	res.render('userdel', { title: 'Delete User', message: 'Hello there!' })
});

app.post('/useradd', (req, res) => {
	const username = req.body.username;
	const service = req.body.service;
	const secretKey = generateSecretKey();
	const otp = authenticator.generate(secretKey);
	const secretUri = authenticator.keyuri(username, service, secretKey);
	generateQrCode(secretUri).then(qrCode => {
		//console.log(qrCode);
		insertUser(username, secretKey, secretUri, qrCode);
		res.render('useradd', { response: { username, secretKey, qrCode }});
	}).catch(() => {
		console.error('Server error generating QR code');
	});
});

app.post('/verify', (req, res) => {
	const username = req.body.username;
	const otp = req.body.otp;
	selectSecretKey(username)
		.then((secretkey) => {
			try {
				const isValid = authenticator.check(otp, secretkey);
				res.json({ isValid });
			} 
			catch (error) {
				console.error("Error verifying OTP");
			}
		})
		.catch((error) => {
			console.error('Error:', error);
		});
});

app.listen(port, () => {
	console.log(`OTP authentication server is running on port ${port}`);
});

process.on('SIGINT', () => {
	console.log('\nReceived SIGINT. Exiting the application...');
	process.exit(0); // Exit with status code 0 (success)
});

// curl -X POST -d "username=master@baex.ca&service=google.com" localhost:3000/useradd
// curl -X POST -d "username=master@baex.ca&otp=765887" localhost:3000/verify