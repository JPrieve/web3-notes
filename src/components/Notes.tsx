import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';

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
        { name: 'isPublic', type: 'bool' }
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
        { name: 'isPublic', type: 'bool' }
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
      setTitle('');
      setContent('');
      setEditingNote(null);
    }
  }, [isSuccess, refetchUserNotes, refetchPublicNotes]);

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
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>📝 Web3 Notes DApp</h2>
        <p>Please connect your wallet to use the notes application</p>
      </div>
    );
  }

  const myNotes = (userNotes as Note[]) || [];
  const allPublicNotes = (publicNotes as Note[]) || [];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📝 Web3 Notes DApp</h1>
      
      <div style={{ 
        background: '#f0f0f0', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <p><strong>Connected:</strong> {address}</p>
        <p><strong>Total Notes:</strong> {noteCount?.toString() || '0'}</p>
        <p><strong>Contract:</strong> {CONTRACT_ADDRESS}</p>
      </div>

      {/* Create/Edit Note Form */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>{editingNote ? '✏️ Edit Note' : '➕ Create New Note'}</h2>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <textarea
            placeholder="Note Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>
        {!editingNote && (
          <div style={{ marginBottom: '15px' }}>
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={editingNote ? handleUpdateNote : handleCreateNote}
            disabled={isPending || isConfirming || !title || !content}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isPending || isConfirming ? '⏳ Processing...' : editingNote ? '💾 Update Note' : '➕ Create Note'}
          </button>
          {editingNote && (
            <button
              onClick={cancelEditing}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('my-notes')}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            background: activeTab === 'my-notes' ? '#007bff' : '#e0e0e0',
            color: activeTab === 'my-notes' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          📋 My Notes ({myNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('public')}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            background: activeTab === 'public' ? '#007bff' : '#e0e0e0',
            color: activeTab === 'public' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer'
          }}
        >
          🌐 Public Notes ({allPublicNotes.length})
        </button>
      </div>

      {/* Notes List */}
      <div>
        {activeTab === 'my-notes' ? (
          myNotes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>
              You haven't created any notes yet. Create your first note above!
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {myNotes.map((note) => (
                <div
                  key={note.id.toString()}
                  style={{
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: note.isPublic ? '2px solid #28a745' : '2px solid #ccc'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 10px 0' }}>
                        {note.title}
                        {note.isPublic && <span style={{ marginLeft: '10px', color: '#28a745' }}>🌐 Public</span>}
                      </h3>
                      <p style={{ margin: '0 0 10px 0', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                      <small style={{ color: '#666' }}>
                        Created: {formatDate(note.createdAt)}
                        {note.updatedAt > note.createdAt && ` | Updated: ${formatDate(note.updatedAt)}`}
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
                      <button
                        onClick={() => startEditing(note)}
                        style={{
                          padding: '5px 10px',
                          background: '#ffc107',
                          color: 'black',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(note.id)}
                        disabled={isPending || isConfirming}
                        style={{
                          padding: '5px 10px',
                          background: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {note.isPublic ? '🔒' : '🌐'}
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={isPending || isConfirming}
                        style={{
                          padding: '5px 10px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          allPublicNotes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>
              No public notes yet. Be the first to share a public note!
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {allPublicNotes.map((note) => (
                <div
                  key={note.id.toString()}
                  style={{
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '2px solid #28a745'
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0' }}>{note.title} 🌐</h3>
                  <p style={{ margin: '0 0 10px 0', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                  <small style={{ color: '#666' }}>
                    By: {note.author.slice(0, 6)}...{note.author.slice(-4)} | 
                    Created: {formatDate(note.createdAt)}
                  </small>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}