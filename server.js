const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
//fdf
const db = new sqlite3.Database('./db/poll.db', (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('connected')
    }
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cors());


app.post('/api', (req, res) => {
    // select id,title,count(response) from poll left outer join response on poll_id = id group by id ;
    db.all('select id,title,count(response) as num from poll left outer join response on poll_id = id where user = ? group by id ', [req.body.id], (err, rows) => {
        if (err) {
            console.log(err);
        }
        res.send(rows);

    });
});


//data

app.get('/api/data/:id', (req, res) => {


    let data = {};
    db.serialize(() => {

        db.get('select id,title from poll where id = ?', [req.params.id], (err, row) => {

            if (err) {
                console.log(err);
            }

            if (typeof (row) == 'undefined') {
                res.json({
                    msg: 'not found'
                });
            } else {
                data = row;

                db.all('select response as name, count(response) as count from response where poll_id = ? group by response', [req.params.id], (err, rows) => {
                    if (err) {
                        console.log(err);
                    }

                    data.data = rows;


                });

                db.all('select id,text from options where poll_id = ?', [req.params.id], (err, rowss) => {
                    if (err) {
                        console.log(err);
                    }

                    data.options = rowss;


                    res.send(data);

                });
            }




        });



    });


});


//new polll

app.post('/api/new', (req, res) => {
    //insert query // Done
    let id;
    db.serialize(() => {

        db.run('insert into poll (user,title) values(?,?)', [req.body.user, req.body.title], (err) => {
            if (err) {
                console.log(err);
            }
            res.send('inserted');
        });

        db.get('select id from poll where title = ? and user = ? order by id desc', [req.body.title, req.body.user], (err, row) => {

            if (err) {
                console.log(err);
            }
            id = row.id;

            let sql = 'insert into options (poll_id,text) values(?,?)';
            let op = req.body.options;
            op.forEach((o) => {
                db.run(sql, [id, o], (err) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log('inseted')
                });
            });

        });

    });
});

//get polll

app.post('/api/:id', (req, res) => {
    //getting poll by id query //Done

    let data;
    db.serialize(() => {
        db.get('select * from poll where id = ? and user = ?', [req.params.id,req.body.uid], (err, row) => {
            if (err) {
                console.log(err);
            }
            if (typeof (row) == 'undefined') {
                res.json({
                    msg: 'not found'
                });
            } else {

                res.json(row);
            }
        });
    });
});

//get options


/*app.post('/api/options/:id', (req, res) => {
    db.get('select text from options where poll_id = ?', [req.params.id], (err, row) => {
        if (err) {
            console.log(err);
        }

        res.json(row);
    });

});*/


//update poll

app.put('/api/:id', (req, res) => {

    // updating poll //done
    db.serialize(() => {
        //update title
        db.run('update poll set title = ? where id = ?', [req.body.title, req.params.id], (err) => {
            if (err) {
                console.log(err);
            }

            res.send('updated');
        });
    });

});


//deleting poll

app.delete('/api/:id', (req, res) => {
    // deleting querys
    db.serialize(() => {


        db.run('delete from poll where id = ?', [req.params.id], (err) => {
            if (err) {
                console.log(err);
            }
        });

        db.run('delete from options where poll_id = ?', [req.params.id], (err) => {
            if (err) {
                console.log(err);
            }
        });

        db.run('delete from response where poll_id = ?', [req.params.id], (err) => {
            if (err) {
                console.log(err);
            }
        });

    });

    res.send('deleted');
});


///////////////////////////////////////
/* dev */

app.delete('/api/dev/delete', (req, res) => {

    db.serialize(() => {


        db.run('delete from poll', [], (err) => {
            if (err) {
                console.log(err);
            }
        });

        db.run('delete from options', [], (err) => {
            if (err) {
                console.log(err);
            }
        });

        db.run('delete from response', [], (err) => {
            if (err) {
                console.log(err);
            }
        });

    });

    res.send('database deleted');

});


//////////////////////////////////////

//voting route 

app.post('/api/poll/:id', (req, res) => {
    // voting querys   //done

    db.run('insert into response values(?,?,?)', [req.params.id, req.body.email, req.body.response], (err) => {

        if (err) {
            console.log(err);
        }

        res.send('voted');

    });

});

//signup

app.post('/api/users/signup', (req, res) => {

    db.get('select * from users where email = ?', [req.body.email], (err, row) => {
        if (err) {
            console.log(err);
        }

        if (typeof (row) == 'undefined') {
            db.run('insert into users (email,pass) values(?,?)', [req.body.email, req.body.pass], (err) => {
                if (err) {
                    console.log(err);
                }

                res.json({
                    error:false,
                    msg: 'success'
                });
            });
        } else {
       
            res.json({error:true, errormsg:'Email already exists'});
        }

    });
});


//login

app.post('/api/users/login',(req,res)=>{

     db.get('select * from users where email = ? and pass = ?', [req.body.email,req.body.password], (err, row) => {
        if (err) {
            console.log(err);
        }
         
          if (typeof (row) == 'undefined') {
               res.json({error:true, errormsg:'Wrong email or password'});
          }else{
              
              res.json({
                    error:false,
                    user: row
                }); 
              
          }
         
         
     });
    
});




app.get('/api/users/:id', (req, res) => {

    db.get('select * from users where id = ?', [req.params.id], (err, row) => {
        if (err) {
            console.log(err);
        }

        res.send(row);
    });

});



const listener = app.listen(process.env.PORT || 3000, () => {
    console.log(`Your app is listening on port ${listener.address().port}`)
});
