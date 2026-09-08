import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFolder, FiPlus, FiSearch, FiMoreVertical, FiEdit2, FiTrash2, FiCopy, FiShare2, FiArchive, FiDownload, FiX, FiChevronDown } from 'react-icons/fi';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import CreateFolderModal from '../../../../components/employer/CreateFolderModal';
import { useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder, useDuplicateFolder } from '../../../../hooks/useFolderQueries';
import './FolderListPage.css';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Updated' },
  { value: 'created', label: 'Recently Created' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Alphabetical' },
  { value: 'candidates', label: 'Most Candidates' },
];

export default function FolderListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [renameData, setRenameData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const limit = 20;

  const params = useMemo(() => {
    const p = { sort, page, limit };
    if (search.trim()) p.search = search.trim();
    return p;
  }, [search, sort, page]);

  const { data: folders = [], total, totalPages, isLoading, refetch } = useFolders(params);
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const duplicateFolder = useDuplicateFolder();

  const handleCreate = async (data) => {
    try {
      await createFolder.mutateAsync(data);
      setShowCreate(false);
      refetch();
    } catch (e) {
      // error handled by modal validation
    }
  };

  const handleRename = async (data) => {
    try {
      await updateFolder.mutateAsync({ id: renameData._id, ...data });
      setRenameData(null);
      refetch();
    } catch (e) {
      // silent
    }
  };

  const handleDelete = async (folder) => {
    if (!window.confirm(`Delete "${folder.name}"? This action cannot be undone.`)) return;
    try {
      await deleteFolder.mutateAsync(folder._id);
      setMenuOpen(null);
      refetch();
    } catch (e) {
      // silent
    }
  };

  const handleDuplicate = async (folder) => {
    try {
      await duplicateFolder.mutateAsync(folder._id);
      setMenuOpen(null);
      refetch();
    } catch (e) {
      // silent
    }
  };

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Recently Updated';

  useEffect(() => { setPage(1); }, [search, sort]);

  const closeMenu = useCallback(() => setMenuOpen(null), []);

  useEffect(() => {
    if (menuOpen) {
      const handler = () => closeMenu();
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [menuOpen, closeMenu]);

  return (
    <div className="flp-root">
      <div className="flp-container">
        <EmployerBreadcrumb items={[
          { label: 'Employer Dashboard', path: '/employer-dashboard' },
          { label: 'Folders' },
        ]} />

        <div className="flp-header">
          <div>
            <h1 className="flp-title">Folders</h1>
            <p className="flp-subtitle">Organize and manage shortlisted candidates.</p>
          </div>
          <button className="flp-create-btn" onClick={() => setShowCreate(true)}>
            <FiPlus size={16} /> Create Folder
          </button>
        </div>

        <div className="flp-toolbar">
          <div className="flp-search">
            <FiSearch size={16} className="flp-search-icon" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search folders..."
              className="flp-search-input"
            />
            {search && (
              <button className="flp-search-clear" onClick={() => setSearch('')}><FiX size={14} /></button>
            )}
          </div>
          <div className="flp-sort-wrapper">
            <button className="flp-sort-btn" onClick={() => setShowSort(!showSort)}>
              {sortLabel} <FiChevronDown size={14} style={{ transform: showSort ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
            </button>
            {showSort && (
              <div className="flp-sort-dropdown">
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} className={`flp-sort-option${sort === opt.value ? ' active' : ''}`}
                    onClick={() => { setSort(opt.value); setShowSort(false); }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flp-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flp-skeleton" style={{ height: 180, borderRadius: 14, background: '#f1f5f9', animation: 'flpPulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : folders.length > 0 ? (
          <>
            <div className="flp-grid">
              {folders.map((folder, i) => (
                <motion.div
                  key={folder._id}
                  className="flp-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  onClick={() => navigate(`/employer-dashboard/folders/${folder._id}`)}
                >
                  <div className="flp-card-top">
                    <div className="flp-card-icon" style={{ background: folder.color || '#002366' }}>
                      <FiFolder size={22} />
                    </div>
                    <div className="flp-card-menu">
                      <button className="flp-card-dots" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === folder._id ? null : folder._id); }}>
                        <FiMoreVertical size={16} />
                      </button>
                      {menuOpen === folder._id && (
                        <div className="flp-card-dropdown" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setRenameData(folder); setMenuOpen(null); }}><FiEdit2 size={14} /> Rename</button>
                          <button onClick={() => handleDuplicate(folder)}><FiCopy size={14} /> Duplicate</button>
                          <button onClick={() => handleDelete(folder)} className="danger"><FiTrash2 size={14} /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="flp-card-name">{folder.name}</h3>
                  {folder.description && <p className="flp-card-desc">{folder.description}</p>}
                  <div className="flp-card-stats">
                    <span className="flp-stat"><strong>{folder.candidateCount || 0}</strong> candidates</span>
                    <span className="flp-stat-sep">·</span>
                    <span className="flp-stat">{new Date(folder.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flp-pagination">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="flp-page-btn">Previous</button>
                <span className="flp-page-info">Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="flp-page-btn">Next</button>
              </div>
            )}
          </>
        ) : (
          <div className="flp-empty">
            <div className="flp-empty-icon"><FiFolder size={48} /></div>
            <h2 className="flp-empty-title">No folders yet</h2>
            <p className="flp-empty-text">Create your first folder to start organizing shortlisted candidates.</p>
            <button className="flp-create-btn" onClick={() => setShowCreate(true)}>
              <FiPlus size={16} /> Create Folder
            </button>
          </div>
        )}
      </div>

      <CreateFolderModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      <CreateFolderModal isOpen={!!renameData} onClose={() => setRenameData(null)} onSubmit={handleRename} initialData={renameData} />
    </div>
  );
}
