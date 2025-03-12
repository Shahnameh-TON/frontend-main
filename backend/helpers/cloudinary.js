var cloudinary = require('cloudinary');

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dmbwgrff6',
  api_key: '649798611825193',
  api_secret: 'a7ABzb2CSyYzi2cDn0_IGl2VlTA'
});

module.exports = {
  // Callback-based image upload
  uploadImage: function(imageName, category, callback) {
    try {
      cloudinary.v2.uploader.upload(
        imageName,
        {
          folder: `telegram_bot/${category}`,  // Fixing template literal
          use_filename: true
        },
        function(error, result) {
          if (error == undefined) {
            callback(result);
          } else {
            callback(undefined);			
          }
        }
      );
    } catch (e) {
      console.log(e);
      callback(undefined);
    }
  },

  // Promise-based image upload
  uploadImage: function(imageName, category) {
    return new Promise((resolve, reject) => {
      try {
        cloudinary.v2.uploader.upload(
          imageName,
          {
            folder: `telegram_bot/${category}`,  // Fixing template literal
            use_filename: true
          },
          (error, result) => {
            if (error) {
              reject(error); 
            } else {
              resolve(result); 
            }
          }
        );
      } catch (e) {
        console.log(e.message);
        reject(e); 
      }
    });
  }
};
