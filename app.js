const express = require('express');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const authService = require('./services/authService');
const historicalEventService = require('./services/hisEventsService');
const hisFigureService = require('./services/hisFigureService');
const userService = require('./services/userService');
const jwt = require('jsonwebtoken');
const Item = require('./models/item');
const Quiz = require('./models/quiz');
const app = express();

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://123:123@cluster0.yiy0oqq.mongodb.net/?retryWrites=true&w=majority')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up express-session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true
}));

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve images from the 'images' directory
app.use('/images', express.static('images'));

// Route handler for the main page
app.get('/', (req, res) => {// Get the authenticated user from the session
  res.render('index',{message: null}); // Pass the user object to the index template
});

app.post('/login', async (req, res) => {
    const user = req.body;
    try {
        const isAdmin = await authService.login(user);
        req.session.token = jwt.sign({isAdmin}, 'my-secret-key', {expiresIn: 60 * 60});
        if(isAdmin){
            res.redirect('/admin');
        }
        else{
            // Redirect to /news/:lang page with a default language, e.g., 'eng' for English
            res.redirect('/news/eng');
        }
    }
    catch (error) {
        res.render('index', { message: error.message });
    }
});


app.get('/register', (req, res) => {
  res.render('register', { message: null });
});

app.post('/register', async (req, res) => {
  const user = req.body;
  try {
    const result = await authService.register(user);
    if(result){
      res.redirect('/');
    }
  }
  catch (error) {
    res.render('register', { message: error.message });
  }
});

app.get('/news/:lang', async (req, res) => {
    try {
        let language = req.params.lang;
        console.log(language);
        const url = `https://newsapi.org/v2/everything?q=${language === 'rus' ? 'Книга' : 'book'}&apiKey=e8574f4894984c0f9ee6e35db26600f7`;
        const response = await axios.get(url);

        const newsWithImages = response.data.articles.filter(article => article.urlToImage !== null);

        if (response.status === 200) {
            // Here, make sure you are referencing the correct EJS file, which is 'home' based on your information
            res.render('home', { news: newsWithImages }); // Change 'newsPage' to 'home'
        } else {
            res.status(response.status).json({ error: 'Failed to fetch news' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/admin',authMiddleware, async (req,res) =>{
    try {
        const users= await userService.getUsers();
        res.render('admin', { users });
    }
    catch (error) {
        res.render('admin', { message: error.message });
    }
})
app.post('/admin/delete', async (req, res) => {
    const id = req.body.id;
    try {
        await userService.deleteUser(id);
        res.redirect('/admin');
    }
    catch (error) {
        res.redirect('/admin');
    }
})
app.post('/admin', authMiddleware, async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const isAdmin = req.body.isAdmin === 'on';
    try {
        await userService.createUser(username, password, isAdmin);
        res.redirect('/admin');
    }
    catch (error) {
        res.redirect('/admin');
    }
});
function authMiddleware(req, res, next) {
    // Check if the token exists in the session
    if (req.session && req.session.token) {
        // Token exists, so user is authenticated
        next(); // Continue to the next middleware or route handler
    } else {
        // Token doesn't exist, so user is not authenticated
        res.render('index', {message: 'You have not token, you need first login'})// Respond with 401 Unauthorized
    }
}
app.post('/add-item', authMiddleware,async (req, res) => {
    const { pictures, name1, name2, description1, description2 } = req.body;

    const newItem = new Item({
        pictures: pictures.split(',').map(url => url.trim()),
        names: [{ lang: 'en', name: name1 }, { lang: 'es', name: name2 }],
        descriptions: [{ lang: 'en', description: description1 }, { lang: 'es', description: description2 }]
    });

    try {
        await newItem.save();
        res.redirect('/admin'); // Redirect to admin page after adding the item
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding item');
    }
});

app.get('/items', authMiddleware,async (req, res) => {
    try {
        const items = await Item.find();
        res.render('itemsList', { items });
    } catch (error) {
        console.error(error);
    }
});

app.get('/items-add-page', authMiddleware, (req, res) => {
    res.render('ItemAdd');
})
app.get('/items-for-admin',authMiddleware, async (req, res) => {
    try {
        const items = await Item.find();
        res.render('itemsListAdmin', { items });
    } catch (error) {
        console.error(error);
    }
});
// Route to handle item deletion
app.post('/delete-item/:id', authMiddleware,async (req, res) => {
    const { id } = req.params;
    try {
        await Item.findByIdAndDelete(id);
        res.redirect('/items-for-admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting item');
    }
});
app.get('/quiz', (req, res) => {
    res.render('quiz');
});
app.post('/api/questions', async (req, res) => {
    const { question, answer } = req.body;
    try {
        const newQuestion = new Quiz({
            question: question,
            answer: answer
        });
        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
});
app.put('/api/questions/:id', async (req, res) => {
    const { id } = req.params;
    const { question, answer } = req.body;
    try {
        const updatedQuestion = await Quiz.findByIdAndUpdate(id, {
            question: question,
            answer: answer
        }, { new: true });
        res.json(updatedQuestion);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
});

// Endpoint to delete a quiz question
app.delete('/api/questions/:id', async (req, res) => {
 const { id } = req.params;
    try {
        await Quiz.findByIdAndDelete(id);
        res.json({ message: 'Question deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete question' });
    }
});
// Обработчик POST запроса для отправки ответа квиза в базу данных
app.post('/submit_quiz_answer', async (req, res) => {
    try {
        // Получаем данные из тела запроса
        const { question, answer } = req.body;

        // Создаем новую запись квиза в базе данных
        const newQuiz = new Quiz({
            question,
            answer
        });

        // Сохраняем запись квиза в базу данных
        await newQuiz.save();

        // После успешного сохранения ответа, перенаправляем на ту же страницу (например, страницу квиза)
        res.redirect('/quiz');
    } catch (error) {
        // Если произошла ошибка, возвращаем статус 500 и сообщение об ошибке
        console.error(error);
        res.status(500).send('Произошла ошибка при сохранении ответа на квиз.');
    }
});


app.listen(3000, () => console.log('Server started on port 3000'));
