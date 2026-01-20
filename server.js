const express=require("express");
const mongoose=require("mongoose");
const session=require("express-session");
require("dotenv").config();
const app=express();
const PORT=process.env.PORT||3000;

app.use(express.json());
app.use(express.static("public"));
app.use(session({
  secret:"clau_secreta_super_segura",
  resave:false,
  saveUninitialized:true
}));

mongoose.connect(process.env.MONGO_URI,{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>console.log("✅ Connectat a MongoDB Atlas"))
.catch(err=>console.error("❌ Error de connexió:",err));

const Professor=mongoose.model("Professor",new mongoose.Schema({
  nom:String,
  usuari:{type:String,unique:true},
  contrasenya:String,
  valoracio:{type:Number,default:0},
  color:{type:String,default:"#dbeafe"} // 🎨 Color pastel per defecte
}));

const Classe=mongoose.model("Classe",new mongoose.Schema({
  alumne:String,
  profe:String,
  data:String,
  hora:String,
  preu:Number,
  done:{type:Boolean,default:false},
  cancelled:{type:Boolean,default:false},
  diesRepeticio:[Number],
  familiaEmail:String,
  familiaTelefon:String
}));

// 🔹 Afegir professor
app.post("/api/professors",async(req,res)=>{
  try{
    const profe=new Professor(req.body);
    await profe.save();
    res.json(profe);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

// 🔹 Llistar professors
app.get("/api/professors",async(req,res)=>{
  const profes=await Professor.find({},"nom usuari contrasenya valoracio color");
  res.json(profes);
});

// 🔹 Actualitzar professor
app.put("/api/professors/:id",async(req,res)=>{
  try{
    const profe=await Professor.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true});
    if(!profe)return res.status(404).json({error:"Professor no trobat"});
    res.json(profe);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

// 🔹 Eliminar professor
app.delete("/api/professors/:id",async(req,res)=>{
  try{
    const result=await Professor.findByIdAndDelete(req.params.id);
    if(!result)return res.status(404).json({error:"Professor no trobat"});
    res.json({message:"Professor eliminat"});
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

// 🔹 Login
app.post("/api/login",async(req,res)=>{
  const{usuari,contrasenya}=req.body;
  try{
    if(usuari==="admin"&&contrasenya==="Focusgrup4"){
      req.session.user={id:"0",nom:"Administrador",usuari:"admin",role:"admin"};
      return res.json(req.session.user);
    }
    const user=await Professor.findOne({usuari,contrasenya});
    if(!user)return res.status(401).json({error:"Credencials incorrectes"});
    req.session.user={id:user._id,nom:user.nom,usuari:user.usuari,role:"profe"};
    res.json(req.session.user);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

// 🔹 Impersonar un professor des de l'admin
app.get("/admin/impersona/:id",async(req,res)=>{
  try{
    if(!req.session.user||req.session.user.role!=="admin"){
      return res.status(403).send("Accés denegat");
    }
    const profe=await Professor.findById(req.params.id);
    if(!profe)return res.status(404).send("Professor no trobat");
    req.session.user={id:profe._id,nom:profe.nom,usuari:profe.usuari,role:"profe"};
    res.redirect("/profe.html");
  }catch(err){
    res.status(500).send("Error en impersonar professor");
  }
});

// 🔹 Endpoint per saber qui està loguejat
app.get("/api/me",(req,res)=>{
  if(req.session.user){
    res.json(req.session.user);
  }else{
    res.status(401).json({error:"No autenticat"});
  }
});

// 🔹 Crear classes amb preu automàtic segons la valoració del professor
app.post("/api/classes",async(req,res)=>{
  try{
    const {alumne,profe,data,hora,familiaEmail,familiaTelefon}=req.body;
    const professor=await Professor.findOne({nom:profe});
    if(!professor){
      return res.status(400).json({error:"Professor no trobat"});
    }
    const classe=new Classe({
      alumne,
      profe,
      data,
      hora,
      preu:professor.valoracio,
      familiaEmail,
      familiaTelefon
    });
    await classe.save();
    res.json(classe);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

// 🔹 Llistar classes
app.get("/api/classes",async(req,res)=>{
  try{
    const{month}=req.query;
    let filter={};
    if(month){
      const[year,mon]=month.split("-");
      const start=new Date(year,mon-1,1);
      const end=new Date(year,mon,0,23,59,59);
      filter={data:{$gte:start.toISOString().split("T")[0],$lte:end.toISOString().split("T")[0]}};
    }
    const classes=await Classe.find(filter);
    res.json(classes);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

// 🔹 Llistar famílies amb contacte
app.get("/api/families",async(req,res)=>{
  try{
    const classes=await Classe.find({});
    const familiesMap=new Map();
    classes.forEach(c=>{
      if(!c.alumne)return;
      familiesMap.set(c.alumne,{
        alumne:c.alumne,
        email:c.familiaEmail||"",
        telefon:c.familiaTelefon||""
      });
    });
    res.json(Array.from(familiesMap.values()));
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

// 🔹 Marcar com a feta/no feta
app.put("/api/classes/:id/toggle",async(req,res)=>{
  try{
    const classe=await Classe.findById(req.params.id);
    if(!classe)return res.status(404).json({error:"No trobada"});
    classe.done=!classe.done;
    await classe.save();
    res.json(classe);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

// 🔹 Cancel·lar/recuperar classe
app.put("/api/classes/:id/cancel",async(req,res)=>{
  try{
    const classe=await Classe.findById(req.params.id);
    if(!classe)return res.status(404).json({error:"No trobada"});
    classe.cancelled=!classe.cancelled;
    await classe.save();
    res.json(classe);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

// 🔹 Test endpoint
app.get("/api/ping",(req,res)=>{
  res.json({message:"pong 🏓",time:new Date()});
});

app.listen(PORT,()=>console.log(`🌍 Servidor a http://localhost:${PORT}`));
