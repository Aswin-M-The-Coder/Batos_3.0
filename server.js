const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');

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








// Set up a route for the home page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname,'login.html'));
});

// Login route - authenticate user and create session
app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // Perform authentication logic (check username and password in the database)
    // For simplicity, let's assume authentication is successful for 'admin'
    if (username === 'admin' && password === 'admin') {
      req.session.user = { username, role: 'Admin' }; // Set user session data
      res.redirect('/show_employees');
    } else {
      res.send('Invalid username or password');
    }
  });

  //checking require login
  function requireLogin(req, res, next) {
    if (req.session.user) {
      next(); // Proceed to the requested route if logged in
    } else {
      res.redirect('/login'); // Redirect to login page if not logged in
    }
  }


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
    res.sendFile(path.join(__dirname,'add_employee.html'));
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
const htmlFile = fs.readFileSync('C:/Users/aswin/Desktop/Pycharm Projects/Batos_3.0/show_employees.html', 'utf8');
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
app.post('/delete/:id', function(req,res) {
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


// Start the server
const PORT = process.env.PORT || 3000; // Use port 3000 by default
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
