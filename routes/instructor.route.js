import express from "express";
import * as instructorModel from "../models/instructor.model.js";
import { Console } from "console";
const router = express.Router();

router.get('/infor/:instructorid', async function (req, res) {
    const instructorid = req.params.instructorid;
  
    if (!instructorid) {
      return res.status(400).send('Instructor ID is required');
    }
  
    const instructor = await instructorModel.findById(instructorid);
    if (!instructor) {
      return res.status(404).send('Instructor not found');
    }
    const email = await instructorModel.getInstructorEmail(instructorid);
    const fullname = await instructorModel.getInstructorName(instructorid);
    console.log(email);
    console.log(fullname);
    console.log(instructor.birthday);
    res.render('vwInstructor/infor', 
    { 
        instructor : instructor ,
        email : email,
        fullname : fullname
    });
  });

export default router;