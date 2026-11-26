'use client';

import { useEffect, useRef, useState } from 'react';
import { Bold, Code, Image as ImageIcon, Link2, List, ListOrdered, Table } from 'lucide-react';

export default function RichTextEditor({ value, onChange, onUploadImage }) {
  const editorRef = useRef(null);
  const [sourceMode, setSourceMode] = useState(false);

  useEffect(() => {
    if (!sourceMode && editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, sourceMode]);

  const exec = (command, arg = null) => {
    if (sourceMode || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    onChange(editorRef.current.innerHTML);
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL (e.g. /collection/lehenga-choli or https://...):');
    if (!url) return;
    exec('createLink', url);
  };

  const insertTable = () => {
    const tableHtml = `
      <table>
        <thead><tr><th>Feature</th><th>Details</th></tr></thead>
        <tbody><tr><td>Fabric</td><td>Pure Silk / Cotton</td></tr><tr><td>Occasion</td><td>Wedding / Festive</td></tr></tbody>
      </table><p></p>`;
    exec('insertHTML', tableHtml);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUploadImage) return;
    const url = await onUploadImage(file);
    if (url) {
      exec('insertHTML', `<img src="${url}" alt="" />`);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-sasta-border bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-sasta-border bg-sasta-yellow-cream px-3 py-2">
        <button type="button" onClick={() => exec('formatBlock', '<h2>')} className="rounded px-2 py-1 text-xs font-bold text-sasta-heading hover:bg-sasta-yellow-light">
          H2
        </button>
        <button type="button" onClick={() => exec('formatBlock', '<h3>')} className="rounded px-2 py-1 text-xs font-bold text-sasta-heading hover:bg-sasta-yellow-light">
          H3
        </button>
        <button type="button" onClick={() => exec('formatBlock', '<p>')} className="rounded px-2 py-1 text-xs font-medium text-sasta-body hover:bg-sasta-yellow-light">
          P
        </button>
        <span className="mx-1 h-4 w-px bg-sasta-border" />
        <button type="button" onClick={() => exec('bold')} title="Bold" className="rounded p-1.5 text-sasta-heading hover:bg-sasta-yellow-light">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => exec('insertUnorderedList')} title="Bullet List" className="rounded p-1.5 text-sasta-heading hover:bg-sasta-yellow-light">
          <List className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => exec('insertOrderedList')} title="Numbered List" className="rounded p-1.5 text-sasta-heading hover:bg-sasta-yellow-light">
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={insertTable} title="Insert Table" className="rounded p-1.5 text-sasta-heading hover:bg-sasta-yellow-light">
          <Table className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={insertLink} title="Insert Link" className="rounded p-1.5 text-sasta-heading hover:bg-sasta-yellow-light">
          <Link2 className="h-3.5 w-3.5" />
        </button>
        <label title="Upload Inline Image" className="cursor-pointer rounded p-1.5 text-sasta-heading hover:bg-sasta-yellow-light">
          <ImageIcon className="h-3.5 w-3.5" />
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleFileChange} className="hidden" />
        </label>
        <button
          type="button"
          onClick={() => setSourceMode((prev) => !prev)}
          className={`ml-auto inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold ${
            sourceMode ? 'bg-sasta-navy text-white' : 'bg-white text-sasta-heading border border-sasta-border'
          }`}
        >
          <Code className="h-3.5 w-3.5" />
          {sourceMode ? 'Visual' : 'HTML'}
        </button>
      </div>

      {sourceMode ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          className="w-full p-4 font-mono text-xs text-sasta-heading focus:outline-none"
          placeholder="<h2>Write HTML content here...</h2>"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          className="blog-prose min-h-[340px] max-h-[540px] overflow-y-auto p-4 text-sm text-sasta-body focus:outline-none"
        />
      )}
    </div>
  );
}
