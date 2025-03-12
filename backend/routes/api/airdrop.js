const mongoose = require('mongoose');
const common = require('../../helpers/common');
const express = require('express');

let router = express.Router();

const userWallet = require('../../model/userWallets');
const { updateSkin } = require('./skin.js');

router.post('/updateUserWalletAddress', common.originMiddle, async (req,res) => {
	try{
    let info = req.body;
			if(info.walletAddress){
				let updation = { walletAddress: info.walletAddress, walletSts : 1  };
				let updateUserWallet = await userWallet.updateOne({chatId : info.chatId},updation).exec();
				if(updateUserWallet){
					return res.json({status : 1, msg: "Wallet Address Updated"});
				}else{
					return res.json({status : 0, msg: "Error Updating User Wallet"});					
				}
			} else{
				return res.json({status : 0, msg: "Please Connect Wallet"});
			}
	} catch(error) {
		res.json({status:0, msg:error.message});
	}
})


router.get('/manifest', async (req, res) => {
    try {
    	let response = {};
    	response.url = "https://game.shahnameh-bot.io";
    	response.name = "Shahnameh";
    	response.iconUrl = "https://game.shahnameh-bot.io/assets/images/airdrop_coin.png";

        res.json(response);
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});

module.exports = router;
