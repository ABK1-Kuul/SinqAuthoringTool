import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Play, RefreshCw, Layers, FileText, Square, 
  HelpCircle, Settings, Plus, Trash2, Edit3, Save, ChevronRight, ChevronDown,
  Monitor, Smartphone, Tablet,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image, Video, CheckSquare
} from 'lucide-react';
import { api } from '../utils/api';

export default function CourseEditor({ courseId, user, onBack }) {
  const [course, setCourse] = useState(null);
  const [outline, setOutline] = useState({ pages: [], articles: [], blocks: [], components: [] });
  const [selectedItem, setSelectedItem] = useState(null); // { type, data }
  const [schemas, setSchemas] = useState({});
  const [editorLoading, setEditorLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Tree expansion states
  const [expandedNodes, setExpandedNodes] = useState({});
  const [inspectorMode, setInspectorMode] = useState('simple'); // simple, advanced
  const [openAccordions, setOpenAccordions] = useState({
    design: true,
    start: false,
    accessibility: false,
    advanced: false
  });
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop, tablet, mobile
  const [toolbarPosition, setToolbarPosition] = useState({
    visible: false,
    top: 0,
    left: 0,
    elementId: '',
    elementType: ''
  });
  const [draggedItem, setDraggedItem] = useState(null); // { type, id, parentId }
  const [showTextColorPopover, setShowTextColorPopover] = useState(false);
  const [showBgColorPopover, setShowBgColorPopover] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Column Sizing States
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(300);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(360);

  const handleMouseDown = (e, direction) => {
    e.preventDefault();
    const startX = e.clientX;
    const startLeftWidth = leftSidebarWidth;
    const startRightWidth = rightSidebarWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      if (direction === 'left') {
        const newWidth = Math.max(200, Math.min(500, startLeftWidth + deltaX));
        setLeftSidebarWidth(newWidth);
      } else if (direction === 'right') {
        const newWidth = Math.max(250, Math.min(600, startRightWidth - deltaX));
        setRightSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    loadEditorData();
  }, [courseId]);

  const loadEditorData = async () => {
    setEditorLoading(true);
    try {
      // 1. Fetch course details
      const courseData = await api.getContent('course', { _id: courseId });
      if (courseData && courseData.length > 0) {
        setCourse(courseData[0]);
        setSelectedItem({ type: 'course', data: courseData[0] });
      }

      // 2. Fetch outline components
      const [pages, articles, blocks, components, schemaList] = await Promise.all([
        api.getContent('contentobject', { _courseId: courseId }),
        api.getContent('article', { _courseId: courseId }),
        api.getContent('block', { _courseId: courseId }),
        api.getContent('component', { _courseId: courseId }),
        api.getSchemas(),
      ]);

      setOutline({
        pages: pages || [],
        articles: articles || [],
        blocks: blocks || [],
        components: components || [],
      });
      setSchemas(schemaList || {});

      // 3. Trigger initial preview compilation
      const tenantId = user?._tenantId || user?.tenant?._id || 'adapt-tenant-master';
      setPreviewUrl(`/preview/${tenantId}/${courseId}/index.html`);
    } catch (e) {
      console.error('Failed to load editor data:', e);
    } finally {
      setEditorLoading(false);
    }
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleRebuildPreview = async () => {
    setPreviewLoading(true);
    try {
      // Trigger framework build for this course
      await api.previewCourse(courseId);
      // Force reload preview iframe
      const iframe = document.getElementById('preview-frame');
      if (iframe) {
        iframe.src = iframe.src;
      }
    } catch (e) {
      console.error('Failed to compile course preview:', e);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Outline creation triggers
  const addPage = async () => {
    try {
      const res = await api.createContent('contentobject', {
        title: 'New Page',
        description: 'New Page Description',
        _courseId: courseId,
        _parentId: courseId,
        _type: 'page',
      });
      setOutline(prev => ({ ...prev, pages: [...prev.pages, res] }));
      toggleNode(courseId);
      setSelectedItem({ type: 'contentobject', data: res });
    } catch (e) {
      console.error(e);
    }
  };

  const addArticle = async (pageId) => {
    try {
      const res = await api.createContent('article', {
        title: 'New Article',
        _courseId: courseId,
        _parentId: pageId,
      });
      setOutline(prev => ({ ...prev, articles: [...prev.articles, res] }));
      setExpandedNodes(prev => ({ ...prev, [pageId]: true }));
      setSelectedItem({ type: 'article', data: res });
    } catch (e) {
      console.error(e);
    }
  };

  const addBlock = async (articleId) => {
    try {
      const res = await api.createContent('block', {
        title: 'New Block',
        _courseId: courseId,
        _parentId: articleId,
      });
      setOutline(prev => ({ ...prev, blocks: [...prev.blocks, res] }));
      setExpandedNodes(prev => ({ ...prev, [articleId]: true }));
      setSelectedItem({ type: 'block', data: res });
    } catch (e) {
      console.error(e);
    }
  };

  const addComponent = async (blockId, compType = 'text') => {
    try {
      const res = await api.createContent('component', {
        title: `New ${compType.toUpperCase()} Component`,
        _courseId: courseId,
        _parentId: blockId,
        _type: 'component',
        _component: compType,
        _layout: 'full',
      });
      setOutline(prev => ({ ...prev, components: [...prev.components, res] }));
      setExpandedNodes(prev => ({ ...prev, [blockId]: true }));
      setSelectedItem({ type: 'component', data: res });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (e, type, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.deleteContent(type, id);
      setOutline(prev => ({
        ...prev,
        [type === 'contentobject' ? 'pages' : type + 's']: prev[type === 'contentobject' ? 'pages' : type + 's'].filter(item => item._id !== id)
      }));
      if (selectedItem?.data?._id === id) {
        setSelectedItem({ type: 'course', data: course });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const SYSTEM_FIELDS = [
    '_id', '_parentId', '_courseId', '_tenantId', '_type', '_sortOrder',
    '_isSelected', '_hasPreview', '_shareWithUsers', 'createdAt', 'createdBy',
    'updatedAt', 'updatedBy', '_latestTrackingId'
  ];

  const handleFieldChange = async (fieldPath, value) => {
    if (!selectedItem) return;
    const { type, data } = selectedItem;
    
    // Update local state, including support for nested fields (e.g. "_graphic.alt")
    const updatedData = { ...data };
    const parts = fieldPath.split('.');
    
    let current = updatedData;
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = { ...current[parts[i]] };
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;

    setSelectedItem({ type, data: updatedData });

    // Update outline lists
    if (type === 'course') {
      setCourse(updatedData);
    } else {
      const key = type === 'contentobject' ? 'pages' : type + 's';
      setOutline(prev => ({
        ...prev,
        [key]: prev[key].map(item => item._id === data._id ? updatedData : item)
      }));
    }

    // Persist to DB. We send the updated top-level field that changed to avoid nested partial update issues
    const topLevelField = parts[0];
    const updatePayload = { [topLevelField]: updatedData[topLevelField] };

    try {
      await api.updateContent(type, data._id, updatePayload);
      
      // Real-time preview push: Send message to iframe to update dynamically
      const iframe = document.getElementById('preview-frame');
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          action: 'updateAttribute',
          id: data._id,
          attribute: fieldPath,
          value: value
        }, '*');
      }
    } catch (e) {
      console.error('Failed to save field change:', e);
    }
  };

  const handleApplyPreset = async (presetKey) => {
    try {
      const res = await api.applyPreset(course._id, presetKey);
      if (res.success) {
        setCourse(res.course);
        setSelectedItem({ type: 'course', data: res.course });
        alert('Preset successfully applied to course config!');
        handleRebuildPreview();
      }
    } catch (e) {
      console.error('Failed to apply preset:', e);
      alert('Error applying configuration preset.');
    }
  };

  const handleIframeLoad = () => {
    const iframe = document.getElementById('preview-frame');
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;

      iframeDoc.addEventListener('scroll', () => {
        setToolbarPosition(prev => ({ ...prev, visible: false }));
        setShowTextColorPopover(false);
        setShowBgColorPopover(false);
      });

      iframeDoc.addEventListener('click', (e) => {
        const target = e.target;
        const closestEl = target.closest('.component, .block, .article, .page, .contentobject');
        
        if (closestEl) {
          e.preventDefault();
          e.stopPropagation();
          setShowTextColorPopover(false);
          setShowBgColorPopover(false);
          
          const id = closestEl.getAttribute('id') || closestEl.getAttribute('data-id');
          if (!id) return;

          const className = closestEl.className;
          let type = '';
          if (className.includes('component')) type = 'component';
          else if (className.includes('block')) type = 'block';
          else if (className.includes('article')) type = 'article';
          else if (className.includes('page') || className.includes('contentobject')) type = 'contentobject';

          if (type) {
            let data = null;
            if (type === 'contentobject') {
              data = outline.pages.find(p => p._id === id);
            } else {
              const key = type === 'contentobject' ? 'pages' : type + 's';
              data = outline[key]?.find(item => item._id === id);
            }

            if (data) {
              setSelectedItem({ type, data });
              
              const rect = closestEl.getBoundingClientRect();
              const iframeRect = iframe.getBoundingClientRect();
              
              setToolbarPosition({
                visible: true,
                top: iframeRect.top + rect.top - 48,
                left: iframeRect.left + rect.left + (rect.width / 2) - 120,
                elementId: id,
                elementType: type
              });
            }
          }
        } else {
          setToolbarPosition(prev => ({ ...prev, visible: false }));
          setShowTextColorPopover(false);
          setShowBgColorPopover(false);
        }
      }, true);
    } catch (err) {
      console.warn('Cannot attach iframe click handlers:', err);
    }
  };

  const handleShiftSibling = async (direction) => {
    if (!selectedItem) return;
    const { type, data } = selectedItem;
    if (type === 'course') return;
    
    const key = type === 'contentobject' ? 'pages' : type + 's';
    const siblings = [...outline[key]].filter(item => item._parentId === data._parentId).sort((a,b) => (a._sortOrder || 0) - (b._sortOrder || 0));
    
    const index = siblings.findIndex(item => item._id === data._id);
    if (index === -1) return;
    
    const swapWithIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapWithIndex < 0 || swapWithIndex >= siblings.length) return;
    
    const targetItem = siblings[swapWithIndex];
    
    // Swap sortOrder
    const oldOrder = data._sortOrder || 0;
    const newOrder = targetItem._sortOrder || 0;
    
    try {
      await Promise.all([
        api.updateContent(type, data._id, { _sortOrder: newOrder }),
        api.updateContent(type, targetItem._id, { _sortOrder: oldOrder })
      ]);
      
      // Update local state
      setOutline(prev => {
        const list = [...prev[key]];
        const dItem = list.find(item => item._id === data._id);
        const tItem = list.find(item => item._id === targetItem._id);
        if (dItem) dItem._sortOrder = newOrder;
        if (tItem) tItem._sortOrder = oldOrder;
        return { ...prev, [key]: list };
      });
      
      handleRebuildPreview();
    } catch (err) {
      console.error('Failed to shift layout order:', err);
    }
  };

  const handleQuickStyleChange = async (styleKey, value) => {
    if (!toolbarPosition.visible || !selectedItem) return;
    const { type, data } = selectedItem;
    
    let updatePayload = {};
    if (styleKey === '_layout') {
      updatePayload = { _layout: value };
    } else if (styleKey === 'alignment') {
      let classes = data._classes || '';
      classes = classes.replace(/\balign-(left|center|right)\b/g, '').trim();
      classes = `${classes} align-${value}`.trim();
      updatePayload = { _classes: classes };
    } else if (styleKey === 'textColor') {
      let classes = data._classes || '';
      classes = classes.replace(/\btext-(white|black|blue|purple|red)\b/g, '').trim();
      classes = `${classes} text-${value}`.trim();
      updatePayload = { _classes: classes };
    } else if (styleKey === 'backgroundColor') {
      let classes = data._classes || '';
      classes = classes.replace(/\bbg-(light|dark|neutral)\b/g, '').trim();
      classes = `${classes} bg-${value}`.trim();
      updatePayload = { _classes: classes };
    }

    try {
      await api.updateContent(type, data._id, updatePayload);
      
      const updatedData = { ...data, ...updatePayload };
      setSelectedItem({ type, data: updatedData });
      
      if (type === 'course') {
        setCourse(updatedData);
      } else {
        const key = type === 'contentobject' ? 'pages' : type + 's';
        setOutline(prev => ({
          ...prev,
          [key]: prev[key].map(item => item._id === data._id ? updatedData : item)
        }));
      }

      const iframe = document.getElementById('preview-frame');
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          action: 'updateAttribute',
          id: data._id,
          attribute: ['alignment', 'textColor', 'backgroundColor'].includes(styleKey) ? '_classes' : styleKey,
          value: updatePayload._classes || value
        }, '*');
      }
    } catch (e) {
      console.error('Failed to apply quick style change:', e);
    }
  };

  const getSimpleFieldsForType = (type) => {
    if (type === 'course') return ['title', 'displayTitle', 'description', 'body', 'heroImage', '_themePreset'];
    if (type === 'contentobject') return ['title', 'description', 'body'];
    if (type === 'article') return ['title', 'body'];
    if (type === 'block') return ['title', 'body'];
    if (type === 'component') return ['title', 'body', '_component', '_layout'];
    return [];
  };

  const isSimpleField = (key, type) => {
    const simples = getSimpleFieldsForType(type);
    if (simples.includes(key)) return true;
    if (type === 'component') {
      const isSystem = SYSTEM_FIELDS.includes(key) || (key.startsWith('_') && !['_component', '_layout', '_graphic', '_media', '_items', '_buttons'].includes(key));
      return !isSystem;
    }
    return false;
  };

  const toggleAccordion = (section) => {
    setOpenAccordions(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDragStart = (e, type, id, parentId) => {
    setDraggedItem({ type, id, parentId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, type, parentId) => {
    if (draggedItem && draggedItem.type === type && draggedItem.parentId === parentId) {
      e.preventDefault();
    }
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetId) return;

    const { type, id, parentId } = draggedItem;
    const key = type === 'contentobject' ? 'pages' : type + 's';
    const list = outline[key];

    const draggedIndex = list.findIndex(item => item._id === id);
    const targetIndex = list.findIndex(item => item._id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newList = [...list];
      const [removed] = newList.splice(draggedIndex, 1);
      newList.splice(targetIndex, 0, removed);

      newList.forEach((item, index) => {
        item._sortOrder = index;
      });

      setOutline(prev => ({
        ...prev,
        [key]: newList
      }));

      try {
        await Promise.all([
          api.updateContent(type, id, { _sortOrder: targetIndex }),
          api.updateContent(type, targetId, { _sortOrder: draggedIndex })
        ]);
        handleRebuildPreview();
      } catch (err) {
        console.error('Failed to save sort order:', err);
      }
    }
    setDraggedItem(null);
  };

  // Simple Form Field Renderer based on Schema
  const renderFormField = (key, prop, value, parentKey = '') => {
    const fullPath = parentKey ? `${parentKey}.${key}` : key;
    if (SYSTEM_FIELDS.includes(key)) return null;

    // Handle nested object schemas
    if (prop.type === 'object' && prop.properties) {
      return (
        <div key={fullPath} style={styles.fieldset}>
          <h4 style={styles.fieldsetLegend}>{prop.title || key}</h4>
          <div style={styles.fieldsetFields}>
            {Object.keys(prop.properties).map(subKey => {
              const subProp = prop.properties[subKey];
              const subVal = value ? value[subKey] : undefined;
              return renderFormField(subKey, subProp, subVal, fullPath);
            })}
          </div>
        </div>
      );
    }

    const val = value !== undefined ? value : prop.default || '';

    // Handle select dropdown choices (from enum or inputType: { type: "Select", options: [...] })
    const isSelect = prop.inputType === 'Select' || (prop.inputType && typeof prop.inputType === 'object' && prop.inputType.type === 'Select');
    const selectOptions = isSelect ? (prop.inputType.options || prop.enum || []) : null;

    // Overrides check:
    const isColor = key.toLowerCase().includes('color');
    const isSpacing = (key.toLowerCase().includes('padding') || key.toLowerCase().includes('margin') || key.toLowerCase().includes('width') || key.toLowerCase().includes('height')) && !isSelect && prop.type !== 'object' && key !== '_layout';

    const isAlign = key.toLowerCase().includes('align') || (selectOptions && selectOptions.every(opt => {
      const optVal = typeof opt === 'object' ? opt.value : opt;
      return ['left', 'center', 'right', 'justify'].includes(optVal);
    }));

    // 1. Spacing override (Range Slider)
    if (isSpacing) {
      const numVal = parseInt(val) || 0;
      return (
        <div key={fullPath} style={styles.formGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={styles.formLabel}>{prop.title || key}</label>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)' }}>{numVal}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            step="4"
            value={numVal}
            onChange={(e) => {
              const updatedVal = typeof val === 'number' ? Number(e.target.value) : e.target.value + 'px';
              handleFieldChange(fullPath, updatedVal);
            }}
            style={styles.rangeInput}
          />
          {prop.help && <span style={styles.helpText}>{prop.help}</span>}
        </div>
      );
    }

    // 2. Color override (Color Picker Grid)
    if (isColor) {
      const presets = ['#ffffff', '#f4f4f5', '#e4e4e7', '#18181b', '#3b82f6', '#a855f7', '#ec4899', '#ef4444', '#10b981', '#f59e0b'];
      const stringVal = String(val);
      const isHex = stringVal.startsWith('#') && stringVal.length === 7;
      return (
        <div key={fullPath} style={styles.formGroup}>
          <label style={styles.formLabel}>{prop.title || key}</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', margin: '4px 0' }}>
            {presets.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => handleFieldChange(fullPath, color)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: stringVal === color ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  padding: 0
                }}
              />
            ))}
            <input
              type="color"
              value={isHex ? stringVal : '#ffffff'}
              onChange={(e) => handleFieldChange(fullPath, e.target.value)}
              style={{
                width: '24px',
                height: '24px',
                border: 'none',
                padding: 0,
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            />
          </div>
          <input
            type="text"
            value={val}
            onChange={(e) => handleFieldChange(fullPath, e.target.value)}
            style={styles.input}
            placeholder="#ffffff"
          />
          {prop.help && <span style={styles.helpText}>{prop.help}</span>}
        </div>
      );
    }

    // 3. Segmented Alignment Buttons
    if (isAlign && selectOptions) {
      return (
        <div key={fullPath} style={styles.formGroup}>
          <label style={styles.formLabel}>{prop.title || key}</label>
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden' }}>
            {selectOptions.map(opt => {
              const optVal = typeof opt === 'object' ? (opt.value !== undefined ? opt.value : opt) : opt;
              const optText = typeof opt === 'object' ? (opt.text || opt.value || opt) : opt;
              
              let Icon = null;
              if (optVal === 'left') Icon = AlignLeft;
              else if (optVal === 'center') Icon = AlignCenter;
              else if (optVal === 'right') Icon = AlignRight;
              else if (optVal === 'justify') Icon = AlignJustify;

              const isActive = val === optVal;

              return (
                <button
                  key={optVal}
                  type="button"
                  onClick={() => handleFieldChange(fullPath, optVal)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {Icon ? <Icon size={14} /> : optText}
                </button>
              );
            })}
          </div>
          {prop.help && <span style={styles.helpText}>{prop.help}</span>}
        </div>
      );
    }

    if (selectOptions) {
      return (
        <div key={fullPath} style={styles.formGroup}>
          <label style={styles.formLabel}>{prop.title || key}</label>
          <select
            value={val}
            onChange={(e) => handleFieldChange(fullPath, e.target.value)}
            style={styles.select}
          >
            {selectOptions.map(opt => {
              const optVal = typeof opt === 'object' ? (opt.value !== undefined ? opt.value : opt) : opt;
              const optText = typeof opt === 'object' ? (opt.text || opt.value || opt) : opt;
              return <option key={optVal} value={optVal}>{optText || optVal || '(none)'}</option>;
            })}
          </select>
          {prop.help && <span style={styles.helpText}>{prop.help}</span>}
        </div>
      );
    }

    if (prop.type === 'boolean') {
      return (
        <div key={fullPath} style={styles.formGroupRow}>
          <label style={styles.formLabel}>{prop.title || key}</label>
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => handleFieldChange(fullPath, e.target.checked)}
            style={styles.toggle}
          />
        </div>
      );
    }

    if (prop.type === 'number') {
      return (
        <div key={fullPath} style={styles.formGroup}>
          <label style={styles.formLabel}>{prop.title || key}</label>
          <input
            type="number"
            value={val}
            onChange={(e) => handleFieldChange(fullPath, Number(e.target.value))}
            style={styles.input}
          />
          {prop.help && <span style={styles.helpText}>{prop.help}</span>}
        </div>
      );
    }

    return (
      <div key={fullPath} style={styles.formGroup}>
        <label style={styles.formLabel}>{prop.title || key}</label>
        {prop.inputType === 'TextArea' ? (
          <>
            <div style={styles.wysiwygToolbar}>
              <button 
                type="button" 
                onClick={() => {
                  const textarea = document.getElementById(`textarea-${fullPath}`);
                  if (!textarea) return;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const text = textarea.value;
                  const selected = text.substring(start, end);
                  const replacement = `**${selected || 'bold text'}**`;
                  const updatedText = text.substring(0, start) + replacement + text.substring(end);
                  handleFieldChange(fullPath, updatedText);
                }} 
                style={styles.wysiwygBtn} 
                title="Bold"
              >
                <b>B</b>
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const textarea = document.getElementById(`textarea-${fullPath}`);
                  if (!textarea) return;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const text = textarea.value;
                  const selected = text.substring(start, end);
                  const replacement = `*${selected || 'italic text'}*`;
                  const updatedText = text.substring(0, start) + replacement + text.substring(end);
                  handleFieldChange(fullPath, updatedText);
                }} 
                style={styles.wysiwygBtn} 
                title="Italic"
              >
                <i>I</i>
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const textarea = document.getElementById(`textarea-${fullPath}`);
                  if (!textarea) return;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const text = textarea.value;
                  const selected = text.substring(start, end);
                  const replacement = `[${selected || 'link text'}](https://)`;
                  const updatedText = text.substring(0, start) + replacement + text.substring(end);
                  handleFieldChange(fullPath, updatedText);
                }} 
                style={styles.wysiwygBtn} 
                title="Insert Link"
              >
                🔗
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const textarea = document.getElementById(`textarea-${fullPath}`);
                  if (!textarea) return;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const text = textarea.value;
                  const selected = text.substring(start, end);
                  const replacement = `\n- ${selected || 'list item'}`;
                  const updatedText = text.substring(0, start) + replacement + text.substring(end);
                  handleFieldChange(fullPath, updatedText);
                }} 
                style={styles.wysiwygBtn} 
                title="Bullet List"
              >
                📋
              </button>
            </div>
            <textarea
              id={`textarea-${fullPath}`}
              value={val}
              onChange={(e) => handleFieldChange(fullPath, e.target.value)}
              style={styles.textarea}
              rows={4}
            />
          </>
        ) : (
          <input
            type="text"
            value={val}
            onChange={(e) => handleFieldChange(fullPath, e.target.value)}
            style={styles.input}
          />
        )}
        {prop.help && <span style={styles.helpText}>{prop.help}</span>}
      </div>
    );
  };

  const getActiveSchema = () => {
    if (!selectedItem) return null;
    const { type, data } = selectedItem;
    if (type === 'course') return schemas['course'] || {};
    if (type === 'contentobject') return schemas['contentobject'] || {};
    if (type === 'article') return schemas['article'] || {};
    if (type === 'block') return schemas['block'] || {};
    if (type === 'component') {
      // components have specific sub-schemas based on component type
      return schemas[data._component] || schemas['component'] || {};
    }
    return null;
  };

  const renderModeSelector = () => (
    <div style={styles.modeSelectorContainer}>
      <button 
        onClick={() => setInspectorMode('simple')} 
        style={{...styles.modeBtn, ...(inspectorMode === 'simple' ? styles.modeBtnActive : {})}}
      >
        Simple Mode
      </button>
      <button 
        onClick={() => setInspectorMode('advanced')} 
        style={{...styles.modeBtn, ...(inspectorMode === 'advanced' ? styles.modeBtnActive : {})}}
      >
        Advanced Mode
      </button>
    </div>
  );

  const renderPresetsSelector = () => {
    if (selectedItem?.type !== 'course') return null;
    return (
      <div style={styles.presetsWrapper}>
        <h4 style={styles.presetsTitle}>Quick Configuration Preset</h4>
        <p style={styles.presetsSubtitle}>Select a configuration preset for this course:</p>
        <div style={styles.presetsList}>
          <div 
            onClick={() => handleApplyPreset('compliance')}
            style={{
              ...styles.presetCard,
              ...(course?._themePreset === 'compliance' ? styles.presetCardActive : {})
            }}
          >
            <div style={styles.presetCardHeader}>
              <span style={styles.presetCardIcon}>🛡️</span>
              <span style={styles.presetCardName}>Standard Compliance</span>
            </div>
            <p style={styles.presetCardDesc}>Strict linear navigation, default screen-reader guides, and full SCORM standards.</p>
          </div>
          
          <div 
            onClick={() => handleApplyPreset('gamified')}
            style={{
              ...styles.presetCard,
              ...(course?._themePreset === 'gamified' ? styles.presetCardActive : {})
            }}
          >
            <div style={styles.presetCardHeader}>
              <span style={styles.presetCardIcon}>🎮</span>
              <span style={styles.presetCardName}>Gamified Exploration</span>
            </div>
            <p style={styles.presetCardDesc}>Free-form page navigation, minimal reading overlays, and disabled page locking.</p>
          </div>

          <div 
            onClick={() => handleApplyPreset('classic')}
            style={{
              ...styles.presetCard,
              ...(course?._themePreset === 'classic' ? styles.presetCardActive : {})
            }}
          >
            <div style={styles.presetCardHeader}>
              <span style={styles.presetCardIcon}>📖</span>
              <span style={styles.presetCardName}>Classic Reading</span>
            </div>
            <p style={styles.presetCardDesc}>Simple linear scroll layout with standard menu and default user guides.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderFigmaInspector = () => {
    const schema = getActiveSchema();
    if (!schema || !selectedItem) return <p>No settings available.</p>;
    
    const type = selectedItem.type;
    const data = selectedItem.data;
    
    if (inspectorMode === 'simple') {
      return (
        <div style={styles.formFields}>
          {type === 'course' && renderPresetsSelector()}
          {Object.keys(schema).map(key => {
            if (!isSimpleField(key, type)) return null;
            return renderFormField(key, schema[key], data[key]);
          })}
        </div>
      );
    }
    
    const designFields = [];
    const startFields = [];
    const accessibilityFields = [];
    const otherFields = [];
    
    Object.keys(schema).forEach(key => {
      if (SYSTEM_FIELDS.includes(key)) return;
      
      const prop = schema[key];
      const val = data[key];
      
      if (key === '_start') {
        startFields.push({ key, prop, val });
      } else if (key === '_globals' || key === '_accessibility') {
        accessibilityFields.push({ key, prop, val });
      } else if (isSimpleField(key, type)) {
        designFields.push({ key, prop, val });
      } else {
        otherFields.push({ key, prop, val });
      }
    });

    return (
      <div style={styles.accordionContainer}>
        {designFields.length > 0 && (
          <div style={styles.accordionSection}>
            <div onClick={() => toggleAccordion('design')} style={styles.accordionHeader}>
              <span style={styles.accordionTitle}>🎨 Design & Content</span>
              <span>{openAccordions.design ? '▼' : '▶'}</span>
            </div>
            {openAccordions.design && (
              <div style={styles.accordionBody}>
                {designFields.map(f => renderFormField(f.key, f.prop, f.val))}
              </div>
            )}
          </div>
        )}

        {startFields.length > 0 && (
          <div style={styles.accordionSection}>
            <div onClick={() => toggleAccordion('start')} style={styles.accordionHeader}>
              <span style={styles.accordionTitle}>🚀 Start Settings</span>
              <span>{openAccordions.start ? '▼' : '▶'}</span>
            </div>
            {openAccordions.start && (
              <div style={styles.accordionBody}>
                {startFields.map(f => renderFormField(f.key, f.prop, f.val))}
              </div>
            )}
          </div>
        )}

        {accessibilityFields.length > 0 && (
          <div style={styles.accordionSection}>
            <div onClick={() => toggleAccordion('accessibility')} style={styles.accordionHeader}>
              <span style={styles.accordionTitle}>♿ Accessibility & Guides</span>
              <span>{openAccordions.accessibility ? '▼' : '▶'}</span>
            </div>
            {openAccordions.accessibility && (
              <div style={styles.accordionBody}>
                {accessibilityFields.map(f => renderFormField(f.key, f.prop, f.val))}
              </div>
            )}
          </div>
        )}

        {otherFields.length > 0 && (
          <div style={styles.accordionSection}>
            <div onClick={() => toggleAccordion('advanced')} style={styles.accordionHeader}>
              <span style={styles.accordionTitle}>⚙️ Technical Properties</span>
              <span>{openAccordions.advanced ? '▼' : '▶'}</span>
            </div>
            {openAccordions.advanced && (
              <div style={styles.accordionBody}>
                {otherFields.map(f => renderFormField(f.key, f.prop, f.val))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* 1. Left Sidebar: Syllabus Navigator */}
      <div style={{ ...styles.leftSidebar, width: `${leftSidebarWidth}px` }}>
        {/* Panel Header */}
        <div style={styles.panelHeader}>
          <button onClick={onBack} style={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Courses</span>
          </button>

          <button onClick={handleRebuildPreview} disabled={previewLoading} style={styles.buildBtn}>
            <Play size={14} />
            <span>{previewLoading ? 'Building...' : 'Preview'}</span>
          </button>
        </div>

        {/* Panel Body */}
        <div style={styles.panelBody}>
          {editorLoading ? (
            <div style={styles.paneLoading}>
              <div style={styles.spinner} />
              <span>Loading workspace...</span>
            </div>
          ) : (
            <div style={styles.tree}>
              <div 
                onClick={() => setSelectedItem({ type: 'course', data: course })}
                style={{
                  ...styles.treeNode,
                  ...styles.courseNode,
                  ...(selectedItem?.type === 'course' ? styles.selectedTreeNode : {})
                }}
              >
                <Layers size={16} style={{color: 'var(--accent-color)'}} />
                <span style={styles.nodeTitle}>{course?.title || 'Course Outline'}</span>
                <button onClick={addPage} style={styles.addBtn} title="Add Page">
                  <Plus size={14} />
                </button>
              </div>

              {/* Pages */}
              {[...outline.pages]
                .sort((a, b) => (a._sortOrder || 0) - (b._sortOrder || 0))
                .map(page => {
                  const pageExpanded = !!expandedNodes[page._id];
                  const pageArticles = [...outline.articles]
                    .filter(a => a._parentId === page._id)
                    .sort((a, b) => (a._sortOrder || 0) - (b._sortOrder || 0));

                  return (
                    <div 
                      key={page._id} 
                      style={styles.treeGroup}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'contentobject', page._id, courseId)}
                      onDragOver={(e) => handleDragOver(e, 'contentobject', courseId)}
                      onDrop={(e) => handleDrop(e, page._id)}
                      onMouseEnter={() => setHoveredNodeId(page._id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                    >
                      <div 
                        className="tree-node"
                        onClick={() => setSelectedItem({ type: 'contentobject', data: page })}
                        style={{
                          ...styles.treeNode,
                          ...styles.pageNode,
                          ...(selectedItem?.data?._id === page._id ? styles.selectedTreeNode : {})
                        }}
                      >
                        <button onClick={(e) => { e.stopPropagation(); toggleNode(page._id); }} style={styles.expandBtn}>
                          {pageExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <FileText size={14} />
                        <span style={styles.nodeTitle}>{page.title || 'Page'}</span>
                        <div 
                          className="node-actions" 
                          style={{
                            ...styles.nodeActions,
                            opacity: hoveredNodeId === page._id ? 1 : 0,
                            pointerEvents: hoveredNodeId === page._id ? 'auto' : 'none',
                            transition: 'opacity 0.2s ease'
                          }}
                        >
                          <button onClick={() => addArticle(page._id)} style={styles.addBtn} title="Add Article">
                            <Plus size={12} />
                          </button>
                          <button onClick={(e) => handleDeleteItem(e, 'contentobject', page._id)} style={styles.nodeDeleteBtn}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Articles */}
                      {pageExpanded && pageArticles.map(article => {
                        const articleExpanded = !!expandedNodes[article._id];
                        const articleBlocks = [...outline.blocks]
                          .filter(b => b._parentId === article._id)
                          .sort((a, b) => (a._sortOrder || 0) - (b._sortOrder || 0));

                        return (
                          <div 
                            key={article._id} 
                            style={styles.treeGroupNested}
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'article', article._id, page._id)}
                            onDragOver={(e) => handleDragOver(e, 'article', page._id)}
                            onDrop={(e) => handleDrop(e, article._id)}
                            onMouseEnter={(e) => { e.stopPropagation(); setHoveredNodeId(article._id); }}
                            onMouseLeave={(e) => { e.stopPropagation(); setHoveredNodeId(null); }}
                          >
                            <div 
                              className="tree-node"
                              onClick={() => setSelectedItem({ type: 'article', data: article })}
                              style={{
                                ...styles.treeNode,
                                ...styles.articleNode,
                                ...(selectedItem?.data?._id === article._id ? styles.selectedTreeNode : {})
                              }}
                            >
                              <button onClick={(e) => { e.stopPropagation(); toggleNode(article._id); }} style={styles.expandBtn}>
                                {articleExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <span style={styles.nodeTitle}>{article.title || 'Article'}</span>
                              <div 
                                className="node-actions" 
                                style={{
                                  ...styles.nodeActions,
                                  opacity: hoveredNodeId === article._id ? 1 : 0,
                                  pointerEvents: hoveredNodeId === article._id ? 'auto' : 'none',
                                  transition: 'opacity 0.2s ease'
                                }}
                              >
                                <button onClick={() => addBlock(article._id)} style={styles.addBtn} title="Add Block">
                                  <Plus size={12} />
                                </button>
                                <button onClick={(e) => handleDeleteItem(e, 'article', article._id)} style={styles.nodeDeleteBtn}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Blocks */}
                            {articleExpanded && articleBlocks.map(block => {
                              const blockExpanded = !!expandedNodes[block._id];
                              const blockComponents = [...outline.components]
                                .filter(c => c._parentId === block._id)
                                .sort((a, b) => (a._sortOrder || 0) - (b._sortOrder || 0));

                              return (
                                <div 
                                  key={block._id} 
                                  style={styles.treeGroupNested}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, 'block', block._id, article._id)}
                                  onDragOver={(e) => handleDragOver(e, 'block', article._id)}
                                  onDrop={(e) => handleDrop(e, block._id)}
                                  onMouseEnter={(e) => { e.stopPropagation(); setHoveredNodeId(block._id); }}
                                  onMouseLeave={(e) => { e.stopPropagation(); setHoveredNodeId(null); }}
                                >
                                  <div 
                                    className="tree-node"
                                    onClick={() => setSelectedItem({ type: 'block', data: block })}
                                    style={{
                                      ...styles.treeNode,
                                      ...styles.blockNode,
                                      ...(selectedItem?.data?._id === block._id ? styles.selectedTreeNode : {})
                                    }}
                                  >
                                    <button onClick={(e) => { e.stopPropagation(); toggleNode(block._id); }} style={styles.expandBtn}>
                                      {blockExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    <span style={styles.nodeTitle}>{block.title || 'Block'}</span>
                                    <div 
                                      className="node-actions" 
                                      style={{
                                        ...styles.nodeActions,
                                        opacity: hoveredNodeId === block._id ? 1 : 0,
                                        pointerEvents: hoveredNodeId === block._id ? 'auto' : 'none',
                                        transition: 'opacity 0.2s ease'
                                      }}
                                    >
                                      <button onClick={() => addComponent(block._id, 'text')} style={styles.addBtn} title="Add Text Component">
                                        <Plus size={12} />
                                      </button>
                                      <button onClick={(e) => handleDeleteItem(e, 'block', block._id)} style={styles.nodeDeleteBtn}>
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Components */}
                                  {blockExpanded && blockComponents.map(comp => {
                                    const compName = String(comp._component || '').toLowerCase();
                                    let CompIcon = Square;
                                    if (compName.includes('text')) CompIcon = FileText;
                                    else if (compName.includes('graphic') || compName.includes('media') || compName.includes('image')) CompIcon = Image;
                                    else if (compName.includes('video')) CompIcon = Video;
                                    else if (compName.includes('mcq') || compName.includes('assessment') || compName.includes('quiz')) CompIcon = CheckSquare;

                                    return (
                                      <div 
                                        key={comp._id}
                                        className="tree-node"
                                        onClick={() => setSelectedItem({ type: 'component', data: comp })}
                                        style={{
                                          ...styles.treeNode,
                                          ...styles.compNode,
                                          ...(selectedItem?.data?._id === comp._id ? styles.selectedTreeNode : {})
                                        }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, 'component', comp._id, block._id)}
                                        onDragOver={(e) => handleDragOver(e, 'component', block._id)}
                                        onDrop={(e) => handleDrop(e, comp._id)}
                                        onMouseEnter={(e) => { e.stopPropagation(); setHoveredNodeId(comp._id); }}
                                        onMouseLeave={(e) => { e.stopPropagation(); setHoveredNodeId(null); }}
                                      >
                                        <CompIcon size={12} style={{color: 'var(--accent-color)'}} />
                                        <span style={styles.nodeTitle}>{comp.title || 'Component'}</span>
                                        <span style={styles.nodeTypeTag}>{comp._component}</span>
                                        <div 
                                          className="node-actions" 
                                          style={{
                                            ...styles.nodeActions,
                                            opacity: hoveredNodeId === comp._id ? 1 : 0,
                                            pointerEvents: hoveredNodeId === comp._id ? 'auto' : 'none',
                                            transition: 'opacity 0.2s ease'
                                          }}
                                        >
                                          <button onClick={(e) => handleDeleteItem(e, 'component', comp._id)} style={styles.nodeDeleteBtn}>
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle Left */}
      <div 
        onMouseDown={(e) => handleMouseDown(e, 'left')}
        style={{
          width: '6px',
          cursor: 'col-resize',
          backgroundColor: 'transparent',
          borderRight: '1px solid var(--border-color)',
          transition: 'background-color 0.2s',
          zIndex: 5,
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--accent-color)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      />

      {/* Side-by-Side Responsive Preview Iframe */}
      <div style={styles.previewPanel}>
        <div style={styles.previewHeader}>
          <span style={styles.previewLabel}>Interactive Live Preview</span>
          
          <div style={styles.deviceSwitcher}>
            <button 
              onClick={() => setPreviewDevice('desktop')}
              style={{...styles.deviceBtn, ...(previewDevice === 'desktop' ? styles.deviceBtnActive : {})}}
              title="Desktop View"
            >
              <Monitor size={14} />
            </button>
            <button 
              onClick={() => setPreviewDevice('tablet')}
              style={{...styles.deviceBtn, ...(previewDevice === 'tablet' ? styles.deviceBtnActive : {})}}
              title="Tablet View"
            >
              <Tablet size={14} />
            </button>
            <button 
              onClick={() => setPreviewDevice('mobile')}
              style={{...styles.deviceBtn, ...(previewDevice === 'mobile' ? styles.deviceBtnActive : {})}}
              title="Mobile View"
            >
              <Smartphone size={14} />
            </button>
          </div>

          {previewLoading && (
            <div style={styles.previewLoadingIndicator}>
              <RefreshCw size={12} style={styles.spinIcon} />
              <span>Building package...</span>
            </div>
          )}
        </div>
        <div style={styles.iframeWrapper}>
          {previewUrl ? (
            <div 
              style={{
                ...styles.deviceFrame,
                ...styles[`deviceFrame_${previewDevice}`]
              }}
            >
              {previewDevice !== 'desktop' && <div style={styles.deviceCamera} />}
              <iframe
                id="preview-frame"
                src={previewUrl}
                style={styles.previewIframe}
                title="Course Live Preview Canvas"
                onLoad={handleIframeLoad}
              />
            </div>
          ) : (
            <div style={styles.previewEmpty}>
              <RefreshCw size={36} />
              <p>Preview rendering canvas is setting up...</p>
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle Right */}
      <div 
        onMouseDown={(e) => handleMouseDown(e, 'right')}
        style={{
          width: '6px',
          cursor: 'col-resize',
          backgroundColor: 'transparent',
          borderLeft: '1px solid var(--border-color)',
          transition: 'background-color 0.2s',
          zIndex: 5,
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--accent-color)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      />

      {/* 2. Right Sidebar: Figma-Style Properties Inspector */}
      <div style={{ ...styles.rightSidebar, width: `${rightSidebarWidth}px` }}>
        {/* Panel Header */}
        <div style={styles.panelHeader}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Properties Inspector</span>
        </div>

        {/* Panel Body */}
        <div style={styles.panelBody}>
          {editorLoading ? (
            <div style={styles.paneLoading}>
              <div style={styles.spinner} />
              <span>Loading settings...</span>
            </div>
          ) : selectedItem ? (
            <div style={styles.formContainer}>
              <div style={styles.formHeader}>
                <span style={styles.formTypeTag}>{selectedItem?.type?.toUpperCase()}</span>
                <h3>{selectedItem?.data?.title || 'Configure Details'}</h3>
                {renderModeSelector()}
              </div>
              {renderFigmaInspector()}
            </div>
          ) : (
            <div style={styles.previewEmpty}>
              <Settings size={36} />
              <p>Select any node or element on canvas to configure styling properties.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Contextual Toolbar */}
      {toolbarPosition.visible && (
        <div 
          style={{
            ...styles.floatingToolbar,
            top: toolbarPosition.top,
            left: toolbarPosition.left
          }}
        >
          {toolbarPosition.elementType === 'component' && (
            <>
              <button 
                onClick={() => handleQuickStyleChange('_layout', 'full')}
                style={{
                  ...styles.toolbarBtn,
                  ...(selectedItem?.data?._layout === 'full' ? styles.toolbarBtnActive : {})
                }}
                title="Full Width"
              >
                ↔️
              </button>
              <button 
                onClick={() => handleQuickStyleChange('_layout', 'left')}
                style={{
                  ...styles.toolbarBtn,
                  ...(selectedItem?.data?._layout === 'left' ? styles.toolbarBtnActive : {})
                }}
                title="Left Align"
              >
                ⬅️
              </button>
              <button 
                onClick={() => handleQuickStyleChange('_layout', 'right')}
                style={{
                  ...styles.toolbarBtn,
                  ...(selectedItem?.data?._layout === 'right' ? styles.toolbarBtnActive : {})
                }}
                title="Right Align"
              >
                ➡️
              </button>
              <div style={styles.toolbarDivider} />
            </>
          )}

          <button 
            onClick={() => handleQuickStyleChange('alignment', 'left')}
            style={{
              ...styles.toolbarBtn,
              ...(selectedItem?.data?._classes?.includes('align-left') ? styles.toolbarBtnActive : {})
            }}
            title="Text Left"
          >
            左
          </button>
          <button 
            onClick={() => handleQuickStyleChange('alignment', 'center')}
            style={{
              ...styles.toolbarBtn,
              ...(selectedItem?.data?._classes?.includes('align-center') ? styles.toolbarBtnActive : {})
            }}
            title="Text Center"
          >
            中
          </button>
          <button 
            onClick={() => handleQuickStyleChange('alignment', 'right')}
            style={{
              ...styles.toolbarBtn,
              ...(selectedItem?.data?._classes?.includes('align-right') ? styles.toolbarBtnActive : {})
            }}
            title="Text Right"
          >
            右
          </button>

          <div style={styles.toolbarDivider} />

          {/* Typography Bold/Italic Toggles */}
          <button 
            onClick={() => handleQuickStyleChange('bold', '')}
            style={{
              ...styles.toolbarBtn,
              ...(selectedItem?.data?._classes?.includes('font-bold') ? styles.toolbarBtnActive : {})
            }}
            title="Bold Typography"
          >
            <b>B</b>
          </button>
          <button 
            onClick={() => handleQuickStyleChange('italic', '')}
            style={{
              ...styles.toolbarBtn,
              ...(selectedItem?.data?._classes?.includes('font-italic') ? styles.toolbarBtnActive : {})
            }}
            title="Italic Typography"
          >
            <i>I</i>
          </button>

          <div style={styles.toolbarDivider} />

          {/* Up / Down Shifter Buttons */}
          <button 
            onClick={() => handleShiftSibling('up')}
            style={styles.toolbarBtn}
            title="Move Up"
          >
            ⬆️
          </button>
          <button 
            onClick={() => handleShiftSibling('down')}
            style={styles.toolbarBtn}
            title="Move Down"
          >
            ⬇️
          </button>

          <div style={styles.toolbarDivider} />

          {/* Text Color Swatch Popover */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => {
                setShowTextColorPopover(!showTextColorPopover);
                setShowBgColorPopover(false);
              }}
              style={{
                ...styles.toolbarBtn,
                ...(showTextColorPopover ? styles.toolbarBtnActive : {})
              }}
              title="Text Color"
            >
              🎨T
            </button>
            {showTextColorPopover && (
              <div style={styles.toolbarColorPopover}>
                {['white', 'black', 'blue', 'purple', 'red'].map(c => (
                  <button 
                    key={c}
                    onClick={() => {
                      handleQuickStyleChange('textColor', c);
                      setShowTextColorPopover(false);
                    }}
                    style={{
                      ...styles.colorDotBtn,
                      backgroundColor: c === 'white' ? '#fff' : c === 'black' ? '#000' : c === 'blue' ? '#3b82f6' : c === 'purple' ? '#a855f7' : '#ef4444'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Background Color Swatch Popover */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => {
                setShowBgColorPopover(!showBgColorPopover);
                setShowTextColorPopover(false);
              }}
              style={{
                ...styles.toolbarBtn,
                ...(showBgColorPopover ? styles.toolbarBtnActive : {})
              }}
              title="Container Background"
            >
              🎨B
            </button>
            {showBgColorPopover && (
              <div style={styles.toolbarColorPopover}>
                {['light', 'neutral', 'dark'].map(c => (
                  <button 
                    key={c}
                    onClick={() => {
                      handleQuickStyleChange('backgroundColor', c);
                      setShowBgColorPopover(false);
                    }}
                    style={{
                      ...styles.colorDotBtn,
                      backgroundColor: c === 'light' ? '#f4f4f5' : c === 'neutral' ? '#71717a' : '#18181b'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={styles.toolbarDivider} />

          <button 
            onClick={() => {
              setInspectorMode('simple');
            }}
            style={styles.toolbarBtn}
            title="Edit Settings"
          >
            ⚙️
          </button>

          <button 
            onClick={(e) => {
              handleDeleteItem(e, selectedItem.type, selectedItem.data._id);
              setToolbarPosition(prev => ({ ...prev, visible: false }));
            }}
            style={{...styles.toolbarBtn, ...styles.toolbarBtnDanger}}
            title="Delete Item"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 64px)',
    backgroundColor: 'var(--bg-primary)',
    overflow: 'hidden',
  },
  leftSidebar: {
    width: '320px',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-secondary)',
    flexShrink: 0,
  },
  rightSidebar: {
    width: '380px',
    borderLeft: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-secondary)',
    flexShrink: 0,
    overflowY: 'auto',
  },
  panelHeader: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-color)',
    flexShrink: 0,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  buildBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 6px var(--accent-glow)',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
    flexShrink: 0,
  },
  tab: {
    flexGrow: 1,
    padding: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
  },
  activeTab: {
    color: 'var(--accent-color)',
    borderBottomColor: 'var(--accent-color)',
  },
  panelBody: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '20px',
  },
  paneLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: 'var(--text-secondary)',
    gap: '12px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid var(--border-color)',
    borderTopColor: 'var(--accent-color)',
    animation: 'spin 1s linear infinite',
  },
  tree: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  treeGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  treeGroupNested: {
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px dashed var(--border-color)',
    marginLeft: '16px',
    paddingLeft: '6px',
    marginTop: '4px',
  },
  treeNode: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    position: 'relative',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    transition: 'var(--transition-smooth)',
  },
  selectedTreeNode: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontWeight: '500',
  },
  courseNode: {
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  pageNode: {
    paddingLeft: '4px',
  },
  articleNode: {
    paddingLeft: '8px',
  },
  blockNode: {
    paddingLeft: '8px',
  },
  compNode: {
    paddingLeft: '12px',
    gap: '6px',
  },
  expandBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '2px',
  },
  nodeTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexGrow: 1,
  },
  nodeTypeTag: {
    fontSize: '9px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  nodeActions: {
    display: 'flex',
    gap: '4px',
  },
  nodeDeleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-danger)',
    cursor: 'pointer',
    padding: '2px',
    opacity: 0.6,
  },
  addBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-color)',
    cursor: 'pointer',
    padding: '2px',
  },
  // Form styles
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formHeader: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '16px',
  },
  formTypeTag: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--accent-color)',
    letterSpacing: '1px',
  },
  formFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formGroupRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    textTransform: 'capitalize',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    outline: 'none',
    resize: 'vertical',
  },
  toggle: {
    cursor: 'pointer',
  },
  helpText: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: '130%',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
  },
  fieldset: {
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-sm)',
    padding: '16px',
    margin: '8px 0',
    backgroundColor: 'var(--bg-primary)',
  },
  fieldsetLegend: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--accent-color)',
    textTransform: 'uppercase',
    marginBottom: '12px',
    letterSpacing: '0.5px',
  },
  fieldsetFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  // Preview styles
  previewPanel: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-primary)',
  },
  previewHeader: {
    height: '48px',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    backgroundColor: 'var(--bg-secondary)',
    flexShrink: 0,
  },
  previewLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  previewLoadingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--accent-color)',
  },
  spinIcon: {
    animation: 'spin 1s linear infinite',
  },
  iframeWrapper: {
    flexGrow: 1,
    position: 'relative',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    overflow: 'auto',
  },
  previewIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  previewEmpty: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: 'var(--text-muted)',
  },
  modeSelectorContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  modeBtn: {
    flexGrow: 1,
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  modeBtnActive: {
    backgroundColor: 'var(--accent-color)',
    borderColor: 'var(--accent-color)',
    color: 'var(--accent-text)',
  },
  presetsWrapper: {
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '16px',
  },
  presetsTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0 0 4px 0',
  },
  presetsSubtitle: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    margin: '0 0 12px 0',
  },
  presetsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  presetCard: {
    padding: '12px',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: 'var(--bg-primary)',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  presetCardActive: {
    borderColor: 'var(--accent-color)',
    backgroundColor: 'var(--bg-tertiary)',
  },
  presetCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  presetCardIcon: {
    fontSize: '16px',
  },
  presetCardName: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  presetCardDesc: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: '1.3',
  },
  accordionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  accordionSection: {
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-sm)',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-secondary)',
  },
  accordionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    cursor: 'pointer',
    backgroundColor: 'var(--bg-tertiary)',
    transition: 'var(--transition-smooth)',
    userSelect: 'none',
  },
  accordionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  accordionBody: {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'var(--bg-secondary)',
  },
  deviceSwitcher: {
    display: 'flex',
    gap: '4px',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '4px',
    borderRadius: 'var(--border-radius-sm)',
  },
  deviceBtn: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '4px',
    transition: 'var(--transition-smooth)',
  },
  deviceBtnActive: {
    color: 'var(--accent-color)',
    backgroundColor: 'var(--bg-primary)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  deviceFrame: {
    position: 'relative',
    backgroundColor: '#ffffff',
    boxShadow: '0 12px 36px rgba(0,0,0,0.15)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  deviceFrame_desktop: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    border: 'none',
  },
  deviceFrame_tablet: {
    width: '768px',
    height: '95%',
    borderRadius: '24px',
    border: '14px solid #1a1a1a',
  },
  deviceFrame_mobile: {
    width: '375px',
    height: '90%',
    borderRadius: '36px',
    border: '14px solid #1a1a1a',
  },
  deviceCamera: {
    width: '48px',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#333',
    margin: '6px auto 10px auto',
    flexShrink: 0,
  },
  floatingToolbar: {
    position: 'absolute',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#18181b', // dark charcoal
    border: '1px solid #27272a',
    borderRadius: '8px',
    padding: '4px 6px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    transition: 'all 0.1s ease',
  },
  toolbarBtn: {
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.15s ease',
  },
  toolbarBtnActive: {
    backgroundColor: 'var(--accent-color)',
    color: '#ffffff',
  },
  toolbarBtnDanger: {
    color: 'var(--color-danger)',
  },
  toolbarDivider: {
    width: '1px',
    height: '16px',
    backgroundColor: '#27272a',
    margin: '0 4px',
  },
  rangeInput: {
    width: '100%',
    accentColor: 'var(--accent-color)',
    cursor: 'pointer',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'var(--bg-tertiary)',
    outline: 'none',
  },
  toolbarColorPopover: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%) translateY(-8px)',
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '6px',
    padding: '6px',
    display: 'flex',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    zIndex: 1010,
  },
  colorDotBtn: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '1px solid #3f3f46',
    cursor: 'pointer',
    padding: 0,
    transition: 'transform 0.1s ease',
  },
  wysiwygToolbar: {
    display: 'flex',
    gap: '4px',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '4px',
    border: '1px solid var(--border-color)',
    borderBottom: 'none',
    borderTopLeftRadius: 'var(--border-radius-sm)',
    borderTopRightRadius: 'var(--border-radius-sm)',
  },
  wysiwygBtn: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    transition: 'var(--transition-smooth)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

// Add standard actions display on treeNode hover via CSS if required, simplified here
