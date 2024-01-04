const PORT =8000
const express = require('express')
const mongoose = require('mongoose')
const uri = 'mongodb+srv://NawfAbdullah:jvzWr0LqQXVI8Brt@cluster0.u5osv.mongodb.net/tech-hospital?retryWrites=true&w=majority'
const {v4:uuidv4} = require('uuid')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')

mongoose.connect(uri)


app = express()
app.use(cors())
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));



const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

const productSchema = new mongoose.Schema({
	product_id:String,
	product_name:String,
	qty:Number,
	cost:Number,
})

const orderSchema = new mongoose.Schema({
	orderId:String,
	products:[productSchema],
	paymentStatus:Boolean,
	total:Number
})

const userSchema = new mongoose.Schema({
        email:String,
        user_id:String,
        hashed_password:String,
        name:String,
        address:String,
        contact:String,
        orders:[orderSchema]
    })




const User = mongoose.model("User",userSchema);



app.get('/',(req,res)=>{
	res.send("Code is running")
})

app.post('/signup',async (req,res)=>{
	const {email,password} = req.body
	console.log(email)
	console.log(password)
	const generateduserId = uuidv4();
	const hashedPassword = await bcrypt.hash(password,10)
	console.log(hashedPassword)
	user = new User({
             'email':email.toLowerCase(),
             'hashed_password':hashedPassword,
             'user_id':generateduserId,
             'name':'',
		     'contact':'',
		     'address':'',
            })
  
    User.exists({'email':email}, function (err, doc) {
        if (err){
            console.log(err)
        }else{
                if(doc){
                    res.status(409).send('user exist')
                }else{
                    user.save()
                    console.log('added')
                     const token = jwt.sign({
		             'email':email.toLowerCase(),
		             'hashed_password':hashedPassword,
		             'user_id':generateduserId,
		              'name':'',
		              'contact':'',
		              'address':'',
		              orders:[]
		            },email.toLowerCase(),{
		    						expiresIn:60*24
		    					})
                    res.status(201).json({token,userId:generateduserId})
                  
                    }
                }
            });


})



app.post('/login',async (req,res)=> {
	const {email,password} = req.body
	console.log(password)
	User.findOne({'email':email},(err,user)=>{
		if(err){console.log(err)}else{
			if(user){
				bcrypt.compare(password,user.hashed_password,(err,isValid)=>{
					if(!err){
					if(isValid){
						console.log(user)
						 const token = jwt.sign({
			             'email':user.email,
			             'hashed_password':user.hashed_password,
			             'user_id':user.user_id
			            },user.email.toLowerCase(),{
			    				expiresIn:60*24
		    			})
						console.log('token: ',token)
						res.status(201).send({token,userId:user.user_id,email:user.email})
					}else{
						console.log('Invalid')
						res.status(201).send({error:'invalid credentials'})
					}}else{
						console.log(err)
					}

				})
			}else{
				res.send({thethingis:'not exist'})
			}
		}
	})
})

app.get('/user',async (req,res)=>{
	const userId = req.query.userId
	User.find({user_id:userId},(err,user)=>{
		res.send(user)
	})
})


app.put('/user/:userId',async (req,res)=>{
	const userId = req.params.userId
	const details = req.body
	console.log(details)
	User.updateOne({user_id:userId}, details,{new: true},(err,user)=>{
		if(!err){
			res.status(200).send(user)
		}else{
			console.log(err)
			res.status(500).send(err)
		}
	});
})

app.put('/placeOrder/:userId',async (req,res)=>{
	const orders = JSON.parse(req.body.order)
	const products = []
	User.findOne({user_id:req.params.userId},(err,user)=>{
		for (var i = orders.products.length - 1; i >= 0; i--) {
			if(orders.products[i]!==null){
				products.push(orders.products[i])
			}
		}
		user.orders.push({orderId:uuidv4(),products:products,paymentStatus:false})
		user.save(err=>{
	      	if(err){
	      		console.log(err)
	      	}else{
	      		res.send({data:'success'})
	      	}
	      });
	})
})


app.listen(PORT,()=>{
	console.log('Server started at ',PORT)
})
