const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const moment = require('moment');
const { connect } = require('http2');

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

//having session key
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  }));


//Database connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'aswin',
    database: 'employee'
});

connection.connect((err) => {
    if(err){
        console.error(err);
        return;
    }
    console.log('Connected to MySQL Successfully');
})


//Email System
const nodemailer = require('nodemailer');

// Function to send email
const sendEmail = async (to, subject, content) => {
  try {
    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      // Specify your email service and authentication details
      service: 'gmail',
      auth: {
        user: 'aswinschool267@gmail.com',
        pass: 'cwam cipb joad lxkj',
      },
    });

    // Define email options
    const mailOptions = {
      from: 'aswinschool267@gmail.com', // Sender email
      to, // Receiver email
      subject,
      text: content, // Plain text body
      // html: '<p>Your HTML content here</p>', // If you want to send HTML content
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
  } catch (error) {
    console.error('Error sending email: ', error);
  }
};

// sendEmail(toEmail, emailSubject, emailContent);






//home page
app.get('/',(req,res) => {
  res.sendFile("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Admin/login.html");
})

app.get('/home',requireAdmin,(req,res) => {
  res.sendFile("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Admin/home.html");
})

// Set up a route for the home page
app.get('/login', (req, res) => {
    res.sendFile("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Admin/login.html");
});

// Login route - authenticate user and create session
app.post('/login', (req, res) => {
  const { username, password, role } = req.body;

  // Perform authentication logic (check username and password in the database)
  const sql = `select * from credentials where User_Name="${username}" and Password = "${password}" and Role="${role}"`;
  connection.query(sql, (err, result) => {
      if (err) {
          console.error('Error destroying session:', err);
          res.status(500).send('Error logging out');
          return;
      }
      if (result.length > 0) {
        result.forEach(Data => {
          req.session.user = { username, role, email:Data.Email };
        });
          

          switch (role) {
              case 'Admin':
                  res.redirect('/home');
                  break;
              case 'Manager':
                  res.redirect('/manager');
                  break;
              case 'Vendor':
                  res.redirect('/vendor');
                  break;
              case 'Operator':
                  res.redirect('/operator');
                  break;
              case 'Customer':
                  res.redirect('/customer');
                  break;
              default:
                  res.redirect('/login');
                  break;
          }
      } else {
        const errorMessage = "Invalid Username or Password";
        const redirectScript = "<script>alert('" + errorMessage + "'); window.location.href='/login';</script>";
        res.send(redirectScript);
      }
  });
});

  //checking require login
  function requireLogin(req, res, next) {
    if (req.session.user) {
      next(); // Proceed to the requested route if logged in
    } else {
      res.redirect('/login'); // Redirect to login page if not logged in
    }
  }
  function isLoggedIn(req, res, next) {
    if (req.session.user) {
        res.locals.isLoggedIn = true;
    } else {
        res.locals.isLoggedIn = false;
    }
    next();
}
  app.get('/loginStatus', isLoggedIn, (req, res) => {
    res.json({ isLoggedIn: res.locals.isLoggedIn });
});

//checks admin
function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'Admin') {
      next(); // Proceed to the requested route if logged in as admin
  } else {
      res.status(403).send('Access Denied');
  }
}

//checks vendor
function requireVendor(req, res, next) {
  if (req.session.user && req.session.user.role === 'Vendor') {
      next(); // Proceed to the requested route if logged in as admin
  } else {
      res.status(403).send('Access Denied');
  }
}


//checks operator
function requireOperator(req, res, next) {
  if (req.session.user && req.session.user.role === 'Operator') {
      next(); // Proceed to the requested route if logged in as admin
  } else {
      res.status(403).send('Access Denied');
  }
}

//checks manager
function requireManager(req, res, next) {
  if (req.session.user && req.session.user.role === 'Manager') {
      next(); // Proceed to the requested route if logged in as admin
  } else {
      res.status(403).send('Access Denied');
  }
}

//.ht page
app.get('/register',requireLogin,requireAdmin,(req,res) => {
  res.sendFile("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Admin/register.html");
})
//register new user
app.post("/register",(req,res) => {
  const{password, email, username,name,role} = req.body;
  const sql =`insert into credentials values(?,?,?,?,?)`;
  connection.query(sql,[name,username, email,password,role ],(err,result) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Error logging out');
      return;
  }
  res.write('<script>alert("Registered Successfully!!");setTimeout(function() { window.location="/login"; }, 500)</script>');
  res.end();
  })
})
//logout
app.post('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Error logging out');
            return;
        }
        // Redirect to the login page after logout
        res.redirect('/login');
    });
});
//Getting Add Employee Section
app.get('/add_employee',(req,res) => {
  res.sendFile(path.join("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Admin/add_employee.html"));
})

//Add Employee
app.post('/submit',(req,res) => {
    const {id, name, dob, age, doj, designation, Address, Phone_Number, Alternate_Number, Salary } = req.body;
    const sql = 'Insert into employee_details values(?,?,?,?,?,?,?,?,?,?)';
    connection.query(sql,[id, name, dob, age, doj, designation, Address, Phone_Number, Alternate_Number, Salary],(err,result) => {
        if (err) {
            console.error('Error inserting data into MySQL:', err);
            res.status(500).send('Error submitting data');
            return;
          }
          console.log('Data inserted into MySQL');
        res.redirect('/add_employee');
    })
})


//display employees
const htmlFile = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Admin/show_employees.html', 'utf8');
app.get('/show_employees',requireLogin,(req,res) => {
    connection.query('SELECT * FROM employee_details', (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- Employee details will be displayed here -->';
    
        results.forEach(employee => {
          tableHtml += `<tr>
          <td>${employee.ID}</td>
                          <td>${employee.Name}</td>
                          <td>${employee.DOB}</td>
                          <td>${employee.Age}</td>
                          <td>${employee.DOJ}</td>
                          <td>${employee.Designation}</td>
                          <td>${employee.Address}</td>
                          <td>${employee.Phone_Number}</td>
                          <td>${employee.Alternate_Number}</td>
                          <td>${employee.Salary}</td>
                          <td>
          <form action="/delete/${employee.id}" method="POST">
            <input type="hidden" name="name" value="John Doe">
            <button type="submit">Delete</button>
          </form>
        </td>
                        </tr>`;
});
const updatedHtmlFile = htmlFile.replace('<!-- Employee details will be displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});




//search employees
app.post('/search', requireLogin, (req, res) => {
    const { searchOption, query } = req.body;
    let searchQuery = '';
  
    // Choose query based on selected search option
    switch (searchOption) {
      case 'id':
        searchQuery = 'SELECT * FROM employee_details WHERE ID = ?';
        break;
      case 'name':
        searchQuery = 'SELECT * FROM employee_details WHERE Name LIKE ?';
        break;
      case 'phone':
        searchQuery = 'SELECT * FROM employee_details WHERE Phone_Number = ?';
        break;
      default:
        res.redirect('/show_employees');
        return;
    }
    if(query==''){
        searchQuery = 'SELECT * FROM employee_details';
    }
  
    connection.query(searchQuery, [`%${query}%`], (err, results) => {
      if (err) {
        console.error('Error searching data in MySQL:', err);
        res.status(500).send('Error searching data');
        return;
      }
  
      let tableHtml = '<!-- Searched Employee details will be displayed here -->';
  
      results.forEach(employee => {
        // Construct table rows with searched employee details
        tableHtml += `<tr>
          <td>${employee.ID}</td>
          <td>${employee.Name}</td>
          <td>${employee.DOB}</td>
          <td>${employee.Age}</td>
          <td>${employee.DOJ}</td>
          <td>${employee.Designation}</td>
          <td>${employee.Address}</td>
          <td>${employee.Phone_Number}</td>
          <td>${employee.Alternate_Number}</td>
          <td>${employee.Salary}</td>
          <td>
            <form action="/delete/${employee.id}" method="POST">
              <input type="hidden" name="name" value="John Doe">
              <button type="submit">Delete</button>
            </form>
          </td>
        </tr>`;
      });
  
      // Replace placeholder in the HTML file with searched data
      const updatedHtmlFile = htmlFile.replace('<!-- Employee details will be displayed here -->', tableHtml);
      res.send(updatedHtmlFile);
    });
  });
  

//delete employee
app.post('/delete/:ID', function(req,res) {
    res.set('WWW-Authenticate', 'Basic realm="Simple App"')
    if(req.headers.authorization == 'Basic YXN3aW46cGFzcw=='){
    const nam = req.params.ID;
    connection.query('DELETE FROM employee_details WHERE id = ?', [nam], (err, result) => {
      if (err) {
        console.error('Error deleting employee:', err);
        res.status(500).send('Error deleting employee');
        return;
      }
      console.log('Employee deleted from MySQL');
      res.redirect('/show_employees'); // Redirect back to the home page or any appropriate page
    });
  };
  });
//create task
const task = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Admin/create_task.html', 'utf8')
app.post('/create_task',requireLogin,requireAdmin,(req,res) => {
  const sql = `SELECT * FROM credentials where Role="Vendor"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = `<!-- rawMaterialVendor -->`;
    
        results.forEach(ID => {
          tableHtml += `<option value="${ID.User_Name}" >${ID.User_Name} ( ${ID.Name} )</option>`;
});
const updatedHtmlFile = task.replace('<!-- rawMaterialVendor -->', tableHtml);

const sql1 = `SELECT * FROM credentials where Role="Operator"`
    connection.query(sql1, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = `<!-- processingVendor -->`;
    
        results.forEach(ID => {
          tableHtml += `<option value="${ID.User_Name}" >${ID.User_Name} ( ${ID.Name} )</option>`;
});
const updatedHtmlFile1 = updatedHtmlFile.replace('<!-- processingVendor -->', tableHtml);
const sql2 = `SELECT * FROM credentials where Role="Manager"`
    connection.query(sql2, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = `<!-- manager -->`;
    
        results.forEach(ID => {
          tableHtml += `<option value="${ID.User_Name}" >${ID.User_Name} ( ${ID.Name} )</option>`;
});
const updatedHtmlFile2 = updatedHtmlFile1.replace('<!-- manager -->', tableHtml);

    res.send(updatedHtmlFile2);
  });
})})});

//creat task now
app.post("/create_task_now", (req, res) => {
  const { username, orderid, rawMaterialVendor, rawMaterialDescription, processingVendor, processingDescription, manager, managerDescription } = req.body;

  const vendorSql = `INSERT INTO vendor VALUES("${orderid}","${rawMaterialVendor}","${rawMaterialDescription}","no")`;
  const operatorSql = `INSERT INTO operator VALUES("${orderid}","${processingVendor}","${processingDescription}","no","no")`;
  const managerSql = `INSERT INTO manager VALUES("${orderid}","${manager}","${managerDescription}","no","no")`;
  const statusBarSql = `INSERT INTO status_bar VALUES("${username}","${orderid}","yes","no","no","no","no")`;
  const adminStatusBarSql = `INSERT INTO admin_status_bar VALUES("${username}","${orderid}","yes","no",0,"",0,"","no","no","no","no")`;
  const slotBookingSql = `INSERT INTO slot_booking VALUES("${username}","${orderid}",null,"no","","","","","no")`;
  const vendorSql1 = `select * from credentials where User_Name="${rawMaterialVendor}"`;
  const currentDateAndTime = new Date();

  connection.query(vendorSql, (err, result) => {
    if (err) {
      console.error('Error inserting vendor data:', err);
      res.status(500).send('Error creating task');
      return;
    }

    connection.query(operatorSql, (err, result) => {
      if (err) {
        console.error('Error inserting operator data:', err);
        res.status(500).send('Error creating task');
        return;
      }

      connection.query(managerSql, (err, result) => {
        if (err) {
          console.error('Error inserting manager data:', err);
          res.status(500).send('Error creating task');
          return;
        }

        connection.query(statusBarSql, (err, result) => {
          if (err) {
            console.error('Error inserting status_bar data:', err);
            res.status(500).send('Error creating task');
            return;
          }

          connection.query(adminStatusBarSql, (err, result) => {
            if (err) {
              console.error('Error inserting admin_status_bar data:', err);
              res.status(500).send('Error creating task');
              return;
            }

            connection.query(slotBookingSql, (err, result) => {
              if (err) {
                console.error('Error inserting slot_booking data:', err);
                res.status(500).send('Error creating task');
                return;
              }
              connection.query(vendorSql1, (err, result1) => {
                if (err) {
                  console.error('Error inserting vendor data:', err);
                  res.status(500).send('Error creating task');
                  return;
                }
                result1.forEach(element => {
                  sendEmail(`${element.Email}`,`You Have Been Assigned With Customer Id: ${orderid}`,`

Dear Vendor,

We hope this message finds you well.

This is to inform you that a new Order has been assigned to you with the following details:


- Customer ID: ${orderid}
- Task Description: ${rawMaterialDescription}
- Assigned Date and Time: ${currentDateAndTime}

Please review the details carefully and proceed with the necessary actions. If you have any questions or require additional information, feel free to reach out.

Your prompt attention to this matter is highly appreciated.

Best regards,

Batos
                  `)
                });
                

              console.log('Task created successfully');
              res.write('<script>alert("Task created successfully");window.location="/"</script>');
              res.end();
          });
            });
          });
        });
      });
    });
  });
});



//admin track id
app.post('/admin_track_data',requireLogin,(req,res) => {
  const sql = `select * from admin_status_bar`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Work History</h1>';
    
        results.forEach(ID => {
          if(ID.Installed=="no"){
            tableHtml += `<li>
            <span>ID: ${ID.Customer_Id} (Pending...)</span>
            <form action="Admin_Track/ID/${ID.Customer_Id}" method="post">
              <button type="submit">Track it</button>
            </form>
          </li>`;
          }
          else{
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id} (Delivered and Installed)</span>
          <form action="Admin_Track/ID/${ID.Customer_Id}" method="post">
              <button type="submit">Track it</button>
            </form>
        </li>`;}
});
const updatedHtmlFile = current_orders.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//admin track details
app.post('/Admin_Track/ID/:id', requireLogin, (req, res) => {
  const ids = req.params.id;
  const selected_date = req.body.selected_date;

  sql = `select * from admin_status_bar WHERE Customer_Id="${ids}";`;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error updating data in MySQL:', err);
      res.status(500).send('Error updating data');
      return;
    }
    let tableHtml = `<!-- Add more items as needed --> <h1>Track Order Id: ${ids}</h1>
    <div class="hh-grayBox pt45 pb20">`;
    results.forEach(ID => {
      if(ID.Initialized=="yes"){
        tableHtml += `
        <div class="order-tracking completed">
            <span class="is-complete"></span>
            <p>Initialized<br></p>
        </div>`;
      }
      else{
      tableHtml += `<div class="order-tracking">
      <span class="is-complete"></span>
      <p>Initialized<br></p>
  </div>`;}
    if(ID.Vendor=="yes"){
      tableHtml += `
      <div class="order-tracking completed">
            <span class="is-complete"></span>
            <p>Raw Material Purchased<br><span>Vendor_Total_Cost: ${ID.Vendor_Total_Cost}</span>
            <span>Vendor_Cost_Description: ${ID.Vendor_Cost_Description}</span></p>
        </div>`;
    }
    else{
    tableHtml += `<div class="order-tracking">
    <span class="is-complete"></span>
    <p>Raw Material Purchased<br></p>
</div>`;}
  if(ID.Operator=="yes"){
    tableHtml += `
    <div class="order-tracking completed">
            <span class="is-complete"></span>
            <p>Completed Process<br><span>Operator_Total_Cost: ${ID.Operator_Total_Cost}</span>
            <span>Operator_Cost_Description: ${ID.Operator_Cost_Description}</span></p>
        </div>`;
  }
  else{
  tableHtml += `<div class="order-tracking">
  <span class="is-complete"></span>
  <p>Completed Process<br></p>
</div>`;}
if(ID.Manager=="yes"){
  tableHtml += `
  <div class="order-tracking completed">
            <span class="is-complete"></span>
            <p>Item Ready For Delivery<br></p>
        </div>`;
}
else{
tableHtml += `
<div class="order-tracking">
            <span class="is-complete"></span>
            <p>Item Ready For Delivery<br></p>
        </div>`;}
if(ID.Installed=="yes"){
tableHtml += `
<div class="order-tracking completed">
            <span class="is-complete"></span>
            <p>Delivered and Installed<br></p>
        </div>`;
}
else{
tableHtml += `
<div class="order-tracking">
          <span class="is-complete"></span>
          <p>Delivered and Installed<br></p>
      </div>`;}
  });
      const updatedHtmlFile = order_track.replace('<!-- Add more items as needed -->', tableHtml);
      
          res.send(updatedHtmlFile);
    
  });
});


///update_data
app.get('/update_data',requireLogin,(req,res) => {
  const ids = req.params.id;
    
        let tableHtml = '<!-- list of items displayed here -->';
    
          tableHtml += `<form action="/submit_data" method="post">
          <label for="customer_id">Enter Customer Id: </label>
          <input type="text" id="selected-date" name="customer_id" required >

          <select id="manager" name="table" required>
          <option value="" disabled selected hidden>Choose</option>
          <!-- manager -->
          <option value="vendor">Vendor</option>
          <option value="operator">Operator</option>
          <option value="manager">Manager</option>
          </select> 
          <input type="submit" value="Retrieve Data">
        </form>`;
const updatedHtmlFile = slot_form.replace('<!-- displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });


//modify data  
const update_details = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Admin/update_data.html', 'utf8');
app.post('/submit_data',requireLogin,(req,res) => {
  const ids = req.params.id;
  const {table,customer_id} =req.body;
  const sql = `select * from ${table} where Customer_Id="${customer_id}"`
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching data from MySQL:', err);
      res.status(500).send('Error fetching data');
      return;
    }
    let tableHtml = '<!-- displayed here --> <h1>Work Details</h1>';
    results.forEach(ID => { 
      tableHtml += `<form action="/submit_update_data/${customer_id}/${table}" method="post">
          <label for="customerId">Customer ID:</label>
          <input type="text" id="customerId" name="customerId" value="${customer_id}" readonly>
      
          <label for="instaler1">User Name: </label>
          <input type="text"  name="instaler1" id="username" value="${ID.User_Name}" readonly>

          <label for="descripton">Description: </label>
          <textarea type="text" name="description" id="username">${ID.description}</textarea>
      
          <input type="submit" value="Submit">
        </form>`;
    })
        

    
          
const updatedHtmlFile = update_details.replace('<!-- displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});


//update modified data
app.post('/submit_update_data/:id/:table', requireLogin, (req, res) => {
  const ids = req.params.id;
  const table = req.params.table;
  const description = req.body.description;

  sql = `update ${table} set description="${description}" where Customer_Id="${ids}"`;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error updating data in MySQL:', err);
      res.status(500).send('Error updating data');
      return;
    }

    // Handle success, maybe send a response back to the client
    res.write('<script>alert("Updated Successfully!!");window.history.go(-2);location.reload();</script>');
    res.end();
  });
});




//raise ticket
const raiseticket = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Admin/raise_ticket.html', 'utf8');
app.post('/raise_ticket/:id',requireLogin,(req,res) => {
  const ids = req.params.id;
    
        let tableHtml = '<!-- displayed here --><h1>Raise Ticket</h1>';
    
          tableHtml += `<form action="/submit_raise_ticket/${ids}" method="post">
          <label for="customerId">Customer ID:</label>
          <input type="text" id="customerId" name="customerId" value="${ids}" readonly>
      
          <label for="username">Username:</label>
          <input type="text" id="username" name="username" value="${req.session.user.username}" readonly>
      
          <label for="role">role:</label>
          <input type="text" id="role" name="role" value="${req.session.user.role}" readonly>
      
          <label for="problemDescription">Problem Description:</label>
          <textarea id="problemDescription" name="problemDescription" required></textarea>
      
          <input type="submit" value="Submit Ticket">
        </form>`;
const updatedHtmlFile = raiseticket.replace('<!-- displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });

//storing tickets
app.post('/submit_raise_ticket/:id',requireLogin,(req,res) => {
  const ids = req.params.id;
  const desc = req.body.problemDescription;
    sql=`INSERT INTO raise_ticket (Customer_Id, User_Name, Role, Description, Raised_Date_Time, Resolved,Email) values  ('${ids}', '${req.session.user.username}', '${req.session.user.role}', '${desc}', now(), 'No','${req.session.user.email}')`
    connection.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching data from MySQL:', err);
        res.status(500).send('Error fetching data');
        return;
      }
      const currentDateTime = new Date();
      sendEmail(`${req.session.user.email}`, `Your Ticket For Customer Id: ${ids} is been raised`, `Dear ${req.session.user.role},

      We hope this email finds you well. This is to inform you that a new ticket has been raised for your account with Customer Id: ${ids}.
      
      Ticket Details:
      - Description: ${desc}
      - Raised Date and Time: ${currentDateTime}
      
      Our support team will review the ticket and address your concerns as soon as possible. You will receive updates on the resolution progress.
      
      If you have any additional information or questions, feel free to reply to this email or contact our support team.
      
      Thank you for choosing our services.
      
      Best regards,
      Batos
      `);

      sql1=`Select * from credentials where Role="Manager"`
      connection.query(sql1, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
        results.forEach(element => {
          
          const currentDateTime = new Date();
      sendEmail(`${element.Email}`, `New Ticket For Customer Id: ${ids} is been raised`, `Dear Manager,

      We hope this email finds you well. This is to inform you that a new ticket has been raised for Customer Id: ${ids}.
      
      Here are the details:
      - Description: ${desc}
      - Raised Date and Time: ${currentDateTime}

      Please take appropriate action to address the customer's concern.
      
      Best regards,
      Batos`);
        });
      res.write('<script>alert("Updated Successfully!!");window.history.go(-3);location.reload(true);</script>');
    res.end();
  });
    }); 
  });

//unsolved tickets admin
app.get('/ticket_unsolved/',requireLogin,(req,res) => {
  const sql = `select * from raise_ticket where Resolved="No" and TIMESTAMPDIFF(SECOND, Raised_Date_Time, NOW()) > 12 * 3600`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Unsolved Issues</h1>';
    
        results.forEach(ID => {
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="Customer/ticket_admin/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Details</button>
          </form>
        </li>`;
});
const updatedHtmlFile = current_orders.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//unsolved tickets manager
app.get('/ticket_unsolved_manager/',requireLogin,(req,res) => {
  const sql = `select * from raise_ticket where Resolved="No" and TIMESTAMPDIFF(SECOND, Raised_Date_Time, NOW()) < 12 * 3600`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Unsolved Issues</h1>';
    
        results.forEach(ID => {
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="Customer/ticket_admin/ID/${ID.Customer_Id}/${ID.Raised_Date_Time}" method="post">
            <button type="submit">Details</button>
          </form>
        </li>`;
});
const updatedHtmlFile = current_orders.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//solved tickets admin
app.get('/ticket_solved',requireLogin,(req,res) => {
  const sql = `select * from raise_ticket where Resolved="yes"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Solved Issues</h1>';
    
        results.forEach(ID => {
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="Customer/ticket_admin_solved/ID/${ID.Customer_Id}/${ID.Raised_Date_Time}" method="post">
            <button type="submit">Details</button>
          </form>
        </li>`;
});
const updatedHtmlFile = current_orders.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});
//solved tickets
app.get('/ticket_solved_user',requireLogin,(req,res) => {
  const sql = `select * from raise_ticket where Resolved="yes" and User_Name="${req.session.user.username}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Solved Issues</h1>';
    
        results.forEach(ID => {
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="Customer/ticket_solved/ID/${ID.Customer_Id}/${ID.Raised_Date_Time}" method="post">
            <button type="submit">Details</button>
          </form>
        </li>`;
});
const updatedHtmlFile = current_orders.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//ticket details unsolved
const ticket_details = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Admin/ticket_details.html', 'utf8');
app.post("/Customer/ticket_admin/ID/:id/:time",requireLogin,(req,res) => {
  const ids = req.params.id;
  const time = req.params.time;
  const formattedDate = moment(time, 'ddd MMM DD YYYY HH:mm:ss ZZ').format('YYYY-MM-DD HH:mm:ss');

  sql=`select * from raise_ticket where Customer_Id="${ids}" and Resolved="no" AND DATE_FORMAT(Raised_Date_Time, '%Y-%m-%d %H:%i:%s') = "${formattedDate}"`;
  connection.query(sql,(err,results) => {
    if(err){
      console.error('Error fetching data from MySQL:', err);
      res.status(500).send('Error fetching data');
      return;
    }
    let tableHtml = ' <!-- displayed here -->';
    
        results.forEach(ID => {
          if(ID.Resolved=="No"){
            tableHtml += `
            <div class="container">

          <h2>Issue Details</h2>
          <div class="customer-id">Customer ID: ${ID.Customer_Id}</div>
          <div class="customer-id">User Name: ${ID.User_Name}</div>
          <div class="customer-id">Role: ${ID.Role}</div>
          <div class="customer-id">Problem Description: ${ID.Description}</div>
          <div class="customer-id">Raised Time: ${ID.Raised_Date_Time}</div>
          <div class="customer-id">Resolved: ${ID.Resolved}</div>
          <div class="details-section">
              <form action="/raise_ticket_solved/${ID.Customer_Id}/${ID.Raised_Date_Time}" method="post">
              <label for="solution">Solution: </label>
              <textarea id="unitwise-cost" name="solution" required></textarea>
                  
              <button type="submit" class="submit-btn">Resolved</button>
              </form>
              
          </div>
        </div>
            `;
          }
          else{
            tableHtml+=`
            <div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${ID.Customer_Id}</div>
          <div class="customer-id">User Name: ${ID.User_Name}</div>
          <div class="customer-id">Role: ${ID.Role}</div>
          <div class="customer-id">Problem Description: ${ID.Description}</div>
          <div class="customer-id">Raised Time: ${ID.Raised_Date_Time}</div>
          <div class="customer-id">Resolved: ${ID.Resolved}</div>
            `
          }
});
const updatedHtmlFile = ticket_details.replace(' <!-- displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  })
})

//ticket details solved admin
app.post("/Customer/ticket_admin_solved/ID/:id/:time",requireLogin,(req,res) => {
  const ids = req.params.id;
  const time = req.params.time;
  const realTime = moment(time, 'ddd MMM DD YYYY HH:mm:ss ZZ').format('YYYY-MM-DD HH:mm:ss');

  sql=`select * from raise_ticket where Customer_Id="${ids}" and Resolved="yes" AND DATE_FORMAT(Raised_Date_Time, '%Y-%m-%d %H:%i:%s') = "${realTime}"`;
  connection.query(sql,(err,results) => {
    if(err){
      console.error('Error fetching data from MySQL:', err);
      res.status(500).send('Error fetching data');
      return;
    }
    let tableHtml = ' <!-- displayed here -->';
    
        results.forEach(ID => {
          if(ID.Resolved=="No"){
            tableHtml += `
            <div class="container">

          <h2>Issue Details</h2>
          <div class="customer-id">Customer ID: ${ID.Customer_Id}</div>
          <div class="customer-id">User Name: ${ID.User_Name}</div>
          <div class="customer-id">Role: ${ID.Role}</div>
          <div class="customer-id">Problem Description: ${ID.Description}</div>
          <div class="customer-id">Raised Time: ${ID.Raised_Date_Time}</div>
          <div class="customer-id">Resolved: ${ID.Resolved}</div>
          <div class="details-section">
            <div class="buttons">
              <form action="/raise_ticket_solved/${ID.Customer_Id}" method="post">


                  <button type="submit" class="submit-btn">Resolved</button>
              </form>
              
            </div>
          </div>
        </div>
            `;
          }
          else{
            tableHtml+=`
            <div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${ID.Customer_Id}</div>
          <div class="customer-id">User Name: ${ID.User_Name}</div>
          <div class="customer-id">Role: ${ID.Role}</div>
          <div class="customer-id">Problem Description: ${ID.Description}</div>
          <div class="customer-id">Raised Time: ${ID.Raised_Date_Time}</div>
          <div class="customer-id">Resolved: ${ID.Resolved}</div>
          <div class="customer-id">Solution: ${ID.Solution}</div>
            `
          }
});
const updatedHtmlFile = ticket_details.replace(' <!-- displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  })
})

//ticket details solved
app.post("/Customer/ticket_solved/ID/:id/:time",requireLogin,(req,res) => {
  const ids = req.params.id;
  const time = req.params.time;
  const realTime = moment(time, 'ddd MMM DD YYYY HH:mm:ss ZZ').format('YYYY-MM-DD HH:mm:ss');
  sql=`select * from raise_ticket where Customer_Id="${ids}" and Resolved="yes" AND DATE_FORMAT(Raised_Date_Time, '%Y-%m-%d %H:%i:%s') = "${realTime}"`;
  connection.query(sql,(err,results) => {
    if(err){
      console.error('Error fetching data from MySQL:', err);
      res.status(500).send('Error fetching data');
      return;
    }
    let tableHtml = ' <!-- displayed here -->';
    
        results.forEach(ID => {
          if(ID.Resolved=="No"){
            tableHtml += `
            <div class="container">

          <h2>Issue Details</h2>
          <div class="customer-id">Customer ID: ${ID.Customer_Id}</div>
          <div class="customer-id">User Name: ${ID.User_Name}</div>
          <div class="customer-id">Role: ${ID.Role}</div>
          <div class="customer-id">Problem Description: ${ID.Description}</div>
          <div class="customer-id">Raised Time: ${ID.Raised_Date_Time}</div>
          <div class="customer-id">Resolved: ${ID.Resolved}</div>
          <div class="details-section">
            <div class="buttons">
              <form action="/raise_ticket_solved/${ID.Customer_Id}" method="post">


                  <button type="submit" class="submit-btn">Resolved</button>
              </form>
              
            </div>
          </div>
        </div>
            `;
          }
          else{
            tableHtml+=`
            <div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${ID.Customer_Id}</div>
          <div class="customer-id">User Name: ${ID.User_Name}</div>
          <div class="customer-id">Role: ${ID.Role}</div>
          <div class="customer-id">Problem Description: ${ID.Description}</div>
          <div class="customer-id">Raised Time: ${ID.Raised_Date_Time}</div>
          <div class="customer-id">Resolved: ${ID.Resolved}</div>
          <div class="customer-id">Solution: ${ID.Solution}</div>
            `
          }
});
const updatedHtmlFile = ticket_details.replace(' <!-- displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  })
})


//update resolved
app.post('/raise_ticket_solved/:id/:time', requireLogin, (req, res) => {
  const ids = req.params.id;
  const time = req.params.time;
  const solution = req.body.solution;
  
  console.log(`/raise_ticket_solved/${ids}/${time}`);

  // Convert the time parameter to a valid MySQL datetime format
  const formattedDate = moment(time, 'ddd MMM DD YYYY HH:mm:ss ZZ').format('YYYY-MM-DD HH:mm:ss');


  sql = `UPDATE raise_ticket 
         SET Resolved="yes", Resolved_Date_Time=now(), solution="${solution}" 
         WHERE Customer_Id="${ids}" AND DATE_FORMAT(Raised_Date_Time, '%Y-%m-%d %H:%i:%s') = "${formattedDate}"`;

  console.log('SQL Query:', sql); // Log the SQL query for debugging

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error updating data in MySQL:', err);
      res.status(500).send('Error updating data');
      return;
    }

    sql1 = `select * from raise_ticket 
        where Resolved="yes" and Customer_Id="${ids}" AND DATE_FORMAT(Raised_Date_Time, '%Y-%m-%d %H:%i:%s') = "${formattedDate}"`;

  console.log('SQL Query:', sql1); // Log the SQL query for debugging

  connection.query(sql1, (err, results) => {
    if (err) {
      console.error('Error updating data in MySQL:', err);
      res.status(500).send('Error updating data');
      return;
    }
    results.forEach(element => {
      
    

    sendEmail(`${element.Email}`,`Your Issue for Customer Id ${ids} is resolved`,`
    Dear ${element.Role},

We are pleased to inform you that the issue you reported for Customer Id ${ids} has been successfully resolved. Our team has diligently worked on addressing the concern, and we are confident that you will now experience smooth operations.

Details of the resolved issue:
- Customer Id: ${ids}
- Description of the Issue: ${element.Description}
- Solution: ${element.Solution}

If you have any further questions or concerns, please do not hesitate to reach out to our support team.

Thank you for your patience and understanding.

Best regards,
Batos
Support Team
  `)
});
    // Handle success, maybe send a response back to the client
    res.write('<script>alert("Updated Successfully!!");window.history.go(-3);location.reload();</script>');
    res.end();
  });
  });
});



//retrieve resolved
app.get("/vendor",(req,res) => {
  res.sendFile("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Vendor/vendor.html");
});


//display need to do id
const htmlFile1 = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Vendor/vendor_task.html', 'utf8');
app.get('/vendor_show_jobs',requireLogin,(req,res) => {
  const sql = `SELECT Customer_Id FROM vendor where User_Name="${req.session.user.username}" and Status="no"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = `<!-- list of items displayed here -->
        <h1>Pending Works</h1>`;
    
        results.forEach(ID => {
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="vendor/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Purchase</button>
          </form>
        </li>`;
});
const updatedHtmlFile = htmlFile1.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});


//display all work
app.get('/vendor_job_history',requireLogin,(req,res) => {
  const sql = `SELECT * FROM vendor where User_Name="${req.session.user.username}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = `<!-- list of items displayed here -->
        <h1>Work History</h1>`;
    
        results.forEach(ID => {
          if(ID.Status=="no"){
            tableHtml += `<li>
          <span>ID: ${ID.Customer_Id} ( Pending... )</span>
          <form action="vendor/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Purchase</button>
          </form>
        </li>`;
          }
          else{
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="vendor/completed/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Details</button>
          </form>
        </li>`;}
});
const updatedHtmlFile = htmlFile1.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//getting id and description
const vendorjob = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Vendor/vendor_id_description.html', 'utf8');
app.post('/vendor/ID/:id',requireLogin,(req,res) => {
  const ids = req.params.id;
  const sql = `SELECT * FROM vendor where Customer_Id="${ids}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- display here -->';
    
        results.forEach(data => {
          tableHtml += `<div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${data.Customer_Id}</div>
          <div class="details-section">
            <textarea class="description" readonly>${data.description}</textarea>
            <div class="buttons">
              <form action="/raise_ticket/${data.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Raise Ticket</button>
              </form>
              <form action="/vendor_completed/${data.Customer_Id}" method="post">
                  <button type="submit" class="cancel-btn">Completed</button>
              </form>
              
            </div>
          </div>
        </div>
        `;
});
const updatedHtmlFile = vendorjob.replace('<!-- display here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//vendor completed id description page
const vendorjob1 = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Vendor/vendor_id_description.html', 'utf8');
app.post('/vendor/completed/ID/:id',requireLogin,(req,res) => {
  const ids = req.params.id;
  const sql = `SELECT * FROM vendor where Customer_Id="${ids}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- display here -->';
    
        results.forEach(data => {
          tableHtml += `<div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${data.Customer_Id}</div>
          <div class="details-section">
            <textarea class="description" readonly>${data.description}</textarea>
            <div class="buttons">
              <form action="/raise_ticket/${data.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Raise Ticket</button>
              </form>
              
            </div>
          </div>
        </div>
        `;
});
const updatedHtmlFile = vendorjob1.replace('<!-- display here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

const vendorsubmit = fs.readFileSync("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Vendor/vendor_submit_id_description.html","utf8")
app.post("/vendor_completed/:Id",requireLogin,(req,res) => {
  const ids = req.params.Id;
    
        
          tableHtml = `<!-- completed here -->
          <form action="/vendor_submit/${ids}" method="post">
        <label for="customer-id">Customer ID:</label>
        <input type="text" id="customer-id" name="customer-id" value="${ids}" readonly>

        <label for="total_cost">Total Cost:</label>
        <input type="number" id="total-cost" name="total_cost" required>

        <label for="unitwise_cost">Unitwise Cost Description:</label>
        <textarea id="unitwise-cost" name="unitwise_cost" required></textarea>

        <input type="submit" value="Submit">
    </form>`;
const updatedHtmlFile = vendorsubmit.replace('<!-- completed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });

//vendor submit work
app.post('/vendor_submit/:id', requireLogin, (req, res) => {
  const ids = req.params.id;
  const { total_cost, unitwise_cost } = req.body;

  const updateVendorQuery = `UPDATE vendor SET Status="yes" WHERE Customer_Id="${ids}"`;
  const updateOperatorQuery = `UPDATE operator SET Vendor_Status="yes" WHERE Customer_Id="${ids}"`;
  const updateStatusBarQuery = `UPDATE status_bar SET Vendor="yes" WHERE Customer_Id="${ids}"`;
  const updateAdminStatusBarQuery = `UPDATE admin_status_bar SET Vendor="yes", Vendor_Cost_Description="${unitwise_cost}",Vendor_Total_Cost="${total_cost}" WHERE Customer_Id="${ids}"`;
  const operator =`select * from operator where Customer_Id="${ids}"`

  connection.query(updateVendorQuery, (err, results) => {
    if (err) {
      console.error('Error updating vendor status:', err);
      res.status(500).send('Error updating data');
      return;
    }

    connection.query(updateOperatorQuery, (err, results) => {
      if (err) {
        console.error('Error updating vendor status:', err);
        res.status(500).send('Error updating data');
        return;
      }

    connection.query(updateStatusBarQuery, (err, results) => {
      if (err) {
        console.error('Error updating status bar:', err);
        res.status(500).send('Error updating data');
        return;
      }

      connection.query(updateAdminStatusBarQuery, (err, results) => {
        if (err) {
          console.error('Error updating admin status bar:', err);
          res.status(500).send('Error updating data');
          return;
        }

        connection.query(operator, (err, resultop) => {
          if (err) {
            console.error('Error inserting vendor data:', err);
            res.status(500).send('Error creating task');
            return;
          }
          resultop.forEach(element => {
        const operatorSql1 = `select * from credentials where User_Name="${element.User_Name}"`;
        const currentDateAndTime = new Date();
        
        connection.query(operatorSql1, (err, result2) => {
          if (err) {
            console.error('Error inserting vendor data:', err);
            res.status(500).send('Error creating task');
            return;
          }
          result2.forEach(element => {
            sendEmail(`${element.Email}`,`You Have Been Assigned Order With Customer Id: ${ids}`,`

Dear Operator,

We hope this message finds you well.

This is to inform you that a new Order has been assigned to you with the following details:


- Customer ID: ${ids}
- Task Description: ${element.description}
- Assigned Date and Time: ${currentDateAndTime}

Please review the details carefully and proceed with the necessary actions. If you have any questions or require additional information, feel free to reach out.

Your prompt attention to this matter is highly appreciated.

Best regards,

Batos
            `)
      });
    });
      


        // Handle success, maybe send a response back to the client
        res.write('<script>alert("Updated Successfully!!");window.history.go(-3);location.reload();</script>');
        res.end();
      });
      });
      });
    });
    });
  });
});


//operator section
//operator home page
app.get("/operator",(req,res) => {
  res.sendFile("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Operator/operator.html");
});

//display need to do id
const htmlFile3 = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Operator/operator_task.html', 'utf8');
app.get('/operator_show_jobs',requireLogin,(req,res) => {
  const sql = `SELECT Customer_Id FROM operator where User_Name="${req.session.user.username}" and Status="no" and Vendor_Status="yes"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Pending Works</h1>';
    
        results.forEach(ID => {
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="operator/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Purchase</button>
          </form>
        </li>`;
});
const updatedHtmlFile = htmlFile3.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});


//display all work
app.get('/operator_job_history',requireLogin,(req,res) => {
  const sql = `SELECT * FROM operator where User_Name="${req.session.user.username}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Work History</h1>';
    
        results.forEach(ID => {
          if(ID.Status=="no" && ID.Vendor_Status=='yes'){
            tableHtml += `<li>
          <span>ID: ${ID.Customer_Id} ( Pending... )</span>
          <form action="operator/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Purchase</button>
          </form>
        </li>`;
          }
          else{
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="operator/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Details</button>
          </form>
        </li>`;}
});
const updatedHtmlFile = htmlFile3.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});


//getting id and description
const operatorjob = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Operator/operator_id_description.html', 'utf8');
app.post('/operator/ID/:id',requireLogin,(req,res) => {
  const ids = req.params.id;
  const sql = `SELECT * FROM operator where Customer_Id="${ids}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- display here -->';
    
        results.forEach(data => {
          tableHtml += `<div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${data.Customer_Id}</div>
          <div class="details-section">
            <textarea class="description" readonly>${data.description}</textarea>
            <div class="buttons">
              <form action="/raise_ticket/${data.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Raise Ticket</button>
              </form>
              <form action="/operator_completed/${data.Customer_Id}" method="post">
                  <button type="submit" class="cancel-btn">Completed</button>
              </form>
              
            </div>
          </div>
        </div>
        `;
});
const updatedHtmlFile = operatorjob.replace('<!-- display here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//operator completed id description page
const operatorjob1 = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Operator/operator_id_description.html', 'utf8');
app.post('/operator/completed/ID/:id',requireLogin,(req,res) => {
  const ids = req.params.id;
  const sql = `SELECT * FROM operator where Customer_Id="${ids}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- display here -->';
    
        results.forEach(data => {
          tableHtml += `<div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${data.Customer_Id}</div>
          <div class="details-section">
            <textarea class="description" readonly>${data.description}</textarea>
            <div class="buttons">
              <form action="/raise_ticket/${data.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Raise Ticket</button>
              </form>
              
            </div>
          </div>
        </div>
        `;
});
const updatedHtmlFile = operatorjob1.replace('<!-- display here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});


const operatorsubmit = fs.readFileSync("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Operator/operator_submit_id_description.html","utf8")
app.post("/operator_completed/:Id",requireLogin,(req,res) => {
  const ids = req.params.Id;
    
        
          tableHtml = `<!-- completed here -->
          <form action="/operator_submit/${ids}" method="post">
        <label for="customer-id">Customer ID:</label>
        <input type="text" id="customer-id" name="customer-id" value="${ids}" readonly>

        <label for="total_cost">Total Cost:</label>
        <input type="number" id="total-cost" name="total_cost" required>

        <label for="unitwise_cost">Unitwise Cost Description:</label>
        <textarea id="unitwise-cost" name="unitwise_cost" required></textarea>

        <input type="submit" value="Submit">
    </form>`;
const updatedHtmlFile = operatorsubmit.replace('<!-- completed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });


//operator submit
app.post('/operator_submit/:id', requireLogin, (req, res) => {
  const ids = req.params.id;
  const { total_cost, unitwise_cost } = req.body;

  const updateOperatorQuery = `UPDATE operator SET Status="yes" WHERE Customer_Id="${ids}"`;
  const updateManagerQuery = `UPDATE manager SET Operator_Status="yes" WHERE Customer_Id="${ids}"`;
  const updateStatusBarQuery = `UPDATE status_bar SET Operator="yes" WHERE Customer_Id="${ids}"`;
  const updateAdminStatusBarQuery = `UPDATE admin_status_bar SET Operator="yes", Operator_Cost_Description="${unitwise_cost}",Vendor_Total_Cost="${total_cost}" WHERE Customer_Id="${ids}"`;
  const managersql = `select * from manager where Customer_Id="${ids}"`

  connection.query(updateOperatorQuery, (err, results) => {
    if (err) {
      console.error('Error updating Operator status:', err);
      res.status(500).send('Error updating data');
      return;
    }

    connection.query(updateManagerQuery, (err, results) => {
      if (err) {
        console.error('Error updating Operator status:', err);
        res.status(500).send('Error updating data');
        return;
      }

    connection.query(updateStatusBarQuery, (err, results) => {
      if (err) {
        console.error('Error updating status bar:', err);
        res.status(500).send('Error updating data');
        return;
      }

      connection.query(updateAdminStatusBarQuery, (err, results) => {
        if (err) {
          console.error('Error updating admin status bar:', err);
          res.status(500).send('Error updating data');
          return;
        }
        connection.query(managersql, (err, resultop) => {
          if (err) {
            console.error('Error inserting vendor data:', err);
            res.status(500).send('Error creating task');
            return;
          }
          resultop.forEach(element => {
            const managerSql1 = `select * from credentials where User_Name="${element.User_Name}"`;
            const currentDateAndTime = new Date();
        connection.query(managerSql1, (err, result2) => {
          if (err) {
            console.error('Error inserting vendor data:', err);
            res.status(500).send('Error creating task');
            return;
          }
          result2.forEach(element => {
            sendEmail(`${element.Email}`,`You Have Been Assigned Order With Customer Id: ${ids}`,`

Dear Manager,
      
We hope this message finds you well.

This is to inform you that a new Order has been assigned to you with the following details:


- Customer ID: ${ids}
- Task Description: ${element.description}
- Assigned Date and Time: ${currentDateAndTime}

Please review the details carefully and proceed with the necessary actions. If you have any questions or require additional information, feel free to reach out.

Your prompt attention to this matter is highly appreciated.

Best regards,

Batos
            `)
      

        // Handle success, maybe send a response back to the client
        res.write('<script>alert("Updated Successfully!!");window.history.go(-3);</script>location.reload(true);</script>');
        res.end();
      });
    });
      });
    });
    });
      });
    });
  });
});


//manager section
//manager home page
app.get("/manager",(req,res) => {
  res.sendFile("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Manager/manager.html");
});

//display need to do id
const htmlFile5 = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Vendor/vendor_task.html', 'utf8');
app.get('/manager_show_jobs',requireLogin,(req,res) => {
  const sql = `SELECT Customer_Id FROM manager where User_Name="${req.session.user.username}" and Status="no" and Operator_Status="yes"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Pending Works</h1>';
    
        results.forEach(ID => {
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="manager/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Go to it</button>
          </form>
        </li>`;
});
const updatedHtmlFile = htmlFile5.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});


//display all work
app.get('/manager_job_history',requireLogin,(req,res) => {
  const sql = `SELECT * FROM manager where User_Name="${req.session.user.username}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Work History</h1>';
    
        results.forEach(ID => {
          if(ID.Status=="no" && ID.Operator_Status=="yes"){
            tableHtml += `<li>
          <span>ID: ${ID.Customer_Id} ( Pending... )</span>
          <form action="manager/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Purchase</button>
          </form>
        </li>`;
          }
          else{
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="manager/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Details</button>
          </form>
        </li>`;}
});
const updatedHtmlFile = htmlFile5.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});


//getting id and description
const managerjob = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Manager/manager_id_description.html', 'utf8');
app.post('/manager/ID/:id',requireLogin,(req,res) => {
  const ids = req.params.id;
  const sql = `SELECT * FROM manager where Customer_Id="${ids}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- display here -->';
    
        results.forEach(data => {
          tableHtml += `<div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${data.Customer_Id}</div>
          <div class="details-section">
            <textarea class="description" readonly>${data.description}</textarea>
            <div class="buttons">
              <form action="/raise_ticket/${data.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Raise Ticket</button>
              </form>
              <form action="/manager_completed/${data.Customer_Id}" method="post">
                  <button type="submit" class="cancel-btn">Completed</button>
              </form>
              
            </div>
          </div>
        </div>
        `;
});
const updatedHtmlFile = managerjob.replace('<!-- display here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//manager submit completed
app.post('/manager_completed/:id', requireLogin, (req, res) => {
  const ids = req.params.id;

  const updateManagerQuery = `UPDATE manager SET Status="yes" WHERE Customer_Id="${ids}"`;
  const updateStatusBarQuery = `UPDATE status_bar SET Manager="yes" WHERE Customer_Id="${ids}"`;
  const updateAdminStatusBarQuery = `UPDATE admin_status_bar SET Manager="yes" WHERE Customer_Id="${ids}"`;
  const updateSlotQuery = `UPDATE slot_booking SET Slot_Confirmed="yes" WHERE Customer_Id="${ids}"`;
  const customerEmail = `select * from slot_booking where Customer_Id="${ids}"`
  


  connection.query(updateManagerQuery, (err, results) => {
    if (err) {
      console.error('Error updating Manager status:', err);
      res.status(500).send('Error updating data');
      return;
    }

    connection.query(updateStatusBarQuery, (err, results) => {
      if (err) {
        console.error('Error updating status bar:', err);
        res.status(500).send('Error updating data');
        return;
      }

      connection.query(updateAdminStatusBarQuery, (err, results) => {
        if (err) {
          console.error('Error updating admin status bar:', err);
          res.status(500).send('Error updating data');
          return;
        }
      connection.query(updateSlotQuery, (err, results) => {
        if (err) {
          console.error('Error updating Manager status:', err);
          res.status(500).send('Error updating data');
          return;
        }
        connection.query(customerEmail, (err, result1) => {
          if (err) {
            console.error('Error updating Manager status:', err);
            res.status(500).send('Error updating data');
            return;
          }
          result1.forEach(element => {
            const sendMail = `select * from credentials where User_Name="${element.User_Name}"`
            connection.query(sendMail, (err, result2) => {
              if (err) {
                console.error('Error updating Manager status:', err);
                res.status(500).send('Error updating data');
                return;
              }
              result2.forEach(element => {
                sendEmail(element.Email,`Item is Out For Delivery. Book Slot for Order Id: ${ids}`,`

Dear Customer,

We hope this email finds you well. We are delighted to inform you that your order with Order Id: ${ids} is now out for delivery and will be arriving soon.

To ensure a smooth delivery experience, kindly consider booking a delivery slot to make sure you're available to receive your package. Our delivery team will do their best to accommodate your preferred time.

If you have any specific delivery instructions or need further assistance, feel free to reply to this email or contact our customer support.

Thank you for choosing Batos. We appreciate your business and look forward to serving you.

Best regards,
Team

  `)
              });
          });

        // Handle success, maybe send a response back to the client
        res.write('<script>alert("Updated Successfully!!");window.history.go(-2);location.reload(true);</script>');
        res.end();
      });
    });
      });
      });
    });
  });
});


//manager completed id description page
const managerjob1 = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Manager/manager_id_description.html', 'utf8');
app.post('/manager/completed/ID/:id',requireLogin,(req,res) => {
  const ids = req.params.id;
  const sql = `SELECT * FROM manager where Customer_Id="${ids}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- display here -->';
    
        results.forEach(data => {
          tableHtml += `<div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${data.Customer_Id}</div>
          <div class="details-section">
            <textarea class="description" readonly>${data.description}</textarea>
            <div class="buttons">
              <form action="/raise_ticket/${data.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Raise Ticket</button>
              </form>
              
            </div>
          </div>
        </div>
        `;
});
const updatedHtmlFile = managerjob1.replace('<!-- display here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//Assign employees
app.get('/assign_installer',requireLogin,(req,res) => {
  const sql = `select * from slot_booking where Date is not null and Installed="no"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Pending Slots</h1>';
    
        results.forEach(ID => {
          if(ID.Installer1==""){
            tableHtml += `<li>
            <span>ID: ${ID.Customer_Id} (Pending...)</span>
            <form action="assign_installers/ID/${ID.Customer_Id}" method="post">
              <button type="submit">Assign</button>
            </form>
          </li>`;
          }
          else{
            tableHtml += `<li>
            <span>ID: ${ID.Customer_Id} (Assigned)</span>
            <form action="assign_installers/ID/${ID.Customer_Id}" method="post">
              <button type="submit">Re-Assign</button>
            </form>
          </li>`;
          }
});
const updatedHtmlFile = current_orders.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});


//installer details
const assign_installer = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Manager/assign_installers.html', 'utf8');
app.post('/assign_installers/ID/:id',requireLogin,(req,res) => {
  const ids = req.params.id;
    
        let tableHtml = '<!-- displayed here --> <h1>Raise Ticket</h1>';
    
          tableHtml += `<form action="/submit_installer/${ids}" method="post">
          <label for="customerId">Customer ID:</label>
          <input type="text" id="customerId" name="customerId" value="${ids}" readonly>
      
          <label for="username">Username:</label>
          <input type="text" id="username" name="username" value="${req.session.user.username}" readonly>
      
          <label for="instaler1">Instaler1 Name:</label>
          <input type="text"  name="instaler1" id="username">

          <label for="instaler1_phone">Instaler1 Number:</label>
          <input type="text"  name="instaler1_phone" id="username">

          <label for="instaler2">Instaler2 Name:</label>
          <input type="text"  name="instaler2" id="username">

          <label for="instaler2_phone">Instaler2 Number:</label>
          <input type="text"  name="instaler2_phone" id="username">
      
          <input type="submit" value="Submit">
        </form>`;
const updatedHtmlFile = assign_installer.replace('<!-- displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });

//submit installer
app.post('/submit_installer/:id', requireLogin, (req, res) => {
  const ids = req.params.id;
  const {instaler1,instaler2,instaler1_phone,instaler2_phone} = req.body;

  sql = `UPDATE slot_booking SET Installer1="${instaler1}",Installer1_Number="${instaler1_phone}",Installer2="${instaler2}", Installer2_Number="${instaler2_phone}" WHERE Customer_Id="${ids}";`;
  const customerEmail = `select * from slot_booking where Customer_Id="${ids}"`
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error updating data in MySQL:', err);
      res.status(500).send('Error updating data');
      return;
    }
    connection.query(customerEmail, (err, results) => {
      if (err) {
        console.error('Error updating Manager status:', err);
        res.status(500).send('Error updating data');
        return;
      }
      results.forEach(element => {
        const sendMail = `select * from credentials where User_Name="${element.User_Name}"`
        connection.query(sendMail, (err, results) => {
          if (err) {
            console.error('Error updating Manager status:', err);
            res.status(500).send('Error updating data');
            return;
          }
          results.forEach(element => {
            sendEmail(element.Email,`Installers Assigned - Order Id: ${ids}`,`


Dear Customer,

We are excited to inform you that installers have been assigned for your recent order with Order Id: ${ids}. This step brings us closer to completing the installation process and ensuring your satisfaction.

**Installer Details:**
- Installer1's Name: ${instaler1}
- Installer1's Contact Number: ${instaler1_phone}
- Installer2's Name: ${instaler2}
- Installer2's Contact Number: ${instaler2_phone}
- Order Id: ${ids}

The assigned installer will reach out to you shortly to coordinate the installation schedule and address any specific requirements you may have. We aim to provide a seamless and efficient installation experience for you.

Should you have any questions or if there's anything else you'd like to discuss, feel free to reply to this email or contact our customer support.

Thank you for choosing Batos. We appreciate the opportunity to serve you.

Best regards,
Batos Team
            
`)
          });
      });


    // Handle success, maybe send a response back to the client
    res.write('<script>alert("Installer Assigned Successfully!!");window.history.go(-2);location.reload(true);</script>');
    res.end();
  });
});
  });
});



//customer
app.get("/customer",(req,res) => {
  res.sendFile("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Customer/customer.html")
})

//current orders
const current_orders = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Customer/customer_ids.html', 'utf8');
app.get('/customer/recent_orders',requireLogin,(req,res) => {
  const sql = `select * from slot_booking where User_Name="${req.session.user.username}" and Installed="no"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Pending Orders</h1>';
    
        results.forEach(ID => {
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="Customer/Details_Complete/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Details</button>
          </form>
          <form action="Customer/Track/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Track it</button>
          </form>
        </li>`;
});
const updatedHtmlFile = current_orders.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//customer all orders
app.get('/customer/order_history',requireLogin,(req,res) => {
  const sql = `select * from slot_booking where User_Name="${req.session.user.username}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Work History</h1>';
    
        results.forEach(ID => {
          if(ID.Installed=="no"){
            tableHtml += `<li>
            <span>ID: ${ID.Customer_Id} (Pending...)</span>
            <form action="Customer/Details/ID/${ID.Customer_Id}" method="post">
              <button type="submit">Details</button>
            </form>
            <form action="Customer/Track/ID/${ID.Customer_Id}" method="post">
              <button type="submit">Track it</button>
            </form>
          </li>`;
          }
          else{
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="Customer/Details/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Details</button>
          </form>
        </li>`;}
});
const updatedHtmlFile = current_orders.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});


//slot booking
app.get('/customer/book_slots',requireLogin,(req,res) => {
  const sql = `select * from slot_booking where User_Name="${req.session.user.username}" and Installed="no" and Slot_Confirmed="yes" and Date is NULL`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Pending Slots</h1>';
    
        results.forEach(ID => {
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id}</span>
          <form action="Customer/Book_Slot/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Book Slot</button>
          </form>
        </li>`;
});
const updatedHtmlFile = current_orders.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//customer track ids
app.get('/customer/ids',requireLogin,(req,res) => {
  const sql = `select * from slot_booking where User_Name="${req.session.user.username}"`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Work History</h1>';
    
        results.forEach(ID => {
          if(ID.Installed=="no"){
            tableHtml += `<li>
            <span>ID: ${ID.Customer_Id} (Pending...)</span>
            <form action="Customer/Details/ID/${ID.Customer_Id}" method="post">
              <button type="submit">Details</button>
            </form>
            <form action="Customer/Track/ID/${ID.Customer_Id}" method="post">
              <button type="submit">Track it</button>
            </form>
          </li>`;
          }
          else{
          tableHtml += `<li>
          <span>ID: ${ID.Customer_Id} (Delivered and Installed)</span>
          <form action="Customer/Details/ID/${ID.Customer_Id}" method="post">
            <button type="submit">Details</button>
          </form>
          <form action="Customer/Track/ID/${ID.Customer_Id}" method="post">
              <button type="submit">Track it</button>
            </form>
        </li>`;}
});
const updatedHtmlFile = current_orders.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//customer show details
const order_details = fs.readFileSync("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Customer/customer_order_details.html","utf-8")
app.post("/customer/Customer/Details/ID/:id",requireLogin,(req,res) => {
  const ids = req.params.id;
  sql=`select * from slot_booking where Customer_Id="${ids}"`;
  connection.query(sql,(err,results) => {
    if(err){
      console.error('Error fetching data from MySQL:', err);
      res.status(500).send('Error fetching data');
      return;
    }
    let tableHtml = ' <!-- displayed here -->';
    
        results.forEach(ID => {
          if(ID.Slot_Confirmed=="yes"){
            tableHtml += `
            <div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${ID.Customer_Id}</div>
          <div class="customer-id">Slot Confirmed: ${ID.Slot_Confirmed}</div>
          <div class="customer-id">Installation Date ${ID.Date}</div>
          <div class="customer-id">Installer 1 Name: ${ID.Installer1}</div>
          <div class="customer-id">Installer 1 Phone Number: ${ID.Installer1_Number}</div>
          <div class="customer-id">Installer 2 Name: ${ID.Installer2}</div>
          <div class="customer-id">Installer 2 Phone Number: ${ID.Installer2_Number}</div>
          <div class="customer-id">Installed: ${ID.Installed}</div>
          <div class="details-section">
            <div class="buttons">
              <form action="/raise_ticket/${ID.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Raise Ticket</button>
              </form>
              
            </div>
          </div>
        </div>
            `;
          }
          else{
            tableHtml+=`
            <div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${ID.Customer_Id}</div>
          <div class="customer-id">Slot Confirmed: ${ID.Slot_Confirmed}</div>
          <div class="customer-id">Check Once Slot is been confirmed to view complete details.</div>
          <div class="details-section">
            <div class="buttons">
              <form action="/raise_ticket/${ID.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Raise Ticket</button>
              </form>
              
            </div>
          </div>
        </div>
            `
          }
});
const updatedHtmlFile = order_details.replace(' <!-- displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  })
})

app.post("/customer/Customer/Details_Complete/ID/:id",requireLogin,(req,res) => {
  const ids = req.params.id;
  sql=`select * from slot_booking where Customer_Id="${ids}"`;
  connection.query(sql,(err,results) => {
    if(err){
      console.error('Error fetching data from MySQL:', err);
      res.status(500).send('Error fetching data');
      return;
    }
    let tableHtml = ' <!-- displayed here -->';
    
        results.forEach(ID => {
          if(ID.Slot_Confirmed=="yes"){
            tableHtml += `
            <div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${ID.Customer_Id}</div>
          <div class="customer-id">Slot Confirmed: ${ID.Slot_Confirmed}</div>
          <div class="customer-id">Installation Date ${ID.Date}</div>
          <div class="customer-id">Installer 1 Name: ${ID.Installer1}</div>
          <div class="customer-id">Installer 1 Phone Number: ${ID.Installer1_Number}</div>
          <div class="customer-id">Installer 2 Name: ${ID.Installer2}</div>
          <div class="customer-id">Installer 2 Phone Number: ${ID.Installer2_Number}</div>
          <div class="customer-id">Installed: ${ID.Installed}</div>
          <div class="details-section">
            <div class="buttons">
            <form action="/Installed/${ID.Customer_Id}" method="post">
            <button type="submit" class="submit-btn">Delivered and Installed</button>
        </form>
              <form action="/raise_ticket/${ID.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Raise Ticket</button>
              </form>
              
            </div>
          </div>
        </div>
            `;
          }
          else{
            tableHtml+=`
            <div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${ID.Customer_Id}</div>
          <div class="customer-id">Slot Confirmed: ${ID.Slot_Confirmed}</div>
          <div class="customer-id">Check Once Slot is been confirmed to view complete details.</div>
          <div class="details-section">
            <div class="buttons">
              <form action="/raise_ticket/${ID.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Raise Ticket</button>
              </form>
              
            </div>
          </div>
        </div>
            `
          }
});
const updatedHtmlFile = order_details.replace(' <!-- displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  })
})

app.post('/Installed/:id', requireLogin, (req, res) => {
  const ids = req.params.id;
  const selected_date = req.body.selected_date;

  sql = `UPDATE status_bar SET Installed="yes" WHERE Customer_Id="${ids}";`;
  sql1 = `UPDATE admin_status_bar SET Installed="yes" WHERE Customer_Id="${ids}";`;
  sql2 = `UPDATE slot_booking SET Installed="yes" WHERE Customer_Id="${ids}";`;
  const customerEmail = `select * from manager where Customer_Id="${ids}"`

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error updating data in MySQL:', err);
      res.status(500).send('Error updating data');
      return;
    }

    connection.query(sql1, (err, results) => {
      if (err) {
        console.error('Error updating data in MySQL:', err);
        res.status(500).send('Error updating data');
        return;
      }

      connection.query(sql2, (err, results) => {
        if (err) {
          console.error('Error updating data in MySQL:', err);
          res.status(500).send('Error updating data');
          return;
        }
        connection.query(customerEmail, (err, results) => {
          if (err) {
            console.error('Error updating Manager status:', err);
            res.status(500).send('Error updating data');
            return;
          }
          results.forEach(element => {
            const sendMail = `select * from credentials where User_Name="${element.User_Name}"`
            connection.query(sendMail, (err, results) => {
              if (err) {
                console.error('Error updating Manager status:', err);
                res.status(500).send('Error updating data');
                return;
              }
              results.forEach(element => {
                sendEmail(element.Email,`Item is Delived and Installed for Order Id: ${ids}`,`

Dear Manager,

We are delighted to share the successful completion of the order with Order Id: ${ids}. The item has been delivered and expertly installed, ensuring a seamless and satisfying experience for our valued customer.

Thank you for your continued leadership and commitment to excellence.

Best regards,
Batos Team

  `)
              });
          });


    // Handle success, maybe send a response back to the client
    res.write('<script>alert("Slot Booked Successfully!!");window.location="/customer";</script>');
    res.end();
      });
    });
  });
  });
});
});


//customer book slot
const slot_form = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Customer/slot_date.html', 'utf8');
app.post('/customer/Customer/Book_Slot/ID/:id',requireLogin,(req,res) => {
  const ids = req.params.id;
    
        let tableHtml = '<!-- list of items displayed here -->';
    
          tableHtml += `<form action="/submit_date/${ids}" method="post">
          <label for="selected_date">Select a Date:</label>
          <input type="date" id="selected-date" name="selected_date" required min="<?php echo date('Y-m-d', strtotime('+7 day')); ?>">
      
          <input type="submit" value="Submit">
        </form>`;
const updatedHtmlFile = slot_form.replace('<!-- displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });

// slot date submit
app.post('/submit_date/:id', requireLogin, (req, res) => {
  const ids = req.params.id;
  const selected_date = req.body.selected_date;

  sql = `UPDATE slot_booking SET Slot_Confirmed="yes", Date="${selected_date}" WHERE Customer_Id="${ids}";`;
  const customerEmail = `select * from manager where Customer_Id="${ids}"`

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error updating data in MySQL:', err);
      res.status(500).send('Error updating data');
      return;
    }
    connection.query(customerEmail, (err, results) => {
      if (err) {
        console.error('Error updating Manager status:', err);
        res.status(500).send('Error updating data');
        return;
      }
      results.forEach(element => {
        const sendMail = `select * from credentials where User_Name="${element.User_Name}"`
        connection.query(sendMail, (err, results) => {
          if (err) {
            console.error('Error updating Manager status:', err);
            res.status(500).send('Error updating data');
            return;
          }
          results.forEach(element => {
            sendEmail(element.Email,`Slot Booked By Customer for Order Id: ${ids}`,`

Dear Manager,

We hope this message finds you well. We wanted to update you on a recent development regarding an order.

A customer has booked a delivery slot for the order with Order Id: ${ids}.

This proactive step taken by the customer helps in ensuring a smooth and convenient delivery process. Please take note of the scheduled delivery slot and coordinate accordingly with our logistics team.

If you have any questions or require additional information, feel free to reach out. We appreciate your attention to this matter.

Thank you for your dedication to ensuring exceptional customer service.

Best regards,
Batos Team
            
`)
          });
      });


    // Handle success, maybe send a response back to the client
    res.write('<script>alert("Slot Booked Successfully!!");window.location="/customer/book_slots";</script>');
    res.end();
      });
    });
  });
});


//track customer
const order_track = fs.readFileSync("C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/Customer/track.html","utf-8")
app.post('/customer/Customer/Track/ID/:id', requireLogin, (req, res) => {
  const ids = req.params.id;
  const selected_date = req.body.selected_date;

  sql = `select * from status_bar WHERE Customer_Id="${ids}";`;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error updating data in MySQL:', err);
      res.status(500).send('Error updating data');
      return;
    }
    let tableHtml = `<!-- Add more items as needed --> <h1>Track Order Id: ${ids}</h1>
    <div class="hh-grayBox pt45 pb20">`;
        results.forEach(ID => {
          if(ID.Initialized=="yes"){
            tableHtml += `
            <div class="order-tracking completed">
                <span class="is-complete"></span>
                <p>Initialized<br></p>
            </div>`;
          }
          else{
          tableHtml += `<div class="order-tracking">
          <span class="is-complete"></span>
          <p>Initialized<br></p>
      </div>`;}
        if(ID.Vendor=="yes"){
          tableHtml += `
          <div class="order-tracking completed">
                <span class="is-complete"></span>
                <p>Raw Material Purchased<br></p>
            </div>`;
        }
        else{
        tableHtml += `<div class="order-tracking">
        <span class="is-complete"></span>
        <p>Raw Material Purchased<br></p>
    </div>`;}
      if(ID.Operator=="yes"){
        tableHtml += `
        <div class="order-tracking completed">
                <span class="is-complete"></span>
                <p>Completed Process<br></p>
            </div>`;
      }
      else{
      tableHtml += `<div class="order-tracking">
      <span class="is-complete"></span>
      <p>Completed Process<br></p>
  </div>`;}
    if(ID.Manager=="yes"){
      tableHtml += `
      <div class="order-tracking completed">
                <span class="is-complete"></span>
                <p>Item Ready For Delivery<br></p>
            </div>`;
    }
    else{
    tableHtml += `
    <div class="order-tracking">
                <span class="is-complete"></span>
                <p>Item Ready For Delivery<br></p>
            </div>`;}
  if(ID.Installed=="yes"){
    tableHtml += `
    <div class="order-tracking completed">
                <span class="is-complete"></span>
                <p>Delivered and Installed<br></p>
            </div>`;
  }
  else{
  tableHtml += `
  <div class="order-tracking">
              <span class="is-complete"></span>
              <p>Delivered and Installed<br></p>
          </div>`;}
      });
      const updatedHtmlFile = order_track.replace('<!-- Add more items as needed -->', tableHtml);
      
          res.send(updatedHtmlFile);
    
  });
});

//customer installation status
app.get('/installation_status',requireLogin,(req,res) => {
  const sql = `select * from slot_booking where User_Name="${req.session.user.username}" and Installed="no" and Date is not null`
    connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data from MySQL:', err);
          res.status(500).send('Error fetching data');
          return;
        }
    
        let tableHtml = '<!-- list of items displayed here --> <h1>Work History</h1>';
    
        results.forEach(ID => {
            tableHtml += `<li>
            <span>ID: ${ID.Customer_Id} (Pending...)</span>
            <form action="Customer/installation_Details/ID/${ID.Customer_Id}" method="post">
              <button type="submit">Details</button>
            </form>
            <form action="Customer/Track/ID/${ID.Customer_Id}" method="post">
              <button type="submit">Track it</button>
            </form>
          </li>`;
});
const updatedHtmlFile = current_orders.replace('<!-- list of items displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  });
});

//customer installation details
app.post("/Customer/installation_Details/ID/:id",requireLogin,(req,res) => {
  const ids = req.params.id;
  sql=`select * from slot_booking where Customer_Id="${ids}"`;
  connection.query(sql,(err,results) => {
    if(err){
      console.error('Error fetching data from MySQL:', err);
      res.status(500).send('Error fetching data');
      return;
    }
    let tableHtml = ' <!-- displayed here -->';
    
        results.forEach(ID => {
          if(ID.Slot_Confirmed=="yes"){
            tableHtml += `
            <div class="container">

          <h2>Order Details</h2>
          <div class="customer-id">Customer ID: ${ID.Customer_Id}</div>
          <div class="customer-id">Slot Confirmed: ${ID.Slot_Confirmed}</div>
          <div class="customer-id">Installation Date ${ID.Date}</div>
          <div class="customer-id">Installer 1 Name: ${ID.Installer1}</div>
          <div class="customer-id">Installer 1 Phone Number: ${ID.Installer1_Number}</div>
          <div class="customer-id">Installer 2 Name: ${ID.Installer2}</div>
          <div class="customer-id">Installer 2 Phone Number: ${ID.Installer2_Number}</div>
          <div class="customer-id">Installed: ${ID.Installed}</div>
          <div class="details-section">
            <div class="buttons">
              <form action="/raise_ticket/${ID.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Raise Ticket</button>
              </form>
              <form action="/submit_installed/${ID.Customer_Id}" method="post">
                  <button type="submit" class="submit-btn">Installed</button>
              </form>
              
            </div>
          </div>
        </div>
            `;
          }
});
const updatedHtmlFile = order_details.replace(' <!-- displayed here -->', tableHtml);

    res.send(updatedHtmlFile);
  })
})

//submit installed
app.post('/submit_installed/:id', requireLogin, (req, res) => {
  const ids = req.params.id;

  sql = `update slot_booking set Installed="yes" where Customer_Id="${ids}"`;
  sql1 = `update status_bar set Installed="yes" where Customer_Id="${ids}"`;
  sql2= `update admin_status_bar set Installed="yes" where Customer_Id="${ids}"`;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error updating data in MySQL:', err);
      res.status(500).send('Error updating data');
      return;
    }
    connection.query(sql1, (err, results) => {
      if (err) {
        console.error('Error updating data in MySQL:', err);
        res.status(500).send('Error updating data');
        return;
      }
      connection.query(sql2, (err, results) => {
        if (err) {
          console.error('Error updating data in MySQL:', err);
          res.status(500).send('Error updating data');
          return;
        }

    // Handle success, maybe send a response back to the client
    res.write('<script>alert("Updated Successfully!!");window.history.go(-2);location.reload(true);</script>');
    res.end();
  });
});
});
});



// Start the server
const PORT = process.env.PORT || 3000; // Use port 3000 by default
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
