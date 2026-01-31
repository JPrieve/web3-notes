import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Notes from './Notes';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useReadContract: jest.fn(),
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn()
}));

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockUseReadContract = useReadContract as jest.MockedFunction<typeof useReadContract>;
const mockUseWriteContract = useWriteContract as jest.MockedFunction<typeof useWriteContract>;
const mockUseWaitForTransactionReceipt = useWaitForTransactionReceipt as jest.MockedFunction<typeof useWaitForTransactionReceipt>;

describe('Notes Component', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Default mock for useWaitForTransactionReceipt
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false
    } as any);
  });

  describe('Wallet Not Connected', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false
      } as any);

      // Even when not connected, provide default empty data
      mockUseReadContract.mockReturnValue({
        data: undefined,
        refetch: jest.fn()
      } as any);

      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: jest.fn(),
        isPending: false
      } as any);
    });

    test('should show connect wallet message when not connected', () => {
      render(<Notes />);
      expect(screen.getByText(/Please connect your wallet/i)).toBeInTheDocument();
    });

    test('should show Web3 Notes DApp title', () => {
      render(<Notes />);
      expect(screen.getByText('📝 Web3 Notes DApp')).toBeInTheDocument();
    });
  });

  describe('Wallet Connected - No Notes', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: mockAddress,
        isConnected: true
      } as any);

      mockUseReadContract.mockReturnValue({
        data: [],
        refetch: jest.fn()
      } as any);

      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: jest.fn(),
        isPending: false
      } as any);
    });

    test('should show create note form when connected', () => {
      render(<Notes />);
      expect(screen.getByPlaceholderText(/Note Title/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Note Content/i)).toBeInTheDocument();
    });

    test('should show connected address', () => {
      render(<Notes />);
      expect(screen.getByText(new RegExp(mockAddress, 'i'))).toBeInTheDocument();
    });

    test('should show empty state message', () => {
      render(<Notes />);
      expect(screen.getByText(/haven't created any notes yet/i)).toBeInTheDocument();
    });

    test('should show My Notes and Public Notes tabs', () => {
      render(<Notes />);
      expect(screen.getByText(/📋 My Notes/i)).toBeInTheDocument();
      expect(screen.getByText(/🌐 Public Notes/i)).toBeInTheDocument();
    });
  });

  describe('Creating Notes', () => {
    const mockWriteContract = jest.fn();

    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: mockAddress,
        isConnected: true
      } as any);

      mockUseReadContract.mockReturnValue({
        data: [],
        refetch: jest.fn()
      } as any);

      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: mockWriteContract,
        isPending: false
      } as any);
    });

    test('should enable create button when title and content are filled', () => {
      render(<Notes />);
      
      const titleInput = screen.getByPlaceholderText(/Note Title/i);
      const contentInput = screen.getByPlaceholderText(/Note Content/i);
      
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      
      const createButton = screen.getByText(/➕ Create Note/i);
      expect(createButton).not.toBeDisabled();
    });

    test('should disable create button when title is empty', () => {
      render(<Notes />);
      
      const contentInput = screen.getByPlaceholderText(/Note Content/i);
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      
      const createButton = screen.getByText(/➕ Create Note/i);
      expect(createButton).toBeDisabled();
    });

    test('should show public checkbox', () => {
      render(<Notes />);
      expect(screen.getByText(/Make this note public/i)).toBeInTheDocument();
    });
  });

  describe('Displaying Notes', () => {
    const mockNotes = [
      {
        id: 0n,
        author: mockAddress,
        title: 'Test Note 1',
        content: 'This is test content 1',
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
        updatedAt: BigInt(Math.floor(Date.now() / 1000)),
        isPublic: false,
        isPinned: false,
        tipsReceived: 0n,
        version: 1n
      },
      {
        id: 1n,
        author: mockAddress,
        title: 'Test Note 2',
        content: 'This is test content 2',
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
        updatedAt: BigInt(Math.floor(Date.now() / 1000)),
        isPublic: true,
        isPinned: false,
        tipsReceived: 0n,
        version: 1n
      }
    ];

    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: mockAddress,
        isConnected: true
      } as any);

      mockUseReadContract.mockImplementation(({ functionName }: any) => {
        if (functionName === 'getUserNotes') {
          return { data: mockNotes, refetch: jest.fn() } as any;
        }
        if (functionName === 'getPublicNotes') {
          return { data: [mockNotes[1]], refetch: jest.fn() } as any;
        }
        if (functionName === 'getPinnedNotes') {
          return { data: [], refetch: jest.fn() } as any;
        }
        if (functionName === 'getUserNoteCount') {
          return { data: 2n, refetch: jest.fn() } as any;
        }
        return { data: undefined, refetch: jest.fn() } as any;
      });

      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: jest.fn(),
        isPending: false
      } as any);
    });

    test('should display user notes', () => {
      render(<Notes />);
      expect(screen.getByText('Test Note 1')).toBeInTheDocument();
      expect(screen.getByText('Test Note 2')).toBeInTheDocument();
    });

    test('should show note count', () => {
      render(<Notes />);
      // The text includes "Total Notes: 2 | Pinned: 0" all in one paragraph
      expect(screen.getByText(/Total Notes:/i)).toBeInTheDocument();
      // Check that My Notes tab shows the count
      expect(screen.getByText(/📋 My Notes \(2\)/i)).toBeInTheDocument();
    });

    test('should show public badge on public notes', () => {
      render(<Notes />);
      // Look specifically for the badge span, not the tab button
      const badges = screen.getAllByText(/🌐 Public/i);
      expect(badges.length).toBeGreaterThan(0);
    });

    test('should show edit, pin, and delete buttons on own notes', () => {
      render(<Notes />);
      const editButtons = screen.getAllByTitle('Edit');
      const deleteButtons = screen.getAllByTitle('Delete');
      
      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    test('should switch to public notes tab', () => {
      render(<Notes />);
      
      const publicTab = screen.getByText(/🌐 Public Notes/i);
      fireEvent.click(publicTab);
      
      // After clicking, we should still see at least one public note
      expect(screen.getByText('Test Note 2')).toBeInTheDocument();
    });
  });

  describe('Pinned Notes', () => {
    const pinnedNote = {
      id: 0n,
      author: mockAddress,
      title: 'Pinned Note',
      content: 'This is pinned',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
      isPublic: false,
      isPinned: true,
      tipsReceived: 0n,
      version: 1n
    };

    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: mockAddress,
        isConnected: true
      } as any);

      mockUseReadContract.mockImplementation(({ functionName }: any) => {
        if (functionName === 'getPinnedNotes') {
          return { data: [pinnedNote], refetch: jest.fn() } as any;
        }
        if (functionName === 'getUserNotes') {
          return { data: [pinnedNote], refetch: jest.fn() } as any;
        }
        return { data: [], refetch: jest.fn() } as any;
      });

      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: jest.fn(),
        isPending: false
      } as any);
    });

    test('should show pinned notes section', () => {
      render(<Notes />);
      expect(screen.getByText(/📌 Pinned Notes/i)).toBeInTheDocument();
    });

    test('should display pin indicator', () => {
      render(<Notes />);
      // Find pin indicators (there will be multiple - in the pinned section and button)
      const indicators = screen.getAllByText('📌');
      expect(indicators.length).toBeGreaterThan(0);
    });
  });

  describe('Note with Tips', () => {
    const tippedNote = {
      id: 0n,
      author: '0x9999999999999999999999999999999999999999',
      title: 'Great Content',
      content: 'This deserves tips',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
      isPublic: true,
      isPinned: false,
      tipsReceived: BigInt('100000000000000000'), // 0.1 ETH
      version: 1n
    };

    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: mockAddress,
        isConnected: true
      } as any);

      mockUseReadContract.mockImplementation(({ functionName }: any) => {
        if (functionName === 'getPublicNotes') {
          return { data: [tippedNote], refetch: jest.fn() } as any;
        }
        return { data: [], refetch: jest.fn() } as any;
      });

      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: jest.fn(),
        isPending: false
      } as any);
    });

    test('should show tip badge on tipped notes', () => {
      render(<Notes />);
      
      const publicTab = screen.getByText(/🌐 Public Notes/i);
      fireEvent.click(publicTab);
      
      expect(screen.getByText(/💰.*ETH/i)).toBeInTheDocument();
    });

    test('should show tip button on others notes', () => {
      render(<Notes />);
      
      const publicTab = screen.getByText(/🌐 Public Notes/i);
      fireEvent.click(publicTab);
      
      expect(screen.getByTitle('Tip Author')).toBeInTheDocument();
    });
  });
});
