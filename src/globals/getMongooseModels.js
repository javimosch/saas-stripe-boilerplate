const mongoose = require('mongoose')
module.exports = function getMongooseModels(arr){
    let obj = {}
    arr.forEach(key=>{
        obj[key] = mongoose.model(key)
    })
    return obj
}