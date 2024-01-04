// import { MongoClient } from "mongodb";
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import process from 'process';
import dotenv from 'dotenv';
import moment from 'moment-timezone';
import path from 'path';
// import moment from 'moment';

dotenv.config();
// const uri = process.env.MONGODB;
const uri = 'mongodb+srv://lekien2k2:letankien@cluster0.myjs2qo.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(uri)
    .then(() => {
        console.log("Connected to MongoDB!");
    })
    .catch((error) => {
        console.log(error)
    });

    

const app = express();
app.use(cors());

app.use(express.json());
// app.use(cookieParser())

const __dirname = path.resolve();
app.listen(3000, () => {
    console.log("Server is running on port 3000!");
});



//get all
app.get('/rooms', async (req, res) => {
    try {
        const rooms = await mongoose.connection.db.collection('rooms').find({}).toArray();
        res.header('Access-Control-Allow-Origin', '*');
        res.json(rooms);
        // console.log(res.json(rooms));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//get by room
app.get('/rooms/:device_id', async (req, res) => {
    const deviceId = req.params.device_id;
    try {
        const rooms = await mongoose.connection.db.collection('rooms').find({ device_id: deviceId }).toArray();
        res.header('Access-Control-Allow-Origin', '*');
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// lặp  5p, không có trong khoảng đó thì trả về null
app.get('/rooms_5minutes/:device_id/:start_date/:end_date', async (req, res) => {
    const deviceId = req.params.device_id;
    const startDate = req.params.start_date;
    const endDate = req.params.end_date;

    const startOfDay = new Date(`${startDate}T10:00:00Z`); // Bắt đầu từ 10h00
    const endOfDay = new Date(`${endDate}T11:00:00Z`); // Kết thúc lúc 11h00

    const intervalMinutes = 5;
    const resultArray = []; // Mảng để lưu kết quả truy vấn

    try {
        // Lặp qua từng khoảng thời gian mỗi 5 phút
        for (let currentTime = startOfDay; currentTime <= endOfDay; currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes)) {
            const startOfInterval = new Date(currentTime);
            const endOfInterval = new Date(currentTime);
            endOfInterval.setMinutes(endOfInterval.getMinutes() + intervalMinutes);

            const startOfInterval1 = startOfInterval.toISOString().replace(/\.\d{3}Z$/, 'Z');
            const endOfInterval1 = endOfInterval.toISOString().replace(/\.\d{3}Z$/, 'Z');

            const query = { device_id: deviceId, time: { $gte: startOfInterval1, $lt: endOfInterval1 } };
            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Kiểm tra nếu không tìm thấy giá trị thì đẩy null vào mảng
            if (rooms.length > 0) {
                resultArray.push(rooms[0]);
            } else {
                resultArray.push(null);
            }
        }

        res.header('Access-Control-Allow-Origin', '*');
        res.json(resultArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//--------------------------------------------------------------------
// NGÀY HIỆN TẠI, KHOẢNG THỜI GIAN 1 TIẾNG, LẤY Ở CUỐI GIỜ ĐÓ
app.get('/rooms_1hour/:device_id', async (req, res) => {
    const deviceId = req.params.device_id;

    var currentDate = new Date();

    // Xác định múi giờ cho Việt Nam
    var vietnamTimeZone = 'Asia/Ho_Chi_Minh';

    // Chuyển đổi múi giờ
    var options = { timeZone: vietnamTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' };
    var formatter = new Intl.DateTimeFormat('en-US', options);

    // Lấy mảng chứa ngày, tháng, năm
    var dateArray = formatter.formatToParts(currentDate).map(part => part.value);

    // Xây dựng chuỗi theo định dạng năm-tháng-ngày
    var formattedDate = `${dateArray[4]}-${dateArray[0]}-${dateArray[2]}`;


    // console.log("formattedDate", formattedDate);

    const startOfDay = new Date(`${formattedDate}T00:00:00Z`); // Bắt đầu từ 00h00
    const endOfDay = new Date(`${formattedDate}T23:59:59Z`); // Kết thúc lúc 23h59

    const intervalHours = 1;
    const resultArray = []; 

    try {
        // Lặp qua từng khoảng thời gian mỗi 1 giờ
        for (let currentTime = new Date(startOfDay); currentTime <= endOfDay; currentTime.setHours(currentTime.getHours() + intervalHours)) {
            const startOfInterval = new Date(currentTime);
            const endOfInterval = new Date(currentTime);
            
            // Kiểm tra nếu là khoảng cuối cùng (24h00), đặt thời điểm kết thúc là 23h59:59
            if (currentTime.getHours() === 23) {
                endOfInterval.setHours(23, 59, 59);
            } else {
                endOfInterval.setHours(endOfInterval.getHours() + intervalHours); // Không trừ 1 giờ để kết thúc vào phút đầu tiên của giờ tiếp theo
            }

            const startOfInterval1 = startOfInterval.toISOString().replace(/\.\d{3}Z$/, 'Z');
            const endOfInterval1 = endOfInterval.toISOString().replace(/\.\d{3}Z$/, 'Z');

            const query = { device_id: deviceId, time: { $gte: startOfInterval1, $lt: endOfInterval1 } };
            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Kiểm tra nếu không tìm thấy giá trị thì đẩy null vào mảng
            if (rooms.length > 0) {
                resultArray.push(rooms[0]);
            } else {
                resultArray.push(null);
            }
        }

        res.header('Access-Control-Allow-Origin', '*');
        res.json(resultArray);
        // console.log(resultArray)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


//TEST
app.get('/rooms_1hour_test/:device_id', async (req, res) => {
    const deviceId = req.params.device_id;

    var currentDate = new Date();

    // Xác định múi giờ cho Việt Nam
    var vietnamTimeZone = 'Asia/Ho_Chi_Minh';

    // Chuyển đổi múi giờ
    var options = { timeZone: vietnamTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' };
    var formatter = new Intl.DateTimeFormat('en-US', options);

    // Lấy mảng chứa ngày, tháng, năm
    var dateArray = formatter.formatToParts(currentDate).map(part => part.value);

    // Xây dựng chuỗi theo định dạng năm-tháng-ngày
    var formattedDate = `${dateArray[4]}-${dateArray[0]}-${dateArray[2]}`;

    // console.log("formattedDate", formattedDate);

    const startOfDay = new Date(`${formattedDate}T00:00:00Z`); // Bắt đầu từ 00h00
    const endOfDay = new Date(`${formattedDate}T23:59:59Z`); // Kết thúc lúc 23h59

    const intervalHours = 1;
    const resultArray = [];

    try {
        // Lặp qua từng khoảng thời gian mỗi 1 giờ
        for (let currentTime = new Date(startOfDay); currentTime <= endOfDay; currentTime.setHours(currentTime.getHours() + intervalHours)) {
            const startOfInterval = new Date(currentTime);
            const endOfInterval = new Date(currentTime);

            // Kiểm tra nếu là khoảng cuối cùng (24h00), đặt thời điểm kết thúc là 23h59:59
            if (currentTime.getHours() === 23) {
                endOfInterval.setHours(23, 59, 59);
            } else {
                endOfInterval.setHours(endOfInterval.getHours() + intervalHours); // Không trừ 1 giờ để kết thúc vào phút đầu tiên của giờ tiếp theo
            }

            const startOfInterval1 = startOfInterval.toISOString().replace(/\.\d{3}Z$/, 'Z');
            const endOfInterval1 = endOfInterval.toISOString().replace(/\.\d{3}Z$/, 'Z');

            // Lấy giá trị cuối cùng trước thời điểm hiện tại từ các ngày trước đó
            

            // Lấy giá trị cuối cùng trong khoảng thời gian hiện tại
            const queryCurrentInterval = { device_id: deviceId, time: { $gte: startOfInterval1, $lt: endOfInterval1 } };
            const roomsCurrentInterval = await mongoose.connection.db.collection('rooms').find(queryCurrentInterval).sort({ time: -1 }).limit(1).toArray();

            // Kiểm tra nếu không tìm thấy giá trị thì đẩy null vào mảng
            if (roomsCurrentInterval.length > 0) {
                resultArray.push(roomsCurrentInterval[0]);
            } else {
                resultArray.push(null);
            }
        }

        // Lấy giá trị trước ngày đó sớm nhất
        const startDateGetLastValue = startOfDay.toISOString().replace(/\.\d{3}Z$/, 'Z');
        const queryLastValueBeforeCurrentDate = { device_id: deviceId, time: { $lt: startDateGetLastValue } };
        const lastValueBeforeCurrentDateResult = await mongoose.connection.db.collection('rooms')
                                                                                        .find(queryLastValueBeforeCurrentDate)
                                                                                        .sort({ time: -1 })
                                                                                        .limit(1)
                                                                                        .toArray();

        const responseObj = {
            lastValueBeforeCurrentDate: lastValueBeforeCurrentDateResult,
            resultArray: resultArray
        };

        res.header('Access-Control-Allow-Origin', '*');
        res.json(responseObj);
        console.log(responseObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});





//-----------------------------------------------------
//NGÀY TỚI NGÀY, LẤY THEO GIỜ
app.get('/rooms_1hour/:device_id/:start_date/:end_date', async (req, res) => {
    const deviceId = req.params.device_id;
    const startDate = req.params.start_date;
    const endDate = req.params.end_date;

    const startOfDay = new Date(`${startDate}T00:00:00Z`); // Bắt đầu từ 00h00
    const endOfDay = new Date(`${endDate}T23:59:59Z`); // Kết thúc lúc 23h59

    const intervalHours = 1;
    const resultArray = []; // Mảng để lưu kết quả truy vấn

    try {
        // Lặp qua từng khoảng thời gian mỗi 1 giờ
        for (let currentTime = new Date(startOfDay); currentTime <= endOfDay; currentTime.setHours(currentTime.getHours() + intervalHours)) {
            const startOfInterval = new Date(currentTime);
            const endOfInterval = new Date(currentTime);
            
            // Kiểm tra nếu là khoảng cuối cùng (24h00), đặt thời điểm kết thúc là 23h59:59
            if (currentTime.getHours() === 23) {
                endOfInterval.setHours(23, 59, 59);
            } else {
                endOfInterval.setHours(endOfInterval.getHours() + intervalHours); // Không trừ 1 giờ để kết thúc vào phút đầu tiên của giờ tiếp theo
            }

            const startOfInterval1 = startOfInterval.toISOString().replace(/\.\d{3}Z$/, 'Z');
            const endOfInterval1 = endOfInterval.toISOString().replace(/\.\d{3}Z$/, 'Z');

            const query = { device_id: deviceId, time: { $gte: startOfInterval1, $lt: endOfInterval1 } };
            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Kiểm tra nếu không tìm thấy giá trị thì đẩy null vào mảng
            if (rooms.length > 0) {
                resultArray.push(rooms[0]);
            } else {
                resultArray.push(null);
            }
        }

        res.header('Access-Control-Allow-Origin', '*');
        res.json(resultArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//TEST
app.get('/rooms_1hour_test/:device_id/:start_date/:end_date', async (req, res) => {
    const deviceId = req.params.device_id;
    const startDate = req.params.start_date;
    const endDate = req.params.end_date;

    const startOfDay = new Date(`${startDate}T00:00:00Z`); // Bắt đầu từ 00h00
    const endOfDay = new Date(`${endDate}T23:59:59Z`); // Kết thúc lúc 23h59

    const intervalHours = 1;
    const resultArray = []; // Mảng để lưu kết quả truy vấn

    try {
        // Lặp qua từng khoảng thời gian mỗi 1 giờ
        for (let currentTime = new Date(startOfDay); currentTime <= endOfDay; currentTime.setHours(currentTime.getHours() + intervalHours)) {
            const startOfInterval = new Date(currentTime);
            const endOfInterval = new Date(currentTime);
            
            // Kiểm tra nếu là khoảng cuối cùng (24h00), đặt thời điểm kết thúc là 23h59:59
            if (currentTime.getHours() === 23) {
                endOfInterval.setHours(23, 59, 59);
            } else {
                endOfInterval.setHours(endOfInterval.getHours() + intervalHours); // Không trừ 1 giờ để kết thúc vào phút đầu tiên của giờ tiếp theo
            }

            const startOfInterval1 = startOfInterval.toISOString().replace(/\.\d{3}Z$/, 'Z');
            const endOfInterval1 = endOfInterval.toISOString().replace(/\.\d{3}Z$/, 'Z');

            const query = { device_id: deviceId, time: { $gte: startOfInterval1, $lt: endOfInterval1 } };
            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Kiểm tra nếu không tìm thấy giá trị thì đẩy null vào mảng
            if (rooms.length > 0) {
                resultArray.push(rooms[0]);
            } else {
                resultArray.push(null);
            }
        }
        // Lấy giá trị trước ngày đó sớm nhất
        const startDateGetLastValue = startOfDay.toISOString().replace(/\.\d{3}Z$/, 'Z');
        const queryLastValueBeforeCurrentDate = { device_id: deviceId, time: { $lt: startDateGetLastValue } };
        const lastValueBeforeCurrentDateResult = await mongoose.connection.db.collection('rooms')
                                                                                        .find(queryLastValueBeforeCurrentDate)
                                                                                        .sort({ time: -1 })
                                                                                        .limit(1)
                                                                                        .toArray();

        const responseObj = {
            lastValueBeforeCurrentDate: lastValueBeforeCurrentDateResult,
            resultArray: resultArray
        };

        res.header('Access-Control-Allow-Origin', '*');
        res.json(responseObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//------------------------------------------------------------
// MỘT THÁNG, LẤY Ở CUỐI NGÀY
// 
app.get('/rooms_1day/:device_id/:year/:month', async (req, res) => {
    const deviceId = req.params.device_id;
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    // Validate the year and month inputs
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Invalid year or month input.' });
    }

    // Format the month with a leading zero if it's a single digit
    const formattedMonth = month < 10 ? `0${month}` : month;

    const startOfMonth = new Date(`${year}-${formattedMonth}-01T00:00:00Z`);
    const endOfMonth = new Date(new Date(startOfMonth).setMonth(startOfMonth.getMonth() + 1) - 1);

    const resultArray = []; // Array to store query results

    try {
        // Loop through each day within the specified month
        for (let currentDay = new Date(startOfMonth); currentDay <= endOfMonth; currentDay.setDate(currentDay.getDate() + 1)) {
            const startOfDay = new Date(currentDay);
            const endOfDay = new Date(currentDay);
            endOfDay.setHours(23, 59, 59);

            const query = {
                device_id: deviceId,
                time: { $gte: startOfDay.toISOString(), $lt: endOfDay.toISOString() }
            };

            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Push either the last record or null to the result array
            resultArray.push(rooms.length > 0 ? rooms[0] : null);
        }

        res.header('Access-Control-Allow-Origin', '*');
        res.json(resultArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


//TEST
app.get('/rooms_1day_test/:device_id/:year/:month', async (req, res) => {
    const deviceId = req.params.device_id;
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    // Validate the year and month inputs
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Invalid year or month input.' });
    }

    // Format the month with a leading zero if it's a single digit
    const formattedMonth = month < 10 ? `0${month}` : month;

    const startOfMonth = new Date(`${year}-${formattedMonth}-01T00:00:00Z`);
    const endOfMonth = new Date(new Date(startOfMonth).setMonth(startOfMonth.getMonth() + 1) - 1);

    const resultArray = []; // Array to store query results

    try {
        // Loop through each day within the specified month
        for (let currentDay = new Date(startOfMonth); currentDay <= endOfMonth; currentDay.setDate(currentDay.getDate() + 1)) {
            const startOfDay = new Date(currentDay);
            const endOfDay = new Date(currentDay);
            endOfDay.setHours(23, 59, 59);

            const query = {
                device_id: deviceId,
                time: { $gte: startOfDay.toISOString(), $lt: endOfDay.toISOString() }
            };

            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Push either the last record or null to the result array
            resultArray.push(rooms.length > 0 ? rooms[0] : null);
        }

        // Lấy giá trị trước ngày đó sớm nhất
        const startDateGetLastValue = startOfMonth.toISOString().replace(/\.\d{3}Z$/, 'Z');
        const queryLastValueBeforeCurrentDate = { device_id: deviceId, time: { $lt: startDateGetLastValue } };
        const lastValueBeforeCurrentDateResult = await mongoose.connection.db.collection('rooms')
                                                                                        .find(queryLastValueBeforeCurrentDate)
                                                                                        .sort({ time: -1 })
                                                                                        .limit(1)
                                                                                        .toArray();

        const responseObj = {
            lastValueBeforeCurrentDate: lastValueBeforeCurrentDateResult,
            resultArray: resultArray
        };

        res.header('Access-Control-Allow-Origin', '*');
        res.json(responseObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//------------------------------------------------------
//MỘT TUẦN, LẤY Ở CUỐI NGÀY
// app.get('/rooms_1day_week/:device_id', async (req, res) => {
//     const deviceId = req.params.device_id;

//     const currentDate = new Date();
//     const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
//     const startOfWeek = new Date(currentDate);
//     startOfWeek.setDate(currentDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); // Adjust to the start of the week (Monday)

//     const endOfWeek = new Date(startOfWeek);
//     endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to the end of the week (Sunday)

//     console.log("startOfWeek", startOfWeek.toISOString());
//     console.log("endOfWeek", endOfWeek.toISOString());

//     const resultArray = []; // Array to store query results

//     try {
//         // Loop through each day of the current week
//         for (let currentDay = new Date(startOfWeek); currentDay <= endOfWeek; currentDay.setDate(currentDay.getDate() + 1)) {
//             const startOfDay = new Date(currentDay);
//             const endOfDay = new Date(currentDay);
//             endOfDay.setHours(23, 59, 59);

//             const query = {
//                 device_id: deviceId,
//                 time: { $gte: startOfDay.toISOString(), $lt: endOfDay.toISOString() }
//             };

//             const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

//             // Push either the last record or null to the result array
//             resultArray.push(rooms.length > 0 ? rooms[0] : null);
//         }


//         res.header('Access-Control-Allow-Origin', '*');
//         res.json(resultArray);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });
app.get('/rooms_1day_week/:device_id', async (req, res) => {
    const deviceId = req.params.device_id;

    // Set the timezone to Indochina Time (ICT)
    const timezoneOffset = 7 * 60; // UTC+7
    const currentDate = new Date(new Date().getTime() + timezoneOffset * 60 * 1000);

    const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Adjust to the start of the week (Monday) at 00:00:00.000Z
    const startOfWeek = new Date(currentDate);
    startOfWeek.setUTCHours(0, 0, 0, 0);
    startOfWeek.setDate(currentDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

    // Set to the end of the week (Sunday) at 23:59:59.999Z
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCHours(23, 59, 59, 999);
    endOfWeek.setDate(endOfWeek.getDate() + 6 + (currentDay === 0 ? 1 : 0)); // Adjust for Sunday end

    const resultArray = []; // Array to store query results

    try {
        // Loop through each day of the current week
        for (let currentDay = new Date(startOfWeek); currentDay <= endOfWeek; currentDay.setDate(currentDay.getDate() + 1)) {
            const startOfDay = new Date(currentDay);
            const endOfDay = new Date(currentDay);
            endOfDay.setUTCHours(23, 59, 59, 999);

            const query = {
                device_id: deviceId,
                time: { $gte: startOfDay.toISOString(), $lt: endOfDay.toISOString() }
            };

            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Push either the last record or null to the result array
            resultArray.push(rooms.length > 0 ? rooms[0] : null);
        }

        // console.log("startOfWeek", startOfWeek.toISOString());
        // console.log("endOfWeek", endOfWeek.toISOString());

        

        res.header('Access-Control-Allow-Origin', '*');
        res.json(resultArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//TEST
app.get('/rooms_1day_week_test/:device_id', async (req, res) => {
    const deviceId = req.params.device_id;

    // Set the timezone to Indochina Time (ICT)
    const timezoneOffset = 7 * 60; // UTC+7
    const currentDate = new Date(new Date().getTime() + timezoneOffset * 60 * 1000);

    const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Adjust to the start of the week (Monday) at 00:00:00.000Z
    const startOfWeek = new Date(currentDate);
    startOfWeek.setUTCHours(0, 0, 0, 0);
    startOfWeek.setDate(currentDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

    // Set to the end of the week (Sunday) at 23:59:59.999Z
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCHours(23, 59, 59, 999);
    endOfWeek.setDate(endOfWeek.getDate() + 6 + (currentDay === 0 ? 1 : 0)); // Adjust for Sunday end

    const resultArray = []; // Array to store query results

    try {
        // Loop through each day of the current week
        for (let currentDay = new Date(startOfWeek); currentDay <= endOfWeek; currentDay.setDate(currentDay.getDate() + 1)) {
            const startOfDay = new Date(currentDay);
            const endOfDay = new Date(currentDay);
            endOfDay.setUTCHours(23, 59, 59, 999);

            const query = {
                device_id: deviceId,
                time: { $gte: startOfDay.toISOString(), $lt: endOfDay.toISOString() }
            };

            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Push either the last record or null to the result array
            resultArray.push(rooms.length > 0 ? rooms[0] : null);
        }

        // console.log("startOfWeek", startOfWeek.toISOString());
        // console.log("endOfWeek", endOfWeek.toISOString());

        // Lấy giá trị trước ngày đó sớm nhất
        const startDateGetLastValue = startOfWeek.toISOString().replace(/\.\d{3}Z$/, 'Z');
        const queryLastValueBeforeCurrentDate = { device_id: deviceId, time: { $lt: startDateGetLastValue } };
        const lastValueBeforeCurrentDateResult = await mongoose.connection.db.collection('rooms')
                                                                                        .find(queryLastValueBeforeCurrentDate)
                                                                                        .sort({ time: -1 })
                                                                                        .limit(1)
                                                                                        .toArray();

        const responseObj = {
            lastValueBeforeCurrentDate: lastValueBeforeCurrentDateResult,
            resultArray: resultArray
        };

        res.header('Access-Control-Allow-Origin', '*');
        res.json(responseObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// -----------------------------------------------------------------
//MỘT NĂM HIỆN TẠI, LẤY CUỐI THÁNG
app.get('/rooms_1mon_year/:device_id', async (req, res) => {
    const deviceId = req.params.device_id;

    const currentDate = new Date();
    const resultArray = [];

    try {
        // Loop through each month of the current year
        for (let currentMonth = 0; currentMonth < 12; currentMonth++) {
            // Set the start of the month at 00:00:00.000Z
            const startOfMonth = new Date(Date.UTC(currentDate.getUTCFullYear(), currentMonth, 1, 0, 0, 0, 0));

            // Set the end of the month at 23:59:59.999Z
            const endOfMonth = new Date(Date.UTC(currentDate.getUTCFullYear(), currentMonth + 1, 0, 23, 59, 59, 999));

            const query = {
                device_id: deviceId,
                time: { $gte: startOfMonth.toISOString(), $lt: endOfMonth.toISOString() }
            };
            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Push either the last record or null to the result array
            resultArray.push(rooms.length > 0 ? rooms[0] : null);
        }

        res.header('Access-Control-Allow-Origin', '*');
        res.json(resultArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//TEST
app.get('/rooms_1mon_year_test/:device_id', async (req, res) => {
    const deviceId = req.params.device_id;

    const currentDate = new Date();
    const resultArray = [];

    try {
        // Loop through each month of the current year
        for (let currentMonth = 0; currentMonth < 12; currentMonth++) {
            // Set the start of the month at 00:00:00.000Z
            const startOfMonth = new Date(Date.UTC(currentDate.getUTCFullYear(), currentMonth, 1, 0, 0, 0, 0));

            // Set the end of the month at 23:59:59.999Z
            const endOfMonth = new Date(Date.UTC(currentDate.getUTCFullYear(), currentMonth + 1, 0, 23, 59, 59, 999));

            // console.log("startOfMonth", startOfMonth.toISOString());
            // console.log("endOfMonth", endOfMonth.toISOString());

            const query = {
                device_id: deviceId,
                time: { $gte: startOfMonth.toISOString(), $lt: endOfMonth.toISOString() }
            };
            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Push either the last record or null to the result array
            resultArray.push(rooms.length > 0 ? rooms[0] : null);
        }

        const currentMonth1 = 0;
        const startOfMonth = new Date(Date.UTC(currentDate.getUTCFullYear(), currentMonth1, 1, 0, 0, 0, 0));

        // console.log("startOfMonth", startOfMonth.toISOString());

        // Lấy giá trị trước ngày đó sớm nhất
        const startDateGetLastValue = startOfMonth.toISOString().replace(/\.\d{3}Z$/, 'Z');
        const queryLastValueBeforeCurrentDate = { device_id: deviceId, time: { $lt: startDateGetLastValue } };
        const lastValueBeforeCurrentDateResult = await mongoose.connection.db.collection('rooms')
                                                                                        .find(queryLastValueBeforeCurrentDate)
                                                                                        .sort({ time: -1 })
                                                                                        .limit(1)
                                                                                        .toArray();

        const responseObj = {
            lastValueBeforeCurrentDate: lastValueBeforeCurrentDateResult,
            resultArray: resultArray
        };

        res.header('Access-Control-Allow-Origin', '*');
        res.json(responseObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


//---------------------------------------------------------------------------

//CẦN NGHIÊN CỨU CÁI NÀY
// ngày tới ngày, từng ngày
app.get('/rooms_day_to_day/:device_id/:start_date/:end_date', async (req, res) => {
    const deviceId = req.params.device_id;
    const startDate = new Date(req.params.start_date);
    const endDate = new Date(req.params.end_date);

    // Validate that startDate is before endDate
    if (startDate >= endDate) {
        return res.status(400).json({ error: 'Invalid date range. Start date must be before end date.' });
    }

    const intervalHours = 1;
    const resultArray = []; // Array to store query results

    try {
        // Loop through each day within the specified date range
        for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
            const startOfDay = new Date(currentDate);
            const endOfDay = new Date(currentDate);
            endOfDay.setHours(23, 59, 59);

            const query = {
                device_id: deviceId,
                time: { $gte: startOfDay.toISOString(), $lt: endOfDay.toISOString() }
            };

            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Push either the last record or null to the result array
            resultArray.push(rooms.length > 0 ? rooms[0] : null);
        }

        res.header('Access-Control-Allow-Origin', '*');
        res.json(resultArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// tất cả, ngày đầu tới ngày cuối
app.get('/rooms_all_day/:device_id', async (req, res) => {
    const deviceId = req.params.device_id;

    const currentDate = new Date();
    
    try {
        // Find the earliest and latest timestamps for the specified device_id
        const earliestRecord = await mongoose.connection.db.collection('rooms').findOne(
            { device_id: deviceId },
            { time: 1 },
            { sort: { time: 1 } }
        );

        const latestRecord = await mongoose.connection.db.collection('rooms').findOne(
            { device_id: deviceId },
            { time: 1 },
            { sort: { time: -1 } }
        );

        // Validate if there are any records for the specified device_id
        if (!earliestRecord || !latestRecord) {
            return res.status(404).json({ error: 'No records found for the specified device_id.' });
        }

        const startDate = new Date(earliestRecord.time);
        const endDate = new Date(latestRecord.time);

        // Loop through each day within the specified date range
        const resultArray = [];
        for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
            const startOfDay = new Date(currentDate);
            const endOfDay = new Date(currentDate);
            endOfDay.setHours(23, 59, 59);

            const query = {
                device_id: deviceId,
                time: { $gte: startOfDay.toISOString(), $lt: endOfDay.toISOString() }
            };

            const rooms = await mongoose.connection.db.collection('rooms').find(query).sort({ $natural: -1 }).limit(1).toArray();

            // Push either the last record or null to the result array
            resultArray.push(rooms.length > 0 ? rooms[0] : null);
        }

        res.header('Access-Control-Allow-Origin', '*');
        res.json(resultArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});





//get all by room and time
app.get('/rooms/:device_id/:start_date/:end_date', async (req, res) => {
    const deviceId = req.params.device_id;
    const startDate = req.params.start_date;
    const endDate = req.params.end_date;
    
    // const startDate = '2023-12-28';
    // const endDate = '2023-12-28';
    

    // const startOfDay = new Date(`${startDate}T00:00:00Z`);
    // const endOfDay = new Date(`${endDate}T23:59:59Z`);

    const startOfDay = new Date(`${startDate}T10:25:00Z`);
    const endOfDay = new Date(`${endDate}T10:30:59Z`);

    // console.log('startDate', startOfDay.toISOString().replace(/\.\d{3}Z$/, 'Z'));
    // console.log('endDate', endOfDay.toISOString().replace(/\.\d{3}Z$/, 'Z'));

    const startOfDay1 = startOfDay.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const endOfDay1 = endOfDay.toISOString().replace(/\.\d{3}Z$/, 'Z')

    try {
        const rooms = await mongoose.connection.db.collection('rooms')
            .find({
                device_id: deviceId,
                time: {
                    $gte: startOfDay1,
                    $lt: endOfDay1
                }
                // time: "2023-12-28T10:11:34Z"
            })
            .sort({ time: 1 })
            .toArray();
        res.header('Access-Control-Allow-Origin', '*');
        res.json(rooms);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// TÍNH TIỀN THÁNG HIỆN TẠI: 
// Trả về giá trị mới nhất tháng hiện tại và giá trị cũ nhất của tháng trước đo
app.get('/rooms_mon_price/:device_id', async (req, res) => {
    const deviceId = req.params.device_id;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // Lấy tháng hiện tại (0-11)

    try {
        // Lấy số liệu mới nhất của tháng hiện tại
        const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentMonth, 1, 0, 0, 0, 0);
        const endOfCurrentMonth = new Date(currentDate.getFullYear(), currentMonth + 1, 0, 23, 59, 59, 999);
        const queryCurrentMonth = {
            device_id: deviceId,
            time: { $gte: startOfCurrentMonth.toISOString(), $lt: endOfCurrentMonth.toISOString() }
        };
        const latestDataCurrentMonth = await mongoose.connection.db.collection('rooms')
            .find(queryCurrentMonth)
            .sort({ time: -1 })
            .limit(1)
            .toArray();

        // Lấy số liệu cũ nhất của tháng trước đó
        const startOfPreviousMonth = new Date(currentDate.getFullYear(), currentMonth - 1, 1, 0, 0, 0, 0);
        const endOfPreviousMonth = new Date(currentDate.getFullYear(), currentMonth, 0, 23, 59, 59, 999);
        const queryPreviousMonth = {
            device_id: deviceId,
            time: { $gte: startOfPreviousMonth.toISOString(), $lt: endOfPreviousMonth.toISOString() }
        };
        const oldestDataPreviousMonth = await mongoose.connection.db.collection('rooms')
            .find(queryPreviousMonth)
            .sort({ time: 1 })
            .limit(1)
            .toArray();

        const responseObj = {
            latestDataCurrentMonth: latestDataCurrentMonth.length > 0 ? latestDataCurrentMonth[0] : null,
            oldestDataPreviousMonth: oldestDataPreviousMonth.length > 0 ? oldestDataPreviousMonth[0] : null
        };

        res.header('Access-Control-Allow-Origin', '*');
        res.json(responseObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Lấy lượng điện tiêu thụ đến thới điểm hiện tại


app.get('/rooms_mon_energy_used/:device_id', async (req, res) => {
    const deviceId = req.params.device_id;

    const timeZone = 'Asia/Ho_Chi_Minh';

    try {
        const currentDate = moment().tz(timeZone);
        const currentMonth = currentDate.month(); // Lấy tháng hiện tại (0-11)

        // Lấy số liệu mới nhất của tháng hiện tại
        const startOfCurrentMonth = currentDate.clone().startOf('month').startOf('day');
        const endOfCurrentMonth = currentDate.clone().endOf('month').startOf('day').add(1, 'second'); // thêm 1 giây
        // console.log("startOfCurrentMonth.toISOString()", startOfCurrentMonth.toISOString())
        // console.log("endOfCurrentMonth.toISOString()", endOfCurrentMonth.toISOString())
        const queryCurrentMonth = {
            device_id: deviceId,
            time: { $gte: startOfCurrentMonth.toISOString(), $lt: endOfCurrentMonth.toISOString() }
        };
        const latestDataCurrentMonth = await mongoose.connection.db.collection('rooms')
            .find(queryCurrentMonth)
            .sort({ time: -1 })
            .limit(1)
            .toArray();

        // Lấy số liệu cũ nhất của tháng trước đó
        const startOfPreviousMonth = currentDate.clone().subtract(1, 'months').startOf('month').startOf('day');
        const endOfPreviousMonth = currentDate.clone().startOf('month').startOf('day'); // 00:00:00 của ngày đầu tiên của tháng hiện tại
        const queryPreviousMonth = {
            device_id: deviceId,
            time: { $gte: startOfPreviousMonth.toISOString(), $lt: endOfPreviousMonth.toISOString() }
        };
        const oldestDataPreviousMonth = await mongoose.connection.db.collection('rooms')
            .find(queryPreviousMonth)
            .sort({ time: 1 })
            .limit(1)
            .toArray();

        const responseObj = {
            latestDataCurrentMonth: latestDataCurrentMonth.length > 0 ? latestDataCurrentMonth[0] : null,
            oldestDataPreviousMonth: oldestDataPreviousMonth.length > 0 ? oldestDataPreviousMonth[0] : null
        };

        res.header('Access-Control-Allow-Origin', '*');
        res.json(responseObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.use(express.static(path.join(__dirname, '/frontend/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.use((error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    return res.status(statusCode).json({
        statusCode,
        success: false, // Inform that the request was failed
        message
    });
});







