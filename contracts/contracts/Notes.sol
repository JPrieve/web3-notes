// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Notes {
    struct Note {
        uint256 id;
        address author;
        string title;
        string content;
        uint256 createdAt;
        uint256 updatedAt;
        bool isPublic;
    }

    // State variables
    uint256 private nextNoteId;
    mapping(uint256 => Note) private notes;
    mapping(address => uint256[]) private userNoteIds;
    uint256[] private publicNoteIds;

    // Events
    event NoteCreated(uint256 indexed noteId, address indexed author, string title, bool isPublic);
    event NoteUpdated(uint256 indexed noteId, address indexed author, string title);
    event NoteDeleted(uint256 indexed noteId, address indexed author);
    event NoteVisibilityChanged(uint256 indexed noteId, bool isPublic);

    // Modifiers
    modifier onlyNoteAuthor(uint256 noteId) {
        require(notes[noteId].author == msg.sender, "Not the note author");
        _;
    }

    modifier noteExists(uint256 noteId) {
        require(notes[noteId].author != address(0), "Note does not exist");
        _;
    }

    // Create a new note
    function createNote(
        string memory title,
        string memory content,
        bool isPublic
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(content).length > 0, "Content cannot be empty");

        uint256 noteId = nextNoteId++;
        
        notes[noteId] = Note({
            id: noteId,
            author: msg.sender,
            title: title,
            content: content,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isPublic: isPublic
        });

        userNoteIds[msg.sender].push(noteId);
        
        if (isPublic) {
            publicNoteIds.push(noteId);
        }

        emit NoteCreated(noteId, msg.sender, title, isPublic);
        return noteId;
    }

    // Update an existing note
    function updateNote(
        uint256 noteId,
        string memory title,
        string memory content
    ) external noteExists(noteId) onlyNoteAuthor(noteId) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(content).length > 0, "Content cannot be empty");

        Note storage note = notes[noteId];
        note.title = title;
        note.content = content;
        note.updatedAt = block.timestamp;

        emit NoteUpdated(noteId, msg.sender, title);
    }

    // Delete a note
    function deleteNote(uint256 noteId) 
        external 
        noteExists(noteId) 
        onlyNoteAuthor(noteId) 
    {
        Note memory note = notes[noteId];
        
        // Remove from public notes if it was public
        if (note.isPublic) {
            _removeFromPublicNotes(noteId);
        }
        
        // Remove from user's note list
        _removeFromUserNotes(msg.sender, noteId);
        
        delete notes[noteId];
        
        emit NoteDeleted(noteId, msg.sender);
    }

    // Toggle note visibility
    function toggleNoteVisibility(uint256 noteId) 
        external 
        noteExists(noteId) 
        onlyNoteAuthor(noteId) 
    {
        Note storage note = notes[noteId];
        note.isPublic = !note.isPublic;
        
        if (note.isPublic) {
            publicNoteIds.push(noteId);
        } else {
            _removeFromPublicNotes(noteId);
        }
        
        emit NoteVisibilityChanged(noteId, note.isPublic);
    }

    // Get a specific note (public or owned by caller)
    function getNote(uint256 noteId) 
        external 
        view 
        noteExists(noteId) 
        returns (Note memory) 
    {
        Note memory note = notes[noteId];
        require(
            note.isPublic || note.author == msg.sender,
            "Note is private"
        );
        return note;
    }

    // Get all notes by a user
    function getUserNotes(address user) 
        external 
        view 
        returns (Note[] memory) 
    {
        uint256[] memory noteIds = userNoteIds[user];
        Note[] memory userNotes = new Note[](noteIds.length);
        
        for (uint256 i = 0; i < noteIds.length; i++) {
            userNotes[i] = notes[noteIds[i]];
        }
        
        return userNotes;
    }

    // Get all public notes
    function getPublicNotes() external view returns (Note[] memory) {
        Note[] memory publicNotes = new Note[](publicNoteIds.length);
        
        uint256 validCount = 0;
        for (uint256 i = 0; i < publicNoteIds.length; i++) {
            uint256 noteId = publicNoteIds[i];
            if (notes[noteId].author != address(0)) {
                publicNotes[validCount] = notes[noteId];
                validCount++;
            }
        }
        
        // Create array with only valid notes
        Note[] memory result = new Note[](validCount);
        for (uint256 i = 0; i < validCount; i++) {
            result[i] = publicNotes[i];
        }
        
        return result;
    }

    // Get user's note count
    function getUserNoteCount(address user) external view returns (uint256) {
        return userNoteIds[user].length;
    }

    // Get total public note count
    function getPublicNoteCount() external view returns (uint256) {
        return publicNoteIds.length;
    }

    // Internal helper functions
    function _removeFromPublicNotes(uint256 noteId) private {
        for (uint256 i = 0; i < publicNoteIds.length; i++) {
            if (publicNoteIds[i] == noteId) {
                publicNoteIds[i] = publicNoteIds[publicNoteIds.length - 1];
                publicNoteIds.pop();
                break;
            }
        }
    }

    function _removeFromUserNotes(address user, uint256 noteId) private {
        uint256[] storage noteIds = userNoteIds[user];
        for (uint256 i = 0; i < noteIds.length; i++) {
            if (noteIds[i] == noteId) {
                noteIds[i] = noteIds[noteIds.length - 1];
                noteIds.pop();
                break;
            }
        }
    }
}