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
import removeAccents  from "remove-accents";
const app = express()
const port = 5000;

const server = createServer(app);

// const io = new Server(server,{
//     cors:{
//         origin:'http://localhost:3000'
//     }
// });

  
// io.on('connection', async (socket) => {
//     console.log('عميل متصل:', socket.id);

//     // إرسال الإشعارات غير المقروءة عند الاتصال
//     const notifications = await Notification.find({ seenBy: { $ne: socket.id } });
//     if (notifications.length > 0) {
//         socket.emit('unread-notifications', notifications);
//     }

//     socket.on('disconnect', () => {
//         console.log('عميل مفصول:', socket.id);
//     });

//     // تحديث الإشعارات كمقروءة
//     socket.on('mark-as-read', async (notificationIds) => {
//         await Notification.updateMany(
//             { _id: { $in: notificationIds } },
//             { $addToSet: { seenBy: socket.id } }
//         );
//     });
// });
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

// سكريبت لنقل البيانات او تقسيمها من مخطط كبير لعدة مخططات صغيره
async function migrateOldConditions() {
    try {
        // البحث عن المستندات التي تحتوي على أكثر من 15 طلبًا
        const conditions = await Conditions.find({code:1200});

        console.log(conditions);

            // تحقق من وجود مستندات تتجاوز الحد
            if (conditions.length === 0) {
                console.log('لا توجد مستندات تحتوي على أكثر من 15 طلبًا.');
                return; // إيقاف العملية إذا لم يكن هناك مستندات تتجاوز الحد
            }
    
        for (const condition of conditions) {
            const { code, name, conditions: allConditions } = condition;

            // تقسيم الطلبات إلى مجموعات من 10 طلبًا
            const chunks = [];
            for (let i = 0; i < allConditions.length; i += 10) {
                const chunk = allConditions.slice(i, i + 10);
                chunks.push({ code, name, conditions: chunk });
            }

            // إنشاء المستندات الجديدة
            const newDocs = await Conditions.insertMany(chunks);

            // تحقق من أن المستندات الجديدة تم إنشاؤها بنجاح
            for (const newDoc of newDocs) {
                const existing = await Conditions.findOne({ _id: newDoc._id });
                if (!existing) {
                    throw new Error(`لم يتم العثور على المستند الجديد بعد إنشائه: ${newDoc._id}`);
                }
            }

            // حذف المستندات القديمة بعد التأكد من أن البيانات تم ترحيلها بنجاح
            await Conditions.deleteOne({ _id: "666c5ce0149b9c28fb0f04e3"});
        
        }
        console.log(conditions );

        console.log('تم ترحيل الطلبات بنجاح');
    } catch (error) {
        console.error('خطأ في ترحيل الطلبات:', error);
    }
}

// تشغيل السكربت   ------------------------------------------------------
// migrateOldConditions();


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
        let existingCondition = await Conditions.findOne({ code }).sort({_id:-1});

        if (existingCondition && existingCondition.conditions.length < 15) {
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

// put  commition request        
app.put('/condition/:code/:conditionId', async (req, res) => {
    try {
        const { code, conditionId } = req.params;
        const { commitionreq } = req.body;

        if (!commitionreq) {
            return res.status(400).json({ error: 'State is required.' });
        }

        const updatedCondition = await Conditions.findOneAndUpdate(
            { code: code, 'conditions._id': conditionId },
            { $set: { 'conditions.$.commitionreq': commitionreq } }, // تحديث حالة الشرط الفرعي
            { new: true, runValidators: true } // إرجاع المستند المحدث والتحقق من صحة التحديث
        );

        if (!updatedCondition) {
            return res.status(404).json('Condition or sub-condition not found');
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

    const subCondition = updatedCondition.conditions.id(conditionId);


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

        // استخدام findOneAndUpdate لتحديث الشرط الفرعي مباشرة
        const updatedCondition = await Conditions.findOneAndUpdate(
            { code: code, 'conditions._id': conditionId },
            { $set: { 'conditions.$.state': state } }, // تحديث حالة الشرط الفرعي
            { new: true, runValidators: true } // إرجاع المستند المحدث والتحقق من صحة التحديث
        );

        if (!updatedCondition) {
            return res.status(404).json('Condition or sub-condition not found');
        }

        // الحصول على الشرط الفرعي المحدث من المستند المحدث
        const subCondition = updatedCondition.conditions.id(conditionId);

        res.status(200).json(subCondition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// get datails condition
app.get("/condition/:id" , async(req,res)=>{
   
    try{
     const { id }= req.params ; 
 
     const finddetails = await Conditions.find({code: id});
    
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
        // استخدام استعلام مجمع للحصول على جميع المستندات من Conditions
        const conditions = await Conditions.aggregate([
            // إلغاء تجميع الشروط ضمن المجموعات بناءً على الكود
            { $unwind: "$conditions" },
            // تجميع البيانات بناءً على الكود وحساب الطول
            {
                $group: {
                    _id: "$code",
                    conditionsLength: { $sum: 1 } // حساب عدد الشروط
                }
            }
        ]);

        if (conditions && conditions.length > 0) {
            return res.status(200).json(conditions);
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
        const { code, id } = req.params;

        // تحويل id إلى ObjectId إذا كان من نوع String
        // const objectId = mongoose.Types.ObjectId.isValid(id) ? mongoose.Types.ObjectId(id) : id;

        // العثور على جميع الوثائق التي تحتوي على الكود
        const conditions = await Conditions.find({ code: code });

        if (conditions.length === 0) {
            return res.status(404).json({ message: 'لم يتم العثور على أي وثائق تحتوي على الكود المحدد' });
        }

        let deletionResult = false;

        // تحديث كل وثيقة تحتوي على الكود وسحب العنصر من المصفوفة
        for (const condition of conditions) {
            const result = await Conditions.updateOne(
                { _id: condition._id, 'conditions._id': id },
                { $pull: { conditions: { _id: id } } }
            );

            if (result.modifiedCount > 0) {
                deletionResult = true; // إذا تم التحديث في أي وثيقة، قم بتعيين نتيجة الحذف كنجاح
                break; // إيقاف الحلقة بمجرد العثور على العنصر وحذفه
            }
        }

        if (!deletionResult) {
            return res.status(404).json({ message: 'العنصر غير موجود أو تم حذفه مسبقاً من جميع الوثائق' });
        }

        res.status(200).json({ message: 'تم حذف العنصر بنجاح من الوثيقة الأولى التي تحتوي عليه' });
    } catch (error) {
        console.error('حدث خطأ أثناء محاولة الحذف:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء محاولة الحذف' });
    }
});

function normalizeArabic(text) {
    // إزالة التشكيل
    const textWithoutAccents = removeAccents(text);
    // إزالة المسافات البيضاء الزائدة
    const normalizedText = textWithoutAccents.trim();
    return normalizedText;
}

async function findCodeByClientName(clientName) {
    try {
        // تطبيع الاسم العربي
        const normalizedClientName = normalizeArabic(clientName);

        const result = await Conditions.aggregate([
            { $match: { 'conditions.clientname': normalizedClientName } },
            { $unwind: '$conditions' },
            { $match: { 'conditions.clientname': normalizedClientName } },
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
        const decodedName = decodeURIComponent(name).trim();
        const code = await findCodeByClientName(decodedName);

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

// api gimini key     AIzaSyBA-GGARuigekKJiVClyv40Ez20tladO3Y