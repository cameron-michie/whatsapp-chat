import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { startChatWithUser } from '../utils/roomId';
import { QuickChatStart } from './QuickChatStart';

interface Contact {
  userId: string;
  name: string;
  avatar?: string;
}

// Mock contact data - in a real app, this would come from an API or user directory
const MOCK_CONTACTS: Contact[] = [
  {
    userId: 'user_456',
    name: 'Jane Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
  },
  {
    userId: 'user_789', 
    name: 'Bob Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
  },
  {
    userId: 'user_321',
    name: 'Alice Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
  },
  {
    userId: 'user_654',
    name: 'Charlie Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
  }
];

export const ContactList: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleStartChat = (contact: Contact) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    console.log(`Starting chat with ${contact.name} (${contact.userId})`);
    startChatWithUser(user.id, contact.userId, navigate);
    setIsOpen(false); // Close the contact list
  };

  const filteredContacts = MOCK_CONTACTS.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.userId.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(contact => contact.userId !== user?.id); // Don't show current user

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Quick Chat Start */}
      <QuickChatStart />

      <div className="relative">
        {/* New Chat Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          title="Start new chat from contacts"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Browse Contacts
        </button>

      {/* Contact List Modal/Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Contact List Panel */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50 max-h-96 overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b dark:border-gray-700">
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Contact List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No contacts found' : 'No contacts available'}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.userId}
                    onClick={() => handleStartChat(contact)}
                    className="w-full px-4 py-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    {/* Avatar */}
                    <img
                      src={contact.avatar}
                      alt={`${contact.name} avatar`}
                      className="w-10 h-10 rounded-full mr-3 bg-gray-200"
                    />
                    
                    {/* Contact Info */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {contact.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {contact.userId}
                      </div>
                    </div>

                    {/* Chat Icon */}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                ))
              )}
            </div>

            {/* Add Contact Option */}
            <div className="p-4 border-t dark:border-gray-700">
              <button
                onClick={() => {
                  // TODO: Implement add contact functionality
                  console.log('Add contact functionality not implemented yet');
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-sm text-blue-500 hover:text-blue-600 transition-colors text-center"
              >
                + Add new contact
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};