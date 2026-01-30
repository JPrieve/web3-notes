import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import './Notes.css';

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const NOTES_ABI = [
  {
    type: 'function',
    name: 'createNote',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'content', type: 'string' },
      { name: 'isPublic', type: 'bool' }
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getUserNotes',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{
      type: 'tuple[]',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'author', type: 'address' },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'updatedAt', type: 'uint256' },
        { name: 'isPublic', type: 'bool' },
        { name: 'isPinned', type: 'bool' },
        { name: 'tipsReceived', type: 'uint256' },
        { name: 'version', type: 'uint256' }
      ]
    }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPublicNotes',
    inputs: [],
    outputs: [{
      type: 'tuple[]',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'author', type: 'address' },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'updatedAt', type: 'uint256' },
        { name: 'isPublic', type: 'bool' },
        { name: 'isPinned', type: 'bool' },
        { name: 'tipsReceived', type: 'uint256' },
        { name: 'version', type: 'uint256' }
      ]
    }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'updateNote',
    inputs: [
      { name: 'noteId', type: 'uint256' },
      { name: 'title', type: 'string' },
      { name: 'content', type: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'deleteNote',
    inputs: [{ name: 'noteId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'toggleNoteVisibility',
    inputs: [{ name: 'noteId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getUserNoteCount',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'togglePinNote',
    inputs: [{name: 'noteId', type: 'uint256'}],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'tipNote',
    inputs: [{name: 'noteId', type: 'uint256'}],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'getPinnedNotes',
    inputs: [{name: 'user', type: 'address'}],
    outputs: [{
      type: 'tuple[]',
      components: [
        {name: 'id', type: 'uint256'},
        {name: 'author', type: 'address'},
        {name: 'title', type: 'string'},
        {name: 'content', type: 'string'},
        {name: 'createdAt', type: 'uint256'},
        {name: 'updatedAt', type: 'uint256'},
        {name: 'isPublic', type: 'bool'},
        {name: 'isPinned', type: 'bool'},
        {name: 'tipsReceived', type: 'uint256'},
        {name: 'version', type: 'uint256'}
      ]
    }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'NoteCreated',
    inputs: [
      { name: 'noteId', type: 'uint256', indexed: true },
      { name: 'author', type: 'address', indexed: true },
      { name: 'title', type: 'string' },
      { name: 'isPublic', type: 'bool' }
    ]
  }
] as const;

interface Note {
  id: bigint;
  author: string;
  title: string;
  content: string;
  createdAt: bigint;
  updatedAt: bigint;
  isPublic: boolean;
  isPinned: boolean;
  tipsReceived: bigint;
  version: bigint;
}

export default function Notes() {
  const { address, isConnected } = useAccount();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState<'my-notes' | 'public'>('my-notes');

  // Read user's notes
  const { data: userNotes, refetch: refetchUserNotes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: NOTES_ABI,
    functionName: 'getUserNotes',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  // Read pinned notes
  const { data: pinnedNotes, refetch: refetchPinnedNotes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: NOTES_ABI,
    functionName: 'getPinnedNotes',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  // Read public notes
  const { data: publicNotes, refetch: refetchPublicNotes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: NOTES_ABI,
    functionName: 'getPublicNotes'
  });

  // Read user note count
  const { data: noteCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: NOTES_ABI,
    functionName: 'getUserNoteCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  // Write contract hooks
  const { data: hash, writeContract, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash 
  });

  // Refetch when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      refetchUserNotes();
      refetchPublicNotes();
      refetchPinnedNotes();
      setTitle('');
      setContent('');
      setEditingNote(null);
    }
  }, [isSuccess, refetchUserNotes, refetchPublicNotes, refetchPinnedNotes]);

  const handleCreateNote = () => {
    if (!title || !content) return;
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: NOTES_ABI,
      functionName: 'createNote',
      args: [title, content, isPublic]
    });
  };

  const handleUpdateNote = () => {
    if (!editingNote || !title || !content) return;
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: NOTES_ABI,
      functionName: 'updateNote',
      args: [editingNote.id, title, content]
    });
  };

  const handleDeleteNote = (noteId: bigint) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: NOTES_ABI,
        functionName: 'deleteNote',
        args: [noteId]
      });
    }
  };

  const handleToggleVisibility = (noteId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: NOTES_ABI,
      functionName: 'toggleNoteVisibility',
      args: [noteId]
    });
  };

  const handleTogglePin = (noteId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: NOTES_ABI,
      functionName: 'togglePinNote',
      args: [noteId]
    });
  };

  const handleTipNote = (noteId: bigint) => {
    const tipAmount = prompt('Enter tip amount in ETH (e.g., 0.01):');
    if (!tipAmount) return;
    
    const tipInWei = BigInt(Math.floor(parseFloat(tipAmount) * 1e18));
    if (tipInWei <= 0) {
      alert('Tip amount must be greater than 0');
      return;
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: NOTES_ABI,
      functionName: 'tipNote',
      args: [noteId],
      value: tipInWei
    });
  };

  const startEditing = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  if (!isConnected) {
    return (
      <div className="notes-connect-screen">
        <h2>📝 Web3 Notes DApp</h2>
        <p>Please connect your wallet to use the notes application</p>
      </div>
    );
  }

  const myNotes = (userNotes as Note[]) || [];
  const allPublicNotes = (publicNotes as Note[]) || [];
  const myPinnedNotes = (pinnedNotes as Note[]) || [];

  return (
    <div className="notes-container">
      <h1>📝 Web3 Notes DApp</h1>
      
      <div className="notes-info-box">
        <p><strong>Connected:</strong> {address}</p>
        <p><strong>Total Notes:</strong> {noteCount?.toString() || '0'} | <strong>Pinned:</strong> {myPinnedNotes.length}</p>
        <p><strong>Contract:</strong> {CONTRACT_ADDRESS}</p>
      </div>

      {/* Create/Edit Note Form */}
      <div className="notes-form">
        <h2>{editingNote ? '✏️ Edit Note' : '➕ Create New Note'}</h2>
        <div className="notes-form-group">
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="notes-input"
          />
        </div>
        <div className="notes-form-group">
          <textarea
            placeholder="Note Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="notes-textarea"
          />
        </div>
        {!editingNote && (
          <div className="notes-form-group">
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              {' '}Make this note public
            </label>
          </div>
        )}
        <div className="notes-button-group">
          <button
            onClick={editingNote ? handleUpdateNote : handleCreateNote}
            disabled={isPending || isConfirming || !title || !content}
            className="notes-btn notes-btn-primary"
          >
            {isPending || isConfirming ? '⏳ Processing...' : editingNote ? '💾 Update Note' : '➕ Create Note'}
          </button>
          {editingNote && (
            <button
              onClick={cancelEditing}
              className="notes-btn notes-btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="notes-tabs">
        <button
          onClick={() => setActiveTab('my-notes')}
          className={`notes-tab ${activeTab === 'my-notes' ? 'notes-tab-active' : 'notes-tab-inactive'}`}
        >
          📋 My Notes ({myNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('public')}
          className={`notes-tab ${activeTab === 'public' ? 'notes-tab-active' : 'notes-tab-inactive'}`}
        >
          🌐 Public Notes ({allPublicNotes.length})
        </button>
      </div>

      {/* Notes List */}
      <div>
        {activeTab === 'my-notes' ? (
          <>
            {/* Pinned Notes Section */}
            {myPinnedNotes.length > 0 && (
              <div className="notes-section">
                <h3 className="notes-section-title">📌 Pinned Notes</h3>
                <div className="notes-grid">
                  {myPinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id.toString()}
                      note={note}
                      isOwner={true}
                      onEdit={startEditing}
                      onDelete={handleDeleteNote}
                      onToggleVisibility={handleToggleVisibility}
                      onTogglePin={handleTogglePin}
                      onTip={handleTipNote}
                      isPending={isPending || isConfirming}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* All Notes Section */}
            {myNotes.length === 0 ? (
              <p className="notes-empty">
                You haven't created any notes yet. Create your first note above!
              </p>
            ) : (
              <div>
                {myPinnedNotes.length > 0 && <h3 className="notes-section-title">📋 All Notes</h3>}
                <div className="notes-grid">
                  {myNotes.map((note) => (
                    <NoteCard
                      key={note.id.toString()}
                      note={note}
                      isOwner={true}
                      onEdit={startEditing}
                      onDelete={handleDeleteNote}
                      onToggleVisibility={handleToggleVisibility}
                      onTogglePin={handleTogglePin}
                      onTip={handleTipNote}
                      isPending={isPending || isConfirming}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          allPublicNotes.length === 0 ? (
            <p className="notes-empty">
              No public notes yet. Be the first to share a public note!
            </p>
          ) : (
            <div className="notes-grid">
              {allPublicNotes.map((note) => (
                <NoteCard
                  key={note.id.toString()}
                  note={note}
                  isOwner={note.author.toLowerCase() === address?.toLowerCase()}
                  onEdit={startEditing}
                  onDelete={handleDeleteNote}
                  onToggleVisibility={handleToggleVisibility}
                  onTogglePin={handleTogglePin}
                  onTip={handleTipNote}
                  isPending={isPending || isConfirming}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// Note Card Component
interface NoteCardProps {
  note: Note;
  isOwner: boolean;
  onEdit: (note: Note) => void;
  onDelete: (noteId: bigint) => void;
  onToggleVisibility: (noteId: bigint) => void;
  onTogglePin: (noteId: bigint) => void;
  onTip: (noteId: bigint) => void;
  isPending: boolean;
}

function NoteCard({ note, isOwner, onEdit, onDelete, onToggleVisibility, onTogglePin, onTip, isPending }: NoteCardProps) {
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const formatEtherAmount = (wei: bigint) => {
    const eth = Number(wei) / 1e18;
    return eth.toFixed(4);
  };

  return (
    <div className={`note-card ${note.isPublic ? 'public' : ''}`}>
      {note.isPinned && (
        <div className="note-card-pin-indicator">
          📌
        </div>
      )}
      <div className="note-card-content">
        <div className="note-card-main">
          <h3 className="note-card-title">
            {note.title}
            {note.isPublic && <span className="note-card-badge public">🌐 Public</span>}
            {note.version > 1n && <span className="note-card-badge version">(v{note.version.toString()})</span>}
          </h3>
          <p className="note-card-text">{note.content}</p>
          <div className="note-card-meta">
            <small className="note-card-meta-text">
              {!isOwner && `By: ${note.author.slice(0, 6)}...${note.author.slice(-4)} | `}
              Created: {formatDate(note.createdAt)}
              {note.updatedAt > note.createdAt && ` | Updated: ${formatDate(note.updatedAt)}`}
            </small>
            {note.tipsReceived > 0n && (
              <small className="note-card-tip-badge">
                💰 {formatEtherAmount(note.tipsReceived)} ETH
              </small>
            )}
          </div>
        </div>
        <div className="note-card-actions">
          {isOwner ? (
            <>
              <button
                onClick={() => onEdit(note)}
                title="Edit"
                className="note-card-btn note-card-btn-edit"
              >
                ✏️
              </button>
              <button
                onClick={() => onTogglePin(note.id)}
                disabled={isPending}
                title={note.isPinned ? 'Unpin' : 'Pin'}
                className="note-card-btn note-card-btn-pin"
              >
                {note.isPinned ? '📌' : '📍'}
              </button>
              <button
                onClick={() => onToggleVisibility(note.id)}
                disabled={isPending}
                title={note.isPublic ? 'Make Private' : 'Make Public'}
                className="note-card-btn note-card-btn-visibility"
              >
                {note.isPublic ? '🔒' : '🌐'}
              </button>
              <button
                onClick={() => onDelete(note.id)}
                disabled={isPending}
                title="Delete"
                className="note-card-btn note-card-btn-delete"
              >
                🗑️
              </button>
            </>
          ) : (
            <button
              onClick={() => onTip(note.id)}
              disabled={isPending}
              title="Tip Author"
              className="note-card-btn note-card-btn-tip"
            >
              💰 Tip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
