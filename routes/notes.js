const express = require('express');
const router = express.Router()
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'shraddhaisagood$girl';
const fetchUser = require('../middleware/fetchUser');
const Notes = require('../models/Notes');
const { body, validationResult } = require('express-validator');

//Route 1 : fetch all notes by user id path = /api/notes/fetchallnotes
router.get('/fetchallnotes', fetchUser, async (req, res) => {

    try {
        const notes = await Notes.find({ user: req.user.id })
        res.json(notes);

    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
})

//Route 2 : add note path=/api/notes/addnote
router.post('/addnote', fetchUser, [
    body('title', 'Enter a valid title').isLength({ min: 5 }),
    body('description', 'Enter a valid description').isLength({ min: 10 })

], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { title, description, tag } = req.body;
        const notes = new Notes({
            title, description, tag, user: req.user.id
        })
        const savedNotes = await notes.save();
        res.json(savedNotes);
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
})

//Route 3 : update note by note id path = /api/notes/updatenote/:id
router.put('/updatenote/:id', fetchUser, [
    body('title', 'Enter a valid title').isLength({ min: 5 }),
    body('description', 'Enter a valid description').isLength({ min: 10 })
], async (req, res) => {

    try {
        const { title, description, tag } = req.body;
        let note = await Notes.findById(req.params.id);

        if (!note) {
            return res.status(404).send("Note not found");
        }
        if (req.user.id != note.user.toString()) {
            return res.status(404).send("Not allowed");
        }
        let newNote = {};
        if (title) { newNote.title = title };
        if (description) { newNote.description = description };
        if (tag) { newNote.tag = tag };

        note = await Notes.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true });
        res.json(note);

    } catch (error) {
        console.error(error)
        res.status(500).send("Internal Server Error");
    }
})

//Route 4 : delete note by note id path = /api/notes/deletenote/:id
router.delete('/deletenote/:id', fetchUser, async (req, res) => {
    try {
        let note = await Notes.findById(req.params.id);
        if (!note) {
            return res.status(404).send("Note not found");
        }
        if (req.user.id != note.user.toString()) {
            return res.status(404).send("Not allowed");
        }
        note = await Notes.findByIdAndDelete(req.params.id);
        res.json({ success: "Deleted Successfully", note });

    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
})

module.exports = router