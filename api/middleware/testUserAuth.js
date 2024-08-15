const { BadRequestError } = require("../errors")

const testUserAuth = (req,res,next) => {
    if(req.user.testUser){
       throw new BadRequestError('Test user! read only')
    }
    next()
}

module.exports = testUserAuth