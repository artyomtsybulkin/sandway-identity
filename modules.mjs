import crypto from 'crypto';
import base32Encode from 'base32-encode';
import sqlite3 from 'sqlite3';
import qrcode from 'qrcode';

export async function insertUser(username, secretKey, secreturi, qrcode) {
	const db = new sqlite3.Database('db.sqlite3');
	try {
		await new Promise((resolve, reject) => {
			db.run('INSERT INTO users (username, secretkey, secreturi, qrcode) VALUES (?, ?, ?, ?)', [username, secretKey, secreturi, qrcode], function (err) {
				if (err) reject(err); else resolve(this.lastID);
			});
		});
		console.log(`User ${username} inserted successfully!`);
	} catch (error) {
		console.error('Error inserting user:', error);
	} finally {
		db.close();
	}
}

export async function selectSecretKey(username) {
	const db = new sqlite3.Database('db.sqlite3');
	try {
	  	const row = await new Promise((resolve, reject) => {
			db.get('SELECT secretkey FROM users WHERE username = ?', [username], (err, row) => {
		  		if (err) reject(err); else resolve(row);
			});
	  	});
  		if (row) {
			return await row.secretkey;
	  	} else {
			console.log('No matching record found.');
			return null;
	  	}
	} catch (error) {
		console.error('Error executing the query:', error);
	} finally {
		db.close();
	}
}

// Function to generate a random secret key
export function generateSecretKey() {
	const secretSize = 32;
	const buffer = crypto.randomBytes(secretSize);
	const secretKey = base32Encode(buffer, 'RFC4648', { padding: false }).toString();
	return secretKey;
}

export async function generateQrCode(secretUri) {
  	try {
		const qt = qrcode.toString(secretUri, { type: 'terminal' }, (err, qrCode) => {
			if (err) {
				console.error('Error generating QR code:', err);
			} else {
			  	console.log('Scan the QR code below with your Authenticator app:\n');
			}
		});
    	const qrCode = await qrcode.toDataURL(secretUri);
    	return qrCode;
  	} catch (error) {
    	console.error('Module error generating QR code', error);
  	}
}

export async function selectAllUsers() {
	const db = new sqlite3.Database('db.sqlite3');
	try {
	  	const rows = await new Promise((resolve, reject) => {
			db.all('SELECT * FROM users', [], (err, rows) => {
		  		if (err) reject(err); else resolve(rows);
			});
	  	});
  		if (rows) {
			return await rows;
	  	} else {
			console.log('No record found.');
			return null;
	  	}
	} catch (error) {
		console.error('Error executing the query:', error);
	} finally {
		db.close();
	}
}