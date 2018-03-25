const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/todos-backend");
mongoose.set("debug", true);
mongoose.Promise = Promise;

const taskSchema = new mongoose.Schema({ name: 'string' });

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true, minlength: 4 },
    password: { type: String, required: true, minlength: 4 },
    tasks: [taskSchema],
    completedTask:[{ name: 'string' }]
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
