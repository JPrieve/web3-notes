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
        bool isPinned;
        uint256 tipsReceived;
        uint256 version;
    }

    struct NoteVersion {
        string title;
        string content;
        uint256 timestamp;
    }

    // Constants for gas optimization
    uint256 public constant MAX_TITLE_LENGTH = 200;
    uint256 public constant MAX_CONTENT_LENGTH = 5000;
    uint256 public constant MAX_BATCH_SIZE = 10;

    // State variables
    uint256 private nextNoteId;
    mapping(uint256 => Note) private notes;
    mapping(address => uint256[]) private userNoteIds;
    mapping(address => uint256[]) private pinnedNoteIds;
    uint256[] private publicNoteIds;
    
    // Note versioning
    mapping(uint256 => NoteVersion[]) private noteVersions;
    
    // Tipping
    mapping(uint256 => address[]) private noteTippers;
    mapping(uint256 => mapping(address => uint256)) private tipAmounts;

    // Events
    event NoteCreated(uint256 indexed noteId, address indexed author, string title, bool isPublic);
    event NoteUpdated(uint256 indexed noteId, address indexed author, string title);
    event NoteDeleted(uint256 indexed noteId, address indexed author);
    event NoteVisibilityChanged(uint256 indexed noteId, bool isPublic);
    event NotePinned(uint256 indexed noteId, address indexed author, bool isPinned);
    event NoteTipped(uint256 indexed noteId, address indexed tipper, address indexed author, uint256 amount);
    event BatchNotesCreated(address indexed author, uint256 count);

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
        require(bytes(title).length <= MAX_TITLE_LENGTH, "Title too long");
        require(bytes(content).length <= MAX_CONTENT_LENGTH, "Content too long");

        uint256 noteId = nextNoteId++;
        
        notes[noteId] = Note({
            id: noteId,
            author: msg.sender,
            title: title,
            content: content,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isPublic: isPublic,
            isPinned: false,
            tipsReceived: 0,
            version: 1
        });

        userNoteIds[msg.sender].push(noteId);
        
        if (isPublic) {
            publicNoteIds.push(noteId);
        }

        // Store initial version
        noteVersions[noteId].push(NoteVersion({
            title: title,
            content: content,
            timestamp: block.timestamp
        }));

        emit NoteCreated(noteId, msg.sender, title, isPublic);
        return noteId;
    }

    // Batch create notes
    function batchCreateNotes(
        string[] memory titles,
        string[] memory contents,
        bool[] memory isPublicArr
    ) external returns (uint256[] memory) {
        require(titles.length == contents.length, "Array length mismatch");
        require(titles.length == isPublicArr.length, "Array length mismatch");
        require(titles.length > 0 && titles.length <= MAX_BATCH_SIZE, "Invalid batch size");

        uint256[] memory noteIds = new uint256[](titles.length);

        for (uint256 i = 0; i < titles.length; i++) {
            require(bytes(titles[i]).length > 0, "Title cannot be empty");
            require(bytes(contents[i]).length > 0, "Content cannot be empty");
            require(bytes(titles[i]).length <= MAX_TITLE_LENGTH, "Title too long");
            require(bytes(contents[i]).length <= MAX_CONTENT_LENGTH, "Content too long");

            uint256 noteId = nextNoteId++;
            
            notes[noteId] = Note({
                id: noteId,
                author: msg.sender,
                title: titles[i],
                content: contents[i],
                createdAt: block.timestamp,
                updatedAt: block.timestamp,
                isPublic: isPublicArr[i],
                isPinned: false,
                tipsReceived: 0,
                version: 1
            });

            userNoteIds[msg.sender].push(noteId);
            
            if (isPublicArr[i]) {
                publicNoteIds.push(noteId);
            }

            // Store initial version
            noteVersions[noteId].push(NoteVersion({
                title: titles[i],
                content: contents[i],
                timestamp: block.timestamp
            }));

            noteIds[i] = noteId;
            emit NoteCreated(noteId, msg.sender, titles[i], isPublicArr[i]);
        }

        emit BatchNotesCreated(msg.sender, titles.length);
        return noteIds;
    }

    // Update an existing note
    function updateNote(
        uint256 noteId,
        string memory title,
        string memory content
    ) external noteExists(noteId) onlyNoteAuthor(noteId) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(content).length > 0, "Content cannot be empty");
        require(bytes(title).length <= MAX_TITLE_LENGTH, "Title too long");
        require(bytes(content).length <= MAX_CONTENT_LENGTH, "Content too long");

        Note storage note = notes[noteId];
        
        // Store previous version before updating
        noteVersions[noteId].push(NoteVersion({
            title: note.title,
            content: note.content,
            timestamp: note.updatedAt
        }));

        note.title = title;
        note.content = content;
        note.updatedAt = block.timestamp;
        note.version++;

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
        
        // Remove from pinned notes if it was pinned
        if (note.isPinned) {
            _removeFromPinnedNotes(msg.sender, noteId);
        }
        
        // Remove from user's note list
        _removeFromUserNotes(msg.sender, noteId);
        
        delete notes[noteId];
        delete noteVersions[noteId];
        delete noteTippers[noteId];
        
        emit NoteDeleted(noteId, msg.sender);
    }

    // Toggle note pin status
    function togglePinNote(uint256 noteId) 
        external 
        noteExists(noteId) 
        onlyNoteAuthor(noteId) 
    {
        Note storage note = notes[noteId];
        note.isPinned = !note.isPinned;
        
        if (note.isPinned) {
            pinnedNoteIds[msg.sender].push(noteId);
        } else {
            _removeFromPinnedNotes(msg.sender, noteId);
        }
        
        emit NotePinned(noteId, msg.sender, note.isPinned);
    }

    // Tip a note author
    function tipNote(uint256 noteId) 
        external 
        payable 
        noteExists(noteId) 
    {
        require(msg.value > 0, "Tip must be greater than 0");
        Note storage note = notes[noteId];
        require(note.author != msg.sender, "Cannot tip your own note");

        note.tipsReceived += msg.value;
        
        // Track tipper if first time tipping this note
        if (tipAmounts[noteId][msg.sender] == 0) {
            noteTippers[noteId].push(msg.sender);
        }
        tipAmounts[noteId][msg.sender] += msg.value;

        // Transfer tip to author
        (bool success, ) = payable(note.author).call{value: msg.value}("");
        require(success, "Tip transfer failed");

        emit NoteTipped(noteId, msg.sender, note.author, msg.value);
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

    // Get pinned notes for a user
    function getPinnedNotes(address user) external view returns (Note[] memory) {
        uint256[] memory noteIds = pinnedNoteIds[user];
        Note[] memory pinned = new Note[](noteIds.length);
        
        for (uint256 i = 0; i < noteIds.length; i++) {
            pinned[i] = notes[noteIds[i]];
        }
        
        return pinned;
    }

    // Get note version history
    function getNoteVersions(uint256 noteId) 
        external 
        view 
        noteExists(noteId)
        returns (NoteVersion[] memory) 
    {
        Note memory note = notes[noteId];
        require(
            note.isPublic || note.author == msg.sender,
            "Note is private"
        );
        return noteVersions[noteId];
    }

    // Get tippers for a note
    function getNoteTippers(uint256 noteId) 
        external 
        view 
        noteExists(noteId)
        returns (address[] memory, uint256[] memory) 
    {
        address[] memory tippers = noteTippers[noteId];
        uint256[] memory amounts = new uint256[](tippers.length);
        
        for (uint256 i = 0; i < tippers.length; i++) {
            amounts[i] = tipAmounts[noteId][tippers[i]];
        }
        
        return (tippers, amounts);
    }

    // Get tip amount from a specific tipper for a note
    function getTipAmount(uint256 noteId, address tipper) 
        external 
        view 
        returns (uint256) 
    {
        return tipAmounts[noteId][tipper];
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

    function _removeFromPinnedNotes(address user, uint256 noteId) private {
        uint256[] storage noteIds = pinnedNoteIds[user];
        for (uint256 i = 0; i < noteIds.length; i++) {
            if (noteIds[i] == noteId) {
                noteIds[i] = noteIds[noteIds.length - 1];
                noteIds.pop();
                break;
            }
        }
    }
}