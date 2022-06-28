const mongoose=require('mongoose');
const express=require('express');


const  randomFixedInteger = function (length) {
    return Math.floor(Math.pow(10, length-1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length-1) - 1));
}


module.exports.createOtpModel=function(expiresIn){
    if(!expiresIn || expiresIn<=0 || !Number.isInteger(expiresIn)){
        throw new "Please provide expiresIn parameter as a postive integer";
    }
    const otpSchema=new mongoose.Schema({
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Admin',
            required:true,
            unique:true,
        },
        otp:{
            type:Number,
            required:true
        },
        createdAt:{
            type:Date,
            default:Date.now(),
            expires:expiresIn
        },
        whatsappNo:{
            type:String,
            required:true
        }
        
    })
    const otp=mongoose.model('otp',otpSchema);
    return otp;
}


module.exports.verifyNumber=async function(userModel,field,num){
    let data;
    if(!userModel||!field||!num){
        throw "userModel, field and num args should all be present";
    }
    try{
        let obj={}
        obj[`${field}`]=num;
         data=await  userModel.findOne(obj).select('whatsappNo _id');
    }
    catch(err){
        throw err;
    }
    
    if(!data){
        return null;
    }

    return  data._doc;
}


module.exports.queryOtpGen=async function(otpModel,otpLength,id,whatsappNo){
    if(!otpModel||!otpLength||otpLength===0){
        throw "Missing args "
    }
    const _otp=randomFixedInteger(otpLength);
    try{
        const exsists=await otpModel.findOne({userId:id}).select('id');

        
        if(!exsists){
            const data=  await otpModel.create({userId:id,otp:_otp,whatsappNo});
            data.sent=true;
            return data;
        }
        else{
            console.log({userId:exsists._id},{otp:_otp});
            const data= await otpModel.findOneAndUpdate({_id:exsists._id},{otp:_otp},{
                new:true,
                runValidators:true
            });
            data.sent=true;
            return data;
        }
    }
    catch(err){
        throw err;
    }
}

module.exports.verifyOtpGen=async function(otpModel,otp,whatsappNo){
    if(!otp||!otpModel||!whatsappNo){
        throw "Missing args";
    }
    try{
        const result=await otpModel.findOne({whatsappNo});
        if(!result){
            return {
            passed:false,
            message:"sorry the otp has either expired or is not sent please try again!!",
            id:null
            }
        }
        console.log(result);
        if(result.otp===otp){
           return  {
                passed:true,
                message:"Successfully logged in!",
                id:result.userId
            }
        }
        else{
            return {
                passed:false,
                message:"Wrong OTP entered!!!",
                id:null
            }
        }
    }
    catch(err){
        throw err;
    }
}



