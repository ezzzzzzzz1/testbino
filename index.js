import express from 'express';
import axios from 'axios'; // محتاج تعمل npm install axios

const app = express();
app.use(express.json());

let orderQueue = [];

// 1. استقبال الأوردر من شوبيفاي
app.post('/webhook/order-created', (req, res) => {
    try {
        const body = req.body;
        const newOrder = {
            id: body.id,
            order_number: body.name,
            customer_name: `${body.customer?.first_name || ''} ${body.customer?.last_name || ''}`,
            phone: body.shipping_address?.phone || body.customer?.phone || "",
            total: body.total_price,
            modelid: body.line_items?.[0]?.sku, // أول SKU كمثال
            variant: body.line_items?.[0]?.variant_title,
            payment_type: body.payment_gateway_names?.[0] === 'manual' ? 'Cash' : 'Online'
        };

        orderQueue.push(newOrder);
        res.status(200).send('OK');
    } catch (err) {
        res.status(500).send('Error');
    }
});

// 2. الـ Endpoint اللي هتعملها Call كل 10 دقائق
app.get('/api/get-next-order', async (req, res) => {
    try {
        if (orderQueue.length === 0) {
            // حالة 2: Warning (مفي? أوردرات حالياً)
            return res.status(200).json(2);
        }

        const nextOrder = orderQueue.shift(); // ناخد أقدم أوردر

        // عمل Call للـ API الخارجي بتاعك
        const externalApiUrl = 'https://binokids.com/BinoKidsAPIv3/ShopiFySite/GetOrders';
        
        await axios.post(externalApiUrl, nextOrder);

        // حالة 1: Success (تم الإرسال بنجاح)
        return res.status(200).json(1);

    } catch (error) {
        console.error('External API Error:', error.message);
        // حالة 3: Error (حصل مشكلة أثناء الـ Call)
        return res.status(500).json(3);
    }
});

export default app;
// import express from 'express';
// import bodyParser from 'body-parser';

// const app = express();
// app.use(bodyParser.json());

// // مصفوفة (قائمة انتظار) بدلاً من متغير واحد
// let orderQueue = [];

// // 1. استقبال الأوردر الجديد (بيضيفه في نهاية القائمة)
// // app.post('/webhook/order-created', (req, res) => {
// //     const newOrder = {
// //         id: req.body.id,
// //         name: req.body.name,
// //         total: req.body.total_price,
// //         customer: req.body.customer?.first_name,
// //         received_at: new Date()
// //     };
    
// //     orderQueue.push(newOrder); // إضافة للطابور
// //     console.log(`✅ أوردر جديد انضم للطابور! (إجمالي الأوردرات: ${orderQueue.length})`);
// //     return res.status(200).json({ status: 'success' });
// // });
// app.post('/webhook/order-created', (req, res) => {
//     const body = req.body;

//     const newOrder = {
//         id: body.id,
//         order_number: body.name, // رقم الأوردر (مثلاً #1001)
//         total: body.total_price,
//         currency: body.currency, // العملة (EGP, USD...)
        
//         // بيانات العميل
//         customer_name: `${body.customer?.first_name || ''} ${body.customer?.last_name || ''}`,
//         phone: body.shipping_address?.phone || body.customer?.phone || "لا يوجد رقم",email: body.email,

//         // العنوان بالتفصيل
//         address: {
//             city: body.shipping_address?.city,
//             address1: body.shipping_address?.address1,
//             address2: body.shipping_address?.address2,
//             province: body.shipping_address?.province, // المحافظة
//             country: body.shipping_address?.country,
//         },

//         // طريقة الدفع
//         // شوبيفاي يرسلها كقائمة، نأخذ أول طريقة مستخدمة
//         payment_method: body.payment_gateway_names?.length > 0 
//             ? body.payment_gateway_names[0] 
//             : "غير محدد",
        
//         // هل تم الدفع أم كاش؟
//         financial_status: body.financial_status, // (paid = مدفوع فيزا، pending = غالباً كاش عند الاستلام)
//         shipping_price: body.shipping_lines?.[0]?.price || "0.00", // تكلفة الشحن
//         // المنتجات المطلوبة (قائمة بكل منتج وكميته)
//         items: body.line_items?.map(item => ({
//             title: item.title,
//             variant_title: item.variant_title, // (مثلاً: Red / XL)
//             quantity: item.quantity,
//             price: item.price,
//             modelid: item.sku
//         })),
//         customer_note: body.note || "",
//         received_at: new Date()
//     };

//     orderQueue.push(newOrder);
//     console.log(`✅ أوردر جديد تم استلامه من ${newOrder.customer_name}`);
//     return res.status(200).json({ status: 'success' });
// });
// // 2. استعراض الأقدم (أول واحد دخل هو اللي هيخرج)
// app.get('/api/get-next-order', (req, res) => {
//     if (orderQueue.length === 0) {
//         return res.status(200).json({ message: 'لا توجد أوردرات حالياً' });
//     }
    
//     // إخراج أول أوردر في القائمة (FIFO - First In, First Out)
//     const nextOrder = orderQueue.shift(); 
    
//     console.log('📦 تم تسليم أوردر للعميل، المتبقي في الطابور:', orderQueue.length);
//     res.status(200).json({ 
//         status: 'order_received', 
//         remaining: orderQueue.length,
//         data: nextOrder 
//     });
// });

// export default app;
// // import express from 'express';


// // import bodyParser from 'body-parser';

// // const app = express();
// // app.use(bodyParser.json());

// // // مصفوفة مؤقتة لتخزين الأوردرات (هتتمسح لو الـ server عمل restart)
// // let ordersDatabase = [];

// // // 1. استقبال الأوردرات من شوبيفاي (Webhook)
// // app.post('/webhook/order-created', (req, res) => {
// //     const orderData = req.body;
    
// //     // إضافة الأوردر للمصفوفة
// //     ordersDatabase.push({
// //         id: orderData.id,
// //         name: orderData.name,
// //         total: orderData.total_price,
// //         customer: orderData.customer?.first_name,
// //         received_at: new Date()
// //     });

// //     console.log('✅ تم حفظ أوردر جديد رقم:', orderData.name);
    
// //     return res.status(200).json({ status: 'success' });
// // });

// // // 2. استعراض الأوردرات (الـ GET اللي أنت عايزه)
// // app.get('/api/orders', (req, res) => {
// //     res.status(200).json({
// //         count: ordersDatabase.length,
// //         orders: ordersDatabase
// //     });
// // });

// // export default app;
// // import express from 'express';
// // import bodyParser from 'body-parser';

// // const app = express();
// // app.use(bodyParser.json());

// // let latestOrder = null;

// // // 1. استقبال الأوردر الجديد (بيسجل الأوردر وبيمسح أي أوردر قديم كان موجود)
// // app.post('/webhook/order-created', (req, res) => {
// //     latestOrder = {
// //         id: req.body.id,
// //         name: req.body.name,
// //         total: req.body.total_price,
// //         customer: req.body.customer?.first_name,
// //     };
// //     console.log('✅ أوردر جديد تم استلامه:', latestOrder.name);
// //     return res.status(200).json({ status: 'success' });
// // });

// // // 2. استعراض الأوردر ومسحه فوراً بعد العرض (Read & Delete)
// // app.get('/api/orders', (req, res) => {
// //     if (!latestOrder) {
// //         return res.status(200).json({ message: 'لا توجد أوردرات حالياً' });
// //     }
    
// //     // حفظ الأوردر في متغير مؤقت عشان نرده
// //     const current = latestOrder;
    
// //     // مسح الأوردر من الذاكرة (كأنك عملت له Marking as Done)
// //     latestOrder = null;
    
// //     console.log('🗑️ تم مسح الأوردر بعد الاستلام');
// //     res.status(200).json({ status: 'order_received', data: current });
// // });

// // export default app;