const express = require('express');
const fs = require('fs');
const https = require('https');
const rzpay = require('razorpay');
const crypto = require('crypto');
const rzpKey = { key_id: 'rzp_test_D74dAvNEV1rMap', key_secret: 'zPDxeaaC0iDQ4fNnEQ1ZHIqd' }
const rpzInitial = new rzpay(rzpKey);
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    fs.readFile(`./jsondb/bookeddates${new Date().getFullYear()}.json`, (err, data) => {
        if (err) { console.log(err); return; }

        let json = { 'table': [] };
        JSON.parse(data).map((v) => { json.table.push(v); })
        res.render('main', {
            db: json
        });
        console.log("view ready");
    });

});
app.post('/booking', (req, res) => {
    console.log("req recived");
    const inputData = req.body;
    fs.readFile(`./jsondb/bookeddates${new Date().getFullYear()}.json`, (err, data) => {
        if (err) { console.log(err); }
        else {
            data = JSON.parse(data);
            data.forEach(e => {
                if (datesBetween(e.start, e.end).includes(inputData.start) || datesBetween(e.start, e.end).includes(inputData.end)) {
                    return res.render('inputerror', { text: "The Dates are already booked", data: inputData });
                }
            });
        }
    })
    if (inputData.cust_num.length != 10) {
        return res.render('inputerror', { text: "The given Number seems wrong", data: inputData });
    }
    if (inputData.start == "" || inputData.end == "") {
        return res.render("inputerror", { text: "Either of the date field is empty", data: inputData });
    }
    if (inputData.start == inputData.end) {
        return res.render("inputerror", { text: "Least booking available for is 24hrs", data: inputData });
    }

    if (inputData.cust_name == "") {
        return res.render("inputerror", { text: "The name field is empty", data: inputData });
    }
    if (myDatesToIso(inputData.end) < myDatesToIso(inputData.start)) {
        return res.render("inputerror", { text: "The dates seem to be out of order", data: inputData })
    }
    else {
        const start = myDatesToIso(inputData.start);
        const end = myDatesToIso(inputData.end);
        const diffofdates = (new Date(end) - new Date(start)) / 1000 / 60 / 60 / 24;
        const rate = 7000;
        const cost = diffofdates * rate * 100;
        const options = { amount: `${cost}`, currency: 'INR' };
        rpzInitial.orders.create(options, (err, order) => {
            if (err) { console.log(err); }
            else {
                inputData.bookingId = order.id;
                res.render("booking", { data: inputData, cost, key: rzpKey.key_id });
            }
        });
    }
});
app.post('/booking/confirm', (req, res) => {
    const recdata = req.body;
    console.log(recdata);
    fs.readFile(`./jsondb/bookeddates${new Date().getFullYear()}.json`, (err, data) => {
        if (err) { console.log(err); }
        else {
            data = JSON.parse(data);
            data.push(recdata);
            fs.writeFile(`./jsondb/bookeddates${new Date().getFullYear()}.json`, JSON.stringify(data), () => {
                res.send({ 'Message': 'Booking Added Successfully' });
            });
        }
    });
    if (new Date(recdata.end).getFullYear() == new Date().getFullYear() + 1) {
        const arr = [];
        arr.push(recdata);
        fs.stat(`./jsondb/bookeddates${new Date().getFullYear() + 1}.json`, (err, stats) => {
            if (err) {
                fs.appendFile(`./jsondb/bookeddates${new Date().getFullYear() + 1}.json`, JSON.stringify(arr), (err) => {
                    console.log('append success', err);
                });
            }
            else {
                fs.readFile(`./jsondb/bookeddates${new Date().getFullYear() + 1}.json`, (err, data) => {
                    if (err) { console.log(err); }
                    else {
                        data = JSON.parse(data);
                        data.push(recdata);
                        fs.writeFile(`./jsondb/bookeddates${new Date().getFullYear() + 1}.json`, JSON.stringify(data), (err) => {
                            if (err) { console.log(err); }
                        });
                    }
                });
            }
        });
    }
});

app.get('/admin', (req, res) => {
    res.render('adminlogin', { text: '' });
})
app.post('/admin', (req, res) => {
    const login = req.body
    fs.readFile('./jsondb/admin.json', (err, data) => {
        if (err) { console.log(err); }
        else {
            data = JSON.parse(data);
            data.forEach((user) => {            
                if (user.password === login.password && user.userId === login.userId) {
                    fs.readFile(`./jsondb/bookeddates${new Date().getFullYear()}.json`, (err, data) => {
                        if (err) { console.log(err); return}
                            data = JSON.parse(data);
                            res.render('admin', {
                                db: data
                            });
                    });                    
                }
                else { res.render('adminlogin', { text: 'credentials incorrect' }); }
            })
        }
    })
})

app.get('/admin/search', (req, res) => {
    fs.readFile(`./jsondb/bookeddates${new Date().getFullYear()}.json`, (err, data) => {
        if (err) console.log(err)
        else {
            res.send({ db: JSON.parse(data) })
        }
    })
})

app.post('/admin/delete', (req, res) => {
    const index = Number(req.body.index)
    fs.readFile(`./jsondb/bookeddates${new Date().getFullYear()}.json`, (err, data) => {
        if (err) {
            return res.send({ 'Message': 'Deleting Failed' })
        }
        else {
            data = JSON.parse(data)
            const enddate = data[index].end
            if (new Date(enddate).getFullYear() == new Date().getFullYear() + 1) {
                fs.readFile(`./jsondb/bookeddates${new Date().getFullYear() + 1}.json`, (err, dt) => {
                    if (err) { console.log(err) }
                    else {
                        console.log('here')
                        let ind
                        dt = JSON.parse(dt)
                        let i = 0
                        dt.forEach(e => { if (e.end == enddate) { ind = i } i++; })
                        dt.splice(ind, 1)
                        fs.writeFile(`./jsondb/bookeddates${new Date().getFullYear() + 1}.json`, JSON.stringify(dt), err => console.log(err))
                    }
                })
            }
            const d = data.splice(index, 1)
            fs.writeFile(`./jsondb/bookeddates${new Date().getFullYear()}.json`, JSON.stringify(data), (err) => {
                if (err) { return res.send({ 'Message': 'failed to rewrite data' }) }
                else {
                    res.send({ 'Message': "Successfully rewritten data" })
                }
            })
            // fs.writeFile('./jsondb/deleted.json', JSON.stringify(d),(err) =>{console.log(err)})
        }

    })
})

const myDatesToIso = (virtualDate) => {
    const n = virtualDate.split('-'); n[1] = Number(n[1]) - 1;
    let nDate = new Date(n[2], n[1], n[0]);
    const offSet = nDate.getTimezoneOffset();
    nDate = new Date(nDate.getTime() - (offSet * 60 * 1000));
    return nDate.toISOString();
}
const isoToMyDates = (isoString) => {
    let p = isoString.split('T');
    let mDate = p[0].split('-').reverse().join('-');
    return mDate;
}
const datesBetween = (date1, date2) => {
    const booked = [];
    d1 = new Date(myDatesToIso(date1));
    d2 = new Date(myDatesToIso(date2));
    while (d1 < d2) {
        booked.push(isoToMyDates(new Date(d1).toISOString()));
        d1 = new Date(d1).setDate(new Date(d1).getDate() + 1);
    }
    return booked;
}

app.listen(9870, '192.168.2.32', () => { console.log('server on 9870'); });