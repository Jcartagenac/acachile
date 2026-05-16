import React, { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Code2,
  Eye,
} from 'lucide-react';

interface RichTextHtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  error?: string;
}

type EditorMode = 'visual' | 'html';

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ active = false, onClick, disabled = false, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors',
        active
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
        disabled ? 'cursor-not-allowed opacity-50' : ''
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export default function RichTextHtmlEditor({
  value,
  onChange,
  label = 'Contenido',
  helperText,
  error,
}: RichTextHtmlEditorProps) {
  const [mode, setMode] = useState<EditorMode>('visual');
  const [htmlDraft, setHtmlDraft] = useState(value);

  const normalizedValue = useMemo(() => value || '<p></p>', [value]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: normalizedValue,
    editorProps: {
      attributes: {
        class:
          'min-h-[320px] rounded-b-lg border border-t-0 border-gray-300 px-4 py-3 focus:outline-none prose prose-sm max-w-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      setHtmlDraft(html);
      onChange(html);
    },
  });

  useEffect(() => {
    setHtmlDraft(value);
  }, [value]);

  useEffect(() => {
    if (!editor || mode !== 'visual') return;

    const currentHtml = editor.getHTML();
    if (normalizedValue !== currentHtml) {
      editor.commands.setContent(normalizedValue, false);
    }
  }, [editor, mode, normalizedValue]);

  const applyLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Ingresa la URL del enlace', previousUrl || 'https://');

    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const switchMode = (nextMode: EditorMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <label className="block text-sm font-medium text-gray-700">{label} *</label>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => switchMode('visual')}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm transition-colors ${
              mode === 'visual' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => switchMode('html')}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm transition-colors ${
              mode === 'html' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code2 className="h-4 w-4 mr-2" />
            HTML
          </button>
        </div>
      </div>

      {mode === 'visual' && editor && (
        <div>
          <div className="flex flex-wrap gap-2 rounded-t-lg border border-gray-300 bg-gray-50 p-3">
            <ToolbarButton
              title="Negrita"
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Cursiva"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Título grande"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Subtítulo"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Encabezado menor"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Lista con viñetas"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Lista numerada"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Alinear a la izquierda"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Centrar"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Alinear a la derecha"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Insertar o editar enlace"
              onClick={applyLink}
              active={editor.isActive('link')}
            >
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>
          </div>
          <EditorContent editor={editor} />
        </div>
      )}

      {mode === 'html' && (
        <textarea
          value={htmlDraft}
          onChange={(e) => {
            const nextValue = e.target.value;
            setHtmlDraft(nextValue);
            onChange(nextValue);
          }}
          rows={14}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="<p>Contenido HTML de la noticia</p>"
        />
      )}

      <div className="mt-2 space-y-1 text-sm text-gray-500">
        <p>
          En modo visual, Enter crea párrafos separados automáticamente. Si necesitas control total,
          cambia a vista HTML y edita el código manualmente.
        </p>
        {helperText ? <p>{helperText}</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
