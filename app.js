//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-"+process.env.USER+":"+process.env.PASSWORD+"@cluster0.yd3l2.mongodb.net/todolistDB", {
  useUnifiedTopology: true
});


const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

var val = true;

const item1 = new Item({
  // name: "Welcome to your todolist!"
  name:"Add items to me, I'll help you to remember"
});
// const item2 = new Item({
//   name: "Hit the + button to add new item."
// });
// const item3 = new Item({
//   name: "<-- Hit this to delete an item."
// });

const defaultItems = [item1 /*, item2, item3 */ ];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {


  Item.find({}, function(err, results) {

    if (val && results.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted into the database");
        }
        val = false;
      })
    }
    const items = results;
    res.render("list", {
      listTitle: "Today",
      newListItems: items
    });

  })


});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove({_id: checkedItemId}, function(err) {
      if(!err){
        console.log("Item has successfully deleted.");
        res.redirect("/");
      }

    })
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull: {items:{_id:checkedItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    })

  }



})


app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // console.log("Doesn't exist!");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });



});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

// app.get("/about", function(req, res){
//   res.render("about");
// });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.");
});
