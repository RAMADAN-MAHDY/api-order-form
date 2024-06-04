import express from 'express';
import connectDB from './db.js';
import Conditions from './chsma/condition.js';
import User from './chsma/createuser.js';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from "socket.io";

const app = express()
const port = 5000;

const server = createServer(app);
const io = new Server(server,{
    cors:{
        origin:'https://royal-corner.vercel.app'
    }
});

  
  app.use(cors());
  
io.on('connection', (socket) => {
    console.log('عميل متصل');

    // استمع لرسائل العميل
    socket.on('message', (data) => {
        console.log('رسالة جديدة:', data);
        // إرسال الرسالة إلى جميع العملاء
        io.emit('message', data);
    });

    // استمع لفصل العميل
    socket.on('disconnect', () => {
        console.log('عميل مفصول');
    });
});

app.use((req, res, next) => {
    const contentLength = parseInt(req.get('content-length'), 10);
    console.log(`حجم البيانات: ${contentLength} bytes`);
    next();
  });
  // زيادة الحد الأقصى لحجم البيانات المسموح به
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));
connectDB();
// app.use(express.json())
//log in 
app.post('/login',async (req,res)=>{
try{
const {email , password ,code} = req.body;
const checkemail = await User.findOne({code});
if(!checkemail){
    return res.status(500).json("يرجي التاكد من الحساب واعادة المحاوله")
}
const ispasswordValid = await bcrypt.compare(password ,checkemail.password );

if(!ispasswordValid){
    return res.status(500).json("يرجي التاكد من الحساب واعادة المحاوله")
}
return res.status(200).json({ message: 'Login successful' });

}catch(err){
    return res.status(500).json("خطأ في التسجيل");
}

})


//post account 
app.post('/user',async (req,res)=>{
try{
    const {email, password , code} = req.body;

    if (!email || !password || !code) {
        return res.status(400).json({ message: "All fields are required." });
    }
    const checkemail =await User.findOne({email})
    const checkecode =await User.findOne({code})
    if(checkemail || checkecode){
        return res.status(300).json("جرب حساب اخر ")
    }
    const hashedpassword = await bcrypt.hash(password , 10)
    await User.create({email, password:hashedpassword , code})
    return res.status(200).json("تم انشاء الحساب");

}catch(err){
   return res.status(500).json({message : err.message})
}
})


//post conditon to conditions array
app.post('/condition', async (req, res) => {
    try {
        const { name , code , stateDetail, } = req.body;
        
        if (!stateDetail) {
            return res.status(400).json({ error: 'الحقول المطلوبة مفقودة' });
        }

        // إضافة الوقت الحالي إلى stateDetail
        stateDetail.timestamp = new Date();

        // البحث عن السجل الموجود باستخدام الكود
        let existingCondition = await Conditions.findOne({ code });

        if (existingCondition) {
            // إذا كان السجل موجودًا، أضف stateDetail إلى الحقل conditions
            existingCondition.conditions.push(stateDetail);
            await existingCondition.save();
        } else {
            // إذا لم يكن السجل موجودًا، قم بإنشاء سجل جديد
            await Conditions.create({ code, name, conditions: [stateDetail] });
        }
        io.emit('new-condition', { code });

        res.status(200).json({ message: 'تمت إضافة تفاصيل الحالة بنجاح' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// put condition data 
app.put('/condition/:code/:conditionId', async (req, res) => {
    try {
        const { code, conditionId } = req.params;
        const { commitionreq } = req.body;

        if (!commitionreq) {
            return res.status(400).json({ error: 'State is required.' });
        }

        const condition = await Conditions.findOne({ code });

        if (!condition) {
            return res.status(404).json('Condition not found');
        }

        const subCondition = condition.conditions.id(conditionId);
        if (!subCondition) {
            return res.status(404).json('Sub-condition not found');
        }

        subCondition.commitionreq = commitionreq;

        await condition.save();

        res.status(200).json(subCondition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT condition data by code and conditionId
app.put('/condition/state/:code/:conditionId', async (req, res) => {
    try {
        const { code, conditionId } = req.params;
        const { state } = req.body;

        if (!state) {
            return res.status(400).json({ error: 'State is required.' });
        }

        const condition = await Conditions.findOne({ code });

        if (!condition) {
            return res.status(404).json('Condition not found');
        }

        const subCondition = condition.conditions.id(conditionId);
        if (!subCondition) {
            return res.status(404).json('Sub-condition not found');
        }

        subCondition.state = state;

        await condition.save();

        res.status(200).json(subCondition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// get datails condition
app.get("/condition/:id" , async(req,res)=>{
   
   try{
    const { id }= req.params ; 

    const finddetails = await Conditions.findOne({code: id});

  if(!finddetails){
    return  res.status(500).json("حدث خطا");
  }

  return res.status(200).json(finddetails);


   }catch(error){
    res.status(500).json({ error: error.message });
   }
})


app.get('/user', async (req, res) => {
  try {
    const conditions = await User.find();
    res.json(conditions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve conditions' });
  }
});


app.get('/', (req, res) => {

  res.send('Hello World!')
})
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('new-condition', (data) => {
    });
});

server.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})