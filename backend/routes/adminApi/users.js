var express = require('express');
var router = express.Router();
var useragent = require('useragent');
var async = require('async');
var validator = require('validator');
var moment = require('moment');
// var multer  = require('multer');
// const axios = require('axios');
const mongoose = require('mongoose');

// helpers
var common = require('../../helpers/common');
var encdec = require('../../helpers/encrypt');
// var mail = require('../../helpers/mail');

// model
var admin = require('../../model/admin');
var adminhis = require('../../model/adminHistory');
var blockip = require('../../model/blockip');
var loginAttempts = require('../../model/loginAttempts');
var settings = require('../../model/siteSettings');
var adminActivity = require('../../model/adminActivity');

var userPoints = require('../../model/userPoints');
var levels = require('../../model/level');
var multiTap = require('../../model/multiTap');
var dailyRewards = require('../../model/dailyReward');
var notify = require('../../model/notify');
var video = require('../../model/videomanage');
var energy = require('../../model/energyLevel');
var manageRewards = require('../../model/reward');
var dailycombo = require('../../model/dailyCombo');
var skin = require('../../model/skins');
var bank = require('../../model/bankdata');

// var storage = multer.diskStorage({
// 	filename: function (req, file, cb) {
// 		cb(null, file.originalname);
// 	}
// });
// var upload = multer({ storage: storage });

let updatedDate = ()=>{
	return new Date();
};


let response = {};


router.post('/tradedata', common.originMiddle, async function(req, res, next) {
    try {
        var info = req.body;
        var filter = info.filter || '';
        var sortOrder = info.sortOrder;
        var size = parseInt(info.pageSize);
        var sortName = info.sortActive;
        var srt = {};
        srt[sortName] = (sortOrder === 'desc') ? -1 : 1;
        var query = {};
        query.sort = srt;
        // Comment out or remove pagination parameters
        // query.skip = size * pageNo;
        // query.limit = size;

        var regex = new RegExp(filter, "i");
        // search
        var search = {};

        if (req.body.list === "tradelog") {
            if (filter === "" || filter === undefined) {
                search = {};
            } else {
                search.address_info = filter;
            }
        }

        var start = "";
        if (info.startDate !== '' && info.startDate !== null) {
            if (moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var startDate = new Date(info.startDate);
                startDate.setDate(startDate.getDate());
                start = startDate.toISOString();
            }
        }
        var end = "";
        if (info.endDate !== '' && info.endDate !== null) {
            if (moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var endDate = new Date(info.endDate);
                endDate.setDate(endDate.getDate());
                end = endDate.toISOString();
            }
        }

        if (start !== '' && end !== '') {
            search['$or'] = [{'created_at': { $gte: new Date(start), $lt: new Date(end)}}];
        }

        // Fetch all matching documents
        const tradeDataPromise = levels.find(search, {}, query).exec();
        const tradeCountPromise = levels.find(search).countDocuments().exec();

        const [tradeData, tradeCount] = await Promise.all([tradeDataPromise, tradeCountPromise]);

        const response = {
            status: true,
            data: tradeData,
            tradeCount: tradeCount,
            // Remove pagination-related properties
            pageIndex: 0,
            pageSize: tradeCount,
            sortOrder: sortOrder,
            sortName: sortName,
            filter: filter,
            startDate: start,
            endDate: end
        };

        res.json(response);

    } catch (err) {
        res.status(500).send(err);
    }
});


router.post('/notifydata', common.originMiddle, async function(req, res, next) {
    try {
        var info = req.body;
        var filter = info.filter || '';
        var pageNo = parseInt(info.pageIndex) || 0;
        var sortOrder = info.sortOrder;
        var size = parseInt(info.pageSize);
        var sortName = info.sortActive;
        var srt = {};
        srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
        var query = {};
        query.sort = srt;
        query.skip = size * pageNo;
        query.limit = size;
        var regex = new RegExp(filter, "i");
        // search
        var search = {};

        if(req.body.list == "tradelog") {
            if(filter == "" || filter == undefined) {
                search = {};
            } else {
                search.address_info = filter;
            }
        }

        var start = "";
        if(info.startDate != '' && info.startDate != null) {
            if(moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var startDate = new Date(info.startDate);
                startDate.setDate(startDate.getDate());
                start = startDate.toISOString();
            }
        }
        var end = "";
        if(info.endDate != '' && info.endDate != null) {
            if(moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var endDate = new Date(info.endDate);
                endDate.setDate(endDate.getDate());
                end = endDate.toISOString();
            }
        }

        if(start != '' && end != '') {
            search['$or'] = [{'created_at': { $gte: new Date(start), $lt: new Date(end)}}];
        }

        const tradeCountPromise = notify.find(search).countDocuments().exec();
        const tradeDataPromise = notify.find(search, {}, query).sort({'created_at': -1}).exec();

        const [tradeCount, tradeData] = await Promise.all([tradeCountPromise, tradeDataPromise]);

        const response = {
            status: true,
            data: tradeData,
            tradeCount: tradeCount,
            pageIndex: pageNo,
            pageSize: size,
            sortOrder: sortOrder,
            sortName: sortName,
            filter: filter,
            startDate: start,
            endDate: end
        };

        res.json(response);

    } catch (err) {
        res.status(500).send(err);
    }
});




router.post('/multidata', common.originMiddle, async function(req, res, next) {
    try {
        var info = req.body;
        var pageNo = parseInt(info.pageIndex) || 0;
        var filter = info.filter;
        var sortOrder = info.sortOrder;
        var size = parseInt(info.pageSize);
        var sortName = info.sortActive;
        
        var query = {};
        var srt = {};
        srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
        srt['date'] = -1; 
        query.sort = srt;
        query.skip = size * pageNo;
        query.limit = size;

        var search = {};
        if (req.body.list === "userlog") {
            if (filter === "" || filter === undefined) {
                search = {};
            } else {
                search.username = filter;
            }

            if (info.startDate && info.endDate) {
                search.created_at = {
                    $gte: new Date(info.startDate),
                    $lte: new Date(info.endDate)
                };
            }
        }

        async function fetchData() {
            try {
                let project = {
           needed_points:1,
           tap_level:1,
           level:1,
                    _id: 1
                };
                const count = await multiTap.find(search).countDocuments().exec();
                const userData = await multiTap.find(search, project).sort(query.sort).skip(query.skip).exec();
                const [userCount, userDatas] = await Promise.all([count, userData]);
                return { userCount, userDatas };
            } catch (error) {
                console.error(error);
                throw new Error('Failed to fetch data: ' + error.message);
            }
        }

        fetchData().then(data => {
            if (data) {
                let response = {};
                if (data.userDatas.length === 0) {
                    response.data = data.userDatas;
                    response.userCount = data.userCount;
                    res.json(response);
                } else {
                    response.status = 1;
                    let len = data.userDatas?.length;
                    let i = 0, datas = [];
                    if (len > 0) {
                        data.userDatas.forEach((user) => {
                            let obj = {
                                needed_points: user.needed_points,
                                tap_level: user.tap_level,
                                level: user.level,

                                _id: user._id
                            };

                            datas.push(obj);
                            i = i + 1;
                        });
                    }
                    response.data = datas;
                    response.userCount = data.userCount;
                    res.json(response);
                }
            } else {
                res.json({ status: 0, msg: 'Try Again Later !' });
            }
        }).catch(error => {
            console.error(error)
            res.json({ status: 0, msg: 'Connection Error' });
        });
    } catch (error) {
        return res.json({ status: 0, msg: error.message });
    }
});




// router.post('/multidata', common.originMiddle, async function(req, res, next) {
//     try {
//         var info = req.body;
//         var filter = info.filter || '';
//         var pageNo = parseInt(info.pageIndex) || 0;
//         var sortOrder = info.sortOrder;
//         var size = parseInt(info.pageSize);
//         var sortName = info.sortActive;
//         var srt = {};
//         srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
//         var query = {};
//         query.sort = srt;
//         query.skip = size * pageNo;
//         query.limit = size;
//         var regex = new RegExp(filter, "i");
//         // search
//         var search = {};

//         if(req.body.list == "tradelog") {
//             if(filter == "" || filter == undefined) {
//                 search = {};
//             } else {
//                 search.address_info = filter;
//             }
//         }

//         var start = "";
//         if(info.startDate != '' && info.startDate != null) {
//             if(moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
//                 var startDate = new Date(info.startDate);
//                 startDate.setDate(startDate.getDate());
//                 start = startDate.toISOString();
//             }
//         }
//         var end = "";
//         if(info.endDate != '' && info.endDate != null) {
//             if(moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
//                 var endDate = new Date(info.endDate);
//                 endDate.setDate(endDate.getDate());
//                 end = endDate.toISOString();
//             }
//         }

//         if(start != '' && end != '') {
//             search['$or'] = [{'created_at': { $gte: new Date(start), $lt: new Date(end)}}];
//         }

//         const tradeCountPromise = multiTap.find(search).countDocuments().exec();
//         const tradeDataPromise = multiTap.find(search, {}, query).sort({'created_at': -1}).exec();

//         const [tradeCount, tradeData] = await Promise.all([tradeCountPromise, tradeDataPromise]);

//         const response = {
//             status: true,
//             data: tradeData,
//             tradeCount: tradeCount,
//             pageIndex: pageNo,
//             pageSize: size,
//             sortOrder: sortOrder,
//             sortName: sortName,
//             filter: filter,
//             startDate: start,
//             endDate: end
//         };

//         res.json(response);

//     } catch (err) {
//         res.status(500).send(err);
//     }
// });


router.post('/energydata', common.originMiddle, async function(req, res, next) {
    try {
        var info = req.body;
        var filter = info.filter || '';
        var pageNo = parseInt(info.pageIndex) || 0;
        var sortOrder = info.sortOrder;
        var size = parseInt(info.pageSize);
        var sortName = info.sortActive;
        var srt = {};
        srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
        var query = {};
        query.sort = srt;
        query.skip = size * pageNo;
        query.limit = size;
        var regex = new RegExp(filter, "i");
        // search
        var search = {};

        if(req.body.list == "tradelog") {
            if(filter == "" || filter == undefined) {
                search = {};
            } else {
                search.address_info = filter;
            }
        }

        var start = "";
        if(info.startDate != '' && info.startDate != null) {
            if(moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var startDate = new Date(info.startDate);
                startDate.setDate(startDate.getDate());
                start = startDate.toISOString();
            }
        }
        var end = "";
        if(info.endDate != '' && info.endDate != null) {
            if(moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var endDate = new Date(info.endDate);
                endDate.setDate(endDate.getDate());
                end = endDate.toISOString();
            }
        }

        if(start != '' && end != '') {
            search['$or'] = [{'created_at': { $gte: new Date(start), $lt: new Date(end)}}];
        }

        const tradeCountPromise = energy.find(search).countDocuments().exec();
        const tradeDataPromise = energy.find(search, {}, query).sort({'created_at': -1}).exec();

        const [tradeCount, tradeData] = await Promise.all([tradeCountPromise, tradeDataPromise]);

        const response = {
            status: true,
            data: tradeData,
            tradeCount: tradeCount,
            pageIndex: pageNo,
            pageSize: size,
            sortOrder: sortOrder,
            sortName: sortName,
            filter: filter,
            startDate: start,
            endDate: end
        };

        res.json(response);

    } catch (err) {
        res.status(500).send(err);
    }
});





router.post('/videodata', common.originMiddle, async function(req, res, next) {
    try {
        var info = req.body;
        var filter = info.filter || '';
        var pageNo = parseInt(info.pageIndex) || 0;
        var sortOrder = info.sortOrder;
        var size = parseInt(info.pageSize);
        var sortName = info.sortActive;
        var srt = {};
        srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
        var query = {};
        query.sort = srt;
        query.skip = size * pageNo;
        query.limit = size;
        var regex = new RegExp(filter, "i");
        // search
        var search = {};

        if(req.body.list == "tradelog") {
            if(filter == "" || filter == undefined) {
                search = {};
            } else {
                search.address_info = filter;
            }
        }

        var start = "";
        if(info.startDate != '' && info.startDate != null) {
            if(moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var startDate = new Date(info.startDate);
                startDate.setDate(startDate.getDate());
                start = startDate.toISOString();
            }
        }
        var end = "";
        if(info.endDate != '' && info.endDate != null) {
            if(moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var endDate = new Date(info.endDate);
                endDate.setDate(endDate.getDate());
                end = endDate.toISOString();
            }
        }

        if(start != '' && end != '') {
            search['$or'] = [{'created_at': { $gte: new Date(start), $lt: new Date(end)}}];
        }

        const tradeCountPromise = video.find(search).countDocuments().exec();
        const tradeDataPromise = video.find(search, {}, query).sort({'created_at': -1}).exec();

        const [tradeCount, tradeData] = await Promise.all([tradeCountPromise, tradeDataPromise]);

        const response = {
            status: true,
            data: tradeData,
            tradeCount: tradeCount,
            pageIndex: pageNo,
            pageSize: size,
            sortOrder: sortOrder,
            sortName: sortName,
            filter: filter,
            startDate: start,
            endDate: end
        };

        res.json(response);

    } catch (err) {
        res.status(500).send(err);
    }
});






router.post('/energydata', common.originMiddle, async function(req, res, next) {
    try {
        var info = req.body;
        var filter = info.filter || '';
        var pageNo = parseInt(info.pageIndex) || 0;
        var sortOrder = info.sortOrder;
        var size = parseInt(info.pageSize);
        var sortName = info.sortActive;
        var srt = {};
        srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
        var query = {};
        query.sort = srt;
        query.skip = size * pageNo;
        query.limit = size;
        var regex = new RegExp(filter, "i");
        // search
        var search = {};

        if(req.body.list == "tradelog") {
            if(filter == "" || filter == undefined) {
                search = {};
            } else {
                search.address_info = filter;
            }
        }

        var start = "";
        if(info.startDate != '' && info.startDate != null) {
            if(moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var startDate = new Date(info.startDate);
                startDate.setDate(startDate.getDate());
                start = startDate.toISOString();
            }
        }
        var end = "";
        if(info.endDate != '' && info.endDate != null) {
            if(moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var endDate = new Date(info.endDate);
                endDate.setDate(endDate.getDate());
                end = endDate.toISOString();
            }
        }

        if(start != '' && end != '') {
            search['$or'] = [{'created_at': { $gte: new Date(start), $lt: new Date(end)}}];
        }

        const tradeCountPromise = multiTap.find(search).countDocuments().exec();
        const tradeDataPromise = multiTap.find(search, {}, query).sort({'created_at': -1}).exec();

        const [tradeCount, tradeData] = await Promise.all([tradeCountPromise, tradeDataPromise]);

        const response = {
            status: true,
            data: tradeData,
            tradeCount: tradeCount,
            pageIndex: pageNo,
            pageSize: size,
            sortOrder: sortOrder,
            sortName: sortName,
            filter: filter,
            startDate: start,
            endDate: end
        };

        res.json(response);

    } catch (err) {
        res.status(500).send(err);
    }
});



router.post('/dailydatas', common.originMiddle, async function(req, res, next) {
    try {
        var info = req.body;
        var filter = info.filter || '';
        var pageNo = parseInt(info.pageIndex) || 0;
        var sortOrder = info.sortOrder;
        var size = parseInt(info.pageSize);
        var sortName = info.sortActive;
        var srt = {};
        srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
        var query = {};
        query.sort = srt;
        query.skip = size * pageNo;
        query.limit = size;
        var regex = new RegExp(filter, "i");
        // search
        var search = {};

        if(req.body.list == "tradelog") {
            if(filter == "" || filter == undefined) {
                search = {};
            } else {
                search.address_info = filter;
            }
        }

        var start = "";
        if(info.startDate != '' && info.startDate != null) {
            if(moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var startDate = new Date(info.startDate);
                startDate.setDate(startDate.getDate());
                start = startDate.toISOString();
            }
        }
        var end = "";
        if(info.endDate != '' && info.endDate != null) {
            if(moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var endDate = new Date(info.endDate);
                endDate.setDate(endDate.getDate());
                end = endDate.toISOString();
            }
        }

        if(start != '' && end != '') {
            search['$or'] = [{'created_at': { $gte: new Date(start), $lt: new Date(end)}}];
        }

        const tradeCountPromise = manageRewards.find(search).countDocuments().exec();
        const tradeDataPromise = manageRewards.find(search, {}, query).sort({'created_at': -1}).exec();

        const [tradeCount, tradeData] = await Promise.all([tradeCountPromise, tradeDataPromise]);

        const response = {
            status: true,
            data: tradeData,
            tradeCount: tradeCount,
            pageIndex: pageNo,
            pageSize: size,
            sortOrder: sortOrder,
            sortName: sortName,
            filter: filter,
            startDate: start,
            endDate: end,
            stat:'true',
        };

        res.json(response);

    } catch (err) {
        res.status(500).send(err);
    }
});





router.post('/dailydata', common.originMiddle, async function(req, res, next) {
    try {
        var info = req.body;
        var filter = info.filter || '';
        var pageNo = parseInt(info.pageIndex) || 0;
        var sortOrder = info.sortOrder;
        var size = parseInt(info.pageSize);
        var sortName = info.sortActive;
        var srt = {};
        srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
        var query = {};
        query.sort = srt;
        query.skip = size * pageNo;
        query.limit = size;
        var regex = new RegExp(filter, "i");
        // search
        var search = {};

        if(req.body.list == "tradelog") {
            if(filter == "" || filter == undefined) {
                search = {};
            } else {
                search.address_info = filter;
            }
        }

        var start = "";
        if(info.startDate != '' && info.startDate != null) {
            if(moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var startDate = new Date(info.startDate);
                startDate.setDate(startDate.getDate());
                start = startDate.toISOString();
            }
        }
        var end = "";
        if(info.endDate != '' && info.endDate != null) {
            if(moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var endDate = new Date(info.endDate);
                endDate.setDate(endDate.getDate());
                end = endDate.toISOString();
            }
        }

        if(start != '' && end != '') {
            search['$or'] = [{'created_at': { $gte: new Date(start), $lt: new Date(end)}}];
        }

        const tradeCountPromise = dailyRewards.find(search).countDocuments().exec();
        const tradeDataPromise = dailyRewards.find(search, {}, query).sort({'created_at': -1}).exec();

        const [tradeCount, tradeData] = await Promise.all([tradeCountPromise, tradeDataPromise]);

        const response = {
            status: true,
            data: tradeData,
            tradeCount: tradeCount,
            pageIndex: pageNo,
            pageSize: size,
            sortOrder: sortOrder,
            sortName: sortName,
            filter: filter,
            startDate: start,
            endDate: end,
            stat:'true',
        };

        res.json(response);

    } catch (err) {
        res.status(500).send(err);
    }
});







router.post('/skindata', common.originMiddle, async function(req, res, next) {
    try {
        var info = req.body;
        var filter = info.filter || '';
        var pageNo = parseInt(info.pageIndex) || 0;
        var sortOrder = info.sortOrder;
        var size = parseInt(info.pageSize);
        var sortName = info.sortActive;
        var srt = {};
        srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
        var query = {};
        query.sort = srt;
        query.skip = size * pageNo;
        query.limit = size;
        var regex = new RegExp(filter, "i");
        // search
        var search = {};

        if(req.body.list == "tradelog") {
            if(filter == "" || filter == undefined) {
                search = {};
            } else {
                search.address_info = filter;
            }
        }

        var start = "";
        if(info.startDate != '' && info.startDate != null) {
            if(moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var startDate = new Date(info.startDate);
                startDate.setDate(startDate.getDate());
                start = startDate.toISOString();
            }
        }
        var end = "";
        if(info.endDate != '' && info.endDate != null) {
            if(moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var endDate = new Date(info.endDate);
                endDate.setDate(endDate.getDate());
                end = endDate.toISOString();
            }
        }

        if(start != '' && end != '') {
            search['$or'] = [{'created_at': { $gte: new Date(start), $lt: new Date(end)}}];
        }

        const skinCountPromise = skin.find(search).countDocuments().exec();
        const skinDataPromise = skin.find(search, {}, query).sort({'created_at': -1}).exec();

        const [skinCount, skinData] = await Promise.all([skinCountPromise, skinDataPromise]);

        const response = {
            status: true,
            data: skinData,
            skinCount: skinCount,
            pageIndex: pageNo,
            pageSize: size,
            sortOrder: sortOrder,
            sortName: sortName,
            filter: filter,
            startDate: start,
            endDate: end,
            stat:'true',
        };

        res.json(response);

    } catch (err) {
        res.status(500).send(err);
    }
});






// router.post('/combodata', common.originMiddle, async function(req, res, next) {
//     try {
//         var info = req.body;
//         var filter = info.filter || '';
//         var pageNo = parseInt(info.pageIndex) || 0;
//         var sortOrder = info.sortOrder;
//         var size = parseInt(info.pageSize);
//         var sortName = info.sortActive;
//         var srt = {};
//         srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
//         var query = {};
//         query.sort = srt;
//         query.skip = size * pageNo;
//         query.limit = size;
//         var regex = new RegExp(filter, "i");
//         // search
//         var search = {};

//         if(req.body.list == "tradelog") {
//             if(filter == "" || filter == undefined) {
//                 search = {};
//             } else {
//                 search.address_info = filter;
//             }
//         }

//         var start = "";
//         if(info.startDate != '' && info.startDate != null) {
//             if(moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
//                 var startDate = new Date(info.startDate);
//                 startDate.setDate(startDate.getDate());
//                 start = startDate.toISOString();
//             }
//         }
//         var end = "";
//         if(info.endDate != '' && info.endDate != null) {
//             if(moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
//                 var endDate = new Date(info.endDate);
//                 endDate.setDate(endDate.getDate());
//                 end = endDate.toISOString();
//             }
//         }

//         if(start != '' && end != '') {
//             search['$or'] = [{'created_at': { $gte: new Date(start), $lt: new Date(end)}}];
//         }

//         const tradeCountPromise = dailycombo.find(search).countDocuments().exec();
//         const tradeDataPromise = dailycombo.find(search, {}, query).sort().exec();

//         const [tradeCount, tradeData] = await Promise.all([tradeCountPromise, tradeDataPromise]);

//         const response = {
//             status: true,
//             data: tradeData,
//             tradeCount: tradeCount,
//             pageIndex: pageNo,
//             pageSize: size,
//             sortOrder: sortOrder,
//             sortName: sortName,
//             filter: filter,
//             startDate: start,
//             endDate: end,
//             stat:'true',
//         };

//         res.json(response);

//     } catch (err) {
//         res.status(500).send(err);
//     }
// });



router.post('/combodata', common.originMiddle, async function(req, res, next) {
    try {
        var info = req.body;
        var filter = info.filter || '';
        var sortOrder = info.sortOrder;
        var sortName = info.sortActive;
        var srt = {};
        srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
        var regex = new RegExp(filter, "i");
        
        // Construct the search query
        var search = {};
        if(req.body.list == "tradelog") {
            if(filter == "" || filter == undefined) {
                search = {};
            } else {
                search.address_info = filter;
            }
        }

        // Handle date filtering
        var start = "";
        if(info.startDate != '' && info.startDate != null) {
            if(moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var startDate = new Date(info.startDate);
                startDate.setDate(startDate.getDate());
                start = startDate.toISOString();
            }
        }
        var end = "";
        if(info.endDate != '' && info.endDate != null) {
            if(moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
                var endDate = new Date(info.endDate);
                endDate.setDate(endDate.getDate());
                end = endDate.toISOString();
            }
        }
        if(start != '' && end != '') {
            search['$or'] = [{'created_at': { $gte: new Date(start), $lt: new Date(end)}}];
        }

        // Fetch all data without pagination
        const tradeCountPromise = dailycombo.find(search).countDocuments().exec();
        const tradeDataPromise = dailycombo.find(search).sort(srt).exec(); // No skip and limit

        const [tradeCount, tradeData] = await Promise.all([tradeCountPromise, tradeDataPromise]);

        const response = {
            status: true,
            data: tradeData,
            tradeCount: tradeCount,
            pageIndex: 0,  // Page index is irrelevant when fetching all data
            pageSize: tradeCount,  // The size is set to the total count
            sortOrder: sortOrder,
            sortName: sortName,
            filter: filter,
            startDate: start,
            endDate: end,
            stat: 'true',
        };

        res.json(response);

    } catch (err) {
        res.status(500).send(err);
    }
});


router.post('/loghistory', common.originMiddle, async function(req, res, next) {
    try {
        var info = req.body;
        var pageNo = parseInt(info.pageIndex) || 0;
        var filter = info.filter;
        var sortOrder = info.sortOrder;
        var size = parseInt(info.pageSize);
        var sortName = info.sortActive;
        
        var query = {};
        var srt = {};
        srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
        srt['date'] = -1; 
        query.sort = srt;
        query.skip = size * pageNo;
        query.limit = size;

        var search = {};
        if (req.body.list === "userlog") {
            if (filter === "" || filter === undefined) {
                search = {};
            } else {
                // Encrypt the filter before querying
                search.first_name = { $regex: new RegExp(filter, 'i') }; 
                // let encryptedFilter = common.encryptParams(filter);
                // console.log(encryptedFilter)
                // search.username = encryptedFilter;
            }

            if (info.startDate && info.endDate) {
                search.created_at = {
                    $gte: new Date(info.startDate),
                    $lte: new Date(info.endDate)
                };
            }
        }

        async function fetchData() {
            try {
                let project = {
                    username: 1,
                    chatId: 1,
                    points: 1,
                    level: 1,
                    score: 1,
                    tap_energy_level: 1,
                    created_at: 1,
                    tap_energy:1,
                    refferal_id:1,
                    refferer_id:1,
                    _id: 1
                };

                const count = await userPoints.find(search).countDocuments().exec();
                const userData = await userPoints.find(search, project).sort(query.sort).skip(query.skip).limit(query.limit).exec();
                const [userCount, userDatas] = await Promise.all([count, userData]);
                return { userCount, userDatas };
            } catch (error) {
                console.error(error);
                throw new Error('Failed to fetch data: ' + error.message);
            }
        }

        fetchData().then(data => {
            if (data) {
                let response = {};
                if (data.userDatas.length === 0) {
                    response.data = data.userDatas;
                    response.userCount = data.userCount;
                    res.json(response);
                } else {
                    response.status = 1;
                    let len = data.userDatas?.length;
                    let i = 0, datas = [];
                    if (len > 0) {
                        data.userDatas.forEach((user) => {
                            console.log(user)
                            let obj = {
                                username: common.decryptParams(user.username), // Decrypt the username
                                chatId: user.chatId,
                                points: user.points,
                                level: user.level,
                                score: user.score,
                                tap_energy_level:user.tap_energy_level,
                                tap_energy:user.tap_energy,
                                refferal_id:user.refferal_id,
                                refferer_id:user.refferer_id,
                                created_at: user.created_at,
                                _id: user._id
                            };

                            datas.push(obj);
                            i = i + 1;
                        });
                    }
                    response.data = datas;
                    response.userCount = data.userCount;
                    res.json(response);
                }
            } else {
                res.json({ status: 0, msg: 'Try Again Later !' });
            }
        }).catch(error => {
            console.error(error)
            res.json({ status: 0, msg: 'Connection Error' });
        });
    } catch (error) {
        return res.json({ status: 0, msg: error.message });
    }
});


// router.post('/loghistory', common.originMiddle, async function(req, res, next) {
//     try {
//         var info = req.body;
//         var pageNo = parseInt(info.pageIndex) || 0;
//         var filter = info.filter;
//         var sortOrder = info.sortOrder;
//         var size = parseInt(info.pageSize);
//         var sortName = info.sortActive;
        
//         var query = {};
//         var srt = {};
//         srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
//         srt['date'] = -1; 
//         query.sort = srt;
//         query.skip = size * pageNo;
//         query.limit = size;

//         var search = {};
//         if (req.body.list === "userlog") {
//             if (filter === "" || filter === undefined) {
//                 search = {};
//             } else {
//                 search.first_name = { $regex: new RegExp(filter, 'i') }; 
//             }

//             if (info.startDate && info.endDate) {
//                 search.created_at = {
//                     $gte: new Date(info.startDate),
//                     $lte: new Date(info.endDate)
//                 };
//             }
//         }

//         async function fetchData() {
//             try {
//                 let project = {
//                     username: 1,
//                     chatId: 1,
//                     points: 1,
//                     level: 1,
//                     score: 1,
//                     tap_energy_level: 1,
//                     created_at: 1,
//                     tap_energy:1,
//                     refferal_id:1,
//                     refferer_id:1,
//                     _id: 1
//                 };

//                 const count = await userPoints.find(search).countDocuments().exec();
//                 const userData = await userPoints.find(search, project).sort(query.sort).skip(query.skip).limit(query.limit).exec();
                
//                 for (let user of userData) {
//                     await updateUserLevelBasedOnPoints(user);
//                 }
                
//                 const [userCount, userDatas] = await Promise.all([count, userData]);
//                 return { userCount, userDatas };
//             } catch (error) {
//                 console.error(error);
//                 throw new Error('Failed to fetch data: ' + error.message);
//             }
//         }

//         async function updateUserLevelBasedOnPoints(user) {
//             try {
//                 const levelData = await levels.findOne({
//                     points_from: { $lte: user.points },
//                     points_upto: { $gte: user.points }
//                 }).exec();

//                 if (levelData) {
//                     if (user.level !== levelData.level) {
//                         await userPoints.updateOne(
//                             { _id: user._id }, 
//                             { $set: { level: levelData.level_name } }
//                         ).exec();
//                     }
//                 }
//             } catch (error) {
//                 console.error(`Failed to update level for user ${user.username}: `, error);
//             }
//         }

//         fetchData().then(data => {
//             if (data) {
//                 let response = {};
//                 if (data.userDatas.length === 0) {
//                     response.data = data.userDatas;
//                     response.userCount = data.userCount;
//                     res.json(response);
//                 } else {
//                     response.status = 1;
//                     let len = data.userDatas?.length;
//                     let i = 0, datas = [];
//                     if (len > 0) {
//                         data.userDatas.forEach((user) => {
//                             let obj = {
//                                 username: common.decryptParams(user.username), 
//                                 chatId: user.chatId,
//                                 points: user.points,
//                                 level: user.level, 
//                                 score: user.score,
//                                 tap_energy_level: user.tap_energy_level,
//                                 tap_energy: user.tap_energy,
//                                 refferal_id: user.refferal_id,
//                                 refferer_id: user.refferer_id,
//                                 created_at: user.created_at,
//                                 _id: user._id
//                             };

//                             datas.push(obj);
//                             i = i + 1;
//                         });
//                     }
//                     response.data = datas;
//                     response.userCount = data.userCount;
//                     res.json(response);
//                 }
//             } else {
//                 res.json({ status: 0, msg: 'Try Again Later !' });
//             }
//         }).catch(error => {
//             console.error(error)
//             res.json({ status: 0, msg: 'Connection Error' });
//         });
//     } catch (error) {
//         return res.json({ status: 0, msg: error.message });
//     }
// });


//send email
router.post('/sendemail', common.userVerify, function(req, res, next) {
	try {
		let info = req.body;
		let tokenVal = validator.isEmpty(info.id);
		if(!tokenVal) {
			var userId=info.id;
			if(userId != '') {
				users.findOne({_id:userId},{status:1,luck_value:1,added_value:1}).then(async function(userRes,userErr) {
					if(userRes && userRes.status == 0) {
						let userEmail = encdec.decryptNew(userRes.luck_value) + encdec.decryptNew(userRes.added_value);
						let encuId = encdec.encryptNew(userRes._id.toString());
						var uri = common.getUrl()+'activate_account?token='+encodeURIComponent(encuId);

						let mailData = {
							"###USER###":userEmail, "###LINK###":uri,"###LINK1###":uri 
						};

						mail.sendMail(userEmail, 'activate_mail', mailData, function(mailRes) {
							if(mailRes){
								return res.json({ status : 1 ,msg:'Link Sended' })
							}else{
								return res.json({ status : 0 ,msg:'Cannot Send Mail' })
							}
						});
					} else {
						res.json({success:0, msg:"Account already activated"});
					}
				});
			}
		} else {
			res.json({success:0, msg:"Invalid Request"});
		}
	} catch(e) {
		res.json({success:0, msg:"Something went wrong"});
	}
})


//userdetails
router.post('/getUser_infos',common.originMiddle, async (req, res) => {
    const info = req.body;
    const encuId = info.UserIdData;
    let usersDetails ;

    try {
        const resData = await userPoints.findOne({ _id:new mongoose.Types.ObjectId(encuId) }).exec();
        // const vendorData = await vendor.find({userId:resData._id}).exec();
        // const vendorlist = await vendorList.find({userId:resData._id}).exec();
        const referredUsers = await userPoints.find({ refferer_id: resData.refferal_id }).exec();

        if (referredUsers.length > 0) {
          usersDetails = referredUsers.map(user => ({
            username: common.decryptParams(user.username),
            points: user.points,
            tap_energy: user.tap_energy,
            level :user.level,
            chatId :user.chatId,
            created_at:user.created_at
          }));
        }


        if (!resData) {
            return res.json({ status: false, msg: "Something went wrong!" });
        }

        const [
            referralledUser,
            walletAddress,
            kycReason
        ] = await Promise.all([
   
            userPoints.findOne({ refer_id: resData.referrer_id }, { _id: 0, luck_value: 1, added_value: 1 }).sort({ 'created_at': -1 }).exec(),
            // userAddress.findOne({ user_id: resData._id }).sort({ 'created_at': -1 }).exec(),
            // kycReasons.find({}).sort({ 'created_at': -1 }).exec(),
            // vendor.find({user_id:resData._id}).exec()
        ]);

        const userInfo = {
            username: common.decryptParams(resData.username),
            chatId:resData.chatId,
            points:resData.points,
            level:resData.level,
            created_at :resData.created_at,
            score: resData.score,
            tap_energy_level: resData.tap_energy_level,
            tap_energy: resData.tap_energy,
            multitap_level:resData.multitap_level,
            refferal_id:resData.refferal_id,
            refferer_id:resData.refferer_id,
            current_energy:resData.current_energy,
            full_energy_count:resData.full_energy_count,
            full_energy_count:resData.full_energy_count,

         };


        const response = {
            userInfo: userInfo,
            referralInfo : usersDetails,
            status: true
        };
        res.json(response);
        
    } catch (error) {
        console.error(error)
        res.status(500).send(error);
    }
});

//upadte userdetails
router.post('/updDetails', common.userVerify, function(req, res, next) {
	try{
		var userid = req.body.id;
		var id=req.userId;var country=req.body.country;var city=req.body.city;
		var state=req.body.state;var phone=req.body.phone;
		var objs = { country:country, city:city, state:state, phone:phone }

		objs.updated_at = updatedDate();
		objs.profile_status = 1;
		users.updateOne({_id:new mongoose.Types.ObjectId(userid)},{$set:objs}).then(function(data,err){
			if(data){
				users.findOne({_id:userid},{_id:0,uid:1}).then(async function(resp,ers){
					if(resp){ 
						var obj={
							admin_id:req.userId,
							M2T_Id:resp.uid,
							action:"user profile updation"
						}
						let result = await adminActivity.create(obj)
						if(result) {
		 					res.json({status:1,msg:"updated"}) 
						}else{
							res.json({status:0,msg:"Invalid Request"})
						}
					}
					if(ers){ res.json({status:0,msg:"something wents wrong"}) }
				})
			}
			if(err){ res.json({status:0,msg:"something wents wrong"}) }
		})
	}catch(err){
		res.json({status : 0 ,msg : err.message})
	}
})

router.post('/updateUseremail', common.userVerify,(req,res) => {
	try{
		var admId=req.userId;
		var email = req.body.email;

		let ValdE = validator.isEmail(email);
		if(ValdE){
			var firstEmail = encdec.encryptNew(email.substr(0, 4));
			var secondEmail = encdec.encryptNew(email.substr(4));
			users.find({$and:[{luck_value:firstEmail,added_value:secondEmail}]}).countDocuments().then(function(userRes,userErr){
				if(userRes){ 
					res.json({status:0,msg:"Email already exists"})
				}else{
					var details = { luck_value:firstEmail, added_value:secondEmail}
					users.updateOne({_id:req.body.userId},{$set:details}).then(async function(resp,err) {
						if(resp){
							var usrInfo = await users.findOne({_id:req.body.userId},{uid:1});
							let actData = { 
								admin_id:admId,
								M2T_Id:usrInfo.uid,
								action:"Update user email"
							};
							await adminActivity.create(actData);
							res.json({status:1,msg:"Email changed successfully"})
						}else{ 
							return res.json({status:0,msg:"Server not found"}) 
						}
					})
				}
			})
		}else{ 
			res.json({status:0,msg:"Enter Valid email"}) 
		}
	}catch(err){
		res.json({status : 0 ,msg : err.message})
	}
})


//reject kyc
router.post('/rejectKYC', common.userVerify,async (req,res) => {
	try{
		let info = req.body;var admId=req.userId;var encuId = req.body.userId;
		var userData = await users.findOne({_id:encuId},{username:1,kyc_status:1,id_status:1,selfie_status:1,addr_status:1,luck_value:1,added_value:1,refer_id:1,id_proof:1,id_proof1:1,selfie_proof:1,addr_proof:1,uid:1}).exec();
		if(userData){
			if(info.type == "id_proof"){ 
				userData.id_status = 2;
				userData.id_reject = info.Reason;
				userData.id_proof = "";
				userData.id_proof1 = "";
			}
			if(info.type == "passport_proof"){ 
				userData.passport_status = 2;
				userData.passport__reject = info.Reason;
				userData.passport_proof = "";
			}
			else if(info.type=="selfie_proof"){ 
				userData.selfie_status = 2;
				userData.selfie_reject = info.Reason;
				userData.selfie_proof = "";
			}


			userData.kyc_status = 1;	
			userData.updated_at=updatedDate();

			users.updateOne({"_id":encuId},{"$set":userData},{multi:true}).then(async function(resUpd,err){
				if(resUpd){
					let actData = {	admin_id:admId,malgo_id:userData.refer_id,action:info.type + " Rejected" };
					await adminActivity.create(actData);
					var userEmail = encdec.decryptNew(userData.luck_value) + encdec.decryptNew(userData.added_value);
					var msg="Reject "+ info.type;
					let mailData={ 
						"###USER###":userData.username,
						"###TYPE###":info.type,
						"###STATUS###":"Rejected",
						"###REASON###":info.Reason,
						"###COPY###":common.getUrl()
					};

					let message = "Your KYC " + info.type +" Process Rejected"
					let userAct = await common.userAct(encuId,userData.uid,message)
					let mailResponse = await mail.sendMail(userEmail,"kyc_verify", mailData);
					res.json({success:1,msg:msg,kycInfo:userData});
				}else{ 
					return res.json({success:0,msg:"Invalid Request"}) 
				}
			}) 	
		}else{ 
			return res.json({success:0,msg:"User not found"}) 
		}
	}catch(err){
		res.json({status : 0 ,msg : err.message})
	}
	
});

router.post('/updateKyc', common.userVerify, async (req,res) => {
	try{
		let info = req.body;var admId=req.userId;var encuId = req.body.userId;
		var userData=await users.findOne({_id:encuId},{username:1,kyc_status:1,id_status:1,selfie_status:1,addr_status:1,luck_value:1,added_value:1,refer_id:1,id_proof:1,id_proof1:1,selfie_proof:1,addr_proof:1,uid:1, passport_proof:1}).exec();
		if(userData){
			if(info.type == "id_proof"){ 
				userData.id_status = 3;userData.id_reject = ""
			}else if(info.type == "selfie_proof"){ 
				userData.selfie_status = 3;userData.selfie_reject = "" 
			} 
			else{
			     userData.passport_status = 3;userData.selfie_reject = "" 
			}

			if(userData.id_status == 3 && userData.selfie_status == 3 && userData.addr_status == 3 && userData.passport_status == 3){
				userData.kyc_status = 4; 
			}
			if(userData.id_status == 3 && userData.selfie_status== 3 || userData.id_status && userData.passport_status == 3){
				userData.kyc_status = 3;
			}else if(userData.id_status == 3 && userData.selfie_status == 3 && userData.passport_status == 3 || userData.passport_status==2 || userData.selfie_status==3){
				userData.kyc_status = 3; 
			}

			userData.updated_at = updatedDate();
			users.updateOne({"_id":encuId},{"$set":userData},{multi:true}).then(async function(resUpd,err){
				let actData = { admin_id:admId,malgo_id:userData.refer_id,action:info.type + " Approved" };
				await adminActivity.create(actData);
				var userEmail = encdec.decryptNew(userData.luck_value) + encdec.decryptNew(userData.added_value);

				var msg=(userData.kyc_status== 3 || userData.kyc_status == 4) ? "Approved KYC " : "Approved "+info.type
				if((userData.id_status == 3 && userData.selfie_status == 3 && userData.addr_status == 3 && userData.passport_status == 3)||(userData.id_status == 3 && userData.selfie_status == 3 && userData.passport_status == 3)){
					let mailData={
						"###USER###":userData.username,
						"###TYPE###":"kyc",
						"###STATUS###":"Approved",
						"###REASON###":"",
						"###COPY###":common.getUrl()
					};

					let message = "Your KYC Has Been Approved"
					let userAct = await common.userAct(encuId,userData.uid,message)

					let mailResponse = await mail.sendMail(userEmail,"kyc_verify", mailData);
				}
				res.json({success:1,msg: "Approved KYC status successfully",kycInfo:userData});
			})
		}else{ 
			return res.json({success:0,msg:"User not found"}) 
		}
	}catch(err){
		res.json({status : 0 ,msg : err.message})
	}
});





router.post('/gettradelist',async (req, res) => {
    try {
        const resData = await levels.find().exec();
        if (!resData) {
            return res.json({ success: 2, msg: "No data" , data : resData});
        }
        res.json({ success: 1, data: resData });
    } catch (error) {
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});



router.post('/energylist', async (req, res) => {
    try {
        const info = req.body;
        const resData = await energy.findOne({ _id: info.id }).exec();

        if (!resData) {
            return res.json({ success: 2, msg: "No data", data: resData });
        }
        res.json({
            success: 1,
            data: {
            levelData: resData,
            }
        });
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});



router.post('/multilist', async (req, res) => {
    try {
        const info = req.body;
        const resData = await multiTap.findOne({ _id: info.id }).exec();

        if (!resData) {
            return res.json({ success: 2, msg: "No data", data: resData });
        }
        res.json({
            success: 1,
            data: {
            levelData: resData,
            }
        });
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});


router.post('/dailylist', async (req, res) => {
    try {
        const info = req.body;
        const resData = await dailyRewards.findOne({ _id: info.id }).exec();
        if (!resData) {
            return res.json({ success: 2, msg: "No data", data: resData });
        }
        res.json({
            success: 1,
            data: {
            levelData: resData,
            }
        });
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});




router.post('/skinlist', async (req, res) => {
    try {
        const info = req.body;
        const resData = await skin.findOne({ _id: info.id }).exec();
        if (!resData) {
            return res.json({ success: 2, msg: "No data", data: resData });
        }
        res.json({
            success: 1,
            data: {
            levelData: resData,
            }
        });
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});


router.post('/tradelist', async (req, res) => {
    try {
        const info = req.body;
        const resData = await levels.findOne({ _id: info.id }).exec();
        if (!resData) {
            return res.json({ success: 2, msg: "No data", data: resData });
        }
        res.json({
            success: 1,
            data: {
            levelData: resData,
            }
        });
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});


router.post('/banklist', async (req, res) => {
    try {
        const info = req.body;
        const resData = await bank.findOne({ _id: info.id }).exec();
        if (!resData) {
            return res.json({ success: 2, msg: "No data", data: resData });
        }
        res.json({
            success: 1,
            data: {
            levelData: resData,
            }
        });
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});



router.post('/combolist', async (req, res) => {
    try {
        const info = req.body;
        const resData = await dailycombo.findOne({ _id: info.id }).exec();
        if (!resData) {
            return res.json({ success: 2, msg: "No data", data: resData });
        }
        res.json({
            success: 1,
            data: {
            levelData: resData,
            }
        });
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});



router.post('/notifylist', async (req, res) => {
    try {
        const info = req.body;
        const resData = await notify.findOne({ _id: info.id }).exec();
        if (!resData) {
            return res.json({ success: 2, msg: "No data", data: resData });
        }
        res.json({
            success: 1,
            data: {
            levelData: resData,
            }
        });
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});


router.post('/manageSave', async (req, res) => {
  try {
    const { _id, telegramAccount, xAccount, exchangeAccount, invite ,bankAccount} = req.body;
    console.log(req.body)

    if (!_id) {
      return res.status(400).json({ success: 0, message: 'ID is required' });
    }

    if (!Array.isArray(invite) || !invite.every(item => typeof item === 'object')) {
      return res.status(400).json({ success: 0, message: 'Invalid invite data' });
    }

    const updatedReward = await manageRewards.findByIdAndUpdate(
      _id, // Use _id here
      {
        telegramAccount,
        xAccount,
        exchangeAccount,
        invite,
        bankAccount
      },
      { new: true }
    );

    if (!updatedReward) {
      return res.status(404).json({ success: 0, message: 'Reward not found' });
    }

    res.status(200).json({ success: 1, message: 'Rewards updated successfully', data: updatedReward });
  } catch (error) {
    console.error('Error updating rewards:', error);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});

// router.post('/manageSave', async (req, res) => {
//   try {
//     const { id, telegramAccount, xAccount, exchangeAccount, invite } = req.body;
//    console.log(req.body)
//     // Find reward by ID and update it
//     let reward;
//     if (id) {
//       reward = await manageRewards.findOne({_id:id});
//       console.log('reward',reward)
//       if (reward) {
//         reward.telegramAccount = telegramAccount;
//         reward.xAccount = xAccount;
//         reward.exchangeAccount = exchangeAccount;
//         reward.invite = invite;
//       } else {
//         return res.status(404).json({ success: 0, message: 'Reward not found' });
//       }
//     } else {
//       // If ID is not provided, create a new reward
//       reward = new manageRewards({ telegramAccount, xAccount, exchangeAccount, invite });
//     }

//     await reward.save();
//     res.status(200).json({ success: 1, message: 'Rewards saved successfully', data: reward });
//   } catch (error) {
//     console.error('Error saving rewards:', error);
//     res.status(500).json({ success: 0, message: 'Internal server error' });
//   }
// });


router.post('/managelist', async (req, res) => {
    try {
        const info = req.body;
        const resData = await manageRewards.findOne({ _id: info.id }).exec();
        if (!resData) {
            return res.json({ success: 2, msg: "No data", data: resData });
        }
        res.json({
            success: 1,
            data: {
            levelData: resData,
            }
        });
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});





router.post('/vdeolist', async (req, res) => {
    try {
        const info = req.body;
        const resData = await video.findOne({ _id: info.id }).exec();
        if (!resData) {
            return res.json({ success: 2, msg: "No video found", data: resData });
        }
        res.json({
            success: 1,
            data: {
            levelData: resData,
            }
        });
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});

router.post('/saveNotify', async (req, res) => {
  try {
    const newMessage = new notify({message: req.body.data});
    await newMessage.save();
    res.json({ msg: 'Message saved successfully' ,status:1});
  } catch (error) {
    res.status(500).send({ error: 'Failed to save message',status:0 });
  }
});



router.post('/manageSaveMinigame', async (req, res) => {
  try {
    const { _id, minigame } = req.body;

    if (!_id) {
      return res.status(400).json({ success: 0, message: 'ID is required' });
    }

    const updatedReward = await manageRewards.findByIdAndUpdate(
      _id,
      {
        minigame
      },
      { new: true }
    );

    if (!updatedReward) {
      return res.status(404).json({ success: 0, message: 'minigame not found' });
    }

    res.status(200).json({ success: 1, message: 'minigame updated successfully', data: updatedReward });
  } catch (error) {
    console.error('Error updating minigame:', error);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});



module.exports = router;