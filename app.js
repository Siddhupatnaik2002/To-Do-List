const express = require("express");
const bodyParser = require("body-parser");
//const date = require(__dirname+"/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

// using mongoose
mongoose.connect("mongodb://localhost:27017/todolistDB");
//todolist schema
const itemsSchema = new mongoose.Schema({
    name:String
});

// model
const Item = mongoose.model("Item",itemsSchema);
//documents
const task1 = new Item({
    name:"Welcome to your Do list"
});

const task2 = new Item({
    name:"To add an item press the + button"
});
const task3 = new Item({
    name:"<-- To remove completed task"
});
//default list
const defaultList = [task1,task2,task3];

//lists schema
const listSchema = new mongoose.Schema({
    listTitle:String,
    items:[itemsSchema]
});

const List = mongoose.model("List",listSchema);

//get requests:

app.get("/",function(req,res){
    //let today = date.getDate();
    
    Item.find({},function(err,items){
        if(err){
            console.log(err);
        }else{
            if(items.length===0){
                Item.insertMany(defaultList,function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("default list updated");
                    }
                });    
                res.redirect("/");            
            }
            else{
                res.render("list",{title:"Today",items:items})
            }
        }
    });
});



app.get("/:currentList",function(req,res){
    const currentList= _.capitalize(req.params.currentList); 
    List.findOne({listTitle:currentList},function(err,foundList){
        if(err){
            console.log(err);
        }else{
            //if list not found
            if(!foundList){
                const newList = new List({
                    listTitle:currentList,
                    items:defaultList
                });
                newList.save()
                res.redirect("/"+currentList);
                
            }else{
               //if list found
               res.render("list",{title:foundList.listTitle,items:foundList.items})
            }
        }
    });
    
});

//post requests:

app.post("/",function(req,res){
    const task = req.body.newTask;
    const listName=req.body.button;
    const newItem = new Item({
        name:task
    });
    if(listName==="Today"){
        newItem.save();
        res.redirect("/");
    }else{
        List.findOne({listTitle:listName},function(err,foundList){
            if(!err){
                foundList.items.push(newItem);
                //since we are adding new data we have to save it again ,if we are not adding any new data then saving again leads to stroing repeated data in our collection
                foundList.save();
                res.redirect("/"+listName);
            }
        });
    }
       
});



app.post("/delete",function(req,res){
    const checkMessage=req.body.check;
    const listName=req.body.listName;
    if(listName==="Today"){
        Item.deleteOne({_id:checkMessage},function(err){
            if(err){
                console.log(err);
            }else{
                console.log("deleted document containing id value: "+checkMessage);
                res.redirect("/");
            }
        });
        
    }else{
        List.findOneAndUpdate({listTitle:listName},{$pull:{items:{_id:checkMessage}}},function(err){
            if(!err){
                res.redirect("/"+listName);
            }
        });
    }
    
});


app.listen(3000,function(){
    console.log("working on to do list project");
});