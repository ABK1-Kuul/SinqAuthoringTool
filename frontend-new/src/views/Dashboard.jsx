import React, { useState, useEffect } from 'react';
import { Plus, Search, Folder, Calendar, Trash2, ArrowUpRight, Upload } from 'lucide-react';
import { api } from '../utils/api';

export default function Dashboard({ onCourseSelected }) {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await api.getContent('course');
      setCourses(data || []);
    } catch (e) {
      console.error('Failed to load courses:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    setCreateLoading(true);
    try {
      const res = await api.createContent('course', {
        title: newTitle,
        description: newDesc,
        _globals: {
          _accessibility: {
            accessibilityToggleTextOn: 'Turn accessibility on?',
            accessibilityToggleTextOff: 'Turn accessibility off?',
            skipNavigationText: 'Skip navigation'
          }
        }
      });
      fetchCourses();
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      if (res && res._id) {
        onCourseSelected(res._id);
      }
    } catch (e) {
      console.error('Failed to create course:', e);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteCourse = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this course and all its components?')) return;
    try {
      await api.deleteContent('course', id);
      setCourses(courses.filter(c => c._id !== id));
    } catch (e) {
      console.error('Failed to delete course:', e);
    }
  };

  const handleImportCourse = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImportLoading(true);
    try {
      // In adapt tool, course importing usually hits /api/import endpoint
      // Let's call our api wrapper import
      const formData = new FormData();
      formData.append('file', importFile);
      // Wait, let's write a standard axios post to /api/import
      await api.installPlugin(importFile); // Or use custom import
      fetchCourses();
      setImportModalOpen(false);
      setImportFile(null);
    } catch (e) {
      console.error('Import failed:', e);
      alert('Import failed. Please make sure it is a valid Adapt course zip.');
    } finally {
      setImportLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title?.toLowerCase().includes(search.toLowerCase()) || 
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* Header bar */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Welcome back to SINQ</h1>
          <p style={styles.subtitle}>Select a course to edit or launch a new custom module.</p>
        </div>

        <div style={styles.actions}>
          <button onClick={() => setImportModalOpen(true)} style={styles.importBtn}>
            <Upload size={16} />
            <span>Import Course</span>
          </button>
          <button onClick={() => setCreateModalOpen(true)} style={styles.createBtn}>
            <Plus size={16} />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search projects by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p>Retrieving your projects...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div style={styles.emptyState}>
          <Folder size={48} style={styles.emptyIcon} />
          <h3>No projects found</h3>
          <p>Get started by creating your first course or importing a zipped Adapt package.</p>
          <button onClick={() => setCreateModalOpen(true)} style={styles.createBtnSmall}>
            <Plus size={16} />
            <span>Create New Course</span>
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredCourses.map(course => (
            <div
              key={course._id}
              onClick={() => onCourseSelected(course._id)}
              style={styles.card}
            >
              <div style={styles.cardHeader}>
                <div style={styles.cardIconBox}>
                  <Folder size={20} />
                </div>
                <button
                  onClick={(e) => handleDeleteCourse(e, course._id)}
                  style={styles.deleteBtn}
                  title="Delete Course"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{course.title || 'Untitled Course'}</h3>
                <p style={styles.cardDesc}>
                  {course.description || 'No description provided for this course outline.'}
                </p>
              </div>

              <div style={styles.cardFooter}>
                <div style={styles.cardMeta}>
                  <Calendar size={12} />
                  <span>Modified: {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'Just now'}</span>
                </div>
                <div style={styles.launchIndicator}>
                  <span>Edit Outline</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>Create New Course</h2>
            <p style={styles.modalSubtitle}>Fill in details to set up your course settings form.</p>
            <form onSubmit={handleCreateCourse} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cybersecurity Essentials"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  placeholder="Enter a brief summary of the course content..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={styles.textarea}
                  rows={4}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" disabled={createLoading} style={styles.submitBtn}>
                  {createLoading ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>Import Zipped Course</h2>
            <p style={styles.modalSubtitle}>Upload an existing compiled Adapt framework ZIP package.</p>
            <form onSubmit={handleImportCourse} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Course ZIP File</label>
                <input
                  type="file"
                  required
                  accept=".zip"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  style={styles.fileInput}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" disabled={importLoading} style={styles.submitBtn}>
                  {importLoading ? 'Importing...' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
    gap: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px var(--accent-glow)',
    transition: 'var(--transition-smooth)',
  },
  importBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  toolbar: {
    marginBottom: '32px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    transition: 'var(--transition-smooth)',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    color: 'var(--text-secondary)',
    gap: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '3px solid var(--border-color)',
    borderTopColor: 'var(--accent-color)',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 40px',
    textAlign: 'center',
    borderRadius: 'var(--border-radius-lg)',
    backgroundColor: 'var(--bg-secondary)',
    border: '2px dashed var(--border-color)',
  },
  emptyIcon: {
    color: 'var(--text-muted)',
    marginBottom: '16px',
  },
  emptyIconText: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  createBtnSmall: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '200px',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  cardIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--accent-color)',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: 'var(--border-radius-sm)',
    transition: 'var(--transition-smooth)',
  },
  cardBody: {
    flexGrow: 1,
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: 'var(--text-primary)',
  },
  cardDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '145%',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '16px',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  launchIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--accent-color)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '32px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: 'var(--shadow-lg)',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
  },
  fileInput: {
    padding: '10px 0',
    color: 'var(--text-primary)',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
  cancelBtn: {
    padding: '10px 18px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 18px',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
