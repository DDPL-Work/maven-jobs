import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiLock, FiSearch, FiUser } from 'react-icons/fi';
import userManagementService from '../../../../../services/userManagementService';
import './CollaborateModal.css';

export default function CollaborateModal({ jobs = [], onClose, onSave }) {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userManagementService.getUsers();
        const fetchedUsers = response.users || response.data || response || [];
        setAllUsers(fetchedUsers);

        // Extract creators from jobs
        const creators = [];
        const creatorIdsOrEmails = new Set();
        
        jobs.forEach(job => {
          if (job.postedBy && !creatorIdsOrEmails.has(job.postedBy)) {
            creatorIdsOrEmails.add(job.postedBy);
            
            // Try to find full user details from fetched users
            const matchedUser = fetchedUsers.find(u => 
              u.email === job.postedBy || u.username === job.postedBy || (u.userId || u.id || u._id) === job.postedBy
            );
            
            creators.push({
              id: matchedUser ? (matchedUser.userId || matchedUser.id || matchedUser._id) : job.postedBy,
              email: matchedUser ? (matchedUser.email || matchedUser.username) : job.postedBy,
              label: '(Creator)',
              locked: true
            });
          }
        });

        // Extract existing collaborators
        const existingCollabs = [];
        const collabIds = new Set();

        jobs.forEach(job => {
          if (Array.isArray(job.collaborators)) {
            job.collaborators.forEach(collabId => {
              // Ensure we don't add the creator again as a regular collaborator if they were somehow in the DB
              const collabIdStr = String(collabId);
              const matchedUser = fetchedUsers.find(u => String(u.userId || u.id || u._id) === collabIdStr);
              if (matchedUser && !creatorIdsOrEmails.has(matchedUser.email) && !creatorIdsOrEmails.has(matchedUser.username) && !collabIds.has(collabIdStr)) {
                collabIds.add(collabIdStr);
                existingCollabs.push({
                  id: matchedUser.userId || matchedUser.id || matchedUser._id,
                  email: matchedUser.email || matchedUser.username,
                  label: '',
                  locked: false
                });
              }
            });
          }
        });

        setSelectedUsers([...creators, ...existingCollabs]);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [jobs]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  const handleClearAll = () => {
    setSelectedUsers(selectedUsers.filter(u => u.locked));
  };

  const handleRemoveUser = (id) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== id || u.locked));
  };

  const handleSelectUser = (user) => {
    const trueId = user.userId || user.id || user._id;
    if (!selectedUsers.find(u => u.id === trueId)) {
      setSelectedUsers([...selectedUsers, {
        id: trueId,
        email: user.email || user.username,
        label: '',
        locked: false
      }]);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(jobs, selectedUsers);
    }
    onClose();
  };

  const filteredUsers = allUsers.filter(u => {
    const emailMatch = (u.email || u.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    const nameMatch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return emailMatch || nameMatch;
  }).filter(u => {
    // Exclude already selected users
    const isSelected = selectedUsers.some(su => su.id === (u.id || u._id));
    
    // Also exclude creators directly if matched by email/username
    const isCreator = jobs.some(job => 
      job.postedBy === u.email || job.postedBy === u.username || job.postedBy === (u.id || u._id)
    );
    
    return !isSelected && !isCreator;
  });

  return (
    <div className="collab-modal-overlay" onClick={onClose}>
      <div className="collab-modal-card" onClick={e => e.stopPropagation()}>
        <button className="collab-modal-close" onClick={onClose}>
          <FiX size={20} />
        </button>

        <h2 className="collab-modal-title">Collaborate with other users</h2>
        <p className="collab-modal-subtitle">
          Add or remove users who will be able to manage this job and its responses.
          To add a new user, go to Manage Users.
        </p>

        <div className="collab-modal-users-header">
          <span className="collab-modal-users-label">Users</span>
          <button type="button" className="collab-modal-clear-btn" onClick={handleClearAll}>
            Clear all
          </button>
        </div>

        <div className="collab-modal-input-container" ref={dropdownRef}>
          <div className="collab-modal-tags">
            {selectedUsers.map(user => (
              <span key={user.id} className={`collab-modal-tag ${user.locked ? 'locked' : ''}`}>
                {user.locked && <FiLock size={12} className="collab-tag-icon" />}
                <span className="collab-tag-text">{user.email} {user.label}</span>
                {!user.locked && (
                  <button type="button" className="collab-tag-remove" onClick={() => handleRemoveUser(user.id)}>
                    <FiX size={14} />
                  </button>
                )}
              </span>
            ))}
          </div>
          <div className="collab-search-wrapper" style={{ position: 'relative' }}>
            <input
              type="text"
              className="collab-modal-search"
              placeholder="Search or select from list"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && (
              <div className="collab-dropdown-menu">
                {loading ? (
                  <div className="collab-dropdown-item">Loading users...</div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div
                      key={user.id || user._id}
                      className="collab-dropdown-item"
                      onClick={() => handleSelectUser(user)}
                    >
                      <FiUser size={14} style={{ marginRight: '8px', color: '#64748b' }}/>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', color: '#0f172a' }}>{user.name || user.email || user.username}</span>
                        {(user.name && (user.email || user.username)) && (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{user.email || user.username}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="collab-dropdown-item">No users found</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="collab-modal-actions">
          <button type="button" className="collab-btn-done" onClick={handleSave}>
            Done
          </button>
          <button type="button" className="collab-btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
