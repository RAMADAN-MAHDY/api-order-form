import express from 'express';
import connectDB from './db.js';
import Conditions from './chsma/condition.js';
import User from './chsma/createuser.js';
import Commitionschma from './chsma/commitionadmin.js';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from "socket.io";
import Notification from './chsma/notification.js';
import nodemailer from 'nodemailer';
const app = express()
const port = 5000;

const server = createServer(app);
const io = new Server(server,{
    cors:{
        origin:'http://localhost:3000'
    }
});

  
io.on('connection', async (socket) => {
    console.log('عميل متصل:', socket.id);

    // إرسال الإشعارات غير المقروءة عند الاتصال
    const notifications = await Notification.find({ seenBy: { $ne: socket.id } });
    if (notifications.length > 0) {
        socket.emit('unread-notifications', notifications);
    }

    socket.on('disconnect', () => {
        console.log('عميل مفصول:', socket.id);
    });

    // تحديث الإشعارات كمقروءة
    socket.on('mark-as-read', async (notificationIds) => {
        await Notification.updateMany(
            { _id: { $in: notificationIds } },
            { $addToSet: { seenBy: socket.id } }
        );
    });
});
const corsOptions = {
    //https://royal-corner.vercel.app
    origin: 'https://royal-corner.vercel.app',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
  
app.use(cors(corsOptions));

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



// إعداد nodemailer باستخدام حساب Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ramadanmahdy45@gmail.com',
      pass: 'zulqwsnqkyxhjure' // استخدم كلمة مرور التطبيقات الخاصة بك هنا
    }
  });




app.post('/login',async (req,res)=>{
try{
const {email , password ,code} = req.body;
const checkemail = await User.findOne({code});
const isnamevalid = await email ===checkemail.email;

if(!checkemail || !isnamevalid){
    return res.status(500).json("يرجي التاكد من الحساب واعادة المحاوله")
}
const ispasswordValid = await password === checkemail.password;

// للتحقق من الباسورد
const hashedPassword = checkemail.password; 
const hashedPasswordbcrypt =await bcrypt.compare(password, hashedPassword)




// const ispasswordValidbcrypt = await bcrypt.compare(password ,checkemail.password );

if(!ispasswordValid && !hashedPasswordbcrypt){
    return res.status(500).json("يرجي التاكد من الحساب واعادة المحاوله")
}
return res.status(200).json({ message: 'Login successful' });

}catch(err){
    return res.status(500).json("خطأ في التسجيل");
}

})


//create an account 
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
    // const hashedpassword = await bcrypt.hash(password , 10)

// لتشفير الباسورد
const saltRounds = 10;

const hashedpassword =await bcrypt.hash(password, saltRounds)




    await User.create({email, password : hashedpassword , code})
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

        //sent message to gmail
        const mailOptions = {
            from: 'ramadanmahdy45@gmail.com', // عنوان المرسل
            to: ['ahmedmahdy20105@gmail.com' , 'magedzein7@gmail.com'], // عنوان المستلم (حساب Gmail الخاص بك)
            subject: `حالة جديدة: ${name}/${code}`, // موضوع البريد
            text: `تم إضافة حالة جديدة من ${name} بكود ${code}.`, // نص البريد
            html: `<p>تم إضافة حالة جديدة من <strong>${name}</strong> بكود <strong>${code}</strong>.</p>` // محتوى HTML للبريد
        };
        

        // const info = await transporter.sendMail(mailOptions);
        // console.log('Message sent: %s', info.messageId);
        // res.send(`Email sent successfully: ${info.messageId}`);

// إرسال البريد الإلكتروني
await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('حدث خطأ أثناء إرسال البريد الإلكتروني:', error);
    } else {
      console.log('تم إرسال البريد الإلكتروني بنجاح:', info.response);
    }})

        const notification = new Notification({
            message: `تمت إضافة حالة جديدة بكود ${code}`,
        });
        await notification.save();

        console.log('إرسال حدث حالة جديدة بالكود:', code);
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
        const mailOptions = {
            from: 'ramadanmahdy45@gmail.com', // عنوان المرسل
            to: ['ahmedmahdy20105@gmail.com' , 'magedzein7@gmail.com'], // عنوان المستلم (حساب Gmail الخاص بك)
            subject: `  طلب العموله من الكود :/${code}`, // موضوع البريد
            text: `  طلب العموله  بكود ${code}.`, // نص البريد
            html: `<p>تم إضافة طلب عموله جديد من الكود <strong>${code}</strong>.</p>` // محتوى HTML للبريد
        };
// إرسال البريد الإلكتروني
    await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('حدث خطأ أثناء إرسال البريد الإلكتروني:', error);
    } else {
      console.log('تم إرسال البريد الإلكتروني بنجاح:', info.response);
    }})

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

app.post("/Commitionschma", async (req, res) => {
    try {
        const { commition , id } = req.body;

        if (!id || !commition) {
            return res.status(400).json({ err: 'Code and commition are required' });
        }

        const commitionfond = await Commitionschma.findOne({ id });

        if (commitionfond) {
            commitionfond.commition = commition;
            await commitionfond.save();
            return res.status(200).json(commitionfond); // إرسال الاستجابة وتوقف التنفيذ
        } else {
            console.log(id + "done-------");
            const newCommition = await Commitionschma.create({ commition ,id });
            return res.status(200).json(newCommition); // إرسال الاستجابة وتوقف التنفيذ
        }
    } catch (err) {
        console.error(err); // طباعة الخطأ للتصحيح
        return res.status(500).json({ err: 'Failed to retrieve conditions' });
    }
});

app.get("/Commitionschma" , async(req,res)=>{
   
    try{
        const getCommitionschma = await Commitionschma.find()
        res.status(200).json(getCommitionschma);
        
 
    }catch(error){
     res.status(500).json({ error: error.message });
    }
 })
 app.get('/lengthoforder', async (req, res) => {
    try {
        const conditions = await Conditions.find();

        if (conditions && conditions.length > 0) {
            const codeList = conditions.map(condition => condition.code);
            
            const findPromises = codeList.map(async code => {
                const findcode = await Conditions.findOne({ code });
                if (findcode) {
                    return { code, conditionsLength: findcode.conditions.length };
                } else {
                    console.log(`Code ${code} not found in conditions`);
                    return null; // or handle as needed
                }
            });

            const results = await Promise.all(findPromises);
            return res.status(200).json(results.filter(result => result !== null));
        } else {
            return res.status(404).json({ message: 'No conditions found' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});



app.get('/user', async (req, res) => {
  try {
    const conditions = await User.find();
    res.json(conditions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve conditions' });
  }
});
// put the order by admin
app.put('/update/:id/:code', async (req, res) => {
    const { id, code } = req.params;
    const requestData = req.body;

    try {
        // إعداد كائن التحديث
        let updateFields = {};
        for (let key in requestData) {
            if (requestData.hasOwnProperty(key)) {
                updateFields[`conditions.$.${key}`] = requestData[key];
            }
        }

        // استخدام findOneAndUpdate لتحديث الحقول المحددة
        const updateResult = await Conditions.findOneAndUpdate(
            { code, 'conditions._id': id },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updateResult) {
            return res.status(404).json({ message: 'User or condition not found' });
        }

        res.status(200).json({ message: "Data update successful", updatedCondition: updateResult });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});









app.delete('/item/:code/:id', async (req, res) => {
    try {
        const code = req.params.code;
        const id = req.params.id;

        // تحديث الكائن وسحب العنصر من المصفوفة
        const updatedCondition = await Conditions.updateOne(
            { code: code },
            { $pull: { conditions: { _id: id } } }
        );

        if (updatedCondition.nModified === 0) {
            return res.status(404).send('العنصر غير موجود');
        }

        res.send('تم حذف العنصر بنجاح.');
    } catch (error) {
        res.status(500).send('حدث خطأ أثناء محاولة الحذف');
    }
});
// async function findClientByName(clientName) {
//     try {
//         const result = await Conditions.findOne(
//             { 'conditions.clientname': clientName } 
//         );
//         if (result) {
//             // عرض الكود الخاص بالوثيقة التي تحتوي على الشرط المطابق
//             console.log('Code found:', result.code);
//             return result.code;
//         } else {
//             console.log('Client not found');
//             return null;
//         }
//     } catch (error) {
//         console.error("Error finding client by name:", error);
//         throw error;
//     }
// }

// // استخدام الدالة للبحث عن عميل معين
// findClientByName('ramadan').then(client => {
//     if (client) {
//         console.log('Client found:', client);
//     } else {
//         console.log('Client not found');
//     }
// });

async function findCodeByClientName(clientName) {
    try {
        // استخدام aggregate للبحث عن اسم العميل والحصول على الكود
        const result = await Conditions.aggregate([
            { $match: { 'conditions.clientname': clientName } },
            { $unwind: '$conditions' },
            { $match: { 'conditions.clientname': clientName } },
            { $project: { code: 1, _id: 0 } }
        ]);

        if (result.length > 0) {
            console.log('Code found:', result[0].code);
            return result[0].code;
        } else {
            console.log('Client not found');
            return null;
        }
    } catch (error) {
        console.error("Error finding client by name:", error);
        throw error;
    }
}

// استخدام الدالة للبحث عن الكود بناءً على اسم العميل


app.post('/search/:name' , async (req, res)=>{
    try{
        const {name } = req.params;
 
        if(!name){
        res.status(500).json({message :"Name parameter is missing" });

        }
       const code =await findCodeByClientName(name);
            if (code) {
                console.log('Code:', code);
                res.status(200).json({code});
            } else {
                console.log('Code not found');
                res.status(500).json({message:"Client not found in the database"});
            }
      



    }catch(error){
        res.status(500).json({ error: error.message });
    }



});



app.get('/', (req, res) => {

  res.send('Hello World!')
})

server.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})