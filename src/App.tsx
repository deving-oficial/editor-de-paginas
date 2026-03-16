/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Layout, 
  Settings, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Code,
  Eye,
  Edit3,
  Download,
  Layers,
  MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type ElementTag = 'div' | 'header' | 'footer' | 'section' | 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'img' | 'button' | 'nav' | 'main';

interface PageElement {
  id: string;
  tag: ElementTag;
  content?: string;
  src?: string;
  styles: React.CSSProperties;
  children: PageElement[];
}

// --- Constants ---

const INITIAL_PAGE: PageElement = {
  id: 'root',
  tag: 'main',
  styles: {
    minHeight: '100vh',
    padding: '2rem',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  children: [
    {
      id: 'header-1',
      tag: 'header',
      styles: {
        padding: '1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '0.5rem',
        textAlign: 'center'
      },
      children: [
        {
          id: 'title-1',
          tag: 'h1',
          content: 'Welcome to WebCraft',
          styles: {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#111827'
          },
          children: []
        }
      ]
    }
  ]
};

const ELEMENT_TEMPLATES: { tag: ElementTag; label: string; icon: any }[] = [
  { tag: 'div', label: 'Container', icon: Square },
  { tag: 'header', label: 'Header', icon: Layout },
  { tag: 'section', label: 'Section', icon: Layers },
  { tag: 'h1', label: 'Heading 1', icon: Type },
  { tag: 'h2', label: 'Heading 2', icon: Type },
  { tag: 'p', label: 'Paragraph', icon: Type },
  { tag: 'img', label: 'Image', icon: ImageIcon },
  { tag: 'button', label: 'Button', icon: MousePointer2 },
];

// --- Components ---

export default function App() {
  const [page, setPage] = useState<PageElement>(INITIAL_PAGE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'code'>('edit');
  const [history, setHistory] = useState<PageElement[]>([INITIAL_PAGE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // --- Helpers ---

  const findElement = (elements: PageElement, id: string): PageElement | null => {
    if (elements.id === id) return elements;
    for (const child of elements.children) {
      const found = findElement(child, id);
      if (found) return found;
    }
    return null;
  };

  const updateElement = (root: PageElement, id: string, updates: Partial<PageElement>): PageElement => {
    if (root.id === id) {
      return { ...root, ...updates };
    }
    return {
      ...root,
      children: root.children.map(child => updateElement(child, id, updates))
    };
  };

  const addElement = (parentId: string, tag: ElementTag) => {
    const newElement: PageElement = {
      id: `el-${Math.random().toString(36).substr(2, 9)}`,
      tag,
      content: tag === 'img' ? undefined : `New ${tag}`,
      src: tag === 'img' ? 'https://picsum.photos/seed/webcraft/400/300' : undefined,
      styles: {
        padding: '1rem',
        margin: '0.5rem 0',
      },
      children: []
    };

    const newPage = updateElement(page, parentId, {
      children: [...(findElement(page, parentId)?.children || []), newElement]
    });
    
    saveToHistory(newPage);
    setSelectedId(newElement.id);
  };

  const deleteElement = (id: string) => {
    if (id === 'root') return;

    const removeRecursive = (root: PageElement): PageElement => {
      return {
        ...root,
        children: root.children
          .filter(child => child.id !== id)
          .map(child => removeRecursive(child))
      };
    };

    const newPage = removeRecursive(page);
    saveToHistory(newPage);
    setSelectedId(null);
  };

  const saveToHistory = (newPage: PageElement) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setPage(newPage);
  };

  const selectedElement = selectedId ? findElement(page, selectedId) : null;

  // --- Rendering ---

  const renderElement = (el: PageElement, isPreview: boolean = false) => {
    const isSelected = selectedId === el.id && !isPreview;
    const Tag = el.tag as any;

    const handleClick = (e: React.MouseEvent) => {
      if (isPreview) return;
      e.stopPropagation();
      setSelectedId(el.id);
    };

    const commonProps = {
      style: el.styles,
      onClick: handleClick,
      className: `relative transition-all ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''} ${!isPreview ? 'hover:outline hover:outline-1 hover:outline-indigo-300' : ''}`,
      referrerPolicy: el.tag === 'img' ? "no-referrer" : undefined,
      src: el.tag === 'img' ? el.src : undefined,
    };

    return (
      <Tag key={el.id} {...commonProps}>
        {el.content}
        {el.children.map(child => renderElement(child, isPreview))}
        {isSelected && !isPreview && (
          <div className="absolute -top-8 right-0 flex gap-1 bg-indigo-500 text-white p-1 rounded shadow-lg z-50">
            <button onClick={() => deleteElement(el.id)} className="p-1 hover:bg-indigo-600 rounded">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </Tag>
    );
  };

  const generateHTML = (el: PageElement, indent: string = ''): string => {
    const styleString = Object.entries(el.styles)
      .map(([key, value]) => `${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${value}`)
      .join('; ');
    
    const attributes = [
      styleString ? `style="${styleString}"` : '',
      el.src ? `src="${el.src}"` : '',
      el.tag === 'img' ? 'referrerpolicy="no-referrer"' : ''
    ].filter(Boolean).join(' ');

    const openingTag = `<${el.tag}${attributes ? ' ' + attributes : ''}>`;
    const closingTag = `</${el.tag}>`;

    if (el.tag === 'img') return `${indent}<img ${attributes}>\n`;

    const childrenHTML = el.children.map(child => generateHTML(child, indent + '  ')).join('');
    return `${indent}${openingTag}${el.content || ''}\n${childrenHTML}${indent}${closingTag}\n`;
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden">
      {/* Sidebar - Elements */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-4 border-b border-zinc-200 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Layout size={18} />
          </div>
          <h1 className="font-bold text-lg tracking-tight">WebCraft</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Add Elements</h2>
            <div className="grid grid-cols-2 gap-2">
              {ELEMENT_TEMPLATES.map((item) => (
                <button
                  key={item.tag}
                  onClick={() => addElement(selectedId || 'root', item.tag)}
                  className="flex flex-col items-center justify-center p-3 bg-zinc-50 border border-zinc-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-colors group"
                >
                  <item.icon size={20} className="text-zinc-500 group-hover:text-indigo-600 mb-2" />
                  <span className="text-[10px] font-medium text-zinc-600">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Layers</h2>
            <div className="space-y-1">
              <LayerItem 
                element={page} 
                selectedId={selectedId} 
                onSelect={setSelectedId} 
                level={0} 
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Toolbar */}
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 z-10">
          <div className="flex bg-zinc-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${viewMode === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <Edit3 size={14} /> Edit
            </button>
            <button 
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${viewMode === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <Eye size={14} /> Preview
            </button>
            <button 
              onClick={() => setViewMode('code')}
              className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${viewMode === 'code' ? 'bg-white shadow-sm text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <Code size={14} /> Code
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const blob = new Blob([generateHTML(page)], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'index.html';
                a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Download size={14} /> Export HTML
            </button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-zinc-200 p-12 flex justify-center">
          <div className={`bg-white shadow-2xl w-full max-w-5xl min-h-full transition-all ${viewMode === 'preview' ? 'p-0' : 'p-0'}`}>
            {viewMode === 'code' ? (
              <div className="p-8 font-mono text-sm bg-zinc-900 text-zinc-300 h-full overflow-auto">
                <pre>{generateHTML(page)}</pre>
              </div>
            ) : (
              <div className="h-full">
                {renderElement(page, viewMode === 'preview')}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Properties Panel */}
      <aside className="w-80 bg-white border-l border-zinc-200 overflow-y-auto">
        <div className="p-4 border-b border-zinc-200 flex items-center gap-2">
          <Settings size={18} className="text-zinc-400" />
          <h2 className="font-semibold">Properties</h2>
        </div>

        {selectedElement ? (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Content</h3>
              
              {selectedElement.tag !== 'img' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Text Content</label>
                  <textarea
                    value={selectedElement.content || ''}
                    onChange={(e) => setPage(updateElement(page, selectedElement.id, { content: e.target.value }))}
                    className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[80px]"
                  />
                </div>
              )}

              {selectedElement.tag === 'img' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={selectedElement.src || ''}
                    onChange={(e) => setPage(updateElement(page, selectedElement.id, { src: e.target.value }))}
                    className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Styles</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Background</label>
                  <input
                    type="color"
                    value={selectedElement.styles.backgroundColor as string || '#ffffff'}
                    onChange={(e) => setPage(updateElement(page, selectedElement.id, { 
                      styles: { ...selectedElement.styles, backgroundColor: e.target.value } 
                    }))}
                    className="w-full h-10 p-1 border border-zinc-200 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Text Color</label>
                  <input
                    type="color"
                    value={selectedElement.styles.color as string || '#000000'}
                    onChange={(e) => setPage(updateElement(page, selectedElement.id, { 
                      styles: { ...selectedElement.styles, color: e.target.value } 
                    }))}
                    className="w-full h-10 p-1 border border-zinc-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Font Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="8"
                    max="120"
                    value={parseInt(selectedElement.styles.fontSize as string) || 16}
                    onChange={(e) => setPage(updateElement(page, selectedElement.id, { 
                      styles: { ...selectedElement.styles, fontSize: `${e.target.value}px` } 
                    }))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-xs font-mono text-zinc-500 w-10">{selectedElement.styles.fontSize || '16px'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Padding</label>
                <input
                  type="text"
                  value={selectedElement.styles.padding as string || ''}
                  placeholder="e.g. 1rem or 10px 20px"
                  onChange={(e) => setPage(updateElement(page, selectedElement.id, { 
                    styles: { ...selectedElement.styles, padding: e.target.value } 
                  }))}
                  className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Border Radius</label>
                <input
                  type="text"
                  value={selectedElement.styles.borderRadius as string || ''}
                  placeholder="e.g. 0.5rem or 8px"
                  onChange={(e) => setPage(updateElement(page, selectedElement.id, { 
                    styles: { ...selectedElement.styles, borderRadius: e.target.value } 
                  }))}
                  className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Display</label>
                <select
                  value={selectedElement.styles.display as string || 'block'}
                  onChange={(e) => setPage(updateElement(page, selectedElement.id, { 
                    styles: { ...selectedElement.styles, display: e.target.value } 
                  }))}
                  className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="block">Block</option>
                  <option value="flex">Flex</option>
                  <option value="grid">Grid</option>
                  <option value="inline-block">Inline Block</option>
                  <option value="none">None</option>
                </select>
              </div>

              {selectedElement.styles.display === 'flex' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Direction</label>
                    <select
                      value={selectedElement.styles.flexDirection as string || 'row'}
                      onChange={(e) => setPage(updateElement(page, selectedElement.id, { 
                        styles: { ...selectedElement.styles, flexDirection: e.target.value } 
                      }))}
                      className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="row">Row</option>
                      <option value="column">Column</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Gap</label>
                    <input
                      type="text"
                      value={selectedElement.styles.gap as string || ''}
                      onChange={(e) => setPage(updateElement(page, selectedElement.id, { 
                        styles: { ...selectedElement.styles, gap: e.target.value } 
                      }))}
                      className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <MousePointer2 size={32} className="mx-auto text-zinc-200 mb-4" />
            <p className="text-sm text-zinc-400">Select an element on the canvas to edit its properties.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

interface LayerItemProps {
  element: PageElement;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  level: number;
}

const LayerItem: React.FC<LayerItemProps> = ({ element, selectedId, onSelect, level }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedId === element.id;
  const hasChildren = element.children.length > 0;

  return (
    <div>
      <div 
        onClick={() => onSelect(element.id)}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-zinc-100 text-zinc-600'}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="text-zinc-400 hover:text-zinc-600">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-[14px]" />
        )}
        <span className="text-xs font-medium truncate">
          {element.tag} <span className="text-[10px] opacity-50 font-normal">#{element.id.slice(-4)}</span>
        </span>
      </div>
      {isOpen && hasChildren && (
        <div className="mt-0.5">
          {element.children.map(child => (
            <LayerItem 
              key={child.id} 
              element={child} 
              selectedId={selectedId} 
              onSelect={onSelect} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
