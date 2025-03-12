const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

AWS.config.update({
 accessKeyId: "AKIAYSE4OESCB3ETEDQ2",
 secretAccessKey: "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"
});

var s3 = new AWS.S3();

module.exports = {
  uploadImage: function(imageName, category) {
    return new Promise((resolve, reject) => {
    	try {
	      let baseName = path.basename(imageName);
	      let fileExtension = path.extname(imageName).toLowerCase(); 
        let contentType = 'application/octet-stream'; 

        if (fileExtension === '.svg') {
          contentType = 'image/svg+xml';
        } else if (fileExtension === '.png') {
          contentType = 'image/png';
        } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
          contentType = 'image/jpeg';
        }

	      let params = {
	        Bucket: 'khabat', 
	        Body: fs.readFileSync(imageName),
	        Key: `${category}/${new Date().getTime()}_${baseName}`,
	        ContentType: contentType 
	      };

	      s3.upload(params, (err, data) => {
	        if (err) {
	          console.log("S3 upload error", err);
	          reject(err);
	        } else {
	          resolve(data); 
	        }
	      });
  		}catch (e) {
			console.log(e.message);
			reject(e); 
		}
    });
  }
};