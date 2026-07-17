import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Play, RefreshCw, Layers, FileText, Square, 
  HelpCircle, Settings, Plus, Trash2, Edit3, Save, ChevronRight, ChevronDown,
  Monitor, Smartphone, Tablet
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
  const [activeTab, setActiveTab] = useState('outline'); // outline, config, theme
  
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
          <textarea
            value={val}
            onChange={(e) => handleFieldChange(fullPath, e.target.value)}
            style={styles.textarea}
            rows={4}
          />
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
      {/* Sidebar Editor Tools */}
      <div style={styles.editorPanel}>
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

        {/* Editor Tabs */}
        <div style={styles.tabs}>
          <button 
            onClick={() => setActiveTab('outline')} 
            style={{...styles.tab, ...(activeTab === 'outline' ? styles.activeTab : {})}}
          >
            Outline
          </button>
          <button 
            onClick={() => setActiveTab('config')} 
            style={{...styles.tab, ...(activeTab === 'config' ? styles.activeTab : {})}}
          >
            Settings
          </button>
        </div>

        {/* Panel Body */}
        <div style={styles.panelBody}>
          {editorLoading ? (
            <div style={styles.paneLoading}>
              <div style={styles.spinner} />
              <span>Loading workspace...</span>
            </div>
          ) : activeTab === 'outline' ? (
            /* Outline Hierarchy Tree */
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
              {outline.pages.map(page => {
                const pageExpanded = !!expandedNodes[page._id];
                const pageArticles = outline.articles.filter(a => a._parentId === page._id);

                return (
                  <div key={page._id} style={styles.treeGroup}>
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
                      <div className="node-actions" style={styles.nodeActions}>
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
                      const articleBlocks = outline.blocks.filter(b => b._parentId === article._id);

                      return (
                        <div key={article._id} style={styles.treeGroupNested}>
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
                            <div className="node-actions" style={styles.nodeActions}>
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
                            const blockComponents = outline.components.filter(c => c._parentId === block._id);

                            return (
                              <div key={block._id} style={styles.treeGroupNested}>
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
                                  <div className="node-actions" style={styles.nodeActions}>
                                    <button onClick={() => addComponent(block._id, 'text')} style={styles.addBtn} title="Add Text Component">
                                      <Plus size={12} />
                                    </button>
                                    <button onClick={(e) => handleDeleteItem(e, 'block', block._id)} style={styles.nodeDeleteBtn}>
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>

                                {/* Components */}
                                {blockExpanded && blockComponents.map(comp => (
                                  <div 
                                    key={comp._id}
                                    className="tree-node"
                                    onClick={() => setSelectedItem({ type: 'component', data: comp })}
                                    style={{
                                      ...styles.treeNode,
                                      ...styles.compNode,
                                      ...(selectedItem?.data?._id === comp._id ? styles.selectedTreeNode : {})
                                    }}
                                  >
                                    <Square size={12} style={{color: 'var(--accent-color)'}} />
                                    <span style={styles.nodeTitle}>{comp.title || 'Component'}</span>
                                    <span style={styles.nodeTypeTag}>{comp._component}</span>
                                    <div className="node-actions" style={styles.nodeActions}>
                                      <button onClick={(e) => handleDeleteItem(e, 'component', comp._id)} style={styles.nodeDeleteBtn}>
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
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
          ) : (
            /* Settings Form Builder */
            <div style={styles.formContainer}>
              <div style={styles.formHeader}>
                <span style={styles.formTypeTag}>{selectedItem?.type?.toUpperCase()}</span>
                <h3>{selectedItem?.data?.title || 'Configure Details'}</h3>
                {renderModeSelector()}
              </div>
              {renderFigmaInspector()}
            </div>
          )}
        </div>
      </div>

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
  editorPanel: {
    width: '420px',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-secondary)',
    flexShrink: 0,
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
    display: 'none',
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
};

// Add standard actions display on treeNode hover via CSS if required, simplified here
