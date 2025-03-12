var express = require('express');
var multer  = require('multer');
var path = require('path');
var async  = require('async');
let common = require('../../helpers/common');
var moment = require('moment');
var router = express.Router();
var mongoose = require('mongoose');
var useragent = require('useragent');
// const speakeasy = require('speakeasy');
// const qrcode = require('qrcode');
var validator = require('validator');

//helpers
var encdec = require('../../helpers/encrypt');
const cloudinary = require('../../helpers/cloudinary');
const AWSImgUpload = require('../../helpers/awsImgUpload');

//modal
var admin = require('../../model/admin');
var settings = require('../../model/siteSettings');
var adminhis = require('../../model/adminHistory');
var loginAttempts = require('../../model/loginAttempts');
var blockip = require('../../model/blockip');
// var users = require('../../model/user');
const adminActivity = require('../../model/adminActivity');

const points = require('../../model/userPoints');
const multiTap = require('../../model/multiTap');
const level = require('../../model/level');
const notify = require('../../model/notify');
const video = require('../../model/videomanage');
var energy = require('../../model/energyLevel');
var dailyWords = require('../../model/dailyWords');
var dailycombo = require('../../model/dailyCombo');
var skins = require('../../model/skins');
var bankdata = require('../../model/bankdata');
var selectedCombo = require('../../model/selectedCombo');


const imageFilter = function (req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

var storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, common.randomString(8) + new Date().getTime() + file.originalname);
  }
});

var upload = multer({ storage: storage,fileFilter: imageFilter  });

let updatedDate = ()=>{
	return new Date();
};

let response = {};

router.get('/blockip', common.originMiddle, async function(req, res, next) {
	try{
		var agent = useragent.parse(req.headers['user-agent']);
		let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
		ip = ip.replace('::ffff:', '');	
		let obj = { "ip_addr" : ip };
		let resData = await blockip.findOne({"ip": ip }).exec();
		if(resData) {
			res.json({status:false, msg:"Ip blocked"});
		} else {    
			res.json({status:true, msg:"Ip not blocked"});
		}
} catch(error) {
		return res.status({status : 0, msg : error.message});
	}
});		

router.get('/check_ip', common.originMiddle, async function(req,res) {
	try{
		var agent = useragent.parse(req.headers['user-agent']);
		let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
		ip = ip.replace('::ffff:', '');
		let resData = await blockip.find({"ip_addr": ip }).countDocuments().exec();
		if(resData != 0){
			return res.json({status:1});
		}else if(resData == 0) {
			return res.json({status:0});
		}
	} catch(error) {
		return res.status({status : 0, msg : error.message});
	}
});	

//copyright text
router.get('/copyright', common.originMiddle,async (req,res) => {
	var resData = await settings.findOne({},{copyright:1}).exec();
	if(resData){
		res.json({status : 1, data : resData });
	} else {
		return res.json({status : 0});
	}
})

router.get('/check_maintain', common.originMiddle, function(req, res) {
	var agent = useragent.parse(req.headers['user-agent']);
	let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	ip = ip.replace('::ffff:', '');
	blockip.findOne({"ip_addr":ip}).exec(function(error,resData){
		if(resData){
			return res.json({status:2});
		} else {
			return res.json({status:1});
		}
	});		
});

async function Ipblock(info, res) {
    let ip = info.header('x-forwarded-for') || info.connection.remoteAddress;
    ip = ip.replace('::ffff:', '');
    const agent = useragent.parse(info.headers['user-agent']);
    const os = agent.os.toString().split(' ')[0];
    const browser = agent.toAgent().split(' ')[0];
    const search = { "emailid": info.body.email };
    const response = {};

    try {
        const attemptRst = await loginAttempts.findOne(search).select('attemptCount').exec();

        if (attemptRst) {
            if (attemptRst.attemptCount > 4) {
                const object = {
                    "ip_addr": ip,
                    "created_at": updatedDate(),
                    "status": 2
                };

                const result = await blockip.create(object);
                if (result) {
                    response.status = 401;
                    response.error = "IP blocked";
                    return res.json(response);
                }
            } else {
                const resData = await loginAttempts.findOne({ "ip_address": ip }).exec();
                if (resData) {
                    const attemptCount = resData.attemptCount + 1;
                    await loginAttempts.updateOne(
                        { "_id": resData._id },
                        { $set: { "attemptCount": attemptCount, "status": 0 } }
                    ).exec();

                    response.status = false;
                    response.error = "Invalid Email/Password or Pattern";
                    return res.json(response);
                }
            }
        } else {
            const attempt = {
                "emailid": info.body.email,
                "secret_key": info.body.password,
                "ip_address": ip,
                "browser": browser,
                "deviceinfo": os,
                "status": 0,
                "datetime": updatedDate()
            };

            const result = await loginAttempts.create(attempt);
            if (result) {
                response.status = false;
                response.error = "Invalid Email/Password or Pattern";
                return res.json(response);
            }
        }
    } catch (err) {
        return res.status(500).send(err);
    }
}


/* check admin login status. */
router.post('/chklogin',async function(req, res, next) {
	let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	ip = ip.replace('::ffff:', '');
	var agent = useragent.parse(req.headers['user-agent']);
	var os = agent.os.toString().split(' ')[0];
	var browser = agent.toAgent().split(' ')[0];
	let ownermail = req.body.email;
	let password = encdec.encryptNew(req.body.password);
	let pattern = encdec.encryptNew(req.body.pattern);
	  console.log('pswd',password);
	  console.log('pattern',pattern)

	let resData = await admin.findOne({$and:[{ ownermail : ownermail, ownerkey : password,pattern : pattern}]}).exec();
	if(resData) {
		if(resData.status==1){						
			let obj = {
				"adminId": resData._id,			  
				"ipaddress" : ip,
				"browser"   : browser,
				"deviceinfo": os,
				"status"    : 1 
			};
			let result = await adminhis.create( obj );      
			let  Key = common.createPayload(resData._id);
			if(result) {
				let resData1 = await loginAttempts.deleteOne({"emailid":resData.ownermail}).exec();
					if(resData1) {
						res.json({status:1, Key: Key, session : resData._id, name : resData.username, role : resData.role,access_module:resData.access_module,success: 'You are logging in. Please Wait.'});
					} else {
						res.json({status:1, Key: Key, session : resData._id, name : resData.username, role : resData.role, success: 'You are logging in. Please Wait.'});
					}
			}
		} else if(resData.status==0){
			response.status= false; 
			response.error = "Your Account is deactivated.Please contact Admin!"  
			res.json(response)  
		} 
	} else {
		Ipblock(req,res)			
	}
});

router.get('/profile', common.tokenMiddleware, (req,res) => {
	let id = req.userId;
	admin.findOne({"_id": id},{ownermail:1,username:1,profileimg:1}).exec(function(error,resData) {
		if(resData){
			res.json({status:true, data : resData });
		} else {
			return res.json({status : false});
		}
	});
});

router.get('/moduleaccess', common.tokenMiddleware, (req,res) => {
	let id = req.userId;
	admin.findOne({"_id": id}).select("access_module role").exec(function(error,resData) {
		if(resData){
			res.json({status : true, data : resData });
		} else {
			return res.json({status : false});
		}
	})
})

router.get('/admin_access', common.tokenMiddleware, (req,res) => {
	let id = req.userId;
	admin.findOne({"_id": id},{_id:0}).select("access_module role").exec(function(error,resData){
		if(resData){			
			res.json({status : true, data : resData });
		} else {
			return res.json({status : false});
		}
	})
})


router.get('/dashboard',common.tokenMiddleware, async (req, res) => {
  try {

    const [ userCount, lvlcount, multiTapCount] = await Promise.all([
      	points.countDocuments().exec(),
        level.countDocuments().exec(),
        multiTap.countDocuments().exec()
    ]);

    const response = { status: 1, userCount, lvlcount, multiTapCount };
    res.json(response);
  } catch (err) {
  	console.error(err);
    res.json({ status : 0 , msg : err.message })
  }
});



router.post('/updateNotify', async (req, res) => {
  const {id, message } = req.body;

  try {
    const updatedMultiTap = await notify.findByIdAndUpdate(id, {message}, { new: true });

    if (!updatedMultiTap) {
      return res.status(404).json({ success: 0, message: 'Multi Tap data not found' });
    }

    res.status(200).json({ success: 1, message: 'Notify data updated successfully', data: updatedMultiTap });
  } catch (err) {
    console.error('Error updating multi-tap data:', err);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});



router.post('/deleteVideo', async (req, res) => {
  const { data } = req.body; // Destructure `data` from `req.body`

  if (!data || !data.id) {
    return res.status(400).json({ success: 0, message: 'ID is required' });
  }
  const { id } = data; // Destructure `id` from `data`
  try {
    const deletedVideo = await video.findByIdAndDelete(id);

    if (!deletedVideo) {
      return res.status(404).json({ success: 0, message: 'Video not found' });
    }

    res.status(200).json({ success: 1, message: 'Video deleted successfully' });
  } catch (err) {
    console.error('Error deleting video:', err);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});


// router.post('/updateVideo', async (req, res) => {
//   const { id, title, points, video: videoUrl ,duration } = req.body; 
//     if (!validator.isURL(videoUrl)) {
//     return res.json({ success: 0, message: 'Invalid URL' });
//   }
//   try {
//     const updatedVideo = await video.findByIdAndUpdate(id, { points, title, video: videoUrl ,duration}, { new: true });

//     if (!updatedVideo) {
//       return res.status(404).json({ success: 0, message: 'Video data not found' });
//     }

//     res.status(200).json({ success: 1, message: 'Video updated successfully', data: updatedVideo });
//   } catch (err) {
//     console.error('Error updating video data:', err);
//     res.status(500).json({ success: 0, message: 'Internal server error' });
//   }
// });



router.post('/updateEnergyTap', async (req, res) => {
  const { id, needed_points, energy_level, level } = req.body;

  try {
    const updatedMultiTap = await energy.findByIdAndUpdate(id, { needed_points, energy_level, level }, { new: true });

    if (!updatedMultiTap) {
      return res.status(404).json({ success: 0, message: 'Energy Tap data not found' });
    }

    res.status(200).json({ success: 1, message: 'Energy Tap data updated successfully', data: updatedMultiTap });
  } catch (err) {
    console.error('Error updating multi-tap data:', err);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});

router.post('/updateMultiTap', async (req, res) => {
  const { id, needed_points, tap_level, level } = req.body;

  try {
    const updatedMultiTap = await multiTap.findByIdAndUpdate(id, { needed_points, tap_level, level }, { new: true });

    if (!updatedMultiTap) {
      return res.status(404).json({ success: 0, message: 'Multi Tap data not found' });
    }

    res.status(200).json({ success: 1, message: 'Multi Tap data updated successfully', data: updatedMultiTap });
  } catch (err) {
    console.error('Error updating multi-tap data:', err);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});



router.post('/savebank',  upload.single('bank_image'), async (req, res, next) => {
  try {      
    const { bank_name, id, exchange_type} = req.body;

    if (!bank_name || !id || !exchange_type) {
      return res.status(400).json({ success: 0, msg: 'Enter all details!' });
    }

    const updatedData = {
      bank_name: bank_name,
      type: exchange_type,
    };

    if (req.file) {
      const imgRes = await AWSImgUpload.uploadImage(req.file.path, exchange_type);
      if (!imgRes) {
        return res.status(500).json({ status: 0, msg: 'Failed to update profile image' });
      }
      updatedData.bank_image = imgRes.Location;
    }

    const updatedBankData = await bankdata.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedBankData) {
      return res.status(404).json({ success: 0, message: 'Bank data not found' });
    }

    res.status(200).json({ success: 1, message: 'Bank data updated successfully', data: updatedBankData });
  } catch (err) {
    console.error('Error updating Bank data:', err);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});


router.post('/save', async (req, res) => {
  try {
    const { level_name, points_from, points_upto, energy_level, tap_level,id } = req.body;
   try {
    const updatedMultiTap = await level.findByIdAndUpdate(id, { level_name, points_from, points_upto , energy_level , tap_level}, { new: true });

    if (!updatedMultiTap) {
      return res.status(404).json({ success: 0, message: 'Multi Tap data not found' });
    }

    res.status(200).json({ success: 1, message: 'Level data updated successfully', data: updatedMultiTap });
  } catch (err) {
    console.error('Error updating multi-tap data:', err);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }

  } catch (error) {
    console.error('Error saving level data:', error.message);
    res.status(500).json({
      status: 0,
      message: 'Failed to save level data',
      error: error.message
    });
  }
});


router.post('/saveCombo', upload.single('combo_image'), async (req, res, next) => {
  try {
    const { lvlname, card_levels, category, id,description } = req.body;

    if (!lvlname || !category || !card_levels || !id) {
      return res.status(400).json({ success: 0, msg: 'Enter all details!' });
    }

    const cardLevelsArray = JSON.parse(card_levels);

    const updatedData = {
      level_name: lvlname,
      description:description,
      card_levels: cardLevelsArray,
      category: category,
    };

    if (req.file) {
      const imgRes = await AWSImgUpload.uploadImage(req.file.path, category);
      if (!imgRes) {
        return res.status(500).json({ status: 0, msg: 'Failed to update profile image' });
      }
      updatedData.image = imgRes.Location;
    }

    const updatedCombo = await dailycombo.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedCombo) {
      return res.status(404).json({ success: 0, message: 'Combo data not found' });
    }

    res.status(200).json({ success: 1, message: 'Combo updated successfully', data: updatedCombo });
  } catch (err) {
    console.error('Error updating Combo data:', err);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});

router.post('/updateVideo', async (req, res) => {
  const { id, title, points, video: videoUrl ,duration } = req.body; 
    if (!validator.isURL(videoUrl)) {
    return res.json({ success: 0, message: 'Invalid URL' });
  }
  try {
    const updatedVideo = await video.findByIdAndUpdate(id, { points, title, video: videoUrl ,duration}, { new: true });

    if (!updatedVideo) {
      return res.status(404).json({ success: 0, message: 'Video data not found' });
    }

    res.status(200).json({ success: 1, message: 'Video updated successfully', data: updatedVideo });
  } catch (err) {
    console.error('Error updating video data:', err);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});


router.post('/addvideo', async (req, res) => {
  try {
    const videoUrl = req.body.video;
    if (!validator.isURL(videoUrl)) {
      return res.json({ success: 0, message: 'Invalid URL' });
    }
    const newVideo = new video({
      title: req.body.title,
      points: req.body.points,
      video: videoUrl, 
      duration: parseFloat(req.body.duration)
    });

    await newVideo.save();
    res.json({ message: 'Video saved successfully', status: 1 });
  } catch (error) {
    res.status(500).send({ error: 'Failed to save video', status: 0 });
  }
});


// router.post('/addvideo', async (req, res) => {
//   try {
//     const videoUrl = req.body.video;
//     const videoId = getYouTubeVideoId(videoUrl);
//     if (!videoId) {
//       return res.status(400).send({ error: 'Invalid video URL', status: 0 });
//     }

//     const embeddedVideoUrl = `https://www.youtube.com/embed/${videoId}`;

//     const newVideo = new video({
//       title: req.body.title,
//       points: req.body.points,
//       video: embeddedVideoUrl, 
//       duration: parseFloat(req.body.duration)
//     });

//     await newVideo.save();
//     res.json({ message: 'Video saved successfully', status: 1 });
//   } catch (error) {
//     res.status(500).send({ error: 'Failed to save video', status: 0 });
//   }
// });

function getYouTubeVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|user\/[A-Za-z0-9_]+\/videos|.*\/)([A-Za-z0-9_-]{11})|(?:https?:\/\/)?(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})/;
  const matches = url.match(regex);
  return matches ? (matches[1] || matches[2]) : null;
}



router.get('/wordtoday', async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));
    
    const word = await dailyWords.findOne({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).exec();

    if (word) {
      res.json({ word: word.word, id : word._id });
    } else {
      res.json({ message: 'No word found for today.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching word for today' });
  }
});



router.get('/combotoday', async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));
    
    const combo = await selectedCombo.findOne({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).exec();

    if (combo) {
      res.json({ combo: combo,  });
    } else {
      res.json({ message: 'No combo found for today.' });
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error fetching combo for today' });
  }
});




router.post('/updateWord', common.originMiddle, async (req, res) => {
  try {
    let info = req.body
    const word = await dailyWords.updateOne({_id : info._id},{ $set : {word : info.word}}).exec();
    if (word) {
      res.json({ success : 1, message : "Word Updated successfully" });
    } else {
      res.json({ success : 0, message: 'Error Updating Word' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching word for today', message : error.message });
  }
});


router.post('/addCombo', upload.single('combo_image'), async (req, res, next) => {
    try {
        const { lvlname, category, card_levels,description } = req.body;

        if (!lvlname || !category || !card_levels || !req.file) {
            return res.status(400).json({ status: 0, msg: "Enter all details including an image!" });
        }

        const cardLevelsArray = JSON.parse(card_levels);

        const imgRes = await AWSImgUpload.uploadImage(req.file.path, category);
        
        if (imgRes) {
            const newCombo = new dailycombo({
                level_name: lvlname,
                category: category,
                description:description,
                image: imgRes.Location, 
                card_levels: cardLevelsArray
            });

            await newCombo.save();

            return res.status(201).json({ message: 'Combo created successfully', success: true });
        } else {
            return res.status(500).json({ status: 0, msg: 'Failed to upload profile image' });
        }
    } catch (error) {
        console.log('Error Inserting Combo', error);
        return res.status(500).json({ message: error.message, success: false });
    }
});

// router.post('/addCombo', upload.single('combo_image'), async (req, res, next) => {
//     try {
//         const { lvlname, category, card_levels,description } = req.body;
//         console.log(req.body)
//         if(lvlname && category && card_levels ){
//           await cloudinary.uploadImage(req.file.path, category, async function(imgRes){
//             if(imgRes){
//               console.log("imgRes",imgRes)
//               const cardLevelsArray = JSON.parse(card_levels);

//               const newCombo = new dailycombo({
//                   level_name: lvlname,
//                   category: category,
//                   // description: description,
//                   image: imgRes.Location,
//                   card_levels: cardLevelsArray
//               });

//               await newCombo.save();

//               if(newCombo){
//                 return res.status(201).json({ message: 'Combo created successfully', success: true });
//               }else{
//                 return res.json({ status : 0, msg:"Cannot create Combo record"});
//               }
//             }else{
//               res.json({ status : 0 ,msg : 'Failed to update profile image'})
//             }
//           })
//         }else{
//           return res.json({ status:0, msg:"Enter all details !" });
//         }
//     } catch (error) {
//       console.log('Error Inserting Combo',error);
//       res.status(500).json({ message: error.message, success: false });
//     }
// });


router.post('/addExchange', upload.single('bank_image'), async (req, res, next) => {
    try {
        const { bank_name, exchange_type } = req.body;

        if (!bank_name || !exchange_type || !req.file) {
            return res.status(400).json({ status: 0, msg: "Enter all details including an image!" });
        }

        const imgRes = await AWSImgUpload.uploadImage(req.file.path, exchange_type);
        
        if (imgRes) {
            const newBankData = new bankdata({
                bank_name: bank_name,
                type: exchange_type,
                bank_image: imgRes.Location, 
            });

            await newBankData.save();

            return res.status(201).json({ message: 'Exchange created successfully', success: true });
        } else {
            return res.status(500).json({ status: 0, msg: 'Failed to update profile image' });
        }
    } catch (error) {
        console.log('Error creating exchange:', error);
        return res.status(500).json({ message: 'Failed to create Exchange', success: false });
    }
});


router.post('/addLevel', async (req, res) => {
    try {
        const { level_name, points_from, points_upto, energy_level, tap_level } = req.body;

        const newLevel = new level({
            level_name,
            points_from,
            points_upto,
            energy_level,
            tap_level
        });

        await newLevel.save();
        res.status(201).json({ success: 1, msg: 'Level added successfully' });
    } catch (error) {
        console.error('Error adding level:', error);
        res.status(500).json({ success: 0, msg: 'Error adding level' });
    }
});





router.post('/editskin', async (req, res) => {
  try {
    const { 
      name, gender, points, 
      name1, gender1, points1, 
      name2, gender2, points2, 
      name3, gender3, points3, 
      name4, gender4, points4,
      name5, gender5, points5,
      name6, gender6, points6,
      name7, gender7, points7,
      name8, gender8, points8,
      name9, gender9, points9,
      name10, gender10, points10,
      name11, gender11, points11,
      name12, gender12, points12 ,
      _id
    } = req.body;
    const update = {
      $set: {
        'skin.0.character_name': name, 'skin.0.gender': gender, 'skin.0.required_points': points,
        'skin.1.character_name': name1, 'skin.1.gender': gender1, 'skin.1.required_points': points1,
        'skin.2.character_name': name2, 'skin.2.gender': gender2, 'skin.2.required_points': points2,
        'skin.3.character_name': name3, 'skin.3.gender': gender3, 'skin.3.required_points': points3,
        'skin.4.character_name': name4, 'skin.4.gender': gender4, 'skin.4.required_points': points4,
        'skin.5.character_name': name5, 'skin.5.gender': gender5, 'skin.5.required_points': points5,
        'skin.6.character_name': name6, 'skin.6.gender': gender6, 'skin.6.required_points': points6,
        'skin.7.character_name': name7, 'skin.7.gender': gender7, 'skin.7.required_points': points7,
        'skin.8.character_name': name8, 'skin.8.gender': gender8, 'skin.8.required_points': points8,
        'skin.9.character_name': name9, 'skin.9.gender': gender9, 'skin.9.required_points': points9,
        'skin.10.character_name': name10, 'skin.10.gender': gender10, 'skin.10.required_points': points10,
        'skin.11.character_name': name11, 'skin.11.gender': gender11, 'skin.11.required_points': points11,
        'skin.12.character_name': name12, 'skin.12.gender': gender12, 'skin.12.required_points': points12
      }
    };
    const result = await skins.updateOne({ '_id': _id }, update);
    if (result.modifiedCount > 0) {
      res.json({ status: 1, msg: 'Combos updated successfully' });
    } else {
      res.json({ status: 0, msg: 'No updates made' });
    }
  } catch (error) {
    console.error('Error updating combos:', error);
    res.status(500).json({ status: 0, msg: 'Error updating combos' });
  }
});



router.post('/banks', async (req, res) => {
  try {
    const type = req.body.type;
    const banks = await bankdata.find({ type: type });
    res.json(banks);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch bank data' });
  }
});






// router.post('/addvideo', async (req, res) => {
// 	console.log(req.body)
//   try {

//     const newVideo = new video({
//       title: req.body.title,
//       points: req.body.points,
//       video: req.body.video,
//             duration: req.body.duration,

//     });
//     await newVideo.save();
//     res.json({ message: 'Video saved successfully' ,status:1});
//   } catch (error) {
//   	console.error(error)
//     res.status(500).send({ error: 'Failed to save video' ,status:0});
//   }
// });


router.post('/deleteCombo', async (req, res) => {
  const { data } = req.body; 

  if (!data || !data.id) {
    return res.status(400).json({ success: 0, message: 'ID is required' });
  }
  const { id } = data; 
  try {
    const deletedCombo = await dailycombo.findByIdAndDelete(id);

    if (!deletedCombo) {
      return res.status(404).json({ success: 0, message: 'Combo not found' });
    }

    res.status(200).json({ success: 1, message: 'Combo deleted successfully' });
  } catch (err) {
    console.error('Error deleting Combo:', err);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});

router.post('/deleteBank', async (req, res) => {
  const { data } = req.body; 

  if (!data || !data.id) {
    return res.status(400).json({ success: 0, message: 'ID is required' });
  }
  const { id } = data; 
  try {
    const deletedBank = await bankdata.findByIdAndDelete(id);

    if (!deletedBank) {
      return res.status(404).json({ success: 0, message: 'bank not found' });
    }

    res.status(200).json({ success: 1, message: 'bank deleted successfully' });
  } catch (err) {
    console.error('Error deleting bank:', err);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});

router.post('/updateComboImage', upload.single('imageFile'), async (req, res) => {
  const { comboId } = req.body; 
 const imageFile = req.file.path; 
  try {
   const result = await AWSImgUpload.uploadImage(imageFile, 'category'); 


    const updateResult = await selectedCombo.updateOne(
      { 'combos.level_name': comboId }, 
      { $set: { 'combos.$.image': result.Location } } 
    );
    if (updateResult.modifiedCount > 0) {
      res.json({ success: 1, msg: 'Image updated successfully', data: cloudinaryResult });
    } else {
      res.json({ success: 0, msg: 'Combo not found' });
    }
  } catch (error) {
    console.error('Error updating combo image:', error);
    res.status(500).json({ msg: 'Error updating combo image', error: error.message });
  }
});


// router.post('/updateComboImage', upload.single('imageFile'), async (req, res) => {
//   const { comboId } = req.body;
//   console.log(comboId)
//   const imageFile = req.file.path; 

//   try {
//     const result = await cloudinary.uploadImage(imageFile, 'category'); 
//     console.log(result)
//     res.status(200).json(result);
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ msg: 'Error updating combo image', error: error.message });
//   }
// });

module.exports = router;